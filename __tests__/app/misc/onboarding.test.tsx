import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { FlatList } from 'react-native';

import OnboardingScreen from '../../../app/onboarding';
import { mockRouter, resetRouter, silenceConsole } from '../../../test-utils/screens';

jest.mock('expo-router', () => require('../../../test-utils/screens').expoRouterMock());

describe('OnboardingScreen (ancien onboarding)', () => {
  beforeEach(() => {
    silenceConsole();
    resetRouter();
  });
  afterEach(() => jest.restoreAllMocks());

  it('affiche les slides et le bouton SUIVANT', () => {
    render(<OnboardingScreen />);
    expect(screen.getByText('DEVENEZ UNE LÉGENDE.')).toBeTruthy();
    expect(screen.getByText('CRÉEZ VOTRE ÉQUIPE.')).toBeTruthy();
    expect(screen.getByText('SUIVANT')).toBeTruthy();
    expect(screen.UNSAFE_getByType(FlatList).props.keyExtractor({ id: '2' })).toBe('2');
  });

  it('fait défiler vers la slide suivante', () => {
    render(<OnboardingScreen />);
    const list = screen.UNSAFE_getByType(FlatList);
    const spy = jest.spyOn(list.instance, 'scrollToIndex').mockImplementation(() => {});
    fireEvent.press(screen.getByText('SUIVANT'));
    expect(spy).toHaveBeenCalledWith({ index: 1, animated: true });
  });

  it('ignore une visibilité vide puis termine sur la dernière slide', () => {
    render(<OnboardingScreen />);
    const list = screen.UNSAFE_getByType(FlatList);
    act(() => list.props.onViewableItemsChanged({ viewableItems: [] }));
    expect(screen.getByText('SUIVANT')).toBeTruthy();
    act(() => list.props.onViewableItemsChanged({ viewableItems: [{ index: 2 }] }));
    fireEvent.press(screen.getByText('COMMENCER'));
    expect(mockRouter.replace).toHaveBeenCalledWith('/(auth)/login');
  });
});
