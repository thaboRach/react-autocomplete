import React from 'react';
import { findDOMNode } from 'react-dom';
import { Option } from './types/Option';
import { getScrollOffset } from './utils';
const scrollIntoView = require('dom-scroll-into-view');

const IMPERATIVE_API = [
  'blur',
  'checkValidity',
  'click',
  'focus',
  'select',
  'setCustomValidity',
  'setSelectionRange',
  'setRangeText',
];

type Props = {
  items: Option[]; // TODO:Change to generic?
  value?: any; // TODO:Change to generic
  onChange?: (event: React.ChangeEvent, value: string) => void;
  onSelect?: (value: string, item: any) => void;
  shouldItemRender?: (item: any, value: string) => boolean;
  isItemSelectable?: (item: any) => boolean;
  sortItems?: (itemA: any, itemB: any, value: string) => number;
  getItemValue: (item: any) => string;
  renderItem: (
    item: any,
    isHighlighted: boolean,
    styles?: React.CSSProperties,
  ) => React.ReactElement;
  renderMenu?: (
    items: any[],
    value: string,
    styles: { top?: number; left?: number; minWidth?: number },
  ) => React.ReactElement;
  menuStyle?: React.CSSProperties;
  renderInput: (
    props: React.InputHTMLAttributes<HTMLInputElement> & {
      ref: (refElement: React.RefObject<HTMLInputElement>) => void;
    },
  ) => React.ReactNode;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  wrapperProps?: React.InputHTMLAttributes<HTMLDivElement>;
  wrapperStyle?: React.CSSProperties;
  autoHighlight?: boolean;
  selectOnBlur?: boolean;
  onMenuVisibilityChange?: (isOpen: boolean) => void;
  open?: boolean;
  debug?: boolean;
};

type State = {
  isOpen?: boolean;
  highlightedIndex?: number | null;
  menuTop?: number;
  menuLeft?: number;
  menuWidth?: number;
};

class Autocomplete extends React.Component<Props, State> {
  static defaultProps: Props = {
    value: '',
    items: [],
    getItemValue() {
      throw new Error('renderItem not implemented.');
    },
    wrapperProps: {},
    wrapperStyle: {
      display: 'inline-block',
    },
    inputProps: {},
    renderInput(props) {
      return <input {...props} />;
    },
    onChange() {},
    onSelect() {},
    isItemSelectable() {
      return true;
    },
    renderMenu(items, value, style) {
      return <div style={{ ...style, ...this.menuStyle }} children={items} />;
    },
    menuStyle: {
      borderRadius: '3px',
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
      background: 'rgba(255, 255, 255, 0.9)',
      padding: '2px 0',
      fontSize: '90%',
      position: 'fixed',
      overflow: 'auto',
      maxHeight: '50%', // TODO: don't cheat, let it flow to the bottom
    },
    autoHighlight: true,
    selectOnBlur: false,
    onMenuVisibilityChange() {},
    renderItem: function (): React.ReactElement {
      throw new Error('renderItem not implemented.');
    },
  };

  private _debugStates: any[];
  private _ignoreBlur?: boolean;
  private _ignoreFocus?: boolean;
  private _scrollOffset?: { x: number; y: number } | null;
  private _scrollTimer?: NodeJS.Timeout | null;
  private inputRef: React.RefObject<HTMLInputElement | null>;

  constructor(props: Props) {
    super(props);

    // State
    this.state = {
      isOpen: false,
      highlightedIndex: null,
    };

    // References
    this.inputRef = React.createRef<HTMLInputElement | null>();

    // Methods
    this._debugStates = [];
    this.ensureHighlightedIndex = this.ensureHighlightedIndex.bind(this);
    this.exposeAPI = this.exposeAPI.bind(this);
    this.handleInputFocus = this.handleInputFocus.bind(this);
    this.handleInputBlur = this.handleInputBlur.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleInputClick = this.handleInputClick.bind(this);
    this.maybeAutoCompleteText = this.maybeAutoCompleteText.bind(this);
  }

