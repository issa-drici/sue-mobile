import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import NotificationsScreen from '../../../app/(onboarding)/notifications';
import OrganizeScreen from '../../../app/(onboarding)/organize';
import OnboardingLayout from '../../../app/(onboarding)/_layout';
import { makeAuth, mockRouter, resetRouter, silenceConsole } from '../../../test-utils/screens';

jest.mock('expo-router', () => require('../../../test-utils/screens').expoRouterMock());

const mockAuth = { current: {} as any };
jest.mock('../../../app/context/auth', () => ({ useAuth: () => mockAuth.current }));

describe('Onboarding : layout, organize, notifications', () => {
  beforeEach(() => {
    silenceConsole();
    resetRouter();
    mockAuth.current = makeAuth();
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('le layout déclare les 3 écrans sans en-tête', () => {
    render(<OnboardingLayout />);
    expect(screen.getByText('screen:welcome')).toBeTruthy();
    expect(screen.getByText('screen:organize')).toBeTruthy();
    expect(screen.getByText('screen:notifications')).toBeTruthy();
    expect(screen.getByTestId('stack-navigator').props.screenOptions).toEqual({ headerShown: false });
  });

  it('Organize : affiche le texte et va vers les notifications', () => {
    render(<OrganizeScreen />);
    expect(screen.getByText(/En 2 secondes tu crées une session/)).toBeTruthy();
    fireEvent.press(screen.getByText('Continuer'));
    expect(mockRouter.push).toHaveBeenCalledWith('/(onboarding)/notifications');
  });

  it("Notifications : termine l'onboarding puis redirige vers la connexion", async () => {
    jest.useFakeTimers();
    render(<NotificationsScreen />);
    expect(screen.getByText(/Active les notifications/)).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByText('Activer les notifications'));
    });
    expect(mockAuth.current.completeOnboarding).toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(60);
    });
    expect(mockRouter.replace).toHaveBeenCalledWith('/(auth)/login');
  });
});
