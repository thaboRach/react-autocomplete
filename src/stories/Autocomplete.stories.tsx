import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { USState } from '../types/USState';
import { Autocomplete, AutocompleteProps } from '../../lib';
import {
  fakeCategorizedRequest,
  fakeRequest,
  getStates,
  matchStateToTerm,
  sortStates,
} from '../utils';
import './styles.css';
import Container from '../components/Container';
import HeadingOne from '../components/HeadingOne';
import Paragraph from '../components/Paragraph';
import Code from '../components/Code';
import Label from '../components/Label';
import InputContainer from '../components/InputContainer';

const meta: Meta<AutocompleteProps<USState>> = {
  title: 'Components/Autocomplete',
  component: Autocomplete,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    getItemValue: {
      control: 'object',
      type: 'function',
      description: 'It is used to read the display value from each entry in items',
    },
    items: {
      control: 'object',
      description: 'A list of items to display in the dropdown menu',
    },
    renderItem: {
      control: 'object',
      type: 'function',
      description:
        'It is invoked for each entry in items that also passes shouldItemRender to generate the render tree for each item in the dropdown menu. \
      Styles is an optional set of styles that can be applied to improve the look/feel of the items in the dropdown menu.',
    },
    autoHighlight: {
      control: 'boolean',
      type: 'boolean',
      description: 'Whether or not to automatically highlight the top match in the dropdown menu.',
    },
    inputProps: {
      control: 'object',
      description:
        'Props passed to props.renderInput. By default these props will be applied to the `<input />` element rendered by Autocomplete,\
      unless you have specified a custom value for props.renderInput. Any properties supported by HTMLInputElement can be specified,\
      apart from the following which are set by Autocomplete: value, autoComplete, role, aria-autocomplete.\
      inputProps is commonly used for (but not limited to) placeholder, event handlers (onFocus, onBlur, etc.), autoFocus, etc..',
    },
    isItemSelectable: {
      control: 'object',
      type: 'function',
      description:
        'Invoked when attempting to select an item. The return value is used to determine whether the item should be selectable or not.\
      By default all items are selectable.',
    },
    menuStyle: {
      control: 'object',
      description:
        'Styles that are applied to the dropdown menu in the default renderMenu implementation.\
      If you override renderMenu and you want to use menuStyle you must manually apply them (props.menuStyle).',
    },
    onChange: {
      control: 'object',
      type: 'function',
      description: "It is invoked every time the user changes the input's value.",
    },
    onMenuVisibilityChange: {
      control: 'object',
      type: 'function',
      description:
        "It is invoked every time the dropdown menu's visibility changes (i.e. every time it is displayed/hidden).",
    },
    onSelect: {
      type: 'function',
      control: 'object',
      description: 'It is invoked when the user selects an item from the dropdown menu.',
    },
    open: {
      control: 'boolean',
      type: 'boolean',
      description:
        'It is used to override the internal logic which displays/hides the dropdown menu.\
      This is useful if you want to force a certain state based on your UX/business logic.\
      Use it together with onMenuVisibilityChange for fine-grained control over the dropdown menu dynamics.',
    },
    renderInput: {
      control: 'object',
      type: 'function',
      description:
        'It is invoked to generate the input element. The props argument is the result of merging props.\
      inputProps with a selection of props that are required both for functionality and accessibility.\
      At the very least you need to apply props.ref and all props.on<event> event handlers.\
      Failing to do this will cause Autocomplete to behave unexpectedly.',
    },
    renderMenu: {
      control: 'object',
      type: 'function',
      description:
        'It is invoked to generate the render tree for the dropdown menu.\
      Ensure the returned tree includes every entry in items or else the highlight order and keyboard navigation logic will break.\
      Styles will contain { top, left, minWidth } which are the coordinates of the top-left corner and the width of the dropdown menu.',
    },
    selectOnBlur: {
      control: 'boolean',
      type: 'boolean',
      description:
        'Whether or not to automatically select the highlighted item when the `<input/>` loses focus.',
    },
    shouldItemRender: {
      control: 'object',
      type: 'function',
      description:
        'It is invoked for each entry in items and its return value is used to determine whether or not it should be displayed in the dropdown menu.\
        By default all items are always rendered.',
    },
    sortItems: {
      control: 'object',
      type: 'function',
      description: 'The function which is used to sort items before display.',
    },
    value: {
      control: 'text',
      type: 'string',
      description: 'The value to display in the input field',
    },
    wrapperProps: {
      control: 'object',
      description:
        'Props that are applied to the element which wraps the `<input />` and dropdown menu elements rendered by Autocomplete.',
    },
    wrapperStyle: {
      control: 'object',
      description:
        'This is a shorthand for `wrapperProps={{ style: <your styles> }}`. Note that wrapperStyle is applied before wrapperProps, so the latter will win if it contains a style entry.',
    },
    wrapperClassName: {
      control: 'text',
      type: 'string',
      description: 'The custom class to use on the wrapper',
    },
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: (args) => {
    const [usState, setUSState] = React.useState<string>('Ma');

    return (
      <Container>
        <HeadingOne>Basic Example with Static Data</HeadingOne>
        <Paragraph>
          When using static data, you use the client to sort and filter the items, so{' '}
          <Code>Autocomplete</Code> has methods baked in to help.
        </Paragraph>
        <InputContainer>
          <Label htmlFor='states-autocomplete'>Choose a state from the US</Label>
          <Autocomplete<USState>
            {...args}
            value={usState}
            wrapperStyle={{ position: 'relative', display: 'inline-block' }}
            wrapperClassName='ra-border ra-border-solid ra-border-black'
            shouldItemRender={matchStateToTerm}
            sortItems={sortStates}
            onChange={(_event, value) => setUSState(value)}
            onSelect={(value) => setUSState(value)}
            renderMenu={(children) => (
              <ul className='ra-absolute ra-w-full ra-border ra-border-solid ra-border-black'>
                {children}
              </ul>
            )}
          />
        </InputContainer>
      </Container>
    );
  },
  args: {
    inputProps: { id: 'states-autocomplete', className: 'ra-text-black ra-pl-1' },
    items: getStates(),
    getItemValue: (item) => item.name,
    renderItem: (item, isHighlighted) => (
      <li
        className={`ra-px-1 ra-py-1 hover:ra-cursor-default  ${isHighlighted ? 'ra-text-white ra-bg-blue-300' : ''}`}
        key={item.abbr}
      >
        {item.name}
      </li>
    ),
    autoHighlight: true,
    isItemSelectable: (_item) => {
      return true;
    },
    menuStyle: {
      borderRadius: '3px',
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
      background: 'rgba(255, 255, 255, 0.9)',
      padding: '2px 0',
      fontSize: '90%',
      position: 'fixed',
      overflow: 'auto',
      maxHeight: '50%',
    },
    onChange: (_event, _value) => {},
    onMenuVisibilityChange: (_isOpen) => {},
    onSelect: (_value, _item) => {},
    renderInput: (_props) => {
      // @ts-ignore
      return <input {..._props} />;
    },
    renderMenu: (_items, _value, _style) => {
      return <div style={{ ..._style }} children={_items} />;
    },
    selectOnBlur: false,
    value: '',
    wrapperProps: {},
    wrapperStyle: { display: 'inline-block' },
  },
};