  static keyDownHandlers: {
    [key: string]: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  } = {
    ArrowDown(event: React.KeyboardEvent<HTMLInputElement>) {
      event.preventDefault();
      const items = this.getFilteredItems(this.props);
      if (!items.length) return;
      const { highlightedIndex } = this.state;
      let index = highlightedIndex === null ? -1 : highlightedIndex;
      for (let i = 0; i < items.length; i++) {
        const p = (index + i + 1) % items.length;
        if (this.props.isItemSelectable(items[p])) {
          index = p;
          break;
        }
      }
      if (index > -1 && index !== highlightedIndex) {
        this.setState({
          highlightedIndex: index,
          isOpen: true,
        });
      }
    },

    ArrowUp(event: React.KeyboardEvent<HTMLInputElement>) {
      event.preventDefault();
      const items = this.getFilteredItems(this.props);
      if (!items.length) return;
      const { highlightedIndex } = this.state;
      let index = highlightedIndex === null ? items.length : highlightedIndex;
      for (let i = 0; i < items.length; i++) {
        const p = (index - (1 + i) + items.length) % items.length;
        if (this.props.isItemSelectable(items[p])) {
          index = p;
          break;
        }
      }
      if (index !== items.length) {
        this.setState({
          highlightedIndex: index,
          isOpen: true,
        });
      }
    },

    Enter(event: React.KeyboardEvent<HTMLInputElement>) {
      // Key code 229 is used for selecting items from character selectors (Pinyin, Kana, etc)
      if (event.code !== 13) return;
      // In case the user is currently hovering over the menu
      this.setIgnoreBlur(false);
      if (!this.isOpen()) {
        // menu is closed so there is no selection to accept -> do nothing
        return;
      } else if (this.state.highlightedIndex == null) {
        // input has focus but no menu item is selected + enter is hit -> close the menu, highlight whatever's in input
        this.setState(
          {
            isOpen: false,
          },
          () => {
            this.inputRef.input.select();
          },
        );
      } else {
        // text entered + menu item has been highlighted + enter is hit -> update value to that of selected menu item, close the menu
        event.preventDefault();
        const item = this.getFilteredItems(this.props)[this.state.highlightedIndex];
        const value = this.props.getItemValue(item);
        this.setState(
          {
            isOpen: false,
            highlightedIndex: null,
          },
          () => {
            //this.inputRef.input.focus() // TODO: file issue
            this.inputRef.input.setSelectionRange(value.length, value.length);
            this.props.onSelect(value, item);
          },
        );
      }
    },

    Escape() {
      // In case the user is currently hovering over the menu
      this.setIgnoreBlur(false);
      this.setState({
        highlightedIndex: null,
        isOpen: false,
      });
    },

    Tab() {
      // In case the user is currently hovering over the menu
      this.setIgnoreBlur(false);
    },
  };

  componentWillMount() {
    this._ignoreBlur = false;
    this._ignoreFocus = false;
    this._scrollOffset = null;
    this._scrollTimer = null;
  }

  componentWillUnmount() {
    if (this._scrollTimer) {
      clearTimeout(this._scrollTimer);
      this._scrollTimer = null;
    }
  }

  componentWillReceiveProps(nextProps: Props) {
    if (this.state.highlightedIndex !== null) {
      this.setState(this.ensureHighlightedIndex);
    }
    if (
      nextProps.autoHighlight &&
      (this.props.value !== nextProps.value || this.state.highlightedIndex === null)
    ) {
      this.setState(this.maybeAutoCompleteText);
    }
  }

  componentDidMount() {
    if (this.isOpen()) {
      this.setMenuPositions();
    }
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (
      (this.state.isOpen && !prevState.isOpen) ||
      ('open' in this.props && this.props.open && !prevProps.open)
    )
      this.setMenuPositions();

    this.maybeScrollItemIntoView();

    if (this.state.isOpen && prevState.isOpen !== this.state.isOpen) {
      this.props.onMenuVisibilityChange && this.props.onMenuVisibilityChange(this.state.isOpen);
    }
  }

