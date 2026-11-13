import React from 'react';

jest.mock('@expo/vector-icons', () => require('../../__testutils__/vectorIconsMock'));
import { render, screen, fireEvent } from '@testing-library/react-native';
import { FormField } from '../FormField';

describe('FormField', () => {
  it('affiche le libellé, transmet la saisie et les props', () => {
    const onChangeText = jest.fn();
    render(
      <FormField
        label="Nom"
        value=""
        onChangeText={onChangeText}
        placeholder="Votre nom"
        secureTextEntry
        keyboardType="default"
        autoCapitalize="words"
        autoComplete="name"
      />
    );
    expect(screen.getByText('Nom')).toBeOnTheScreen();
    expect(screen.queryByText('*')).toBeNull();
    const input = screen.getByPlaceholderText('Votre nom');
    expect(input.props.secureTextEntry).toBe(true);
    fireEvent.changeText(input, 'Issa');
    expect(onChangeText).toHaveBeenCalledWith('Issa');
  });

  it('affiche l’astérisque obligatoire et le message d’erreur', () => {
    render(<FormField label="Email" value="" onChangeText={jest.fn()} required error="Email invalide" />);
    expect(screen.getByText('*')).toBeOnTheScreen();
    expect(screen.getByText('Email invalide')).toBeOnTheScreen();
  });

  it('désactivé : champ non éditable', () => {
    render(<FormField label="L" value="v" onChangeText={jest.fn()} disabled />);
    expect(screen.getByDisplayValue('v').props.editable).toBe(false);
  });
});
