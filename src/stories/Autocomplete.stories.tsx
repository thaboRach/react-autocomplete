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
      description: '',
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
            value={usState}
            wrapperStyle={{ position: 'relative', display: 'inline-block' }}
            wrapperClassName='ra-border ra-border-solid ra-border-black'
            shouldItemRender={matchStateToTerm}
            sortItems={sortStates}
            onChange={(_event, value) => setUSState(value)}
            onSelect={(value) => setUSState(value)}
            renderMenu={(children) => (
              <div className='ra-absolute ra-w-full ra-border ra-border-solid ra-border-black'>
                {children}
              </div>
            )}
            {...args}
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
      <div
        className={`ra-px-1 ra-py-1 ${isHighlighted ? 'ra-text-white ra-bg-blue-300' : ''}`}
        key={item.abbr}
      >
        {item.name}
      </div>
    ),
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
              <div className='ra-absolute ra-w-full ra-border ra-border-solid ra-border-black ra-bg-white'>
                {children}
              </div>
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
      <div
        className={`ra-px-1 ra-py-1 ${isHighlighted ? 'ra-text-white ra-bg-blue-300' : ''}`}
        key={item.abbr}
      >
        {item.name}
      </div>
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
              <div className='ra-absolute ra-max-w-[12rem] ra-border ra-border-solid ra-border-black ra-bg-white'>
                {value === '' ? (
                  <div className='ra-px-1 ra-py-1'>Type of the name of a United State</div>
                ) : loading ? (
                  <div className='ra-px-1 ra-py-1'>Loading...</div>
                ) : items.length === 0 ? (
                  <div className='ra-px-1 ra-py-1'>No matches for {value}</div>
                ) : (
                  items
                )}
              </div>
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
    // items: getStates(),
    getItemValue: (item) => item.name,
    renderItem: (item, isHighlighted) =>
      item.header ? (
        <div className='ra-px-1 ra-py-1 item-header' key={item.header}>
          {item.header}
        </div>
      ) : (
        <div
          className={`ra-px-1 ra-py-1 ${isHighlighted ? 'ra-text-white ra-bg-blue-300' : ''}`}
          key={item.abbr}
        >
          {item.name}
        </div>
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
              <div className='ra-absolute ra-w-full ra-border ra-border-solid ra-border-black'>
                {children}
              </div>
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
      <div
        className={`ra-px-1 ra-py-1 ${isHighlighted ? 'ra-text-white ra-bg-blue-300' : ''}`}
        key={item.abbr}
      >
        {item.name}
      </div>
    ),
  },
};
