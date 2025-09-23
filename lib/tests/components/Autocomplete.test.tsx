import React, { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Autocomplete, AutocompleteProps } from '@lib/components/Autocomplete';
import { getStates, matchStateToTermWithHeaders } from '@lib/utils';
import { ImperativeAPIRef, USState } from '@lib/types';

function AutocompleteComponentJSX(
  props: Readonly<
    Omit<Partial<AutocompleteProps<USState>>, 'items' | 'getItemValue' | 'shouldItemRender'>
  >,
) {
  const [value, setValue] = React.useState<string>('');
  return (
    <Autocomplete<USState>
      {...props}
      getItemValue={(item) => item.name}
      value={value}
      onSelect={(value) => setValue(value)}
      onChange={(_event, value) => {
        setValue(value);
      }}
      items={getStates()}
      renderItem={(item, isHighlighted) => (
        <option key={item.abbr} aria-selected={isHighlighted}>
          {item.name}
        </option>
      )}
      shouldItemRender={matchStateToTermWithHeaders}
    />
  );
}

// jest.useFakeTimers()

// afterEach(() => {
//   jest.clearAllTimers()
//   setTimeout.mockClear()
//   clearTimeout.mockClear()
// })

describe('Autocomplete acceptance tests', () => {
  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should render the Autocomplete component', () => {
    render(<AutocompleteComponentJSX />);
    const input = screen.getByRole('textbox');

    expect(input).toBeInTheDocument();
  });

  it('should update the value', async () => {
    render(<AutocompleteComponentJSX />);
    const input = screen.getByRole('textbox');

    await userEvent.click(input);
    await userEvent.type(input, 'California');

    expect(input).toHaveValue('California');
  });

  it('should display autocomplete menu when input has focus', async () => {
    render(<AutocompleteComponentJSX />);
    const input = screen.getByRole('textbox');

    await userEvent.click(input);

    const menu = screen.getByRole('combobox');
    expect(menu).toBeInTheDocument();
  });

  it('should show results when value is a partial match', async () => {
    render(<AutocompleteComponentJSX />);
    const input = screen.getByRole('textbox');

    await userEvent.click(input);

    const options = screen.queryAllByRole('option');
    expect(options.length).toBe(50);

    await userEvent.type(input, 'as');

    const updatedOptions = screen.queryAllByRole('option');
    expect(updatedOptions.length).toBe(7);
  });

  it('should close autocomplete menu when input is blurred', async () => {
    render(<AutocompleteComponentJSX />);
    const input = screen.getByRole('textbox');
    await userEvent.click(input);

    const menu = screen.queryByRole('combobox');
    expect(menu).toBeInTheDocument();

    await userEvent.tab();
    expect(menu).not.toBeInTheDocument();
  });

  it('should highlight top match when `props.value` changes', async () => {
    render(<AutocompleteComponentJSX />);
    const input = screen.getByRole('textbox');

    await userEvent.click(input);
    await userEvent.type(input, 'ar');

    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
  });

  // TODO: update
  it.skip('should highlight top match when an item appears in `props.items` that matches `props.value`', async () => {
    render(<AutocompleteComponentJSX />);
    const input = screen.getByRole('textbox');

    // jest.spyOn(tree.instance(), 'maybeAutoCompleteText')
    // tree.setProps({ value: 'a' })
    await userEvent.type(input, 'a');

    // expect(tree.state('highlightedIndex')).toEqual(null)
    // tree.setProps({ items: getStates() })
    // expect(tree.instance().maybeAutoCompleteText).toHaveBeenCalledTimes(2)
    // expect(tree.state('highlightedIndex')).toEqual(0)
  });

  it('should not highlight top match when `props.autoHighlight=false`', async () => {
    render(<AutocompleteComponentJSX autoHighlight={false} />);
    const input = screen.getByRole('textbox');

    await userEvent.click(input);
    await userEvent.type(input, 'a');

    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'false');
  });

  it.skip('should reset `state.highlightedIndex` when `props.value` becomes an empty string`', async () => {
    render(<AutocompleteComponentJSX />);
    const input = screen.getByRole('textbox');

    await userEvent.click(input);
    await userEvent.type(input, 'a');

    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');

    await userEvent.clear(input);
    expect(options[0]).toHaveAttribute('aria-selected', 'false');
  });

  it.skip("should reset `state.highlightedIndex` if `props.value` doesn't match anything", async () => {
    render(<AutocompleteComponentJSX />);
    const input = screen.getByRole('textbox');

    await userEvent.type(input, 'ax');

    // const options = screen.getAllByRole('option');

    // expect(tree.instance().maybeAutoCompleteText).toHaveBeenCalledTimes(1)
    // expect(tree.state('highlightedIndex')).toEqual(null)
  });

  it.skip('should preserve `state.highlightedIndex` when `props.value` changes as long as it still matches', async () => {
    render(<AutocompleteComponentJSX />);
    const input = screen.getByRole('textbox');

    await userEvent.type(input, 'h');

    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');

    // tree.setState({ highlightedIndex: 10 })
    // tree.setProps({ value: 'ha' })
    // expect(tree.state('highlightedIndex')).toEqual(10)
  });

  // it.skip('should reset `state.highlightedIndex` when it falls outside of possible `props.items` range', () => {
  //   const items = getStates();
  //   autocompleteWrapper.setState({ highlightedIndex: 10 });
  //   items.length = 5;
  //   autocompleteWrapper.setProps({ items });
  //   expect(autocompleteWrapper.state('highlightedIndex')).toBe(null);
  // });

  // it.skip('should preserve `state.highlightedIndex` when it is within `props.items` range and `props.value` is unchanged`', () => {
  //   const tree = mount(
  //     AutocompleteComponentJSX({
  //       value: 'a',
  //     }),
  //   );
  //   render(<AutocompleteComponentJSX value='a' />);
  //   tree.setState({ highlightedIndex: 0 });
  //   jest.spyOn(tree.instance(), 'ensureHighlightedIndex');
  //   tree.setProps({ value: 'a' });
  //   expect(tree.instance().ensureHighlightedIndex).toHaveBeenCalledTimes(1);
  //   expect(tree.state('highlightedIndex')).toEqual(0);
  // });

  // it.skip('should preserve the matched item even when its previous place was outside of the new range', () => {
  //   const tree = mount(AutocompleteComponentJSX({}));
  //   render(<AutocompleteComponentJSX />);
  //   jest.spyOn(tree.instance(), 'maybeAutoCompleteText');
  //   tree.setProps({ value: 'ma' });
  //   tree.setState({ highlightedIndex: 3 }); // Massachusetts
  //   tree.setProps({ value: 'mas' });
  //   expect(tree.instance().maybeAutoCompleteText).toHaveBeenCalledTimes(2);
  //   expect(tree.state('highlightedIndex')).toEqual(0);
  // });

  // it.skip('should display menu based on `props.open` when provided', () => {
  //   render(<AutocompleteComponentJSX />);
  //   expect(tree.state('isOpen')).toBe(false);
  //   expect(tree.find('> div').length).toBe(0);
  //   tree.setState({ isOpen: true });
  //   expect(tree.find('> div').length).toBe(1);
  //   tree.setProps({ open: false });
  //   tree.setState({ isOpen: false });
  //   expect(tree.find('> div').length).toBe(0);
  //   tree.setProps({ open: true });
  //   expect(tree.find('> div').length).toBe(1);
  // });

  // it.skip('should set menu positions on initial render if the menu is visible', () => {
  //   const menuSpy = jest.fn(() => <div />);
  //   mount(
  //     AutocompleteComponentJSX({
  //       open: true,
  //       renderMenu: menuSpy,
  //     }),
  //   );
  //   expect(menuSpy).toHaveBeenCalledTimes(2);
  //   // Initial render
  //   expect(menuSpy.mock.calls[0][2]).toEqual({
  //     left: undefined,
  //     top: undefined,
  //     minWidth: undefined,
  //   });
  //   // Re-render after componentDidMount
  //   expect(menuSpy.mock.calls[1][2]).toEqual({ left: 0, top: 0, minWidth: 0 });
  // });

  // it.skip('should set menu positions when the menu is forced open via props.open', () => {
  //   const menuSpy = jest.fn(() => <div />);
  //   const tree = mount(
  //     AutocompleteComponentJSX({
  //       renderMenu: menuSpy,
  //     }),
  //   );
  //   expect(menuSpy).not.toHaveBeenCalled();
  //   tree.setProps({ open: true });
  //   expect(menuSpy).toHaveBeenCalledTimes(2);
  //   expect(menuSpy.mock.calls[0][2]).toEqual({
  //     left: undefined,
  //     top: undefined,
  //     minWidth: undefined,
  //   });
  //   expect(menuSpy.mock.calls[1][2]).toEqual({ left: 0, top: 0, minWidth: 0 });
  // });

  // it.skip('should invoke `props.inMenuVisibilityChange` when `state.isOpen` changes', () => {
  //   const onMenuVisibilityChange = jest.fn();
  //   const tree = mount(AutocompleteComponentJSX({ onMenuVisibilityChange }));
  //   expect(tree.state('isOpen')).toBe(false);
  //   expect(onMenuVisibilityChange).not.toHaveBeenCalled();
  //   tree.setState({ isOpen: true });
  //   expect(onMenuVisibilityChange).toHaveBeenCalledTimes(1);
  //   expect(onMenuVisibilityChange.mock.calls[0][0]).toBe(true);
  //   tree.setState({ isOpen: false });
  //   expect(onMenuVisibilityChange).toHaveBeenCalledTimes(2);
  //   expect(onMenuVisibilityChange.mock.calls[1][0]).toBe(false);
  // });

  // it.skip('should allow specifying any event handler via `props.inputProps`', () => {
  //   const handlers = ['Focus', 'Blur', 'KeyDown', 'KeyUp', 'Click'];
  //   const spies = [];
  //   const inputProps = {};
  //   handlers.forEach((handler, i) => (inputProps[`on${handler}`] = spies[i] = jest.fn()));
  //   const tree = mount(AutocompleteComponentJSX({ inputProps }));
  //   handlers.forEach((handler, i) => {
  //     tree.find('input').simulate(handler.toLowerCase());
  //     expect(spies[i]).toHaveBeenCalledTimes(1);
  //     expect(spies[i].mock.calls[0][0]).toBeDefined();
  //   });
  // });

  // it.skip('should not invoke onBlur and/or onFocus when selecting an item from the menu', () => {
  //   const onBlurSpy = jest.fn();
  //   const onFocusSpy = jest.fn();
  //   const onSelectSpy = jest.fn();
  //   const tree = mount(
  //     AutocompleteComponentJSX({
  //       inputProps: {
  //         onBlur: onBlurSpy,
  //         onFocus: onFocusSpy,
  //       },
  //       onSelect: onSelectSpy,
  //       open: true,
  //     }),
  //   );
  //   tree.find('div > div').at(0).simulate('mouseEnter');
  //   tree.find('input').at(0).simulate('blur');
  //   tree.find('div > div > div').at(0).simulate('click');
  //   expect(onBlurSpy).not.toHaveBeenCalled();
  //   expect(onFocusSpy).not.toHaveBeenCalled();
  //   expect(onSelectSpy).toHaveBeenCalledTimes(1);
  // });

  // it.skip('should select value on blur when selectOnBlur=true and highlightedIndex is not null', () => {
  //   const onSelect = jest.fn();
  //   const tree = mount(
  //     AutocompleteComponentJSX({
  //       selectOnBlur: true,
  //       onSelect,
  //     }),
  //   );
  //   tree.find('input').at(0).simulate('focus');
  //   tree.setProps({ value: 'ma' });
  //   tree.setState({ highlightedIndex: 3 }); // Massachusetts
  //   tree.find('input').at(0).simulate('blur');
  //   expect(onSelect).toHaveBeenCalledTimes(1);
  //   expect(onSelect).toHaveBeenCalledWith('Massachusetts', getStates()[20]);
  // });

  // it.skip('should not select value on blur when selectOnBlur=false', () => {
  //   const onSelect = jest.fn();
  //   const tree = mount(
  //     AutocompleteComponentJSX({
  //       selectOnBlur: false,
  //       onSelect,
  //     }),
  //   );
  //   tree.find('input').at(0).simulate('focus');
  //   tree.setProps({ value: 'ma' });
  //   tree.setState({ highlightedIndex: 3 }); // Massachusetts
  //   tree.find('input').at(0).simulate('blur');
  //   expect(onSelect).not.toHaveBeenCalled();
  // });

  // it.skip('should not select value on blur when selectOnBlur=true and highlightedIndex=null ', () => {
  //   const onSelect = jest.fn();
  //   const tree = mount(
  //     AutocompleteComponentJSX({
  //       selectOnBlur: false,
  //       onSelect,
  //     }),
  //   );
  //   tree.find('input').at(0).simulate('focus');
  //   tree.setProps({ value: 'ma' });
  //   tree.setState({ highlightedIndex: null });
  //   tree.find('input').at(0).simulate('blur');
  //   expect(onSelect).not.toHaveBeenCalled();
  // });
});

