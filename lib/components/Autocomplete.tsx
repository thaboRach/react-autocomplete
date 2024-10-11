import React from 'react';
import { getScrollOffset } from '../utils';
import scrollIntoView from 'dom-scroll-into-view';

const IMPERATIVE_API = [
  'blur',
  'checkValidity',
  'click',
  'focus',
  'select',
  'setCustomValidity',
  'setSelectionRange',
  'setRangeText',
] as const;

type ImperativeAPI = (typeof IMPERATIVE_API)[number];

export type AutocompleteProps<T> = {
  items: T[];
  value?: any; // TODO:Change to generic
  onChange?: (event: React.ChangeEvent, value: string) => void;
  onSelect?: (value: string, item?: T) => void;
  shouldItemRender?: (item: T, value: string) => boolean;
  isItemSelectable?: (item: T) => boolean;
  sortItems?: (itemA: any, itemB: any, value: string) => number;
  getItemValue: (item: T) => string;
  renderItem: (
    item: any,
    isHighlighted: boolean,
    styles?: React.CSSProperties,
  ) => React.ReactElement;
  renderMenu?: (
    items: React.ReactNode[],
    value: string,
    styles: { top?: number; left?: number; minWidth?: number },
  ) => React.ReactElement;
  menuStyle?: React.CSSProperties;
  renderInput?: (
    props: React.InputHTMLAttributes<HTMLInputElement> & {
      ref: (refElement: React.RefObject<HTMLInputElement>) => void;
    },
  ) => React.ReactNode;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  wrapperProps?: React.InputHTMLAttributes<HTMLDivElement>;
  wrapperStyle?: React.CSSProperties;
  wrapperClassName?: string;
  autoHighlight?: boolean;
  selectOnBlur?: boolean;
  onMenuVisibilityChange?: (isOpen: boolean) => void;
  open?: boolean;
  debug?: boolean;
};

