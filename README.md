# @thaborach/react-autocomplete

Accessible, extensible, Autocomplete Input component for React.js.

It is forked from [react-autocomplete](https://github.com/reactjs/react-autocomplete) which is deprecated and no longer being maintained.

[Checkout the demo](https://thaborach.github.io/react-autocomplete/?path=/docs/components-autocomplete--docs)

## Table of contents

- [Installation and usage](#installation-and-usage)
  - [Installation](#installation)
  - [Usage](#usage)
- [Properties](#properties)
- [Contributing](#contributing)
- [For any questions, suggestions, or feature requests](#for-any-questions-suggestions-or-feature-requests)

## Installation and usage

### Installation

**npm**:

```bash
npm i @thaborach/react-autocomplete --save
```

**yarn**:

```bash
yarn add @thaborach/react-autocomplete
```

### Usage

```jsx
import React from 'react';
import { Autocomplete } from '@thaboRach/react-autocomplete';

export default function Dropdown() {
  const [value, setValue] = React.useState();

  return (
    <Autocomplete
      getItemValue={(item) => item.label}
      items={[{ label: 'apple' }, { label: 'banana' }, { label: 'pear' }]}
      renderItem={(item, isHighlighted) => (
        <div style={{ background: isHighlighted ? 'lightgray' : 'white' }}>{item.label}</div>
      )}
      value={value}
      onChange={(e, val) => setValue(val)}
      onSelect={(val) => setValue(val)}
    />
  );
}
```

## Properties

Autocomplete accepts the following values as props:

### `getItemValue: Function`

Arguments: `item: Any`

Used to read the display value from each entry in `items`.

### `items: Array`

The items to display in the dropdown menu

### `renderItem: Function`

Arguments: `item: Any, isHighlighted: Boolean, styles: Object`

Invoked for each entry in `items` that also passes `shouldItemRender` to
generate the render tree for each item in the dropdown menu. `styles` is
an optional set of styles that can be applied to improve the look/feel
of the items in the dropdown menu.

### `autoHighlight: Boolean` (optional)

Default value: `true`

Whether or not to automatically highlight the top match in the dropdown
menu.

### `inputProps: Object` (optional)

Default value: `{}`

Props passed to `props.renderInput`. By default these props will be
applied to the `<input />` element rendered by `Autocomplete`, unless you
have specified a custom value for `props.renderInput`. Any properties
supported by `HTMLInputElement` can be specified, apart from the
following which are set by `Autocomplete`: value, autoComplete, role,
aria-autocomplete. `inputProps` is commonly used for (but not limited to)
placeholder, event handlers (onFocus, onBlur, etc.), autoFocus, etc..

### `isItemSelectable: Function` (optional)

Default value: `function() { return true }`

Arguments: `item: Any`

Invoked when attempting to select an item. The return value is used to
determine whether the item should be selectable or not.
By default all items are selectable.

### `menuStyle: Object` (optional)

Default value:

```jsx
{
  borderRadius: '3px',
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
  background: 'rgba(255, 255, 255, 0.9)',
  padding: '2px 0',
  fontSize: '90%',
  position: 'fixed',
  overflow: 'auto',
  maxHeight: '50%', // TODO: don't cheat, let it flow to the bottom
}
```

Styles that are applied to the dropdown menu in the default `renderMenu`
implementation. If you override `renderMenu` and you want to use
`menuStyle` you must manually apply them (`this.props.menuStyle`).

### `onChange: Function` (optional)

Default value: `function() {}`

Arguments: `event: Event, value: String`

Invoked every time the user changes the input's value.

### `onMenuVisibilityChange: Function` (optional)

Default value: `function() {}`

Arguments: `isOpen: Boolean`

Invoked every time the dropdown menu's visibility changes (i.e. every
time it is displayed/hidden).

### `onSelect: Function` (optional)

Default value: `function() {}`

Arguments: `value: String, item: Any`

Invoked when the user selects an item from the dropdown menu.

### `open: Boolean` (optional)

Used to override the internal logic which displays/hides the dropdown
menu. This is useful if you want to force a certain state based on your
UX/business logic. Use it together with `onMenuVisibilityChange` for
fine-grained control over the dropdown menu dynamics.

### `renderInput: Function` (optional)

Default value:

```jsx
function(props) {
  return <input {...props} />
}
```

Arguments: `props: Object`

Invoked to generate the input element. The `props` argument is the result
of merging `props.inputProps` with a selection of props that are required
both for functionality and accessibility. At the very least you need to
apply `props.ref` and all `props.on<event>` event handlers. Failing to do
this will cause `Autocomplete` to behave unexpectedly.

### `renderMenu: Function` (optional)

Default value:

```jsx
function(items, value, style) {
  return <div style={{ ...style, ...this.menuStyle }} children={items}/>
}
```

Arguments: `items: Array<Any>, value: String, styles: Object`

Invoked to generate the render tree for the dropdown menu. Ensure the
returned tree includes every entry in `items` or else the highlight order
and keyboard navigation logic will break. `styles` will contain
{ top, left, minWidth } which are the coordinates of the top-left corner
and the width of the dropdown menu.

### `selectOnBlur: Boolean` (optional)

Default value: `false`

Whether or not to automatically select the highlighted item when the
`<input>` loses focus.

### `shouldItemRender: Function` (optional)

Arguments: `item: Any, value: String`

Invoked for each entry in `items` and its return value is used to
determine whether or not it should be displayed in the dropdown menu.
By default all items are always rendered.

### `sortItems: Function` (optional)

Arguments: `itemA: Any, itemB: Any, value: String`

The function which is used to sort `items` before display.

### `value: Any` (optional)

Default value: `''`

The value to display in the input field

### `wrapperProps: Object` (optional)

Default value: `{}`

Props that are applied to the element which wraps the `<input />` and
dropdown menu elements rendered by `Autocomplete`.

### `wrapperStyle: Object` (optional)

Default value:

```jsx
{
  display: 'inline-block';
}
```

This is a shorthand for `wrapperProps={{ style: <your styles> }}`.
Note that `wrapperStyle` is applied before `wrapperProps`, so the latter
will win if it contains a `style` entry.

### Imperative API

In addition to the props there is an API available on the mounted element which is similar to that of `HTMLInputElement`. In other words: you can access most of the common `<input>` methods directly on an `Autocomplete` instance. An example:

```jsx
import React from 'react';

function MyComponent() {
  const input = React.useRef(null);

  React.useEffect(() => {
    // Focus the input and select "world"
    input.focus();
    input.setSelectionRange(6,11);
  },[]);

  return (
      <Autocomplete
        ref={el => this.input = el}
        value="hello world"
        ...
      />
  );
}
```

## Contributing

We would love some contributions! Check out [this document](https://github.com/thaboRach/react-autocomplete/blob/main/CONTRIBUTING.md#contributing-to-react-autocomplete) to get started.

## For any questions, suggestions, or feature requests

[Please file an issue](https://github.com/thaboRach/react-autocomplete/issues)!