// describe.skip('focus management', () => {
//   it('should preserve focus when clicking on a menu item', () => {
//     const tree = mount(AutocompleteComponentJSX({}));
//     const ac = tree.instance();
//     const input = tree.find('input');
//     input.simulate('focus');
//     ac.refs.input.focus = jest.fn(() => input.simulate('focus'));
//     expect(tree.state('isOpen')).toBe(true);
//     const menu = tree.find('div > div').at(0);
//     menu.simulate('mouseEnter');
//     expect(ac._ignoreBlur).toBe(true);
//     input.simulate('blur');
//     expect(tree.state('isOpen')).toBe(true);
//     const items = tree.find('div > div > div');
//     items.at(3).simulate('click');
//     expect(ac.refs.input.focus).toHaveBeenCalledTimes(1);
//     expect(tree.state('isOpen')).toBe(false);
//     expect(ac._ignoreBlur).toBe(false);
//   });

//   it('...even if `input.focus()` happens async (IE)', () => {
//     const tree = mount(AutocompleteComponentJSX({}));
//     const ac = tree.instance();
//     const input = tree.find('input');
//     input.simulate('focus');
//     ac.refs.input.focus = jest.fn();
//     expect(tree.state('isOpen')).toBe(true);
//     const menu = tree.find('div > div').at(0);
//     menu.simulate('mouseEnter');
//     expect(ac._ignoreBlur).toBe(true);
//     input.simulate('blur');
//     expect(tree.state('isOpen')).toBe(true);
//     const items = tree.find('div > div > div');
//     items.at(3).simulate('click');
//     expect(ac.refs.input.focus).toHaveBeenCalledTimes(1);
//     expect(ac._ignoreFocus).toBe(true);
//     input.simulate('focus');
//     expect(tree.state('isOpen')).toBe(false);
//     expect(ac._ignoreBlur).toBe(false);
//     expect(ac._ignoreFocus).toBe(false);
//   });

