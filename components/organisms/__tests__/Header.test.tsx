import React from 'react';
import { Text } from 'react-native';

jest.mock('@expo/vector-icons', () => require('../../__testutils__/vectorIconsMock'));
const mockBack = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack }) }));

import { Ionicons } from '@expo/vector-icons';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Header } from '../Header';

describe('Header', () => {
  beforeEach(() => mockBack.mockClear());

  it('affiche le titre et l’action de droite, sans bouton retour par défaut', () => {
    const { UNSAFE_queryByType } = render(<Header title="Profil" rightAction={<Text>Action</Text>} />);
    expect(screen.getByText('Profil')).toBeOnTheScreen();
    expect(screen.getByText('Action')).toBeOnTheScreen();
    expect(UNSAFE_queryByType(Ionicons)).toBeNull();
  });

  it('sans titre', () => {
    render(<Header />);
    expect(screen.toJSON()).toBeTruthy();
  });

  it('bouton retour : router.back par défaut', () => {
    const { UNSAFE_getByType } = render(<Header showBackButton />);
    fireEvent.press(UNSAFE_getByType(Ionicons));
    expect(mockBack).toHaveBeenCalled();
  });

  it('bouton retour : onBackPress personnalisé', () => {
    const onBackPress = jest.fn();
    const { UNSAFE_getByType } = render(<Header showBackButton onBackPress={onBackPress} />);
    fireEvent.press(UNSAFE_getByType(Ionicons));
    expect(onBackPress).toHaveBeenCalled();
    expect(mockBack).not.toHaveBeenCalled();
  });
});
