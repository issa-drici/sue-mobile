import React from 'react';

jest.mock('@expo/vector-icons', () => require('../../__testutils__/vectorIconsMock'));
import { TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Input, OutlinedInput, FilledInput } from '../Input';

describe('Input', () => {
  it('affiche le placeholder et transmet la saisie', () => {
    const onChangeText = jest.fn();
    render(<Input value="" onChangeText={onChangeText} placeholder="Email" keyboardType="email-address" />);
    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'a@b.c');
    expect(onChangeText).toHaveBeenCalledWith('a@b.c');
    expect(screen.getByPlaceholderText('Email').props.keyboardType).toBe('email-address');
  });

  it.each(['default', 'outlined', 'filled'] as const)('variante %s avec et sans erreur', (variant) => {
    const { rerender } = render(<Input value="v" onChangeText={jest.fn()} variant={variant} />);
    rerender(<Input value="v" onChangeText={jest.fn()} variant={variant} error />);
    expect(screen.getByDisplayValue('v')).toBeOnTheScreen();
  });

  it.each(['sm', 'md', 'lg'] as const)('taille %s', (size) => {
    render(<Input value="t" onChangeText={jest.fn()} size={size} />);
    expect(screen.getByDisplayValue('t')).toBeOnTheScreen();
  });

  it('désactivé : non éditable', () => {
    render(<Input value="d" onChangeText={jest.fn()} disabled />);
    expect(screen.getByDisplayValue('d').props.editable).toBe(false);
  });

  it('icônes gauche et droite, la droite est cliquable', () => {
    const onRight = jest.fn();
    const { UNSAFE_getAllByType } = render(
      <Input value="" onChangeText={jest.fn()} leftIcon="search" rightIcon="close" onRightIconPress={onRight} />
    );
    const icons = UNSAFE_getAllByType(Ionicons);
    expect(icons.map((i) => i.props.name)).toEqual(['search', 'close']);
    fireEvent.press(icons[1]);
    expect(onRight).toHaveBeenCalled();
  });

  it('OutlinedInput et FilledInput', () => {
    const { UNSAFE_getAllByType } = render(
      <>
        <OutlinedInput value="o" onChangeText={jest.fn()} />
        <FilledInput value="f" onChangeText={jest.fn()} />
      </>
    );
    expect(UNSAFE_getAllByType(TextInput)).toHaveLength(2);
  });
});