export function Autocomplete<T extends object>(props: AutocompleteProps<T>): JSX.Element {
  const {
    value = '',
    items = [],
    getItemValue = () => {
      throw new Error('renderItem not implemented.');
    },
    wrapperProps = {},
    wrapperStyle = {
      display: 'inline-block',
    },
    wrapperClassName = '',
    inputProps = {},
    renderInput = (args) => {
      // @ts-ignore
      return <input {...args} />;
    },
    onChange = () => {},
    onSelect = () => {},
    isItemSelectable = () => {
      return true;
    },
    renderMenu = (items, value, style) => {
      return <div style={{ ...style, ...menuStyle }} children={items} />;
    },
    menuStyle = {
      borderRadius: '3px',
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
      background: 'rgba(255, 255, 255, 0.9)',
      padding: '2px 0',
      fontSize: '90%',
      position: 'fixed',
      overflow: 'auto',
      maxHeight: '50%', // TODO: don't cheat, let it flow to the bottom
    },
    autoHighlight = true,
    selectOnBlur = false,
    onMenuVisibilityChange = () => {},
    renderItem = (): React.ReactElement => {
      throw new Error('renderItem not implemented.');
    },
  } = props;

  let inputRef = React.useRef<{ [key: string]: React.RefObject<HTMLElement | HTMLInputElement> }>(
    {},
  );
  const apiRefs = React.useRef<{ [key in ImperativeAPI]?: (...args: any[]) => void }>({});

  const ignoreBlur = React.useRef<boolean>(false);
  const ignoreFocus = React.useRef<boolean>(false);
  const scrollOffset = React.useRef<{ x: number; y: number } | null>(null);
  const scrollTimer = React.useRef<NodeJS.Timeout | null>(null);
  const debugStates = React.useRef<
    {
      id: number;
      state: any;
    }[]
  >(null);

  const prevIsOpen = React.useRef<boolean>(false);
  const prevPropsOpen = React.useRef<boolean | undefined>(props.open);

  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState<number | null>(null);
  const [menuTop, setMenuTop] = React.useState<number>();
  const [menuLeft, setMenuLeft] = React.useState<number>();
  const [menuWidth, setMenuWidth] = React.useState<number>();

  const [itemValue, setItemValue] = React.useState<any>();
  const [valueState, setValueState] = React.useState<any>(value);
  const [itemState, setItemState] = React.useState<T>();

  const keyDownHandlers: {
    [key: string]: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  } = {
    ArrowDown(event: React.KeyboardEvent<HTMLInputElement>) {
      event.preventDefault();
      const items = getFilteredItems();
      if (!items.length) return;
      let index = highlightedIndex === null ? -1 : highlightedIndex;
      for (let i = 0; i < items.length; i++) {
        const p = (index + i + 1) % items.length;
        if (isItemSelectable(items[p])) {
          index = p;
          break;
        }
      }
      if (index > -1 && index !== highlightedIndex) {
        setHighlightedIndex(index);
        setIsOpen(true);
      }
    },

    ArrowUp(event: React.KeyboardEvent<HTMLInputElement>) {
      event.preventDefault();
      const items = getFilteredItems();
      if (!items.length) return;
      let index = highlightedIndex === null ? items.length : highlightedIndex;
      for (let i = 0; i < items.length; i++) {
        const p = (index - (1 + i) + items.length) % items.length;
        if (isItemSelectable(items[p])) {
          index = p;
          break;
        }
      }
      if (index !== items.length) {
        setHighlightedIndex(index);
        setIsOpen(true);
      }
    },

    Enter(event: React.KeyboardEvent<HTMLInputElement>) {
      // Key code 229 is used for selecting items from character selectors (Pinyin, Kana, etc)
      if (event.key !== 'Enter') return;

      // In case the user is currently hovering over the menu
      setIgnoreBlur(false);
      if (!checkIsOpen()) {
        // menu is closed so there is no selection to accept -> do nothing
        return;
      } else if (highlightedIndex == null) {
        // input has focus but no menu item is selected + enter is hit -> close the menu, highlight whatever's in input

        setIsOpen(false);
      } else {
        // text entered + menu item has been highlighted + enter is hit -> update value to that of selected menu item, close the menu
        event.preventDefault();
        const item = getFilteredItems()[highlightedIndex];

        setItemState(item);
        setItemValue(getItemValue(item));

        setIsOpen(false);
        setHighlightedIndex(null);
      }
    },

    Escape() {
      // In case the user is currently hovering over the menu
      setIgnoreBlur(false);
      setHighlightedIndex(null);
      setIsOpen(false);
    },

    Tab() {
      // In case the user is currently hovering over the menu
      setIgnoreBlur(false);
    },
  };

  React.useEffect(() => {
    onSelect(itemValue, itemState);
    if (
      inputRef?.current &&
      inputRef.current.input?.current &&
      inputRef.current.input?.current instanceof HTMLInputElement
    ) {
      inputRef.current.input.current.setSelectionRange(value.length, value.length);
    }
  }, [itemState, valueState, itemValue]);

  React.useEffect(() => {
    if (checkIsOpen()) {
      setMenuPositions();
    }

    () => {
      if (scrollTimer && scrollTimer.current) {
        clearTimeout(scrollTimer.current);
        scrollTimer.current = null;
      }
    };
  }, []);

  React.useEffect(() => {
    if (highlightedIndex !== null) {
      setHighlightedIndex(ensureHighlightedIndex);
    }

    if (autoHighlight && (value || highlightedIndex === null)) {
      setHighlightedIndex(maybeAutoCompleteText);
    }
  }, [autoHighlight, value, highlightedIndex]);

  React.useEffect(() => {
    if (
      (isOpen && !prevIsOpen.current) ||
      ('open' in props && props.open && !prevPropsOpen.current)
    ) {
      setMenuPositions();
    }

    // Maybe scroll item into view
    if (checkIsOpen() && highlightedIndex !== null) {
      const itemNode = inputRef.current[`item-${highlightedIndex}`];
      const menuNode = inputRef.current.menu;
      scrollIntoView(itemNode, menuNode, {
        onlyScrollIfNeeded: true,
      });
    }

    if (isOpen && prevIsOpen.current !== isOpen) {
      onMenuVisibilityChange(isOpen);
    }

    // Update ref/state with current
    prevIsOpen.current = isOpen;
    prevPropsOpen.current = props.open;
  }, [isOpen]);

  function ensureHighlightedIndex(prevState: number | null): number | null {
    if (prevState && prevState >= getFilteredItems().length) {
      return null;
    }
    return prevState;
  }

  function maybeAutoCompleteText(prevState: number | null): number | null {
    const { value, getItemValue } = props;
    let index: number = prevState === null ? 0 : prevState;
    let items = getFilteredItems();

    for (let i = 0; i < items.length; i++) {
      if (isItemSelectable(items[index])) break;
      index = (index + 1) % items.length;
    }

    const matchedItem = items[index] && isItemSelectable(items[index]) ? items[index] : null;

    if (value !== '' && matchedItem) {
      const itemValue = getItemValue(matchedItem);
      const itemValueDoesMatch = itemValue.toLowerCase().indexOf(value.toLowerCase()) === 0;
      if (itemValueDoesMatch) {
        return index;
      }
    }

    return null;
  }

  function checkIsOpen() {
    return 'open' in props ? props.open : isOpen;
  }

  function setMenuPositions() {
    const node = inputRef.current.input;
    if (!node || !node.current) {
      return;
    }
    const rect = node.current?.getBoundingClientRect();
    const computedStyle = global.window.getComputedStyle(node.current);
    const marginBottom = parseInt(computedStyle.marginBottom, 10) || 0;
    const marginLeft = parseInt(computedStyle.marginLeft, 10) || 0;
    const marginRight = parseInt(computedStyle.marginRight, 10) || 0;

    setMenuTop(rect.bottom + marginBottom);
    setMenuLeft(rect.left + marginLeft);
    setMenuWidth(rect.width + marginLeft + marginRight);
  }

  function exposeAPI(refElement: React.RefObject<HTMLInputElement>) {
    inputRef.current.input = refElement;
    IMPERATIVE_API.forEach((ev) => {
      if (refElement?.current) {
        const huh = refElement?.current[ev].bind(refElement);
        apiRefs.current[ev] = huh;
      }
    });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (keyDownHandlers[event.key]) {
      keyDownHandlers[event.key](event);
    } else if (!checkIsOpen()) {
      setIsOpen(true);
    }
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    onChange(event, event.target.value);
  }

  function getFilteredItems() {
    let filteredItems = items;

    if (props?.shouldItemRender) {
      filteredItems = items.filter(
        (item) => props?.shouldItemRender && props.shouldItemRender(item, props.value),
      );
    }

    if (props.sortItems) {
      filteredItems.sort((a, b) => (props.sortItems && props.sortItems(a, b, props.value)) ?? 0);
    }

    return filteredItems;
  }

  function highlightItemFromMouse(index: number) {
    setHighlightedIndex(index);
  }

  function selectItemFromMouse(item: any) {
    const value = getItemValue(item);
    setValueState(value);
    setItemState(item);
    // The menu will de-render before a mouseLeave event
    // happens. Clear the flag to release control over focus
    setIgnoreBlur(false);
    setIsOpen(false);
    setHighlightedIndex(null);
  }

  function setIgnoreBlur(ignore: boolean) {
    ignoreBlur.current = ignore;
  }

  function renderMenuEl() {
    const items = getFilteredItems().map((item, index) => {
      const element = renderItem(item, highlightedIndex === index, {
        cursor: 'default',
      });

      return React.cloneElement(element, {
        onMouseEnter:
          isItemSelectable && isItemSelectable(item) ? () => highlightItemFromMouse(index) : null,
        onClick:
          isItemSelectable && isItemSelectable(item) ? () => selectItemFromMouse(item) : null,
        ref: (e: React.RefObject<HTMLElement>) => (inputRef.current[`item-${index}`] = e),
      });
    });

    const style = {
      left: menuLeft,
      top: menuTop,
      minWidth: menuWidth,
    };
    const menu = renderMenu(items, props.value, style);
    if (!menu) return;
    return React.cloneElement(menu, {
      ref: (e: React.RefObject<HTMLElement>) => (inputRef.current.menu = e),
      // Ignore blur to prevent menu from de-rendering before we can process click
      onTouchStart: () => setIgnoreBlur(true),
      onMouseEnter: () => setIgnoreBlur(true),
      onMouseLeave: () => setIgnoreBlur(false),
    });
  }

  function handleInputBlur(event: React.FocusEvent<HTMLInputElement>) {
    if (ignoreBlur && ignoreBlur.current) {
      ignoreFocus.current = true;
      scrollOffset.current = getScrollOffset();
      inputRef.current?.input.current?.focus();
      return;
    }
    if (selectOnBlur && highlightedIndex) {
      const items = getFilteredItems();
      const item = items[highlightedIndex];
      const value = getItemValue(item);
      setValueState(value);
      setItemState(item);
    }

    setIsOpen(false);
    setHighlightedIndex(null);

    const { onBlur } = inputProps;
    if (onBlur) {
      onBlur(event);
    }
  }

  function handleInputFocus(event: React.FocusEvent<HTMLInputElement>) {
    if (ignoreFocus && ignoreFocus.current) {
      ignoreFocus.current = false;
      const { x = 0, y = 0 } = scrollOffset.current || {};
      scrollOffset.current = null;
      // Focus will cause the browser to scroll the <input> into view.
      // This can cause the mouse coords to change, which in turn
      // could cause a new highlight to happen, cancelling the click
      // event (when selecting with the mouse)
      window.scrollTo(x, y);
      // Some browsers wait until all focus event handlers have been
      // processed before scrolling the <input> into view, so let's
      // scroll again on the next tick to ensure we're back to where
      // the user was before focus was lost. We could do the deferred
      // scroll only, but that causes a jarring split second jump in
      // some browsers that scroll before the focus event handlers
      // are triggered.
      scrollTimer.current && clearTimeout(scrollTimer.current);
      scrollTimer.current = setTimeout(() => {
        scrollTimer.current = null;
        window.scrollTo(x, y);
      }, 0);
      return;
    }

    setIsOpen(true);
    const { onFocus } = inputProps;
    if (onFocus) {
      onFocus(event);
    }
  }

  function isInputFocused() {
    const el = inputRef.current.input.current;
    return el && el.ownerDocument && el === el.ownerDocument.activeElement;
  }

  function handleInputClick() {
    // Input will not be focused if it's disabled
    if (isInputFocused() && !checkIsOpen()) {
      setIsOpen(true);
    }
  }

  function composeEventHandlers<T>(
    internal: (event: T) => void,
    external?: ((event: T) => void) | undefined,
  ) {
    return external
      ? (e: T) => {
          internal(e);
          external(e);
        }
      : internal;
  }

  function render() {
    if (props.debug && debugStates?.current) {
      // you don't like it, you love it
      debugStates.current.push({
        id: debugStates?.current.length,
        state: { isOpen, highlightedIndex, menuTop, menuLeft, menuWidth },
      });
    }

    const { inputProps } = props;
    const open = checkIsOpen();

    return (
      <div className={wrapperClassName} style={{ ...wrapperStyle }} {...wrapperProps}>
        {renderInput({
          ...inputProps,
          role: 'combobox',
          'aria-autocomplete': 'list',
          'aria-expanded': open,
          autoComplete: 'off',
          ref: exposeAPI,
          onFocus: handleInputFocus,
          onBlur: handleInputBlur,
          onChange: handleChange,
          onKeyDown: composeEventHandlers(handleKeyDown, inputProps && inputProps.onKeyDown),
          onClick: composeEventHandlers(handleInputClick, inputProps && inputProps.onClick),
          value: props.value,
        })}
        {open && renderMenuEl()}
        {props.debug && debugStates.current && (
          <pre style={{ marginLeft: 300 }}>
            {JSON.stringify(
              debugStates.current.slice(
                Math.max(0, debugStates.current.length - 5),
                debugStates.current.length,
              ),
              null,
              2,
            )}
          </pre>
        )}
      </div>
    );
  }

  return render();
}