//   it('should preserve focus when clicking on non-item elements in the menu', () => {
//     const tree = mount(
//       AutocompleteComponentJSX({
//         renderMenu: (items) => (
//           <div>
//             <span />
//             {items}
//           </div>
//         ),
//       }),
//     );
//     const ac = tree.instance();
//     const input = tree.find('input');
//     input.simulate('focus');
//     ac.refs.input.focus = jest.fn(() => input.simulate('focus'));
//     expect(tree.state('isOpen')).toBe(true);
//     const menu = tree.find('div > div').at(0);
//     menu.simulate('mouseEnter');
//     expect(ac._ignoreBlur).toBe(true);
//     input.simulate('blur');
//     expect(tree.state('isOpen')).toBe(true);
//     const nonItem = tree.find('span');
//     nonItem.simulate('click');
//     expect(ac.refs.input.focus).toHaveBeenCalledTimes(1);
//     expect(tree.state('isOpen')).toBe(true);
//     expect(ac._ignoreBlur).toBe(true);
//   });

//   it('should save scroll position on blur', () => {
//     const tree = mount(AutocompleteComponentJSX({}));
//     const ac = tree.instance();
//     expect(ac._scrollOffset).toBe(null);
//     ac._ignoreBlur = true;
//     ac.handleInputBlur();
//     expect(ac._scrollOffset).toEqual(expect.any(Object));
//     expect(ac._scrollOffset.x).toEqual(expect.any(Number));
//     expect(ac._scrollOffset.y).toEqual(expect.any(Number));
//   });

