/** Hook des notifications push : initialisation au montage, token, envois. */
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { usePushNotifications } from '../usePushNotifications';

const mockService = {
  initialize: jest.fn(),
  getToken: jest.fn(),
  sendLocalNotification: jest.fn(),
  sendTestNotification: jest.fn(),
};
jest.mock('../../services/notifications/pushNotifications', () => ({
  get pushNotificationService() { return mockService; },
}));

beforeEach(() => {
  Object.values(mockService).forEach((f) => f.mockReset());
});

it('s’initialise au montage et récupère le token', async () => {
  mockService.initialize.mockResolvedValue(true);
  mockService.getToken.mockReturnValue('ExpoToken[x]');
  const { result } = renderHook(() => usePushNotifications());
  await waitFor(() => expect(result.current.isInitialized).toBe(true));
  expect(result.current.token).toBe('ExpoToken[x]');
  expect(result.current.isInitializing).toBe(false);
  // déjà initialisé : ne recommence pas
  let again: boolean | undefined;
  await act(async () => { again = await result.current.initialize(); });
  expect(again).toBe(true);
  expect(mockService.initialize).toHaveBeenCalledTimes(1);
});

it('renvoie false si l’initialisation échoue', async () => {
  mockService.initialize.mockRejectedValue(new Error('no perms'));
  const { result } = renderHook(() => usePushNotifications());
  await waitFor(() => expect(result.current.isInitializing).toBe(false));
  expect(result.current.isInitialized).toBe(false);
  let res: boolean | undefined;
  await act(async () => { res = await result.current.initialize(); });
  expect(res).toBe(false);
});

it('ignore un appel pendant une initialisation en cours', async () => {
  let resolve: (v: boolean) => void = () => {};
  mockService.initialize.mockImplementation(() => new Promise((r) => { resolve = r; }));
  const { result } = renderHook(() => usePushNotifications());
  await waitFor(() => expect(result.current.isInitializing).toBe(true));
  let res: boolean | undefined;
  await act(async () => { res = await result.current.initialize(); });
  expect(res).toBe(false);
  expect(mockService.initialize).toHaveBeenCalledTimes(1);
  await act(async () => { resolve(false); });
});

it('délègue les envois au service', async () => {
  mockService.initialize.mockResolvedValue(false);
  mockService.sendTestNotification.mockResolvedValue(true);
  const { result } = renderHook(() => usePushNotifications());
  await waitFor(() => expect(result.current.isInitializing).toBe(false));
  const payload = { title: 't', body: 'b' } as never;
  await act(async () => { await result.current.sendLocalNotification(payload); });
  expect(mockService.sendLocalNotification).toHaveBeenCalledWith(payload);
  let ok: boolean | undefined;
  await act(async () => { ok = await result.current.sendTestNotification('u1'); });
  expect(ok).toBe(true);
  expect(mockService.sendTestNotification).toHaveBeenCalledWith('u1');
});
