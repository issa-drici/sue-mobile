/**
 * Hooks des notifications : liste (avec rafraîchissement toutes les 30 s), compteur de non lues,
 * marquage comme lu, suppression ; erreurs et mode simulé.
 */
import { act, renderHook } from '@testing-library/react-native';
import { ENV } from '../../../config/env';
import { mockNotifications } from '../../../mocks/notifications';
import { NotificationsApi } from '../../api/notificationsApi';
import { useGetNotifications, useGetUnreadCount, useMarkAllNotificationsAsRead, useMarkNotificationAsRead } from '..';
import { useDeleteNotification } from '../deleteNotification';

const mockApiRequest: { fn?: () => Promise<any>; options?: any; result: any } = { result: {} };
jest.mock('../../../hooks/useApiRequest', () => ({
  useApiRequest: (fn: () => Promise<any>, options: any) => {
    mockApiRequest.fn = fn;
    mockApiRequest.options = options;
    return mockApiRequest.result;
  },
}));

jest.mock('../../api/notificationsApi', () => ({
  NotificationsApi: { getAll: jest.fn(), getUnreadCount: jest.fn(), markAsRead: jest.fn(), markAllAsRead: jest.fn(), delete: jest.fn() },
}));

const api = NotificationsApi as jest.Mocked<typeof NotificationsApi>;
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
  jest.useRealTimers();
  spies.forEach((s) => s.mockRestore());
});

async function call<T>(fn: () => Promise<T>): Promise<{ value?: T; error?: any }> {
  let out: { value?: T; error?: any } = {};
  await act(async () => {
    try { out = { value: await fn() }; } catch (error) { out = { error }; }
  });
  return out;
}

describe('useGetNotifications', () => {
  it('appelle l’API avec page et limite, et extrait données et pagination', async () => {
    const { result, rerender } = renderHook(() => useGetNotifications(2, 5));
    expect(result.current.data).toEqual([]);
    expect(result.current.pagination).toEqual({});
    expect(mockApiRequest.options).toEqual(expect.objectContaining({ maxRetries: 5, retryDelay: 1000, enableRetry: true }));
    mockApiRequest.options.onRetry(1, new Error('x'));
    mockApiRequest.options.onMaxRetriesReached(new Error('x'));

    api.getAll.mockResolvedValueOnce({ data: [{ id: 'n' }], pagination: { page: 2 } } as any);
    await expect(mockApiRequest.fn!()).resolves.toEqual({ data: [{ id: 'n' }], pagination: { page: 2 } });
    expect(api.getAll).toHaveBeenCalledWith(2, 5);

    mockApiRequest.result = { ...mockApiRequest.result, data: { data: [{ id: 'n' }], pagination: { page: 2 } } };
    rerender({});
    expect(result.current.data).toEqual([{ id: 'n' }]);
    expect(result.current.pagination).toEqual({ page: 2 });
  });

  it('valeurs par défaut (page 1, 20) et mode simulé converti', async () => {
    renderHook(() => useGetNotifications());
    api.getAll.mockResolvedValueOnce({ data: [], pagination: {} } as any);
    await mockApiRequest.fn!();
    expect(api.getAll).toHaveBeenCalledWith(1, 20);

    env.USE_MOCKS = true;
    const mocked = await mockApiRequest.fn!();
    expect(mocked.pagination).toEqual({ page: 1, limit: 20, total: mockNotifications.length, totalPages: 1 });
    expect(mocked.data[0]).toEqual({
      id: mockNotifications[0].id, type: mockNotifications[0].type, title: mockNotifications[0].title,
      message: mockNotifications[0].message, isRead: mockNotifications[0].read, read: mockNotifications[0].read,
      createdAt: mockNotifications[0].createdAt, sessionId: mockNotifications[0].sessionId,
      data: { sessionId: mockNotifications[0].sessionId },
    });
  });

  it('rafraîchit toutes les 30 secondes, et s’arrête au démontage', () => {
    jest.useFakeTimers();
    const refetch = mockApiRequest.result.refetch;
    const { unmount } = renderHook(() => useGetNotifications());
    jest.advanceTimersByTime(30000);
    expect(refetch).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(60000);
    expect(refetch).toHaveBeenCalledTimes(3);
    unmount();
    jest.advanceTimersByTime(60000);
    expect(refetch).toHaveBeenCalledTimes(3);
  });

  it('pas de rafraîchissement en mode simulé', () => {
    jest.useFakeTimers();
    env.USE_MOCKS = true;
    const { unmount } = renderHook(() => useGetNotifications());
    jest.advanceTimersByTime(60000);
    expect(mockApiRequest.result.refetch).not.toHaveBeenCalled();
    unmount();
  });
});