//   it('should restore scroll position on focus reset', () => {
//     jest.spyOn(window, 'scrollTo');
//     const tree = mount(AutocompleteComponentJSX({}));
//     const ac = tree.instance();
//     ac._ignoreFocus = true;
//     ac._scrollOffset = { x: 1, y: 2 };
//     const timer = {};
//     ac._scrollTimer = timer;
//     ac.handleInputFocus();
//     expect(window.scrollTo).toHaveBeenCalledTimes(1);
//     expect(window.scrollTo).toHaveBeenCalledWith(1, 2);
//     expect(clearTimeout).toHaveBeenCalledTimes(1);
//     expect(clearTimeout).toHaveBeenCalledWith(timer);
//     expect(setTimeout).toHaveBeenCalledTimes(1);
//     expect(ac._scrollTimer).toEqual(expect.any(Number));
//     expect(ac._scrollOffset).toBe(null);
//     jest.runAllTimers();
//     expect(window.scrollTo).toHaveBeenCalledTimes(2);
//     expect(window.scrollTo).toHaveBeenLastCalledWith(1, 2);
//     expect(ac._scrollTimer).toBe(null);
//   });

//   it('should clear any pending scroll timers on unmount', () => {
//     const tree = mount(AutocompleteComponentJSX({}));
//     const ac = tree.instance();
//     ac._scrollTimer = 42;
//     tree.unmount();
//     expect(ac._scrollTimer).toBe(null);
//     expect(clearTimeout).toHaveBeenCalledTimes(1);
//     expect(clearTimeout).toHaveBeenCalledWith(42);
//   });
// });

