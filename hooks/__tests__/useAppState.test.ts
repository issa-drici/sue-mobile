/**
 * Retour au premier plan : initialisation des notifications si connecté, revérification des
 * permissions, enregistrement du token.
 */
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { useAppState } from '../useAppState';

const mockAuth = { isAuthenticated: true };
jest.mock('../../app/context/auth', () => ({ useAuth: () => mockAuth }));
const mockService = {
  isServiceInitialized: jest.fn(),
  initialize: jest.fn(),
  registerTokenInDatabase: jest.fn(),
  checkAndReinitializePermissions: jest.fn(),
};
jest.mock('../../services/notifications/pushNotifications', () => ({
  get pushNotificationService() { return mockService; },
}));

let listener: ((s: string) => Promise<void>) | null = null;
const remove = jest.fn();

beforeEach(() => {
  Object.values(mockService).forEach((f) => f.mockReset());
  mockService.registerTokenInDatabase.mockResolvedValue(undefined);
  mockAuth.isAuthenticated = true;
  listener = null;
  remove.mockReset();
  (AppState as { currentState: string }).currentState = 'active';
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, cb) => {
    listener = cb as never;
    return { remove } as never;
  });
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => { jest.restoreAllMocks(); });

it('initialise le service et enregistre le token si connecté et pas encore initialisé', async () => {
  mockService.isServiceInitialized.mockReturnValue(false);
  mockService.initialize.mockResolvedValue(true);
  renderHook(() => useAppState());
  await waitFor(() => expect(mockService.registerTokenInDatabase).toHaveBeenCalledTimes(1));
});

it('n’enregistre pas le token si l’initialisation échoue', async () => {
  mockService.isServiceInitialized.mockReturnValue(false);
  mockService.initialize.mockResolvedValue(false);
  renderHook(() => useAppState());
  await waitFor(() => expect(mockService.initialize).toHaveBeenCalled());
  expect(mockService.registerTokenInDatabase).not.toHaveBeenCalled();
});

it('ne réinitialise pas un service déjà prêt', async () => {
  mockService.isServiceInitialized.mockReturnValue(true);
  renderHook(() => useAppState());
  await act(async () => {});
  expect(mockService.initialize).not.toHaveBeenCalled();
});

it('ne fait rien au démarrage si déconnecté', async () => {
  mockAuth.isAuthenticated = false;
  renderHook(() => useAppState());
  await act(async () => {});
  expect(mockService.isServiceInitialized).not.toHaveBeenCalled();
});

it('avale une erreur d’initialisation', async () => {
  mockService.isServiceInitialized.mockImplementation(() => { throw new Error('x'); });
  renderHook(() => useAppState());
  await act(async () => {});
  expect(console.warn).toHaveBeenCalled();
});

it('au retour au premier plan, revérifie les permissions et enregistre le token', async () => {
  mockService.isServiceInitialized.mockReturnValue(true);
  mockService.checkAndReinitializePermissions.mockResolvedValue(true);
  renderHook(() => useAppState());
  await act(async () => { await listener!('background'); });
  expect(mockService.checkAndReinitializePermissions).not.toHaveBeenCalled();
  await act(async () => { await listener!('active'); });
  expect(mockService.checkAndReinitializePermissions).toHaveBeenCalledTimes(1);
  expect(mockService.registerTokenInDatabase).toHaveBeenCalledTimes(1);
  // active → active : rien
  await act(async () => { await listener!('active'); });
  expect(mockService.checkAndReinitializePermissions).toHaveBeenCalledTimes(1);
});

it('au retour, n’enregistre pas sans permission ni si déconnecté', async () => {
  mockService.checkAndReinitializePermissions.mockResolvedValue(false);
  const { rerender } = renderHook(() => useAppState());
  await act(async () => { await listener!('inactive'); });
  await act(async () => { await listener!('active'); });
  expect(mockService.registerTokenInDatabase).not.toHaveBeenCalled();

  mockAuth.isAuthenticated = false;
  mockService.checkAndReinitializePermissions.mockResolvedValue(true);
  rerender({});
  await act(async () => { await listener!('background'); });
  await act(async () => { await listener!('active'); });
  expect(mockService.registerTokenInDatabase).not.toHaveBeenCalled();
  expect(remove).toHaveBeenCalled();
});

it('avale une erreur de vérification des permissions et retire l’écoute au démontage', async () => {
  mockAuth.isAuthenticated = false;
  mockService.checkAndReinitializePermissions.mockRejectedValue(new Error('x'));
  const { unmount } = renderHook(() => useAppState());
  await act(async () => { await listener!('background'); });
  await act(async () => { await listener!('active'); });
  expect(console.warn).toHaveBeenCalled();
  unmount();
  expect(remove).toHaveBeenCalledTimes(1);
});
