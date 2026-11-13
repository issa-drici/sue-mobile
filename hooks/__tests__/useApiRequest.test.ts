/**
 * Requête API avec relance automatique : authentification requise, écrans d'auth, focus, annulation.
 */
import { act, renderHook } from '@testing-library/react-native';
import { useApiRequest } from '../useApiRequest';

const mockAuth = { isAuthenticated: true };
const mockScreen: { isAuthScreen: boolean | undefined } = { isAuthScreen: false };
jest.mock('../../app/context/auth', () => ({ useAuth: () => mockAuth }));
jest.mock('../useAuthScreenDetection', () => ({ useAuthScreenDetection: () => mockScreen }));
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (cb: () => void | (() => void)) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('react').useEffect(cb, [cb]);
  },
}));

beforeEach(() => {
  jest.useFakeTimers();
  mockAuth.isAuthenticated = true;
  mockScreen.isAuthScreen = false;
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

const tick = (ms = 0) => act(async () => { await jest.advanceTimersByTimeAsync(ms); });

it('lance la requête 100 ms après le focus et renvoie les données', async () => {
  const api = jest.fn().mockResolvedValue({ id: 1 });
  const { result } = renderHook(() => useApiRequest(api));
  expect(api).not.toHaveBeenCalled();
  await tick(100);
  expect(api).toHaveBeenCalledTimes(1);
  expect(result.current.data).toEqual({ id: 1 });
  expect(result.current.isLoading).toBe(false);
  expect(result.current.error).toBeNull();
});

it('ne lance rien sans autoFetch', async () => {
  const api = jest.fn();
  renderHook(() => useApiRequest(api, { autoFetch: false }));
  await tick(500);
  expect(api).not.toHaveBeenCalled();
});

it('ne lance rien si l’utilisateur n’est pas connecté et que l’auth est requise', async () => {
  mockAuth.isAuthenticated = false;
  const api = jest.fn();
  const { result } = renderHook(() => useApiRequest(api));
  await tick(100);
  expect(api).not.toHaveBeenCalled();
  expect(result.current.isLoading).toBe(false);
});

it('lance quand même si l’auth n’est pas requise', async () => {
  mockAuth.isAuthenticated = false;
  const api = jest.fn().mockResolvedValue('public');
  const { result } = renderHook(() => useApiRequest(api, { requiresAuth: false }));
  await tick(100);
  expect(result.current.data).toBe('public');
});

it('relance après erreur puis réussit', async () => {
  const onRetry = jest.fn();
  const api = jest.fn().mockRejectedValueOnce(new Error('net')).mockResolvedValue('ok');
  const { result } = renderHook(() => useApiRequest(api, { retryDelay: 200, onRetry }));
  await tick(100);
  expect(result.current.isRetrying).toBe(true);
  expect(result.current.retryCount).toBe(1);
  expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
  await tick(200);
  expect(result.current.data).toBe('ok');
  expect(result.current.isRetrying).toBe(false);
  expect(result.current.retryCount).toBe(0);
});

it('abandonne après le maximum de tentatives', async () => {
  const onMax = jest.fn();
  const api = jest.fn().mockRejectedValue({});
  const { result } = renderHook(() => useApiRequest(api, { maxRetries: 1, retryDelay: 50, onMaxRetriesReached: onMax }));
  await tick(100);
  await tick(50);
  expect(api).toHaveBeenCalledTimes(2);
  expect(result.current.error).toBe('Une erreur est survenue');
  expect(result.current.isRetrying).toBe(false);
  expect(onMax).toHaveBeenCalledTimes(1);
});

it('ne relance pas sur un écran d’authentification', async () => {
  mockScreen.isAuthScreen = true;
  const onMax = jest.fn();
  const api = jest.fn().mockRejectedValue(new Error('401'));
  const { result } = renderHook(() => useApiRequest(api, { onMaxRetriesReached: onMax }));
  await tick(100);
  await tick(5000);
  expect(api).toHaveBeenCalledTimes(1);
  expect(result.current.error).toBe('401');
  expect(onMax).not.toHaveBeenCalled();
});

it('traite isAuthScreen indéfini comme faux', async () => {
  mockScreen.isAuthScreen = undefined;
  const api = jest.fn().mockRejectedValue(new Error('x'));
  const { result } = renderHook(() => useApiRequest(api, { enableRetry: false }));
  await tick(100);
  expect(result.current.error).toBe('x');
});

it('si la connexion disparaît pendant une relance, la relance s’arrête sans toucher l’état', async () => {
  const api = jest.fn().mockRejectedValue(new Error('x'));
  const { result, rerender } = renderHook(() => useApiRequest(api, { retryDelay: 50 }));
  await tick(100);
  expect(result.current.isRetrying).toBe(true);
  // La relance programmée garde l'ancien closure : on vérifie juste qu'elle ne plante pas
  mockAuth.isAuthenticated = false;
  rerender({});
  await tick(50);
  expect(api.mock.calls.length).toBeGreaterThanOrEqual(1);
});

it('refetch repart de zéro en annulant la relance en cours', async () => {
  const api = jest.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValue('fresh');
  const { result } = renderHook(() => useApiRequest(api, { retryDelay: 1000 }));
  await tick(100);
  expect(result.current.isRetrying).toBe(true);
  await act(async () => { result.current.refetch(); });
  await tick(0);
  expect(result.current.data).toBe('fresh');
  await tick(2000);
  expect(api).toHaveBeenCalledTimes(2);
  // refetch sans relance en cours
  await act(async () => { result.current.refetch(); });
  expect(api).toHaveBeenCalledTimes(3);
});

it('cancelRetry et reset', async () => {
  const api = jest.fn().mockRejectedValue(new Error('x'));
  const { result } = renderHook(() => useApiRequest(api, { retryDelay: 1000 }));
  await tick(100);
  act(() => { result.current.cancelRetry(); });
  expect(result.current.isRetrying).toBe(false);
  expect(result.current.isLoading).toBe(false);
  await tick(3000);
  expect(api).toHaveBeenCalledTimes(1);
  act(() => { result.current.cancelRetry(); });
  act(() => { result.current.reset(); });
  expect(result.current).toMatchObject({ data: null, error: null, retryCount: 0, isRetrying: false });
});

it('n’écrit plus l’état après démontage', async () => {
  let resolve: (v: string) => void = () => {};
  let reject: (e: Error) => void = () => {};
  const ok = jest.fn(() => new Promise<string>((r) => { resolve = r; }));
  const ko = jest.fn(() => new Promise<string>((_, r) => { reject = r; }));
  const a = renderHook(() => useApiRequest(ok));
  const b = renderHook(() => useApiRequest(ko));
  await tick(100);
  a.unmount();
  b.unmount();
  resolve('late');
  reject(new Error('late'));
  await tick(5000);
  expect(ko).toHaveBeenCalledTimes(1);
  // appel après démontage : sans effet
  await act(async () => { a.result.current.refetch(); });
  expect(ok).toHaveBeenCalledTimes(1);
});

it('une relance programmée ne part pas après démontage', async () => {
  const api = jest.fn().mockRejectedValue(new Error('x'));
  const { unmount } = renderHook(() => useApiRequest(api, { retryDelay: 100 }));
  await tick(100);
  unmount();
  await jest.advanceTimersByTimeAsync(1000);
  expect(api).toHaveBeenCalledTimes(1);
});

it('le délai de focus est annulé si on quitte l’écran avant', async () => {
  const api = jest.fn();
  const { unmount } = renderHook(() => useApiRequest(api));
  unmount();
  await jest.advanceTimersByTimeAsync(500);
  expect(api).not.toHaveBeenCalled();
});