// Event handler unit tests

describe.skip('Autocomplete <character> event handlers', () => {
  it('should pass updated `input.value` to `onChange` and replace with `props.value`', async () => {
    let value = '';
    render(
      <AutocompleteComponentJSX
        onChange={(_, v) => {
          value = v;
        }}
      />,
    );
    const input = screen.getByRole('textbox');

    await userEvent.type(input, 'a');

    // autocompleteWrapper.setProps({ value, onChange(_, v) { value = v } })

    // autocompleteInputWrapper.get(0).value = 'a'
    // autocompleteInputWrapper.simulate('keyPress', { key: 'a', keyCode: 97, which: 97 })
    // autocompleteInputWrapper.simulate('change')

    expect(input).toHaveValue('');
    expect(value).toEqual('a');
  });
});

describe('Autocomplete ArrowDown event handlers', () => {

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should highlight the 1st item in the menu when none is selected', async () => {
    render(<AutocompleteComponentJSX />);
    const input = screen.getByRole('textbox');

    await userEvent.click(input);

    const menu = screen.getByRole('combobox');
    expect(menu).toBeInTheDocument();

    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'false');

    await userEvent.keyboard('{ArrowDown}');

    expect(options[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('should highlight the "n+1" item in the menu when "n" is selected', async () => {
    render(<AutocompleteComponentJSX />);
    const input = screen.getByRole('textbox');
    await userEvent.click(input);
    await userEvent.keyboard('{ArrowDown}');

    const menu = screen.getByRole('combobox');
    expect(menu).toBeInTheDocument();

    const n = 4;
    await userEvent.keyboard(`{ArrowDown>${n}/}`);

    const options = screen.getAllByRole('option');
    expect(options[n]).toHaveAttribute('aria-selected', 'true');
  });

  it('should highlight the 1st item in the menu when the last is selected', async () => {
    render(<AutocompleteComponentJSX />);
    const input = screen.getByRole('textbox');
    await userEvent.click(input);

    await userEvent.keyboard(`{ArrowDown>50/}`);

    const options = screen.getAllByRole('option');
    expect(options[49]).toHaveAttribute('aria-selected', 'true');

    await userEvent.keyboard(`{ArrowDown}`);
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('should not select anything if there are no selectable items', async () => {
    render(<AutocompleteComponentJSX isItemSelectable={() => false} />);
    const input = screen.getByRole('textbox');
    await userEvent.click(input);

    await userEvent.keyboard(`{ArrowDown}`);
    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'false');
  });
});

describe('Autocomplete ArrowUp event handlers', () => {
  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should highlight the last item in the menu when none is selected', async () => {
    render(<AutocompleteComponentJSX />);
    const input = screen.getByRole('textbox');
    await userEvent.click(input);

    const menu = screen.getByRole('combobox');
    expect(menu).toBeInTheDocument();

    await userEvent.keyboard('{ArrowUp}');

    const options = screen.getAllByRole('option');
    expect(options[49]).toHaveAttribute('aria-selected', 'true');
  });

  it('should highlight the "n-1" item in the menu when "n" is selected', async () => {
    render(<AutocompleteComponentJSX />);
    const input = screen.getByRole('textbox');
    await userEvent.click(input);
    await userEvent.keyboard('{ArrowDown}');

    const menu = screen.getByRole('combobox');
    expect(menu).toBeInTheDocument();

    const n = 4;
    await userEvent.keyboard(`{ArrowDown>${n}/}`);

    await userEvent.keyboard(`{ArrowUp}`);
    const options = screen.getAllByRole('option');
    expect(options[n - 1]).toHaveAttribute('aria-selected', 'true');
  });

  it('should highlight the last item in the menu when the 1st is selected', async () => {
    render(<AutocompleteComponentJSX />);
    const input = screen.getByRole('textbox');
    await userEvent.click(input);
    await userEvent.keyboard('{ArrowDown}');

    const menu = screen.getByRole('combobox');
    expect(menu).toBeInTheDocument();

    await userEvent.keyboard('{ArrowUp}');

    const options = screen.getAllByRole('option');
    expect(options[49]).toHaveAttribute('aria-selected', 'true');
  });

  it('should not select anything if there are no selectable items', async () => {
    render(<AutocompleteComponentJSX isItemSelectable={() => false} />);
    const input = screen.getByRole('textbox');
    await userEvent.click(input);

    await userEvent.keyboard(`{ArrowUp}`);
    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'false');
  });
});