export const ManagedMenuVisibility: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<string>('');
    const [isOpen, setIsOpen] = React.useState<boolean>(false);
    const [forceOpen, setForceOpen] = React.useState<boolean>(false);

    const open = React.useMemo(() => forceOpen || isOpen, [forceOpen, isOpen]);

    return (
      <Container>
        <HeadingOne>Managed Menu Visibility</HeadingOne>
        <Paragraph>
          By default Autocomplete will manage its own menu visibility, using basic logic to decide
          whether or not to display it (e.g. open on focus, keypress, close on blur, select, escape,
          etc). If you need full control over when the menu opens and closes you can put
          Autocomplete into "managed menu visibility mode" by supplying <Code>props.open</Code>.
          This will force Autocomplete to ignore its internal menu visibility status and always
          hide/show the menu based on <Code>props.open</Code>. Pair this with{' '}
          <Code>props.onMenuVisibilityChange</Code>- which is invoked each time the internal
          visibility state changes - for full control over the menu's visibility.
        </Paragraph>
        <InputContainer>
          <Label htmlFor='states'>Choose a US state</Label>
          <Autocomplete<USState>
            value={value}
            shouldItemRender={matchStateToTerm}
            onSelect={(value) => setValue(value)}
            onChange={(_event, value) => {
              setValue(value);
            }}
            renderMenu={(children) => (
              <ul className='ra-absolute ra-w-full ra-border ra-border-solid ra-border-black ra-bg-white'>
                {children}
              </ul>
            )}
            wrapperStyle={{ position: 'relative', display: 'inline-block' }}
            wrapperClassName='ra-border ra-border-solid ra-border-black'
            onMenuVisibilityChange={(isOpen) => setIsOpen(isOpen)}
            open={open}
            {...args}
          />

          <button
            className='ra-bg-blue-500 ra-text-white ra-p-2 ra-rounded'
            onClick={() => setIsOpen((prev) => !prev)}
            disabled={forceOpen}
          >
            {open ? 'Close menu' : 'Open menu'}
          </button>
          <label htmlFor='forceOpen'>
            <input
              id='forceOpen'
              type='checkbox'
              checked={forceOpen}
              onChange={() => setForceOpen((prev) => !prev)}
            />
            Force menu to stay open
          </label>
        </InputContainer>
        <div className='ra-mt-4'></div>
      </Container>
    );
  },
  args: {
    inputProps: { id: 'states', className: 'ra-text-black ra-pl-1' },
    items: getStates(),
    getItemValue: (item) => item.name,
    renderItem: (item, isHighlighted) => (
      <li
        className={`ra-px-1 ra-py-1 hover:ra-cursor-default ${isHighlighted ? 'ra-text-white ra-bg-blue-300' : ''}`}
        key={item.abbr}
      >
        {item.name}
      </li>
    ),
  },
};

