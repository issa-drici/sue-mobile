/** Détection des écrans d'authentification (pas de relance automatique dessus). */
import { renderHook } from '@testing-library/react-native';
import { useAuthScreenDetection } from '../useAuthScreenDetection';

const mockPathname = jest.fn();
jest.mock('expo-router', () => ({ usePathname: () => mockPathname() }));

it.each([
  ['/login', true],
  ['/register', true],
  ['/(auth)/login', true],
  ['/(auth)/register', true],
  ['/foo/login/bar', true],
  ['/(tabs)', false],
  ['/sessions/12', false],
])('chemin %s → écran d’auth = %s', (path, expected) => {
  mockPathname.mockReturnValue(path);
  const { result } = renderHook(() => useAuthScreenDetection());
  expect(result.current).toEqual({ isAuthScreen: expected, currentPath: path });
});

it('gère un chemin indéfini', () => {
  mockPathname.mockReturnValue(undefined);
  const { result } = renderHook(() => useAuthScreenDetection());
  expect(result.current).toEqual({ isAuthScreen: false, currentPath: '' });
});