describe('Autocomplete <Enter> event handlers', () => {
  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should do nothing if the menu is closed', async () => {
    render(<AutocompleteComponentJSX />);

    await userEvent.keyboard('{Enter}');
    const menu = screen.queryByRole('combobox');
    expect(menu).not.toBeInTheDocument();
  });

  it('should close menu if input has focus but no item has been selected and then the Enter key is hit', async () => {
    let value = '';
    render(
      <AutocompleteComponentJSX
        onSelect={(v) => {
          value = v;
        }}
      />,
    );
    const input = screen.getByRole('textbox');
    await userEvent.click(input);

    await userEvent.keyboard('{Backspace}');

    const options = screen.queryAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'false');

    await userEvent.keyboard('{Enter}');
    expect(value).toBe('');

    const menu = screen.queryByRole('combobox');
    expect(menu).not.toBeInTheDocument();
  });

  it.skip('should invoke `onSelect` with the selected menu item and close the menu', async () => {
    let value = 'Ar';
    // let defaultPrevented = false;
    render(
      <AutocompleteComponentJSX
        onSelect={(v) => {
          value = v;
        }}
      />,
    );
    const input = screen.getByRole('textbox');
    await userEvent.click(input);
    await userEvent.type(input, value);

    await userEvent.keyboard('r');
    await userEvent.keyboard('{Enter}');

    expect(value).toEqual('Arizona');

    const menu = screen.getByRole('combobox');
    expect(menu).toBeInTheDocument();
  });

  it('should do nothing if `keyCode` is not 13', async () => {
    const onSelect = vi.fn();
    render(<AutocompleteComponentJSX onSelect={onSelect} />)
    const input = screen.getByRole('textbox');
    await userEvent.click(input);

    const menu = screen.getByRole('combobox');
    expect(menu).toBeInTheDocument();

    await userEvent.keyboard('{Enter}');
    expect(onSelect).not.toHaveBeenCalled();

    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Enter}');
    expect(onSelect).not.toHaveBeenCalled();

    // tree.setState({ isOpen: true });
    // tree.find('input').simulate('keyDown', { key: 'Enter', keyCode: 229 });
    // expect(tree.state('isOpen')).toBe(true);
    // expect(onSelect).not.toHaveBeenCalled();

    // tree.setState({ highlightedIndex: 1 });
    // tree.find('input').simulate('keyDown', { key: 'Enter', keyCode: 229 });
    // expect(tree.state('isOpen')).toBe(true);
    // expect(onSelect).not.toHaveBeenCalled();
  });
});