export const CustomMenu: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<string>('');
    const [unitedStates, setUnitedSates] = React.useState<USState[]>([]);
    const [loading, setLoading] = React.useState<boolean>(false);

    let requestTimer = React.useRef<number | null>(null);

    return (
      <Container>
        <HeadingOne>Custom Menu</HeadingOne>
        <Paragraph>
          While Autocomplete ships with a decent looking menu, you can control the look as well as
          the rendering of it. In this example we'll group the states into the region where they
          belong.
        </Paragraph>
        <InputContainer>
          <Label htmlFor='states-autocomplete'>Choose a state from the US</Label>
          <Autocomplete<USState>
            value={value}
            inputProps={{ id: 'states-autocomplete' }}
            // @ts-ignore
            items={unitedStates}
            onSelect={(value, state) => {
              setValue(value);
              if (state) setUnitedSates([state]);
            }}
            wrapperClassName='ra-border ra-border-solid ra-border-black ra-max-w-[12rem] ra-w-full'
            onChange={(_event, value) => {
              setValue(value);
              setLoading(true);
              setUnitedSates([]);
              if (requestTimer?.current) clearTimeout(requestTimer?.current);
              requestTimer.current = fakeCategorizedRequest<USState[]>(
                value,
                (items: USState[]) => {
                  setUnitedSates(items);
                  setLoading(false);
                },
              );
            }}
            renderMenu={(items, value) => (
              <ul className='ra-absolute ra-max-w-[12rem] ra-border ra-border-solid ra-border-black ra-bg-white'>
                {value === '' ? (
                  <div className='ra-px-1 ra-py-1'>Type of the name of a United State</div>
                ) : loading ? (
                  <div className='ra-px-1 ra-py-1'>Loading...</div>
                ) : items.length === 0 ? (
                  <div className='ra-px-1 ra-py-1'>No matches for {value}</div>
                ) : (
                  items
                )}
              </ul>
            )}
            isItemSelectable={(item) => !item.header}
            {...args}
          />
        </InputContainer>
      </Container>
    );
  },
  args: {
    inputProps: { id: 'states-autocomplete', className: 'ra-text-black ra-pl-1 ra-w-full' },
    getItemValue: (item) => item.name,
    renderItem: (item, isHighlighted) =>
      item.header ? (
        <div className='ra-px-1 ra-py-1 item-header' key={item.header}>
          {item.header}
        </div>
      ) : (
        <li
          className={`ra-px-1 ra-py-1 hover:ra-cursor-default  ${isHighlighted ? 'ra-text-white ra-bg-blue-300' : ''}`}
          key={item.abbr}
        >
          {item.name}
        </li>
      ),
  },
};

export const AsyncData: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<string>('');
    const [unitedStates, setUnitedSates] = React.useState<USState[]>(getStates());

    let requestTimer = React.useRef<number | null>(null);

    return (
      <Container>
        <HeadingOne>Async Data</HeadingOne>
        <Paragraph>
          Autocomplete works great with async data by allowing you to pass in items. The{' '}
          <Code>onChange</Code> event provides you the value to make a server request with, then
          change state and pass in new items, it will attempt to autocomplete the first one.
        </Paragraph>
        <InputContainer>
          <Label htmlFor='states-autocomplete'>Choose a state from the US</Label>
          <Autocomplete
            wrapperStyle={{ position: 'relative', display: 'inline-block' }}
            wrapperClassName='ra-border ra-border-solid ra-border-black'
            value={value}
            //@ts-ignore
            items={unitedStates}
            onSelect={(value, item) => {
              // set the menu to only the selected item
              setValue(value);
              if (item) setUnitedSates([item]);
              // or you could reset it to a default list again
              // this.setState({ unitedStates: getStates() })
            }}
            onChange={(_event, value) => {
              setValue(value);
              if (requestTimer?.current) clearTimeout(requestTimer.current);
              requestTimer.current = fakeRequest<USState[]>(value, (items) => {
                setUnitedSates(items);
              });
            }}
            renderMenu={(children) => (
              <ul className='ra-absolute ra-w-full ra-border ra-border-solid ra-border-black'>
                {children}
              </ul>
            )}
            {...args}
          />
        </InputContainer>
      </Container>
    );
  },
  args: {
    inputProps: { id: 'states-autocomplete', className: 'ra-text-black ra-pl-1' },
    getItemValue: (item) => item.name,
    renderItem: (item, isHighlighted) => (
      <li
        className={`ra-px-1 ra-py-1  hover:ra-cursor-default  ${isHighlighted ? 'ra-text-white ra-bg-blue-300' : ''}`}
        key={item.abbr}
      >
        {item.name}
      </li>
    ),
  },
};
