import React from 'react';

jest.mock('@expo/vector-icons', () => require('../../__testutils__/vectorIconsMock'));
import { Ionicons } from '@expo/vector-icons';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { SearchBar } from '../SearchBar';

describe('SearchBar', () => {
  it('placeholder par défaut, pas de bouton effacer quand vide', () => {
    const { UNSAFE_getAllByType } = render(<SearchBar value="" onChangeText={jest.fn()} />);
    expect(screen.getByPlaceholderText('Rechercher...')).toBeOnTheScreen();
    expect(UNSAFE_getAllByType(Ionicons).map((i) => i.props.name)).toEqual(['search']);
    expect(screen.queryByText('Rechercher')).toBeNull();
  });

  it('effacer vide le texte et appelle onClear', () => {
    const onChangeText = jest.fn();
    const onClear = jest.fn();
    const { UNSAFE_getAllByType } = render(
      <SearchBar value="tennis" onChangeText={onChangeText} onClear={onClear} placeholder="Chercher" />
    );
    const clear = UNSAFE_getAllByType(Ionicons)[1];
    expect(clear.props.name).toBe('close-circle');
    fireEvent.press(clear);
    expect(onChangeText).toHaveBeenCalledWith('');
    expect(onClear).toHaveBeenCalled();
  });

  it('effacer sans onClear', () => {
    const onChangeText = jest.fn();
    const { UNSAFE_getAllByType } = render(<SearchBar value="x" onChangeText={onChangeText} />);
    fireEvent.press(UNSAFE_getAllByType(Ionicons)[1]);
    expect(onChangeText).toHaveBeenCalledWith('');
  });

  it('bouton Rechercher : désactivé si texte vide, actif sinon', () => {
    const onSubmit = jest.fn();
    const { rerender } = render(<SearchBar value="  " onChangeText={jest.fn()} onSubmit={onSubmit} />);
    fireEvent.press(screen.getByText('Rechercher'));
    expect(onSubmit).not.toHaveBeenCalled();
    rerender(<SearchBar value="foot" onChangeText={jest.fn()} onSubmit={onSubmit} />);
    fireEvent.press(screen.getByText('Rechercher'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('en chargement : le titre est remplacé par le spinner', () => {
    render(<SearchBar value="foot" onChangeText={jest.fn()} onSubmit={jest.fn()} loading />);
    expect(screen.queryByText('Rechercher')).toBeNull();
  });
});