describe('Autocomplete <Escape> event handlers', () => {
  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should unhighlight any selected menu item + close the menu', async () => {
    render(<AutocompleteComponentJSX />);
    const input = screen.getByRole('textbox');

    await userEvent.click(input);

    const menu = screen.getByRole('combobox');
    expect(menu).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');

    expect(menu).not.toBeInTheDocument();
  });
});

describe('Autocomplete keyDown', () => {
  afterEach(() => {
    vi.clearAllTimers();
  });

  it("should not clear highlightedIndex for keys that don't modify `input.value`", async () => {
    render(<AutocompleteComponentJSX />);
    const input = screen.getByRole('textbox');

    await userEvent.click(input);

    const options = screen.getAllByRole('option');

    await userEvent.type(input, 'a');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');

    await userEvent.keyboard('{ArrowLeft}');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');

    await userEvent.keyboard('{ArrowRight}');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');

    await userEvent.keyboard('{Control}');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');

    await userEvent.keyboard('{Alt}');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
  });
});

describe('Autocomplete mouse event handlers', () => {
  afterEach(() => {
    vi.clearAllTimers();
  });

  it.skip('should open menu if it is closed when clicking in the input', async () => {
    render(<AutocompleteComponentJSX />);
    const input = screen.getByRole('textbox');

    const menu = screen.queryByRole('combobox');
    expect(menu).not.toBeInTheDocument();

    await userEvent.click(input);

    expect(menu).toBeInTheDocument();
  });

  it('should set `highlightedIndex` when hovering over items in the menu', async () => {
    render(<AutocompleteComponentJSX />);
    const input = screen.getByRole('textbox');
    await userEvent.click(input);

    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'false');

    await userEvent.hover(options[0]);
    expect(options[0]).toHaveAttribute('aria-selected', 'true');

    await userEvent.hover(options[2]);
    expect(options[2]).toHaveAttribute('aria-selected', 'true');
  });

  it.skip('should select an item when clicking on an item in the menu', async () => {
    let selected;
    render(
      <AutocompleteComponentJSX
        onSelect={(val) => {
          selected = val;
        }}
      />,
    );
    const input = screen.getByRole('textbox');
    await userEvent.click(input);

    const options = screen.getAllByRole('option');
    await userEvent.click(options[3]);

    expect(selected).toBe(getStates()[3].name);
  });
});

// describe.skip('Autocomplete.props.renderInput', () => {
//   afterEach(() => {
//     vi.clearAllTimers();
//   });

//   it('should be invoked in `render` to create the <input> element', () => {
//     const renderInput = vi.fn((props) => {
//       expect(props).toMatchSnapshot();
//       return (
//         <div>
//           <input {...props} autoComplete='on' />
//         </div>
//       );
//     });

//     render(<AutocompleteComponentJSX value='pants' renderInput={renderInput} />);

//     const tree = shallow(
//       AutocompleteComponentJSX({
//         value: 'pants',
//         inputProps: {
//           foo: 'bar',
//         },
//         renderInput,
//       }),
//     );

//     expect(renderInput).toHaveBeenCalledTimes(1);
//     expect(tree).toMatchSnapshot();
//   });
// });

