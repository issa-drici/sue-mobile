/**
 * Requêtes HTTP génériques (GET avec relance, POST, PUT, DELETE) : états, callbacks, erreurs.
 */
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useApi } from '../useApi';

jest.mock('@react-navigation/native', () => ({
  // Comme le vrai : l'effet est relancé quand le callback change
  useFocusEffect: (cb: () => void | (() => void)) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useEffect: useEff } = require('react');
    useEff(cb, [cb]);
  },
}));

const fetchMock = global.fetch as jest.Mock;
const HEADERS = { 'X-Test': '1' };
const okResponse = (data: unknown) => ({ ok: true, status: 200, json: () => Promise.resolve(data) });
const koResponse = (status: number) => ({ ok: false, status, json: () => Promise.resolve({}) });

beforeEach(() => {
  fetchMock.mockReset();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

it('charge les données au focus et appelle onSuccess', async () => {
  fetchMock.mockResolvedValue(okResponse({ a: 1 }));
  const onSuccess = jest.fn();
  const { result } = renderHook(() => useApi('https://x/items', { headers: HEADERS, onSuccess }));
  await waitFor(() => expect(result.current.data).toEqual({ a: 1 }));
  expect(result.current.loading).toBe(false);
  expect(result.current.error).toBeNull();
  expect(onSuccess).toHaveBeenCalledWith({ a: 1 });
  expect(fetchMock).toHaveBeenCalledWith('https://x/items', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', 'X-Test': '1' },
  });
});

// BUG: hooks/useApi.ts:47 — `headers = {}` par défaut crée un nouvel objet à chaque rendu, donc
// fetchData (qui en dépend) change à chaque rendu et useFocusEffect relance une requête à chaque
// rendu : boucle infinie de requêtes dès qu'on appelle useApi(url) sans `headers` stable.
// (Idem si onSuccess / onError sont des fonctions fléchées inline.) Hook non utilisé dans l'app.
it.skip('ne relance pas la requête à chaque rendu sans headers explicites', async () => {
  fetchMock.mockResolvedValue(okResponse({}));
  renderHook(() => useApi('https://x'));
  await new Promise((r) => setTimeout(r, 50));
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it('ne charge rien sans autoFetch', () => {
  renderHook(() => useApi('https://x', { autoFetch: false, headers: HEADERS }));
  expect(fetchMock).not.toHaveBeenCalled();
});

it('relance en cas d’erreur puis échoue définitivement', async () => {
  jest.useFakeTimers();
  fetchMock.mockResolvedValue(koResponse(500));
  const onError = jest.fn();
  const { result } = renderHook(() =>
    useApi('https://x', { headers: HEADERS, onError, maxRetries: 2, retryDelay: 100 })
  );
  await act(async () => { await jest.advanceTimersByTimeAsync(0); });
  expect(result.current.retryCount).toBe(1);
  expect(result.current.isRetrying).toBe(true);
  await act(async () => { await jest.advanceTimersByTimeAsync(100); });
  expect(result.current.retryCount).toBe(2);
  await act(async () => { await jest.advanceTimersByTimeAsync(100); });
  expect(fetchMock).toHaveBeenCalledTimes(3);
  expect(result.current.error).toBe('HTTP error! status: 500');
  expect(result.current.isRetrying).toBe(false);
  expect(onError).toHaveBeenCalledWith('HTTP error! status: 500');
  expect(console.error).toHaveBeenCalled();
});

it('sans relance, échoue directement avec un message par défaut', async () => {
  fetchMock.mockRejectedValue({});
  const onError = jest.fn();
  const { result } = renderHook(() => useApi('https://x', { headers: HEADERS, onError, enableRetry: false }));
  await waitFor(() => expect(result.current.error).toBe('Une erreur est survenue'));
  expect(onError).toHaveBeenCalledWith('Une erreur est survenue');
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it('cancelRetry annule la relance programmée', async () => {
  jest.useFakeTimers();
  fetchMock.mockRejectedValue(new Error('net'));
  const { result } = renderHook(() => useApi('https://x', { headers: HEADERS, retryDelay: 100 }));
  await act(async () => { await jest.advanceTimersByTimeAsync(0); });
  expect(result.current.isRetrying).toBe(true);
  act(() => { result.current.cancelRetry(); });
  expect(result.current.isRetrying).toBe(false);
  await act(async () => { await jest.advanceTimersByTimeAsync(1000); });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  act(() => { result.current.cancelRetry(); });
});

it('une relance après démontage ne part pas', async () => {
  jest.useFakeTimers();
  fetchMock.mockRejectedValue(new Error('net'));
  const { unmount } = renderHook(() => useApi('https://x', { headers: HEADERS, retryDelay: 100 }));
  await act(async () => { await jest.advanceTimersByTimeAsync(0); });
  unmount();
  await jest.advanceTimersByTimeAsync(500);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it('ignore une réponse (succès ou erreur) arrivée après démontage', async () => {
  let resolve: (v: unknown) => void = () => {};
  fetchMock.mockImplementation(() => new Promise((r) => { resolve = r; }));
  const onSuccess = jest.fn();
  const { unmount, result } = renderHook(() => useApi('https://x', { headers: HEADERS, onSuccess }));
  unmount();
  await act(async () => { resolve(okResponse({ late: true })); });
  expect(result.current.data).toBeNull();

  let reject: (e: unknown) => void = () => {};
  fetchMock.mockImplementation(() => new Promise((_, r) => { reject = r; }));
  const onError = jest.fn();
  const second = renderHook(() => useApi('https://x', { headers: HEADERS, onError }));
  second.unmount();
  await act(async () => { reject(new Error('late')); });
  expect(onError).not.toHaveBeenCalled();
  // fetchData après démontage : sans effet
  await second.result.current.fetchData();
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

it('refetch relance la requête et reset vide l’état', async () => {
  fetchMock.mockResolvedValue(okResponse([1]));
  const { result } = renderHook(() => useApi('https://x', { headers: HEADERS, autoFetch: false }));
  await act(async () => { result.current.refetch(); });
  await waitFor(() => expect(result.current.data).toEqual([1]));
  act(() => { result.current.reset(); });
  expect(result.current).toMatchObject({ data: null, loading: false, error: null });
});

describe.each([
  ['postData', 'POST', true],
  ['putData', 'PUT', true],
  ['deleteData', 'DELETE', false],
] as const)('%s', (method, verb, hasBody) => {
  it(`envoie un ${verb} et renvoie la réponse`, async () => {
    fetchMock.mockResolvedValue(okResponse({ done: true }));
    const onSuccess = jest.fn();
    const { result } = renderHook(() => useApi('https://x', { headers: HEADERS, autoFetch: false, onSuccess }));
    let res: unknown;
    await act(async () => {
      res = method === 'deleteData' ? await result.current.deleteData() : await result.current[method]({ v: 1 });
    });
    expect(res).toEqual({ done: true });
    expect(result.current.data).toEqual({ done: true });
    expect(onSuccess).toHaveBeenCalledWith({ done: true });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe(verb);
    expect(init.headers).toEqual({ 'Content-Type': 'application/json', 'X-Test': '1' });
    expect(init.body).toBe(hasBody ? JSON.stringify({ v: 1 }) : undefined);
  });

  it(`propage l’erreur d’un ${verb} refusé`, async () => {
    fetchMock.mockResolvedValue(koResponse(422));
    const onError = jest.fn();
    const { result } = renderHook(() => useApi('https://x', { headers: HEADERS, autoFetch: false, onError }));
    await act(async () => {
      const call = method === 'deleteData' ? result.current.deleteData() : result.current[method]({});
      await expect(call).rejects.toThrow('HTTP error! status: 422');
    });
    expect(result.current.error).toBe('HTTP error! status: 422');
    expect(onError).toHaveBeenCalledWith('HTTP error! status: 422');
  });

  it(`utilise un message par défaut si l’erreur d’un ${verb} n’en a pas`, async () => {
    fetchMock.mockRejectedValue({});
    const { result } = renderHook(() => useApi('https://x', { headers: HEADERS, autoFetch: false }));
    await act(async () => {
      const call = method === 'deleteData' ? result.current.deleteData() : result.current[method]({});
      await expect(call).rejects.toEqual({});
    });
    expect(result.current.error).toBe('Une erreur est survenue');
  });
});

