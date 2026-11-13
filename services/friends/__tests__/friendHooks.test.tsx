/**
 * Hooks des amis : demandes (envoyer, répondre, annuler), suppression, listes et compteur,
 * avec gestion des erreurs et mode simulé.
 */
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { ENV } from '../../../config/env';
import { mockUsers } from '../../../mocks/users';
import { UsersApi } from '../../api/usersApi';
import {
  useCancelFriendRequest, useGetFriendRequests, useGetFriendRequestsCount, useGetFriends, useRemoveFriend,
  useRespondToFriendRequest, useSendFriendRequest,
} from '..';

jest.mock('@react-navigation/native', () => {
  const React = jest.requireActual('react');
  return { useFocusEffect: (cb: () => void) => React.useEffect(cb, [cb]) };
});

const mockApiRequest: { fn?: () => Promise<any>; options?: any; result: any } = { result: {} };
jest.mock('../../../hooks/useApiRequest', () => ({
  useApiRequest: (fn: () => Promise<any>, options: any) => {
    mockApiRequest.fn = fn;
    mockApiRequest.options = options;
    return mockApiRequest.result;
  },
}));

jest.mock('../../api/usersApi', () => ({
  UsersApi: {
    cancelFriendRequest: jest.fn(), getFriendRequests: jest.fn(), getFriendRequestsCount: jest.fn(), getFriends: jest.fn(),
    removeFriend: jest.fn(), respondToFriendRequest: jest.fn(), sendFriendRequest: jest.fn(),
  },
}));

const api = UsersApi as jest.Mocked<typeof UsersApi>;
const env = ENV as { USE_MOCKS: boolean };
let spies: jest.SpyInstance[] = [];

beforeEach(() => {
  Object.values(api).forEach((fn) => (fn as jest.Mock).mockReset());
  env.USE_MOCKS = false;
  mockApiRequest.result = { data: null, isLoading: false, error: null, refetch: jest.fn() };
  spies = (['log', 'error'] as const).map((m) => jest.spyOn(console, m).mockImplementation(() => {}));
});
afterEach(() => {
  env.USE_MOCKS = false;
  spies.forEach((s) => s.mockRestore());
});

async function call<T>(fn: () => Promise<T>): Promise<{ value?: T; error?: any }> {
  let out: { value?: T; error?: any } = {};
  await act(async () => {
    try { out = { value: await fn() }; } catch (error) { out = { error }; }
  });
  return out;
}

describe('actions', () => {
  it.each([
    ['useCancelFriendRequest', useCancelFriendRequest, 'cancelFriendRequest', ['u1'], true, 'Erreur lors de l\'annulation de la demande d\'ami'],
    ['useRemoveFriend', useRemoveFriend, 'removeFriend', ['f1'], 'r', 'Erreur lors de la suppression de l\'ami'],
    ['useRespondToFriendRequest', useRespondToFriendRequest, 'respondToFriendRequest', ['r1', 'accept'], 'r', 'Erreur lors de la réponse à la demande d\'ami'],
  ] as const)('%s : API, erreurs, mode simulé', async (_name, hook: any, method, args, expectedValue, fallback) => {
    (api as any)[method].mockResolvedValueOnce('r');
    const { result } = renderHook(() => hook());
    const { value } = await call(() => result.current[method](...args));
    expect(value).toBe(expectedValue);
    expect((api as any)[method]).toHaveBeenCalledWith(...args);
    expect(result.current.data).toBe(true);
    expect(result.current.isLoading).toBe(false);

    (api as any)[method].mockRejectedValueOnce(new Error('refus'));
    expect((await call(() => result.current[method](...args))).error.message).toBe('refus');
    expect(result.current.error).toBe('refus');
    (api as any)[method].mockRejectedValueOnce({});
    await call(() => result.current[method](...args));
    expect(result.current.error).toBe(fallback);

    env.USE_MOCKS = true;
    expect((await call(() => result.current[method](...args))).value).toBe(true);
    expect(result.current.error).toBeNull();
    expect((api as any)[method]).toHaveBeenCalledTimes(3);
  });

  it('useSendFriendRequest : API, mode simulé et extraction du message d’erreur', async () => {
    api.sendFriendRequest.mockResolvedValueOnce({ id: 'req' } as any);
    const { result } = renderHook(() => useSendFriendRequest());
    expect((await call(() => result.current.sendFriendRequest('u2'))).value).toEqual({ id: 'req' });
    expect(api.sendFriendRequest).toHaveBeenCalledWith('u2');
    expect(result.current.data).toBe(true);

    const cases: [any, string][] = [
      [new Error('direct'), 'direct'],
      [{ error: { message: 'imbriqué' } }, 'imbriqué'],
      [{ response: { data: { message: 'réponse' } } }, 'réponse'],
      [{ response: { data: { error: { message: 'réponse imbriquée' } } } }, 'réponse imbriquée'],
      [{}, 'Erreur lors de l\'envoi de la demande d\'ami'],
    ];
    for (const [thrown, expected] of cases) {
      api.sendFriendRequest.mockRejectedValueOnce(thrown);
      expect((await call(() => result.current.sendFriendRequest('u2'))).error.message).toBe(expected);
      expect(result.current.error).toBe(expected);
    }

    env.USE_MOCKS = true;
    expect((await call(() => result.current.sendFriendRequest('u2'))).value).toBe(true);
  });
});