describe('useGetUnreadCount', () => {
  it('compteur de l’API, 0 par défaut et en mode simulé', async () => {
    const { result, rerender } = renderHook(() => useGetUnreadCount());
    expect(result.current.count).toBe(0);
    mockApiRequest.options.onRetry(1, new Error('x'));
    mockApiRequest.options.onMaxRetriesReached(new Error('x'));
    api.getUnreadCount.mockResolvedValueOnce(9);
    await expect(mockApiRequest.fn!()).resolves.toBe(9);
    env.USE_MOCKS = true;
    await expect(mockApiRequest.fn!()).resolves.toBe(0);
    mockApiRequest.result = { data: 9, isLoading: false, error: null, refetch: jest.fn() };
    rerender({});
    expect(result.current.count).toBe(9);
  });
});

describe('marquage comme lu', () => {
  it.each([
    ['useMarkNotificationAsRead', useMarkNotificationAsRead, 'markAsRead', 'markAsRead', ['n1'], 'Erreur lors du marquage de la notification'],
    ['useMarkAllNotificationsAsRead', useMarkAllNotificationsAsRead, 'markAllAsRead', 'markAllAsRead', [], 'Erreur lors du marquage de toutes les notifications'],
  ] as const)('%s', async (_name, hook: any, method, apiMethod, args, fallback) => {
    (api as any)[apiMethod].mockResolvedValueOnce('r');
    const { result } = renderHook(() => hook());
    expect((await call(() => result.current[method](...args))).value).toBe('r');
    expect((api as any)[apiMethod]).toHaveBeenCalledWith(...args);
    expect(result.current.data).toBe(true);
    (api as any)[apiMethod].mockRejectedValueOnce(new Error('panne'));
    expect((await call(() => result.current[method](...args))).error.message).toBe('panne');
    expect(result.current.error).toBe('panne');
    (api as any)[apiMethod].mockRejectedValueOnce({});
    await call(() => result.current[method](...args));
    expect(result.current.error).toBe(fallback);
    env.USE_MOCKS = true;
    expect((await call(() => result.current[method](...args))).value).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });
});

describe('useDeleteNotification', () => {
  it('ID manquant : erreur sans appel', async () => {
    const { result } = renderHook(() => useDeleteNotification());
    await call(() => result.current.deleteNotification(''));
    expect(result.current.error).toBe('ID de notification manquant');
    expect(api.delete).not.toHaveBeenCalled();
  });

  it('supprime via l’API ; erreurs relayées', async () => {
    const { result } = renderHook(() => useDeleteNotification());
    api.delete.mockResolvedValueOnce(undefined);
    await call(() => result.current.deleteNotification('n1'));
    expect(api.delete).toHaveBeenCalledWith('n1');
    expect(result.current.error).toBeNull();
    api.delete.mockRejectedValueOnce(new Error('panne'));
    expect((await call(() => result.current.deleteNotification('n1'))).error.message).toBe('panne');
    expect(result.current.error).toBe('panne');
    api.delete.mockRejectedValueOnce(null);
    await call(() => result.current.deleteNotification('n1'));
    expect(result.current.error).toBe('Erreur lors de la suppression de la notification');
    expect(result.current.isLoading).toBe(false);
  });

  it('mode simulé : attend 500 ms sans appel', async () => {
    jest.useFakeTimers();
    env.USE_MOCKS = true;
    const { result } = renderHook(() => useDeleteNotification());
    let pending!: Promise<void>;
    act(() => { pending = result.current.deleteNotification('n1'); });
    expect(result.current.isLoading).toBe(true);
    await act(async () => { await jest.advanceTimersByTimeAsync(500); await pending; });
    expect(result.current.isLoading).toBe(false);
    expect(api.delete).not.toHaveBeenCalled();
  });
});
