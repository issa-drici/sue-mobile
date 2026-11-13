/** Tirer pour rafraîchir : délai minimum, pas d'appels simultanés, erreurs. */
import { act, renderHook } from '@testing-library/react-native';
import { usePullToRefresh } from '../usePullToRefresh';

beforeEach(() => { jest.useFakeTimers(); });
afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

it('reste en rafraîchissement au moins le délai minimum', async () => {
  const onRefresh = jest.fn().mockResolvedValue(undefined);
  const { result } = renderHook(() => usePullToRefresh({ onRefresh, minDelay: 500 }));
  let p: Promise<void> = Promise.resolve();
  act(() => { p = result.current.onRefresh(); });
  expect(result.current.refreshing).toBe(true);
  await act(async () => { await jest.advanceTimersByTimeAsync(499); });
  expect(result.current.refreshing).toBe(true);
  await act(async () => { await jest.advanceTimersByTimeAsync(1); await p; });
  expect(result.current.refreshing).toBe(false);
  expect(onRefresh).toHaveBeenCalledTimes(1);
});

it('ignore un second appel pendant un rafraîchissement', async () => {
  const onRefresh = jest.fn().mockResolvedValue(undefined);
  const { result } = renderHook(() => usePullToRefresh({ onRefresh }));
  let p: Promise<void> = Promise.resolve();
  act(() => { p = result.current.onRefresh(); });
  await act(async () => { await result.current.onRefresh(); });
  expect(onRefresh).toHaveBeenCalledTimes(1);
  await act(async () => { await jest.advanceTimersByTimeAsync(1000); await p; });
  expect(result.current.refreshing).toBe(false);
});

it('n’attend pas si le rafraîchissement a déjà pris le délai', async () => {
  const onRefresh = jest.fn(async () => { jest.setSystemTime(Date.now() + 2000); });
  const { result } = renderHook(() => usePullToRefresh({ onRefresh, minDelay: 1000 }));
  await act(async () => { await result.current.onRefresh(); });
  expect(result.current.refreshing).toBe(false);
});

it('signale l’erreur via onError, ou l’avale sans onError', async () => {
  const err = new Error('x');
  const onError = jest.fn();
  const { result } = renderHook(() => usePullToRefresh({ onRefresh: jest.fn().mockRejectedValue(err), onError }));
  await act(async () => { await result.current.onRefresh(); });
  expect(onError).toHaveBeenCalledWith(err);
  expect(result.current.refreshing).toBe(false);

  const other = renderHook(() => usePullToRefresh({ onRefresh: jest.fn().mockRejectedValue(err) }));
  await act(async () => { await other.result.current.onRefresh(); });
  expect(other.result.current.refreshing).toBe(false);
});
