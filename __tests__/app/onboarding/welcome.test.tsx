import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { FlatList } from 'react-native';

import WelcomeScreen from '../../../app/(onboarding)/welcome';
import { makeAuth, mockRouter, resetRouter, silenceConsole } from '../../../test-utils/screens';

jest.mock('expo-router', () => require('../../../test-utils/screens').expoRouterMock());

const mockAuth = { current: {} as any };
jest.mock('../../../app/context/auth', () => ({ useAuth: () => mockAuth.current }));

describe('WelcomeScreen (onboarding)', () => {
  beforeEach(() => {
    silenceConsole();
    resetRouter();
    mockAuth.current = makeAuth();
  });
  afterEach(() => jest.restoreAllMocks());

  const setIndex = (index: number) => {
    const list = screen.UNSAFE_getByType(FlatList);
    act(() => {
      list.props.onViewableItemsChanged({ viewableItems: [{ index }] });
    });
  };

  it('affiche les slides et le bouton SUIVANT', () => {
    render(<WelcomeScreen />);
    expect(screen.getByText('DEVENEZ UNE LÉGENDE.')).toBeTruthy();
    expect(screen.getByText('SUIVANT')).toBeTruthy();
    const list = screen.UNSAFE_getByType(FlatList);
    expect(list.props.getItemLayout(null, 2)).toEqual(expect.objectContaining({ index: 2 }));
    expect(list.props.keyExtractor({ id: '3' })).toBe('3');
  });

  it('fait défiler vers la slide suivante', () => {
    render(<WelcomeScreen />);
    const list = screen.UNSAFE_getByType(FlatList);
    const spy = jest.spyOn(list.instance, 'scrollToIndex').mockImplementation(() => {});
    fireEvent.press(screen.getByText('SUIVANT'));
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ index: 1 }));
    expect(mockAuth.current.completeOnboarding).not.toHaveBeenCalled();
  });

  it('ignore un changement de visibilité vide', () => {
    render(<WelcomeScreen />);
    act(() => {
      screen.UNSAFE_getByType(FlatList).props.onViewableItemsChanged({ viewableItems: [] });
    });
    expect(screen.getByText('SUIVANT')).toBeTruthy();
  });

  it('affiche "ACTIVER & CONTINUER" sur la slide des notifications', () => {
    render(<WelcomeScreen />);
    setIndex(3);
    expect(screen.getByText('ACTIVER & CONTINUER')).toBeTruthy();
  });

  it("termine l'onboarding sur la dernière slide et redirige vers la connexion", async () => {
    render(<WelcomeScreen />);
    setIndex(4);
    expect(screen.getByText('COMMENCER')).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByText('COMMENCER'));
    });
    expect(mockAuth.current.completeOnboarding).toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith('/(auth)/login');
  });
});