// Component method unit tests
describe.skip('Autocomplete#renderMenu', () => {
  it('should return a <div ref="menu"> ReactComponent when renderMenu() is called', () => {
    const inputRef = createRef<ImperativeAPIRef>();
    render(<AutocompleteComponentJSX inputElementRef={inputRef} />);
    // const input = screen.getByRole('textbox');

    //autocompleteInputWrapper.simulate('change', { target: { value: 'Ar' } })
    const menu = screen.getByRole('combobox')
    expect(typeof menu).toEqual('div');
    // expect(typeof menu.ref).toEqual('function');
    expect(menu.children.length).toEqual(50);
  });

  it('should return a menu ReactComponent with a subset of children when partial match text has been entered', async () => {
    // Input 'Ar' should result in 6 items in the menu, populated from autocomplete.
    render(<AutocompleteComponentJSX value='Ar' />);
    // const input = screen.getByRole('textbox');

    const menu = screen.getByRole('combobox')
    expect(menu.children.length).toEqual(6);
    // const autocompleteMenu = autocompleteWrapper.instance().renderMenu();
    // expect(autocompleteMenu.props.children.length).toEqual(6);
  });

  it('should allow using custom components', async () => {

    function Menu(props: any) {
      return (<div data-testid="menu">{props.items}</div>)
    }

    function Item(props: any) {
      return (<div data-testid="item">{props.item.name}</div>)
    }

    render(<AutocompleteComponentJSX renderMenu={(items) => (<Menu items={items} />)} renderItem={(item) => (<Item item={item} />)} />)

    const input = screen.getByRole('textbox');
    await userEvent.click(input);

    const menu = screen.queryAllByTestId('menu');
    const items = screen.queryAllByTestId('item')


    expect(menu.length).toBe(1);
    expect(items.length).toBe(50);
  });
});

// describe.skip('Autocomplete isItemSelectable', () => {
//   // const autocompleteWrapper = mount(AutocompleteComponentJSX({
//   //   open: true,
//   //   items: getCategorizedStates(),
//   //   isItemSelectable: item => !item.header
//   // }))

//   it('should automatically highlight the first selectable item', () => {
//     render(<AutocompleteComponentJSX open={true} isItemSelectable={(item) => !item.header} />);
//     const autocompleteWrapper = screen.getByRole('combobox');

//     // Inputting 'ne' will cause Nevada to be the first selectable state to show up under the header 'West'
//     // The header (index 0) is not selectable, so should not be automatically highlighted.
//     autocompleteWrapper.setProps({ value: 'ne' });
//     expect(autocompleteWrapper.state('highlightedIndex')).toBe(1);
//   });

//   it('should automatically highlight the next available item', () => {
//     // After inputting 'new h' to get New Hampshire you have a list that looks like:
//     // [ header, header, header, header, New Hampshire, ... ]
//     // This test makes sure that New Hampshire is selected, at index 4.
//     // (maybeAutocompleteText should skip over the headers correctly)
//     autocompleteWrapper.setProps({ value: 'new h' });
//     expect(autocompleteWrapper.state('highlightedIndex')).toBe(4);
//   });

//   it('should highlight nothing automatically if there are no selectable items', () => {
//     // No selectable results should appear in the results, only headers.
//     // As a result there should be no highlighted index.
//     autocompleteWrapper.setProps({ value: 'new hrhrhhrr' });
//     expect(autocompleteWrapper.state('highlightedIndex')).toBe(null);
//   });
// });

describe('Public imperative API', () => {
  afterEach(() => {
    vi.clearAllTimers();
  });

  it.skip('should expose select APIs available on HTMLInputElement', () => {
    const inputRef = createRef<ImperativeAPIRef>();
    render(<AutocompleteComponentJSX inputElementRef={inputRef} />);
    const input = screen.getByRole('textbox');

    if (inputRef.current) {
      expect(typeof inputRef.current.focus).toBe('function');
      expect(input).not.toHaveFocus();

      inputRef.current.focus();
      expect(input).toHaveFocus();

      expect(typeof inputRef.current.setSelectionRange).toBe('function');
      inputRef.current.setSelectionRange(1, 2);
      // TODO: test selectionrange

      expect(typeof inputRef.current.blur).toBe('function');
      inputRef.current.blur();
      expect(input).not.toHaveFocus();
    }
  });
});
