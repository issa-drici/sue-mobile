/* Helpers partagés pour les tests d'écrans (app/**). Ne contient aucun test. */
/* eslint-disable @typescript-eslint/no-require-imports */
import React from 'react';

/** Router mocké partagé : les tests le réinitialisent via resetRouter(). */
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  navigate: jest.fn(),
  dismiss: jest.fn(),
  dismissAll: jest.fn(),
  setParams: jest.fn(),
  canGoBack: jest.fn(() => true),
};

/** État mutable lu par les hooks expo-router mockés. */
export const routerState: { params: Record<string, any>; segments: string[]; runFocusEffects: boolean } = {
  params: {},
  segments: [],
  runFocusEffects: true,
};

export function resetRouter() {
  Object.values(mockRouter).forEach((fn) => (fn as jest.Mock).mockClear());
  mockRouter.canGoBack.mockImplementation(() => true);
  routerState.params = {};
  routerState.segments = [];
  routerState.runFocusEffects = true;
}

/**
 * Fabrique du module expo-router mocké.
 * Usage : jest.mock('expo-router', () => require('<rel>/test-utils/screens').expoRouterMock());
 */
export function expoRouterMock() {
  const { Text, View } = require('react-native');
  const R = require('react');

  const makeNavigator = (name: string) => {
    const Nav: any = ({ children, screenOptions }: any) => {
      const props = typeof screenOptions === 'function' ? {} : screenOptions;
      return R.createElement(View, { testID: `${name}-navigator`, screenOptions: props }, children);
    };
    Nav.Screen = ({ name: screenName, options }: any) => {
      const opts = typeof options === 'function' ? options({ route: { name: screenName } }) : options;
      const children: any[] = [R.createElement(Text, { key: 'n' }, `screen:${screenName ?? ''}`)];
      if (opts?.tabBarIcon) {
        children.push(
          R.createElement(R.Fragment, { key: 'i1' }, opts.tabBarIcon({ color: '#000', focused: true, size: 24 })),
          R.createElement(R.Fragment, { key: 'i2' }, opts.tabBarIcon({ color: '#999', focused: false, size: 24 }))
        );
      }
      if (opts?.title) children.push(R.createElement(Text, { key: 't' }, `title:${opts.title}`));
      return R.createElement(View, { testID: `screen-${screenName ?? 'options'}` }, children);
    };
    return Nav;
  };

  return {
    __esModule: true,
    useRouter: () => require('./screens').mockRouter,
    router: require('./screens').mockRouter,
    useLocalSearchParams: () => require('./screens').routerState.params,
    useGlobalSearchParams: () => require('./screens').routerState.params,
    useSegments: () => require('./screens').routerState.segments,
    usePathname: () => '/',
    useFocusEffect: (cb: () => void | (() => void)) => {
      R.useEffect(() => {
        if (!require('./screens').routerState.runFocusEffects) return undefined;
        return cb();
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [cb]);
    },
    useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn(), setOptions: jest.fn(), addListener: jest.fn(() => jest.fn()) }),
    Stack: makeNavigator('stack'),
    Tabs: makeNavigator('tabs'),
    Slot: () => R.createElement(Text, null, 'slot'),
    Redirect: ({ href }: any) => R.createElement(Text, null, `redirect:${href}`),
    Link: ({ children, href }: any) => R.createElement(Text, { testID: `link-${href}` }, children),
  };
}

/** Utilisateur de test (forme de User de app/context/auth). */
export const testUser = {
  id: 'u1',
  firstname: 'Alex',
  lastname: 'Roux',
  email: 'alex@test.fr',
  phone: '+33612345678',
  avatar: null as string | null,
};

/** Valeur par défaut du contexte d'auth mocké. */
export function makeAuth(overrides: Record<string, any> = {}) {
  return {
    user: testUser,
    isLoading: false,
    isAuthenticated: true,
    isOnboardingCompleted: true,
    isOnboardingLoading: false,
    signIn: jest.fn(() => Promise.resolve()),
    signUp: jest.fn(() => Promise.resolve()),
    authenticateWithSession: jest.fn(() => Promise.resolve()),
    signOut: jest.fn(() => Promise.resolve()),
    forceSignOut: jest.fn(() => Promise.resolve()),
    checkTokenValidity: jest.fn(() => Promise.resolve(true)),
    refreshAuth: jest.fn(() => Promise.resolve(true)),
    completeOnboarding: jest.fn(() => Promise.resolve()),
    resetOnboarding: jest.fn(() => Promise.resolve()),
    getAuthToken: jest.fn(() => Promise.resolve('tok')),
    forgotPassword: jest.fn(() => Promise.resolve()),
    updateUserProfile: jest.fn(() => Promise.resolve()),
    refreshUser: jest.fn(() => Promise.resolve()),
    ...overrides,
  };
}

/** Récupère le dernier appel à Alert.alert et appuie sur le bouton portant ce libellé. */
export async function pressAlertButton(alertSpy: jest.SpyInstance, text: string, callIndex = -1) {
  const calls = alertSpy.mock.calls;
  const call = calls[callIndex < 0 ? calls.length + callIndex : callIndex];
  const buttons: any[] = call?.[2] ?? [];
  const btn = buttons.find((b) => b.text === text);
  if (!btn) throw new Error(`Bouton "${text}" introuvable dans l'alerte ${JSON.stringify(call?.[0])}`);
  const { act } = require('@testing-library/react-native');
  await act(async () => {
    await btn.onPress?.();
  });
}

/** Silence les logs bruyants ; renvoie les spies pour restauration. */
export function silenceConsole() {
  return [
    jest.spyOn(console, 'log').mockImplementation(() => {}),
    jest.spyOn(console, 'warn').mockImplementation(() => {}),
    jest.spyOn(console, 'error').mockImplementation(() => {}),
    jest.spyOn(console, 'info').mockImplementation(() => {}),
    jest.spyOn(console, 'debug').mockImplementation(() => {}),
  ];
}

export const flush = () => new Promise<void>((r) => setImmediate(r));

export default React;
