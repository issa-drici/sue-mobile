/**
 * Relance automatique d'une fonction asynchrone : succès, échecs répétés, annulation, remise à zéro.
 */
import { act, renderHook } from '@testing-library/react-native';
import { useRetry } from '../useRetry';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

it('renvoie les données au premier essai réussi', async () => {
  const fn = jest.fn().mockResolvedValue('ok');
  const { result } = renderHook(() => useRetry(fn));
  expect(result.current.isLoading).toBe(false);
  await act(async () => { await result.current.execute(); });
  expect(fn).toHaveBeenCalledTimes(1);
  expect(result.current.data).toBe('ok');
  expect(result.current.isLoading).toBe(false);
  expect(result.current.error).toBeNull();
  expect(result.current.retryCount).toBe(0);
});

it('relance après une erreur puis réussit', async () => {
  const onRetry = jest.fn();
  const fn = jest.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValue(42);
  const { result } = renderHook(() => useRetry(fn, { retryDelay: 500, onRetry }));
  await act(async () => { await result.current.execute(); });
  expect(result.current.error).toBe('boom');
  expect(result.current.isRetrying).toBe(true);
  expect(result.current.retryCount).toBe(1);
  expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
  await act(async () => { await jest.advanceTimersByTimeAsync(500); });
  expect(fn).toHaveBeenCalledTimes(2);
  expect(result.current.data).toBe(42);
  expect(result.current.error).toBeNull();
  expect(result.current.isRetrying).toBe(false);
});

it('abandonne après le nombre maximum de tentatives', async () => {
  const onMax = jest.fn();
  const fn = jest.fn().mockRejectedValue({});
  const { result } = renderHook(() => useRetry(fn, { maxRetries: 2, retryDelay: 10, onMaxRetriesReached: onMax }));
  await act(async () => { await result.current.execute(); });
  await act(async () => { await jest.advanceTimersByTimeAsync(10); });
  await act(async () => { await jest.advanceTimersByTimeAsync(10); });
  expect(fn).toHaveBeenCalledTimes(3);
  expect(onMax).toHaveBeenCalledTimes(1);
  expect(result.current.error).toBe('Une erreur est survenue');
  expect(result.current.isLoading).toBe(false);
  expect(result.current.isRetrying).toBe(false);
});

it('ne fait rien quand désactivé', async () => {
  const fn = jest.fn();
  const { result } = renderHook(() => useRetry(fn, { enabled: false }));
  await act(async () => { await result.current.execute(); });
  expect(fn).not.toHaveBeenCalled();
});

it('cancelRetry arrête la relance programmée et reset vide l’état', async () => {
  const fn = jest.fn().mockRejectedValue(new Error('x'));
  const { result } = renderHook(() => useRetry(fn, { retryDelay: 100 }));
  await act(async () => { await result.current.execute(); });
  act(() => { result.current.cancelRetry(); });
  expect(result.current.isRetrying).toBe(false);
  expect(result.current.isLoading).toBe(false);
  await act(async () => { await jest.advanceTimersByTimeAsync(1000); });
  expect(fn).toHaveBeenCalledTimes(1);
  // cancelRetry sans relance en cours : sans effet
  act(() => { result.current.cancelRetry(); });
  act(() => { result.current.reset(); });
  expect(result.current.error).toBeNull();
  expect(result.current.data).toBeNull();
  expect(result.current.retryCount).toBe(0);
});

it('ne relance plus et n’écrit plus l’état après le démontage', async () => {
  const fn = jest.fn().mockRejectedValue(new Error('a'));
  const { result, unmount } = renderHook(() => useRetry(fn, { retryDelay: 100 }));
  await act(async () => { await result.current.execute(); });
  unmount();
  await jest.advanceTimersByTimeAsync(1000);
  expect(fn).toHaveBeenCalledTimes(1);
});

it('ignore la réponse arrivée après le démontage', async () => {
  let resolve: (v: string) => void = () => {};
  let reject: (e: Error) => void = () => {};
  const ok = jest.fn(() => new Promise<string>((r) => { resolve = r; }));
  const ko = jest.fn(() => new Promise<string>((_, r) => { reject = r; }));
  const a = renderHook(() => useRetry(ok));
  const b = renderHook(() => useRetry(ko));
  let pa: Promise<void> = Promise.resolve();
  let pb: Promise<void> = Promise.resolve();
  act(() => { pa = a.result.current.execute(); pb = b.result.current.execute(); });
  a.unmount();
  b.unmount();
  resolve('late');
  reject(new Error('late'));
  await pa;
  await pb;
  expect(jest.getTimerCount()).toBe(0);
  // après démontage, execute ne fait plus rien
  await a.result.current.execute();
  expect(ok).toHaveBeenCalledTimes(1);
});
