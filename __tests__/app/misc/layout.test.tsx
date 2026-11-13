import { act, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Linking } from 'react-native';

import { makeAuth, mockRouter, resetRouter, routerState, silenceConsole } from '../../../test-utils/screens';

jest.mock('expo-router', () => require('../../../test-utils/screens').expoRouterMock());
jest.mock('expo-splash-screen', () => ({
  setOptions: jest.fn(),
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

const mockAuth = { current: {} as any };
jest.mock('../../../app/context/auth', () => ({
  useAuth: () => mockAuth.current,
  AuthProvider: ({ children }: any) => children,
}));
jest.mock('../../../context/globalNotifications', () => ({ GlobalNotificationsProvider: ({ children }: any) => children }));
jest.mock('../../../context/globalFriendRequests', () => ({ GlobalFriendRequestsProvider: ({ children }: any) => children }));
jest.mock('../../../hooks/useAppState', () => ({ useAppState: jest.fn() }));
jest.mock('../../../components/UpdatePhoneOverlay', () => {
  const { Text } = require('react-native');
  return { UpdatePhoneOverlay: () => <Text>update-phone-overlay</Text> };
});
jest.mock('../../../utils/shareLink', () => ({
  extractShareToken: jest.fn((url: string | null) => (url && url.includes('/s/') ? url.split('/s/')[1].split('?')[0] : null)),
  extractFromParam: jest.fn((url: string | null) => (url && url.includes('from=') ? url.split('from=')[1] : null)),
  setPendingShareToken: jest.fn(() => Promise.resolve()),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const SplashScreen = require('expo-splash-screen');
const shareLink = jest.requireMock('../../../utils/shareLink');
const { useAppState } = jest.requireMock('../../../hooks/useAppState');

// Import après les mocks (setOptions / preventAutoHideAsync sont appelés au chargement du module)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const RootLayout = require('../../../app/_layout').default;

describe('RootLayout', () => {
  let urlListener: ((e: { url: string }) => Promise<void>) | null;
  let removeSpy: jest.Mock;

  beforeEach(() => {
    silenceConsole();
    resetRouter();
    routerState.segments = ['(tabs)'];
    mockAuth.current = makeAuth();
    SplashScreen.hideAsync.mockClear().mockResolvedValue(undefined);
    shareLink.setPendingShareToken.mockClear();
    urlListener = null;
    removeSpy = jest.fn();
    // Linking est déjà un jest.fn dans le preset : on remet ses compteurs à zéro
    jest.spyOn(Linking, 'getInitialURL').mockClear().mockResolvedValue(null);
    jest.spyOn(Linking, 'addEventListener').mockClear().mockImplementation(((_type: string, cb: any) => {
      urlListener = cb;
      return { remove: removeSpy };
    }) as any);
  });
  afterEach(() => jest.restoreAllMocks());

  const renderLayout = async () => {
    const utils = render(<RootLayout />);
    await act(async () => {});
    return utils;
  };

  it("configure le splash au chargement du module", () => {
    expect(SplashScreen.setOptions).toHaveBeenCalledWith({ duration: 1000, fade: true });
    expect(SplashScreen.preventAutoHideAsync).toHaveBeenCalled();
  });

  it('déclare toutes les routes de la pile et la surcouche de mise à jour', async () => {
    await renderLayout();
    [
      '(onboarding)', '(auth)', '(tabs)', 'join/[token]', 'session/[id]', 'chat/[sessionId]',
      'edit-session/[id]', 'create-session', 'add-friend', 'friend-requests', 'privacy', 'debug',
    ].forEach((name) => expect(screen.getByText(`screen:${name}`)).toBeTruthy());
    expect(screen.getByText('update-phone-overlay')).toBeTruthy();
    expect(screen.getByTestId('stack-navigator').props.screenOptions).toEqual(
      expect.objectContaining({ headerShown: false, animation: 'fade' })
    );
    expect(useAppState).toHaveBeenCalled();
  });

  it('identifie chaque écran de chat par sa session', async () => {
    // Le mock de Stack.Screen ne transmet pas getId : on le récupère sur l'élément
    const { Stack } = jest.requireMock('expo-router');
    await renderLayout();
    const chat = screen.UNSAFE_getAllByType(Stack.Screen).find((n: any) => n.props.name === 'chat/[sessionId]');
    expect(chat.props.getId({ params: { sessionId: 's9' } })).toBe('s9');
    expect(chat.props.getId({ params: undefined })).toBeUndefined();
  });

  it("cache le splash une fois l'auth chargée et le lien initial traité", async () => {
    await renderLayout();
    expect(SplashScreen.hideAsync).toHaveBeenCalled();
  });

  it("ignore l'échec de hideAsync et de getInitialURL", async () => {
    SplashScreen.hideAsync.mockRejectedValue(new Error('x'));
    (Linking.getInitialURL as jest.Mock).mockRejectedValue(new Error('y'));
    await renderLayout();
    expect(SplashScreen.hideAsync).toHaveBeenCalled();
  });

  it("n'agit pas tant que l'auth charge", async () => {
    mockAuth.current = makeAuth({ isLoading: true, user: null });
    await renderLayout();
    expect(Linking.getInitialURL).not.toHaveBeenCalled();
    expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
  });

  describe('lien initial (app lancée par un lien de partage)', () => {
    it('connecté : ouvre directement la session partagée (avec et sans from)', async () => {
      (Linking.getInitialURL as jest.Mock).mockResolvedValue('https://sue-app.fr/s/tok1?from=u2');
      await renderLayout();
      expect(mockRouter.replace).toHaveBeenCalledWith('/join/tok1?from=u2');
    });

    it('connecté sans from', async () => {
      (Linking.getInitialURL as jest.Mock).mockResolvedValue('https://sue-app.fr/s/tok1');
      await renderLayout();
      expect(mockRouter.replace).toHaveBeenCalledWith('/join/tok1');
    });

    it('non connecté : mémorise le lien', async () => {
      routerState.segments = ['(auth)'];
      mockAuth.current = makeAuth({ user: null });
      (Linking.getInitialURL as jest.Mock).mockResolvedValue('https://sue-app.fr/s/tok2?from=u3');
      await renderLayout();
      expect(shareLink.setPendingShareToken).toHaveBeenCalledWith('tok2', 'u3');
      expect(mockRouter.replace).not.toHaveBeenCalled();
    });

    it('ne traite le lien initial qu’une seule fois', async () => {
      const { rerender } = await renderLayout();
      rerender(<RootLayout />);
      await act(async () => {});
      expect(Linking.getInitialURL).toHaveBeenCalledTimes(1);
    });
  });

  describe('lien reçu app ouverte', () => {
    it('connecté : ouvre la session (avec et sans from)', async () => {
      await renderLayout();
      await act(async () => {
        await urlListener!({ url: 'https://sue-app.fr/s/abc?from=u1' });
      });
      expect(mockRouter.replace).toHaveBeenCalledWith('/join/abc?from=u1');
      await act(async () => {
        await urlListener!({ url: 'https://sue-app.fr/s/abc' });
      });
      expect(mockRouter.replace).toHaveBeenCalledWith('/join/abc');
    });

    it('non connecté : mémorise le lien et envoie vers la connexion', async () => {
      routerState.segments = ['(auth)'];
      mockAuth.current = makeAuth({ user: null });
      await renderLayout();
      await act(async () => {
        await urlListener!({ url: 'https://sue-app.fr/s/xyz' });
      });
      expect(shareLink.setPendingShareToken).toHaveBeenCalledWith('xyz', null);
      expect(mockRouter.replace).toHaveBeenCalledWith('/(auth)/login');
    });

    it('ignore une URL sans jeton et se désabonne au démontage', async () => {
      const { unmount } = await renderLayout();
      await act(async () => {
        await urlListener!({ url: 'https://autre.fr/page' });
      });
      expect(mockRouter.replace).not.toHaveBeenCalled();
      unmount();
      expect(removeSpy).toHaveBeenCalled();
    });
  });

  describe("redirections selon l'authentification", () => {
    it('attend les segments et le chargement de l’onboarding', async () => {
      routerState.segments = [];
      await renderLayout();
      expect(mockRouter.replace).not.toHaveBeenCalled();
    });

    it("n'agit pas pendant le chargement de l'onboarding", async () => {
      mockAuth.current = makeAuth({ isOnboardingLoading: true, user: null });
      routerState.segments = ['(tabs)'];
      await renderLayout();
      expect(mockRouter.replace).not.toHaveBeenCalled();
    });

    it.each([['(tabs)'], ['privacy'], ['(onboarding)']])('sans utilisateur sur %s → connexion', async (segment) => {
      mockAuth.current = makeAuth({ user: null });
      routerState.segments = [segment];
      await renderLayout();
      expect(mockRouter.replace).toHaveBeenCalledWith('/(auth)/login');
    });

    it.each([['(auth)'], ['join']])('sans utilisateur sur %s → reste', async (segment) => {
      mockAuth.current = makeAuth({ user: null });
      routerState.segments = [segment];
      await renderLayout();
      expect(mockRouter.replace).not.toHaveBeenCalled();
    });

    it.each([['(auth)'], ['(onboarding)'], ['onboarding']])('connecté sur %s → onglets', async (segment) => {
      routerState.segments = [segment];
      await renderLayout();
      expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
    });

    it.each([['(tabs)'], ['session'], ['join']])('connecté sur %s → reste', async (segment) => {
      routerState.segments = [segment];
      await renderLayout();
      expect(mockRouter.replace).not.toHaveBeenCalled();
    });
  });
});