describe('useGetFriendRequests', () => {
  it('charge au focus, recharge, erreurs et mode simulé', async () => {
    api.getFriendRequests.mockResolvedValueOnce([{ id: 'r' }] as any);
    const { result } = renderHook(() => useGetFriendRequests());
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual([{ id: 'r' }]);

    api.getFriendRequests.mockRejectedValueOnce(new Error('panne'));
    await act(async () => { await result.current.refetch(); });
    expect(result.current.error).toBe('panne');
    api.getFriendRequests.mockRejectedValueOnce({});
    await act(async () => { await result.current.refetch(); });
    expect(result.current.error).toBe('Erreur lors du chargement des demandes d\'amis');

    env.USE_MOCKS = true;
    await act(async () => { await result.current.refetch(); });
    expect(result.current.data.map((r: any) => r.id)).toEqual(['5', '6', '7']);
    expect(result.current.data.every((r: any) => r.status === 'pending')).toBe(true);
  });
});

describe('hooks à nouvelles tentatives', () => {
  it('useGetFriends : 5 tentatives, tableau par défaut, mode simulé', async () => {
    const { result, rerender } = renderHook(() => useGetFriends());
    expect(result.current.data).toEqual([]);
    expect(mockApiRequest.options).toEqual(expect.objectContaining({ maxRetries: 5, retryDelay: 1000, enableRetry: true }));
    mockApiRequest.options.onRetry(1, new Error('x'));
    mockApiRequest.options.onMaxRetriesReached(new Error('x'));
    api.getFriends.mockResolvedValueOnce([{ id: 'f' }] as any);
    await expect(mockApiRequest.fn!()).resolves.toEqual([{ id: 'f' }]);
    env.USE_MOCKS = true;
    await expect(mockApiRequest.fn!()).resolves.toEqual(mockUsers.slice(0, 3).map(({ id, firstname, lastname, avatar, email }) => ({ id, firstname, lastname, avatar, email })));
    mockApiRequest.result = { data: [{ id: 'z' }] };
    rerender({});
    expect(result.current.data).toEqual([{ id: 'z' }]);
  });

  it('useGetFriendRequestsCount : 3 tentatives, 0 par défaut, mode simulé (3)', async () => {
    const { result, rerender } = renderHook(() => useGetFriendRequestsCount());
    expect(result.current.count).toBe(0);
    expect(result.current.refetch).toBe(mockApiRequest.result.refetch);
    expect(mockApiRequest.options).toEqual(expect.objectContaining({ maxRetries: 3 }));
    mockApiRequest.options.onRetry(2, new Error('x'));
    mockApiRequest.options.onMaxRetriesReached(new Error('x'));
    api.getFriendRequestsCount.mockResolvedValueOnce(4);
    await expect(mockApiRequest.fn!()).resolves.toBe(4);
    env.USE_MOCKS = true;
    await expect(mockApiRequest.fn!()).resolves.toBe(3);
    mockApiRequest.result = { data: 7, isLoading: true, error: 'e' };
    rerender({});
    expect(result.current).toEqual(expect.objectContaining({ count: 7, isLoading: true, error: 'e' }));
  });
});
