import React from 'react';

jest.mock('@expo/vector-icons', () => require('../../__testutils__/vectorIconsMock'));
import { Ionicons } from '@expo/vector-icons';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { EmptyState } from '../EmptyState';
import * as Molecules from '../index';

describe('EmptyState', () => {
  it.each([
    ['default', 'information-circle-outline'],
    ['error', 'alert-circle-outline'],
    ['search', 'search-outline'],
    ['loading', 'time-outline'],
  ] as const)('variante %s utilise l’icône par défaut %s', (variant, icon) => {
    const { UNSAFE_getByType } = render(<EmptyState variant={variant} title="Titre" />);
    expect(UNSAFE_getByType(Ionicons).props.name).toBe(icon);
    expect(screen.getByText('Titre')).toBeOnTheScreen();
  });

  it('icône personnalisée et sous-titre', () => {
    const { UNSAFE_getByType } = render(<EmptyState icon="star" title="T" subtitle="Sous-titre" />);
    expect(UNSAFE_getByType(Ionicons).props.name).toBe('star');
    expect(screen.getByText('Sous-titre')).toBeOnTheScreen();
  });

  it('affiche le bouton d’action seulement avec onAction et actionTitle', () => {
    const onAction = jest.fn();
    const { rerender } = render(<EmptyState title="T" actionTitle="Réessayer" />);
    expect(screen.queryByText('Réessayer')).toBeNull();
    rerender(<EmptyState title="T" subtitle="s" actionTitle="Réessayer" onAction={onAction} />);
    fireEvent.press(screen.getByText('Réessayer'));
    expect(onAction).toHaveBeenCalled();
  });

  it('le barrel exporte les molécules', () => {
    expect(Molecules.EmptyState).toBe(EmptyState);
    expect(Molecules.FormField).toBeDefined();
    expect(Molecules.SearchBar).toBeDefined();
    expect(Molecules.SessionCard).toBeDefined();
    expect(Molecules.UserCard).toBeDefined();
  });
});
