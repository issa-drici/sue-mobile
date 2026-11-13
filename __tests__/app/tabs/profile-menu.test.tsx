import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { UIManager } from 'react-native';

import { makeAuth, resetRouter, silenceConsole } from '../../../test-utils/screens';

jest.mock('expo-router', () => require('../../../test-utils/screens').expoRouterMock());
// Build sans version native : la ligne "Version" est masquée
jest.mock('expo-application', () => ({ nativeApplicationVersion: null, nativeBuildVersion: null }));
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  launchCameraAsync: jest.fn(() => Promise.resolve({ canceled: false, assets: [{ uri: 'file:///c.jpg' }] })),
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({ canceled: false, assets: [{ uri: 'file:///l.jpg' }] })),
  MediaTypeOptions: { Images: 'Images' },
}));
jest.mock('@react-native-menu/menu', () => {
  const { View } = require('react-native');
  return { MenuView: ({ children, onPressAction, actions }: any) => <View testID="photo-menu" onPressAction={onPressAction} actions={actions}>{children}</View> };
});
jest.mock('../../../config/env', () => ({ ENV: {} }));

const mockAuth = { current: {} as any };
jest.mock('../../../app/context/auth', () => ({ useAuth: () => mockAuth.current }));
jest.mock('../../../services', () => ({
  useGetUserProfile: () => ({ data: null, isLoading: false, error: null, refetch: jest.fn() }),
  useUpdateUser: () => ({ updateUser: jest.fn(), isLoading: false }),
}));
jest.mock('../../../services/badges', () => ({ useBadges: () => ({ badges: [] }) }));
jest.mock('../../../hooks/useDevMode', () => ({ useDevMode: () => ({ isDev: false }) }));
jest.mock('../../../services/api/usersApi', () => ({ UsersApi: { updateAvatar: jest.fn() } }));
jest.mock('../../../components/organisms/Badges', () => ({ BadgeGrid: () => null }));

const ImagePicker = jest.requireMock('expo-image-picker');

describe('ProfileScreen avec menu natif', () => {
  let ProfileScreen: React.ComponentType;
  const original = UIManager.getViewManagerConfig;

  beforeAll(() => {
    // Le menu natif est détecté au chargement du module : on le simule avant le require
    (UIManager as any).getViewManagerConfig = (name: string) => (name === 'MenuView' ? {} : original?.(name));
    ProfileScreen = require('../../../app/(tabs)/profile').default;
  });
  afterAll(() => {
    (UIManager as any).getViewManagerConfig = original;
  });

  beforeEach(() => {
    silenceConsole();
    resetRouter();
    mockAuth.current = makeAuth();
  });
  afterEach(() => jest.restoreAllMocks());

  it('masque la version et ouvre caméra / photothèque via le menu', async () => {
    render(<ProfileScreen />);
    expect(screen.queryByText(/^Version/)).toBeNull();
    fireEvent.press(screen.getByText('Modifier mon profil'));
    const menu = screen.getByTestId('photo-menu');
    expect(menu.props.actions.map((a: any) => a.id)).toEqual(['camera', 'library']);

    await act(async () => {
      menu.props.onPressAction({ nativeEvent: { event: 'camera' } });
    });
    expect(ImagePicker.launchCameraAsync).toHaveBeenCalled();
    await act(async () => {
      menu.props.onPressAction({ nativeEvent: { event: 'library' } });
    });
    expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
    await act(async () => {
      menu.props.onPressAction({ nativeEvent: { event: 'autre' } });
    });
    expect(ImagePicker.launchCameraAsync).toHaveBeenCalledTimes(1);
  });
});
