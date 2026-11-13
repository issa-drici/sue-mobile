/** Le point d'entrée des hooks réexporte bien chaque hook. */
jest.mock('../../services', () => ({ useServiceMarker: 'service' }));
jest.mock('expo-router', () => ({ useRouter: jest.fn(), usePathname: jest.fn() }));
jest.mock('../../app/context/auth', () => ({ useAuth: jest.fn() }));
jest.mock('../../services/notifications/pushNotifications', () => ({ pushNotificationService: {} }));

it('réexporte tous les hooks', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const hooks = require('../index');
  [
    'useApi', 'useColorScheme', 'useThemeColor', 'useAuthRedirect', 'useAuthScreen', 'useProtectedRoute',
    'usePullToRefresh', 'useAppState', 'usePushNotifications', 'useApiRequest', 'useApiWithRetry',
    'useAuthScreenDetection', 'useOnboarding', 'useRetry', 'useDevMode',
  ].forEach((name) => expect(typeof hooks[name]).toBe('function'));
  expect(hooks.useServiceMarker).toBe('service');
});