  exposeAPI(refElement: React.RefObject<HTMLInputElement>) {
    this.inputRef = refElement;
    IMPERATIVE_API.forEach(
      (ev) => (this[ev] = refElement && refElement[ev] && refElement[ev].bind(element)),
    );
  }

  maybeScrollItemIntoView() {
    if (this.isOpen() && this.state.highlightedIndex !== null) {
      const itemNode = this.inputRef[`item-${this.state.highlightedIndex}`];
      const menuNode = this.inputRef.menu;
      scrollIntoView(findDOMNode(itemNode), findDOMNode(menuNode), { onlyScrollIfNeeded: true });
    }
  }

  handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (Autocomplete.keyDownHandlers[event.key])
      Autocomplete.keyDownHandlers[event.key].call(this, event);
    else if (!this.isOpen()) {
      this.setState({
        isOpen: true,
      });
    }
  }

  handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    this.props.onChange && this.props.onChange(event, event.target.value);
  }

  getFilteredItems(props: Props) {
    let items = props.items;

    if (props?.shouldItemRender) {
      items = items.filter(
        (item) => props?.shouldItemRender && props.shouldItemRender(item, props.value),
      );
    }

    if (props.sortItems) {
      items.sort((a, b) => (props.sortItems && props.sortItems(a, b, props.value)) ?? 0);
    }

    return items;
  }

  maybeAutoCompleteText(state: State, props: Props) {
    const { highlightedIndex = null } = state;
    const { value, getItemValue } = props;
    let index: number = highlightedIndex === null ? 0 : highlightedIndex;
    let items = this.getFilteredItems(props);

    for (let i = 0; i < items.length; i++) {
      if (props.isItemSelectable && props.isItemSelectable(items[index])) break;
      index = (index + 1) % items.length;
    }

    const matchedItem =
      items[index] && props.isItemSelectable && props.isItemSelectable(items[index])
        ? items[index]
        : null;
    if (value !== '' && matchedItem) {
      const itemValue = getItemValue(matchedItem);
      const itemValueDoesMatch = itemValue.toLowerCase().indexOf(value.toLowerCase()) === 0;
      if (itemValueDoesMatch) {
        return { highlightedIndex: index };
      }
    }

    return { highlightedIndex: null };
  }

  ensureHighlightedIndex(state: State, props: Props): State {
    if (state.highlightedIndex && state.highlightedIndex >= this.getFilteredItems(props).length) {
      return { highlightedIndex: null };
    }
    return {};
  }

  setMenuPositions() {
    const node = this.inputRef.current;
    if (!node) {
      return;
    }
    const rect = node?.getBoundingClientRect();
    const computedStyle = global.window.getComputedStyle(node);
    const marginBottom = parseInt(computedStyle.marginBottom, 10) || 0;
    const marginLeft = parseInt(computedStyle.marginLeft, 10) || 0;
    const marginRight = parseInt(computedStyle.marginRight, 10) || 0;
    this.setState({
      menuTop: rect.bottom + marginBottom,
      menuLeft: rect.left + marginLeft,
      menuWidth: rect.width + marginLeft + marginRight,
    });
  }

  highlightItemFromMouse(index: number) {
    this.setState({ highlightedIndex: index });
  }

  selectItemFromMouse(item: any) {
    const value = this.props.getItemValue(item);
    // The menu will de-render before a mouseLeave event
    // happens. Clear the flag to release control over focus
    this.setIgnoreBlur(false);
    this.setState(
      {
        isOpen: false,
        highlightedIndex: null,
      },
      () => {
        this.props.onSelect && this.props.onSelect(value, item);
      },
    );
  }

  setIgnoreBlur(ignore: boolean) {
    this._ignoreBlur = ignore;
  }

  renderMenu() {
    const items = this.getFilteredItems(this.props).map((item, index) => {
      const element = this.props.renderItem(item, this.state.highlightedIndex === index, {
        cursor: 'default',
      });

      return React.cloneElement(element, {
        onMouseEnter:
          this.props.isItemSelectable && this.props.isItemSelectable(item)
            ? () => this.highlightItemFromMouse(index)
            : null,
        onClick:
          this.props.isItemSelectable && this.props.isItemSelectable(item)
            ? () => this.selectItemFromMouse(item)
            : null,
        ref: (e) => (this.inputRef[`item-${index}`] = e),
      });
    });

    const style = {
      left: this.state.menuLeft,
      top: this.state.menuTop,
      minWidth: this.state.menuWidth,
    };
    const menu = this.props.renderMenu && this.props.renderMenu(items, this.props.value, style);
    if (!menu) return;
    return React.cloneElement(menu, {
      ref: (e) => (this.inputRef.menu = e),
      // Ignore blur to prevent menu from de-rendering before we can process click
      onTouchStart: () => this.setIgnoreBlur(true),
      onMouseEnter: () => this.setIgnoreBlur(true),
      onMouseLeave: () => this.setIgnoreBlur(false),
    });
  }

  handleInputBlur(event: React.FocusEvent<HTMLInputElement>) {
    if (this._ignoreBlur) {
      this._ignoreFocus = true;
      this._scrollOffset = getScrollOffset();
      this.inputRef.current && this.inputRef.current.focus();
      return;
    }
    let setStateCallback;
    const { highlightedIndex } = this.state;
    if (this.props.selectOnBlur && highlightedIndex) {
      const items = this.getFilteredItems(this.props);
      const item = items[highlightedIndex];
      const value = this.props.getItemValue(item);
      setStateCallback = () => this.props.onSelect && this.props.onSelect(value, item);
    }
    this.setState(
      {
        isOpen: false,
        highlightedIndex: null,
      },
      setStateCallback,
    );
    const { onBlur } = this.props.inputProps || {};
    if (onBlur) {
      onBlur(event);
    }
  }

  handleInputFocus(event: React.FocusEvent<HTMLInputElement>) {
    if (this._ignoreFocus) {
      this._ignoreFocus = false;
      const { x, y } = this._scrollOffset || {};
      this._scrollOffset = null;
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
      this._scrollTimer && clearTimeout(this._scrollTimer);
      this._scrollTimer = setTimeout(() => {
        this._scrollTimer = null;
        window.scrollTo(x, y);
      }, 0);
      return;
    }
    this.setState({ isOpen: true });
    const { onFocus } = this.props.inputProps || {};
    if (onFocus) {
      onFocus(event);
    }
  }

  isInputFocused() {
    const el = this.inputRef.current;
    return el && el.ownerDocument && el === el.ownerDocument.activeElement;
  }

  handleInputClick() {
    // Input will not be focused if it's disabled
    if (this.isInputFocused() && !this.isOpen()) this.setState({ isOpen: true });
  }

  composeEventHandlers<T>(
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

  isOpen() {
    return 'open' in this.props ? this.props.open : this.state.isOpen;
  }

  render() {
    if (this.props.debug) {
      // you don't like it, you love it
      this._debugStates.push({
        id: this._debugStates.length,
        state: this.state,
      });
    }

    const { inputProps } = this.props;
    const open = this.isOpen();

    return (
      <div style={{ ...this.props.wrapperStyle }} {...this.props.wrapperProps}>
        {this.props.renderInput({
          ...inputProps,
          role: 'combobox',
          'aria-autocomplete': 'list',
          'aria-expanded': open,
          autoComplete: 'off',
          ref: this.exposeAPI,
          onFocus: this.handleInputFocus,
          onBlur: this.handleInputBlur,
          onChange: this.handleChange,
          onKeyDown: this.composeEventHandlers(
            this.handleKeyDown,
            inputProps && inputProps.onKeyDown,
          ),
          onClick: this.composeEventHandlers(
            this.handleInputClick,
            inputProps && inputProps.onClick,
          ),
          value: this.props.value,
        })}
        {open && this.renderMenu()}
        {this.props.debug && (
          <pre style={{ marginLeft: 300 }}>
            {JSON.stringify(
              this._debugStates.slice(
                Math.max(0, this._debugStates.length - 5),
                this._debugStates.length,
              ),
              null,
              2,
            )}
          </pre>
        )}
      </div>
    );
  }
}

module.exports = Autocomplete;
