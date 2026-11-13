import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { ActivityIndicator, Platform } from 'react-native';

import TabLayout from '../../../app/(tabs)/_layout';
import { makeAuth, mockRouter, resetRouter, silenceConsole } from '../../../test-utils/screens';

jest.mock('expo-router', () => require('../../../test-utils/screens').expoRouterMock());
jest.mock('expo-blur', () => ({ BlurView: () => null }));

const mockAuth = { current: {} as any };
jest.mock('../../../app/context/auth', () => ({ useAuth: () => mockAuth.current }));

const mockFriendRequests = { friendRequestsCount: 0 };
jest.mock('../../../context/globalFriendRequests', () => ({
  useGlobalFriendRequests: () => mockFriendRequests,
}));
jest.mock('../../../context/globalNotifications', () => ({
  useGlobalNotifications: () => ({ unreadCount: 0 }),
}));
jest.mock('../../../context/notifications', () => ({
  NotificationsProvider: ({ children }: any) => children,
}));

describe('TabLayout', () => {
  beforeEach(() => {
    silenceConsole();
    resetRouter();
    mockAuth.current = makeAuth();
    mockFriendRequests.friendRequestsCount = 0;
  });
  afterEach(() => jest.restoreAllMocks());

  it("affiche un loader pendant le chargement de l'auth", () => {
    mockAuth.current = makeAuth({ isLoading: true, user: null });
    render(<TabLayout />);
    expect(screen.UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("redirige vers la connexion et n'affiche pas les onglets sans utilisateur", () => {
    mockAuth.current = makeAuth({ user: null });
    render(<TabLayout />);
    expect(mockRouter.replace).toHaveBeenCalledWith('/(auth)/login');
    expect(screen.queryByTestId('tabs-navigator')).toBeNull();
  });

  it('affiche les onglets Sessions et Profil pour un utilisateur connecté', () => {
    mockFriendRequests.friendRequestsCount = 3;
    render(<TabLayout />);
    expect(screen.getByTestId('tabs-navigator')).toBeTruthy();
    ['index', 'friends', 'notifications', 'history', 'profile'].forEach((name) =>
      expect(screen.getByText(`screen:${name}`)).toBeTruthy()
    );
    expect(screen.getByText('title:Sessions')).toBeTruthy();
    expect(screen.getByText('title:Profil')).toBeTruthy();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("rend le fond flouté sur iOS et rien sur Android", () => {
    render(<TabLayout />);
    const opts = screen.getByTestId('tabs-navigator').props.screenOptions;
    expect(opts.headerShown).toBe(false);
    const original = Platform.OS;
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
    expect(opts.tabBarBackground()).toBeTruthy();
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    expect(opts.tabBarBackground()).toBeUndefined();
    Object.defineProperty(Platform, 'OS', { value: original, configurable: true });
  });
});
