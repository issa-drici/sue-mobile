/**
 * Contexte d'authentification : restauration de session au démarrage, connexion, inscription,
 * session par téléphone (OTP), déconnexion (stockage, file d'attente et cache du chat vidés),
 * tokens (baseApiService), rafraîchissement, onboarding, profil, erreurs.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert, Text } from 'react-native';
import AuthProviderDefault, { AuthProvider, useAuth } from '../../../app/context/auth';

const mockEnv = { API_BASE_URL: 'https://api.test/api', USE_MOCKS: false };
jest.mock('../../../config/env', () => ({ get ENV() { return mockEnv; } }));

const mockAuthApi = { login: jest.fn(), register: jest.fn(), logout: jest.fn(), forgotPassword: jest.fn() };
jest.mock('../../../services/api/authApi', () => ({ get AuthApi() { return mockAuthApi; } }));

const mockBase = { setAuthToken: jest.fn(), clearAuthToken: jest.fn(), setLogoutCallback: jest.fn(), resetUnauthorized: jest.fn() };
jest.mock('../../../services/api/baseApi', () => ({ get baseApiService() { return mockBase; } }));

const mockUsersApi = { getProfile: jest.fn(), updateProfile: jest.fn() };
jest.mock('../../../services/api/usersApi', () => ({ get UsersApi() { return mockUsersApi; } }));

const mockCache = { clearAll: jest.fn(), prune: jest.fn() };
jest.mock('../../../services/chat/messageCache', () => ({ get messageCache() { return mockCache; } }));

const mockOutbox = { clearAll: jest.fn(), setUser: jest.fn() };
jest.mock('../../../services/chat/outbox', () => ({ get outbox() { return mockOutbox; } }));

const mockPush = {
  unregisterTokenFromDatabase: jest.fn(),
  checkAndReinitializePermissions: jest.fn(),
  registerTokenInDatabase: jest.fn(),
};
jest.mock('../../../services/notifications/pushNotifications', () => ({
  get pushNotificationService() { return mockPush; },
}));

jest.mock('../../../utils', () => ({
  formatAvatarUrl: (u: string | null | undefined) => (u ? `https://cdn.test/${u}` : null),
}));

const fetchMock = global.fetch as jest.Mock;
const res = (status: number, body: unknown = {}) => ({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) });

const apiUser = { id: 'u1', first_name: 'Alex', last_name: 'Martin', email: 'a@test.fr', phone: '+33600000000', avatar_url: 'a.jpg' };
const normalizedUser = {
  id: 'u1', firstname: 'Alex', lastname: 'Martin', email: 'a@test.fr', phone: '+33600000000', avatar: 'https://cdn.test/a.jpg',
};

const resetAll = (o: Record<string, jest.Mock>) => Object.values(o).forEach((f) => f.mockReset());

beforeEach(async () => {
  jest.useRealTimers();
  mockEnv.USE_MOCKS = false;
  [mockAuthApi, mockBase, mockUsersApi, mockCache, mockOutbox, mockPush].forEach(resetAll);
  mockCache.clearAll.mockResolvedValue(undefined);
  mockOutbox.clearAll.mockResolvedValue(undefined);
  mockPush.unregisterTokenFromDatabase.mockResolvedValue(undefined);
  mockPush.checkAndReinitializePermissions.mockResolvedValue(true);
  mockPush.registerTokenInDatabase.mockResolvedValue(undefined);
  mockUsersApi.getProfile.mockResolvedValue(apiUser);
  mockAuthApi.logout.mockResolvedValue(undefined);
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(res(200));
  await AsyncStorage.clear();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => { jest.restoreAllMocks(); });

const wrapper = ({ children }: { children: React.ReactNode }) => <AuthProvider>{children}</AuthProvider>;

const setup = async () => {
  const hook = renderHook(() => useAuth(), { wrapper });
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
  return hook;
};

const storeSession = async (user: unknown = apiUser, token = 'tok') => {
  await AsyncStorage.setItem('user', JSON.stringify(user));
  await AsyncStorage.setItem('authToken', token);
};

describe('démarrage', () => {
  it('sans session : déconnecté, onboarding non terminé', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isOnboardingLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isOnboardingCompleted).toBe(false);
    expect(result.current.isOnboardingLoading).toBe(false);
    expect(mockBase.setAuthToken).not.toHaveBeenCalled();
    expect(mockOutbox.setUser).toHaveBeenCalledWith(null);
    expect(mockCache.prune).not.toHaveBeenCalled();
  });

  it('restaure la session enregistrée, configure le token et synchronise le profil', async () => {
    await storeSession();
    await AsyncStorage.setItem('onboarding_completed', 'true');
    mockUsersApi.getProfile.mockResolvedValue({ ...apiUser, firstname: 'Alexandre' });
    const { result } = await setup();
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isOnboardingCompleted).toBe(true);
    expect(mockBase.setAuthToken).toHaveBeenCalledWith('tok');
    expect(mockBase.setLogoutCallback).toHaveBeenCalledWith(expect.any(Function));
    expect(fetchMock).toHaveBeenCalledWith('https://api.test/api/profile', {
      headers: { Authorization: 'Bearer tok', Accept: 'application/json' },
    });
    await waitFor(() => expect(result.current.user?.firstname).toBe('Alexandre'));
    expect(JSON.parse((await AsyncStorage.getItem('user'))!).firstname).toBe('Alexandre');
    expect(mockOutbox.setUser).toHaveBeenLastCalledWith('u1');
    expect(mockCache.prune).toHaveBeenCalledWith('u1');
  });

  it('normalise un utilisateur au format avatar / avatarUrl, ou incomplet', async () => {
    await storeSession({ avatarUrl: 'b.png' });
    mockUsersApi.getProfile.mockImplementation(() => new Promise(() => {}));
    const { result } = await setup();
    expect(result.current.user).toEqual({ id: '', firstname: '', lastname: '', email: undefined, phone: undefined, avatar: 'https://cdn.test/b.png' });
  });

  it('normalise un profil nul en objet vide, sans avatar', async () => {
    await storeSession({ id: 'u1', firstname: 'A', lastname: 'B', avatar: '' });
    mockUsersApi.getProfile.mockResolvedValue(null);
    const { result } = await setup();
    await waitFor(() => expect(result.current.user).toEqual({}));
  });

  describe('jeton refusé (401) signalé par l’API', () => {
    const signal = async () => {
      const report = mockBase.setLogoutCallback.mock.calls[0][0];
      await act(async () => { report(); await new Promise((r) => setTimeout(r, 0)); });
    };

    it('refus confirmé par le serveur et rafraîchissement impossible : déconnexion avec message', async () => {
      await storeSession();
      const { result } = await setup();
      const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
      await AsyncStorage.removeItem('refreshToken');
      fetchMock.mockResolvedValue(res(401));
      await signal();
      expect(result.current.user).toBeNull();
      expect(mockBase.clearAuthToken).toHaveBeenCalled();
      expect(alert).toHaveBeenCalledWith('Session expirée', 'Reconnecte-toi pour retrouver tes sessions.');
    });

    it('jeton finalement accepté : reste connecté et réarme le signalement', async () => {
      await storeSession();
      const { result } = await setup();
      fetchMock.mockResolvedValue(res(200));
      await signal();
      expect(result.current.user).toEqual(normalizedUser);
      expect(mockBase.resetUnauthorized).toHaveBeenCalled();
    });

    it('serveur en erreur ou pas de réseau : jamais de déconnexion', async () => {
      await storeSession();
      const { result } = await setup();
      fetchMock.mockResolvedValueOnce(res(500));
      await signal();
      fetchMock.mockRejectedValueOnce(new Error('offline'));
      await signal();
      expect(result.current.user).toEqual(normalizedUser);
      expect(mockBase.clearAuthToken).not.toHaveBeenCalled();
    });

    it('rafraîchissement réussi : reste connecté', async () => {
      await storeSession();
      const { result } = await setup();
      await AsyncStorage.setItem('refreshToken', 'R');
      fetchMock.mockResolvedValueOnce(res(401)).mockResolvedValueOnce(res(200, { token: 'N' }));
      await signal();
      expect(result.current.user).toEqual(normalizedUser);
      expect(await AsyncStorage.getItem('authToken')).toBe('N');
    });

    it('sans jeton enregistré : rien à vérifier', async () => {
      const { result } = await setup();
      fetchMock.mockClear();
      await signal();
      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.current.user).toBeNull();
    });
  });

  it('erreur de lecture de l’onboarding → considéré non terminé', async () => {
    const getItem = AsyncStorage.getItem as jest.Mock;
    const original = getItem.getMockImplementation();
    getItem.mockImplementation((key: string) =>
      key === 'onboarding_completed' ? Promise.reject(new Error('disk')) : original!(key)
    );
    const { result } = await setup();
    expect(result.current.isOnboardingCompleted).toBe(false);
    expect(result.current.isOnboardingLoading).toBe(false);
    getItem.mockImplementation(original!);
  });

  it('erreur au chargement : récupère quand même la session', async () => {
    await storeSession();
    mockBase.setAuthToken.mockImplementationOnce(() => { throw new Error('boom'); });
    const { result } = await setup();
    expect(result.current.user).toEqual(normalizedUser);
    expect(mockBase.setAuthToken).toHaveBeenCalledTimes(2);
  });

  it('erreur au chargement sans session récupérable : déconnecté', async () => {
    const getItem = AsyncStorage.getItem as jest.Mock;
    const original = getItem.getMockImplementation();
    let first = true;
    getItem.mockImplementation((key: string) => {
      if (key === 'user' && first) { first = false; return Promise.reject(new Error('disk')); }
      return original!(key);
    });
    const { result } = await setup();
    expect(result.current.user).toBeNull();
    getItem.mockImplementation(original!);
  });

  it('données corrompues : déconnecté', async () => {
    await AsyncStorage.setItem('user', '{pas du json');
    await AsyncStorage.setItem('authToken', 'tok');
    const { result } = await setup();
    expect(result.current.user).toBeNull();
    expect(console.error).toHaveBeenCalledWith('❌ Impossible de récupérer l\'utilisateur:', expect.any(Error));
  });

  it('affiche ses enfants et l’export par défaut est le provider', () => {
    expect(AuthProviderDefault).toBe(AuthProvider);
    render(<AuthProvider><Text>enfant</Text></AuthProvider>);
    expect(screen.getByText('enfant')).toBeOnTheScreen();
  });

  it('useAuth hors du provider lève une erreur', () => {
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within an AuthProvider');
  });
});

describe('signIn', () => {
  it('connecte, enregistre l’utilisateur et les tokens, configure l’API et le token push', async () => {
    mockAuthApi.login.mockResolvedValue({ token: 'T', user: apiUser, refresh_token: 'R' });
    const { result } = await setup();
    await act(async () => { await result.current.signIn('a@test.fr', 'pw'); });
    expect(mockAuthApi.login).toHaveBeenCalledWith({ email: 'a@test.fr', password: 'pw', device_name: 'Alarrache Mobile App' });
    expect(result.current.user).toEqual(normalizedUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(JSON.parse((await AsyncStorage.getItem('user'))!)).toEqual(normalizedUser);
    expect(await AsyncStorage.getItem('authToken')).toBe('T');
    expect(await AsyncStorage.getItem('refreshToken')).toBe('R');
    expect(mockBase.setAuthToken).toHaveBeenCalledWith('T');
    expect(mockPush.registerTokenInDatabase).toHaveBeenCalled();
  });

  it('sans refresh token ni permission push', async () => {
    mockAuthApi.login.mockResolvedValue({ token: 'T', user: apiUser });
    mockPush.checkAndReinitializePermissions.mockResolvedValue(false);
    const { result } = await setup();
    await act(async () => { await result.current.signIn('a@test.fr', 'pw'); });
    expect(await AsyncStorage.getItem('refreshToken')).toBeNull();
    expect(mockPush.registerTokenInDatabase).not.toHaveBeenCalled();
  });

  it('une erreur du token push n’empêche pas la connexion', async () => {
    mockAuthApi.login.mockResolvedValue({ token: 'T', user: apiUser });
    mockPush.checkAndReinitializePermissions.mockRejectedValue(new Error('push'));
    const { result } = await setup();
    await act(async () => { await result.current.signIn('a@test.fr', 'pw'); });
    expect(result.current.isAuthenticated).toBe(true);
    expect(console.warn).toHaveBeenCalled();
  });

  it('réponse invalide du serveur', async () => {
    mockAuthApi.login.mockResolvedValue({ token: 'T' });
    const { result } = await setup();
    await act(async () => {
      await expect(result.current.signIn('a', 'b')).rejects.toThrow('Format de réponse invalide du serveur');
    });
    expect(result.current.user).toBeNull();
  });

  it('erreur de l’API : message transmis, ou message par défaut', async () => {
    const { result } = await setup();
    mockAuthApi.login.mockRejectedValueOnce(new Error('Identifiants invalides'));
    await act(async () => { await expect(result.current.signIn('a', 'b')).rejects.toThrow('Identifiants invalides'); });
    mockAuthApi.login.mockRejectedValueOnce({});
    await act(async () => { await expect(result.current.signIn('a', 'b')).rejects.toThrow('Erreur lors de la connexion'); });
  });

  it('mode démo (mocks) : utilisateur fictif', async () => {
    mockEnv.USE_MOCKS = true;
    const { result } = await setup();
    await act(async () => { await result.current.signIn('demo@test.fr', 'pw'); });
    expect(mockAuthApi.login).not.toHaveBeenCalled();
    expect(result.current.user).toEqual({ id: '1', firstname: 'Utilisateur', lastname: 'Test', email: 'demo@test.fr' });
    expect(await AsyncStorage.getItem('authToken')).toMatch(/^mock-token-/);
    expect(await AsyncStorage.getItem('refreshToken')).toMatch(/^mock-refresh-/);
    expect(mockBase.setAuthToken).toHaveBeenCalledWith(expect.stringMatching(/^mock-token-/));
    expect(mockPush.registerTokenInDatabase).toHaveBeenCalled();
  });

  it('mode démo : push sans permission ou en erreur, et échec du stockage', async () => {
    mockEnv.USE_MOCKS = true;
    const { result } = await setup();
    mockPush.checkAndReinitializePermissions.mockResolvedValueOnce(false);
    await act(async () => { await result.current.signIn('d', 'p'); });
    expect(mockPush.registerTokenInDatabase).not.toHaveBeenCalled();
    mockPush.checkAndReinitializePermissions.mockRejectedValueOnce(new Error('push'));
    await act(async () => { await result.current.signIn('d', 'p'); });
    expect(console.warn).toHaveBeenCalled();
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk'));
    await act(async () => { await expect(result.current.signIn('d', 'p')).rejects.toThrow('Erreur lors de la connexion mock'); });
  });
});

describe('signUp', () => {
  it('inscrit et ouvre la session', async () => {
    mockAuthApi.register.mockResolvedValue({ token: 'T', user: apiUser, refresh_token: 'R' });
    const { result } = await setup();
    await act(async () => { await result.current.signUp('Alex', 'Martin', 'a@test.fr', '+336', 'pw', 'pw'); });
    expect(mockAuthApi.register).toHaveBeenCalledWith({
      firstname: 'Alex', lastname: 'Martin', email: 'a@test.fr', phone: '+336', password: 'pw', password_confirmation: 'pw',
      device_name: 'Alarrache Mobile App',
    });
    expect(result.current.user).toEqual(normalizedUser);
    expect(await AsyncStorage.getItem('authToken')).toBe('T');
    expect(await AsyncStorage.getItem('refreshToken')).toBe('R');
    expect(mockBase.setAuthToken).toHaveBeenCalledWith('T');
  });

  it('sans refresh token', async () => {
    mockAuthApi.register.mockResolvedValue({ token: 'T', user: apiUser });
    const { result } = await setup();
    await act(async () => { await result.current.signUp('a', 'b', 'c', 'd', 'e', 'e'); });
    expect(await AsyncStorage.getItem('refreshToken')).toBeNull();
  });

  it('réponse invalide et erreurs', async () => {
    const { result } = await setup();
    mockAuthApi.register.mockResolvedValueOnce({ user: apiUser });
    await act(async () => {
      await expect(result.current.signUp('a', 'b', 'c', 'd', 'e', 'e')).rejects.toThrow('Format de réponse invalide du serveur');
    });
    mockAuthApi.register.mockRejectedValueOnce({});
    await act(async () => {
      await expect(result.current.signUp('a', 'b', 'c', 'd', 'e', 'e')).rejects.toThrow('Erreur lors de l\'inscription');
    });
  });

  it('mode démo : prénom et nom fournis', async () => {
    mockEnv.USE_MOCKS = true;
    const { result } = await setup();
    await act(async () => { await result.current.signUp('Zoé', 'Durand', 'z@test.fr', '+336', 'pw', 'pw'); });
    expect(mockAuthApi.register).not.toHaveBeenCalled();
    expect(result.current.user).toMatchObject({ id: '1', firstname: 'Zoé', lastname: 'Durand' });
  });
});

describe('authenticateWithSession (connexion par téléphone / OTP)', () => {
  it('ouvre la session avec le token reçu, recharge le profil et enregistre le token push', async () => {
    const { result } = await setup();
    mockUsersApi.getProfile.mockResolvedValue({ ...apiUser, avatar: 'p.jpg' });
    await act(async () => { await result.current.authenticateWithSession('T', apiUser as never, 'R'); });
    expect(await AsyncStorage.getItem('authToken')).toBe('T');
    expect(await AsyncStorage.getItem('refreshToken')).toBe('R');
    expect(mockBase.setAuthToken).toHaveBeenCalledWith('T');
    expect(mockPush.registerTokenInDatabase).toHaveBeenCalled();
    await waitFor(() => expect(result.current.user?.avatar).toBe('https://cdn.test/p.jpg'));
  });

  it('sans refresh token, sans permission push', async () => {
    mockPush.checkAndReinitializePermissions.mockResolvedValue(false);
    const { result } = await setup();
    await act(async () => { await result.current.authenticateWithSession('T', apiUser as never); });
    expect(await AsyncStorage.getItem('refreshToken')).toBeNull();
    expect(mockPush.registerTokenInDatabase).not.toHaveBeenCalled();
  });

  it('erreur push ignorée ; échec du profil ignoré', async () => {
    mockPush.checkAndReinitializePermissions.mockRejectedValue(new Error('push'));
    mockUsersApi.getProfile.mockRejectedValue(new Error('profile'));
    const { result } = await setup();
    await act(async () => { await result.current.authenticateWithSession('T', apiUser as never); });
    expect(result.current.user).toEqual(normalizedUser);
    expect(console.warn).toHaveBeenCalled();
  });

  it('échec du stockage : erreur remontée', async () => {
    const { result } = await setup();
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk plein'));
    await act(async () => {
      await expect(result.current.authenticateWithSession('T', apiUser as never)).rejects.toThrow('disk plein');
    });
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce({});
    await act(async () => {
      await expect(result.current.authenticateWithSession('T', apiUser as never)).rejects.toThrow('Erreur lors de la connexion');
    });
  });
});

describe('signOut / forceSignOut', () => {
  const signedIn = async () => {
    await storeSession();
    await AsyncStorage.setItem('refreshToken', 'R');
    const hook = await setup();
    await waitFor(() => expect(hook.result.current.isAuthenticated).toBe(true));
    return hook;
  };

  it('vide le stockage, la file d’attente et le cache du chat, et le token de l’API', async () => {
    await AsyncStorage.setItem('onboarding_completed', 'true');
    const { result } = await signedIn();
    await act(async () => { await result.current.signOut(); });
    expect(mockPush.unregisterTokenFromDatabase).toHaveBeenCalled();
    expect(mockAuthApi.logout).toHaveBeenCalled();
    expect(await AsyncStorage.multiGet(['user', 'authToken', 'refreshToken'])).toEqual([
      ['user', null], ['authToken', null], ['refreshToken', null],
    ]);
    expect(await AsyncStorage.getItem('onboarding_completed')).toBe('true');
    expect(mockOutbox.clearAll).toHaveBeenCalled();
    expect(mockCache.clearAll).toHaveBeenCalled();
    expect(mockBase.clearAuthToken).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(mockOutbox.setUser).toHaveBeenLastCalledWith(null);
  });

  it('continue malgré les erreurs du token push et de l’API', async () => {
    mockPush.unregisterTokenFromDatabase.mockRejectedValue(new Error('push'));
    mockAuthApi.logout.mockRejectedValue(new Error('api'));
    const { result } = await signedIn();
    await act(async () => { await result.current.signOut(); });
    expect(result.current.user).toBeNull();
    expect(mockBase.clearAuthToken).toHaveBeenCalled();
  });

  it('mode démo : pas d’appel à l’API de déconnexion', async () => {
    mockEnv.USE_MOCKS = true;
    const { result } = await signedIn();
    await act(async () => { await result.current.signOut(); });
    expect(mockAuthApi.logout).not.toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });

  it('erreur pendant le nettoyage : déconnexion forcée', async () => {
    const { result } = await signedIn();
    mockOutbox.clearAll.mockRejectedValueOnce(new Error('disk'));
    await act(async () => { await result.current.signOut(); });
    expect(mockOutbox.clearAll).toHaveBeenCalledTimes(2);
    expect(mockPush.unregisterTokenFromDatabase).toHaveBeenCalledTimes(2);
    expect(result.current.user).toBeNull();
  });

  it('forceSignOut nettoie tout, même si le token push échoue', async () => {
    mockPush.unregisterTokenFromDatabase.mockRejectedValue(new Error('push'));
    const { result } = await signedIn();
    await act(async () => { await result.current.forceSignOut(); });
    expect(await AsyncStorage.getItem('authToken')).toBeNull();
    expect(mockOutbox.clearAll).toHaveBeenCalled();
    expect(mockCache.clearAll).toHaveBeenCalled();
    expect(mockBase.clearAuthToken).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });

  it('forceSignOut journalise une erreur de nettoyage', async () => {
    const { result } = await signedIn();
    mockCache.clearAll.mockRejectedValueOnce(new Error('disk'));
    await act(async () => { await result.current.forceSignOut(); });
    expect(console.error).toHaveBeenCalledWith('❌ Erreur lors de la déconnexion forcée:', expect.any(Error));
    expect(result.current.user).not.toBeNull();
  });
});

describe('tokens', () => {
  it('getAuthToken lit le token, ou null en cas d’erreur', async () => {
    await AsyncStorage.setItem('authToken', 'abc');
    const { result } = await setup();
    expect(await result.current.getAuthToken()).toBe('abc');
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('disk'));
    expect(await result.current.getAuthToken()).toBeNull();
  });

  describe('checkTokenValidity', () => {
    it('sans token : invalide', async () => {
      const { result } = await setup();
      expect(await result.current.checkTokenValidity()).toBe(false);
    });

    it('token accepté : valide', async () => {
      const { result } = await setup();
      await AsyncStorage.setItem('authToken', 'tok');
      fetchMock.mockResolvedValue(res(200));
      await expect(result.current.checkTokenValidity()).resolves.toBe(true);
    });

    it('401 puis rafraîchissement réussi : revérifie avec le nouveau token', async () => {
      const { result } = await setup();
      await AsyncStorage.setItem('authToken', 'old');
      await AsyncStorage.setItem('refreshToken', 'R');
      fetchMock
        .mockResolvedValueOnce(res(401))
        .mockResolvedValueOnce(res(200, { token: 'new' }))
        .mockResolvedValueOnce(res(200));
      let valid: boolean | undefined;
      await act(async () => { valid = await result.current.checkTokenValidity(); });
      expect(valid).toBe(true);
      expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe('Bearer new');
      expect(mockBase.setAuthToken).toHaveBeenCalledWith('new');
    });

    it('401 sans rafraîchissement possible : reste connecté', async () => {
      const { result } = await setup();
      await AsyncStorage.setItem('authToken', 'old');
      fetchMock.mockResolvedValueOnce(res(401));
      let valid: boolean | undefined;
      await act(async () => { valid = await result.current.checkTokenValidity(); });
      expect(valid).toBe(true);
    });

    // BUG: app/context/auth.tsx:158-164 — après un 401, si /refresh renvoie un nouveau token mais que
    // /profile le refuse encore (401), checkTokenValidity se rappelle sans limite : boucle de requêtes
    // /profile + /refresh. Le garde `isRefreshing` de refreshAuth ne protège pas (valeur d'état figée
    // dans la closure du rendu, toujours false). Il faudrait limiter à une seule nouvelle vérification.
    it('ne boucle pas si le nouveau token est encore refusé', async () => {
      const { result } = await setup();
      await AsyncStorage.setItem('authToken', 'old');
      await AsyncStorage.setItem('refreshToken', 'R');
      let calls = 0;
      fetchMock.mockImplementation((url: string) => {
        calls += 1;
        if (calls > 40) return Promise.resolve(res(200));
        return Promise.resolve(url.endsWith('/refresh') ? res(200, { token: 'new' }) : res(401));
      });
      await act(async () => { await result.current.checkTokenValidity(); });
      expect(calls).toBeLessThanOrEqual(3);
    });

    it('autre erreur serveur ou réseau : reste connecté', async () => {
      const { result } = await setup();
      await AsyncStorage.setItem('authToken', 'tok');
      fetchMock.mockResolvedValueOnce(res(500));
      expect(await result.current.checkTokenValidity()).toBe(true);
      fetchMock.mockRejectedValueOnce(new Error('offline'));
      expect(await result.current.checkTokenValidity()).toBe(true);
    });
  });

  describe('refreshAuth', () => {
    it('sans refresh token : échec', async () => {
      const { result } = await setup();
      let ok: boolean | undefined;
      await act(async () => { ok = await result.current.refreshAuth(); });
      expect(ok).toBe(false);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('enregistre le nouveau token (token ou access_token)', async () => {
      const { result } = await setup();
      await AsyncStorage.setItem('refreshToken', 'R');
      fetchMock.mockResolvedValueOnce(res(200, { token: 'N1' }));
      let ok: boolean | undefined;
      await act(async () => { ok = await result.current.refreshAuth(); });
      expect(ok).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith('https://api.test/api/refresh', {
        method: 'POST',
        headers: { Authorization: 'Bearer R', Accept: 'application/json', 'Content-Type': 'application/json' },
      });
      expect(await AsyncStorage.getItem('authToken')).toBe('N1');
      fetchMock.mockResolvedValueOnce(res(200, { access_token: 'N2' }));
      await act(async () => { ok = await result.current.refreshAuth(); });
      expect(ok).toBe(true);
      expect(mockBase.setAuthToken).toHaveBeenLastCalledWith('N2');
    });

    it('réponse sans token, refusée ou erreur réseau : échec', async () => {
      const { result } = await setup();
      await AsyncStorage.setItem('refreshToken', 'R');
      let ok: boolean | undefined;
      fetchMock.mockResolvedValueOnce(res(200, {}));
      await act(async () => { ok = await result.current.refreshAuth(); });
      expect(ok).toBe(false);
      fetchMock.mockResolvedValueOnce(res(401));
      await act(async () => { ok = await result.current.refreshAuth(); });
      expect(ok).toBe(false);
      fetchMock.mockRejectedValueOnce(new Error('offline'));
      await act(async () => { ok = await result.current.refreshAuth(); });
      expect(ok).toBe(false);
    });

    it('un second rafraîchissement pendant le premier est refusé', async () => {
      const { result } = await setup();
      await AsyncStorage.setItem('refreshToken', 'R');
      let resolve: (v: unknown) => void = () => {};
      fetchMock.mockImplementationOnce(() => new Promise((r) => { resolve = r; }));
      let first: Promise<boolean> = Promise.resolve(false);
      await act(async () => { first = result.current.refreshAuth(); });
      let second: boolean | undefined;
      await act(async () => { second = await result.current.refreshAuth(); });
      expect(second).toBe(false);
      await act(async () => { resolve(res(200, { token: 'N' })); await first; });
      await expect(first).resolves.toBe(true);
    });
  });
});

describe('onboarding', () => {
  it('termine puis réinitialise', async () => {
    const { result } = await setup();
    await act(async () => { await result.current.completeOnboarding(); });
    expect(result.current.isOnboardingCompleted).toBe(true);
    expect(await AsyncStorage.getItem('onboarding_completed')).toBe('true');
    await act(async () => { await result.current.resetOnboarding(); });
    expect(result.current.isOnboardingCompleted).toBe(false);
    expect(await AsyncStorage.getItem('onboarding_completed')).toBeNull();
  });

  it('erreurs de stockage journalisées sans changer l’état', async () => {
    const { result } = await setup();
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk'));
    await act(async () => { await result.current.completeOnboarding(); });
    expect(result.current.isOnboardingCompleted).toBe(false);
    await act(async () => { await result.current.completeOnboarding(); });
    jest.spyOn(AsyncStorage, 'removeItem').mockRejectedValueOnce(new Error('disk'));
    await act(async () => { await result.current.resetOnboarding(); });
    expect(result.current.isOnboardingCompleted).toBe(true);
  });
});

describe('mot de passe oublié', () => {
  it('appelle l’API', async () => {
    mockAuthApi.forgotPassword.mockResolvedValue(undefined);
    const { result } = await setup();
    await result.current.forgotPassword('a@test.fr');
    expect(mockAuthApi.forgotPassword).toHaveBeenCalledWith('a@test.fr');
  });

  it('mode démo : rien à appeler', async () => {
    mockEnv.USE_MOCKS = true;
    const { result } = await setup();
    await result.current.forgotPassword('a@test.fr');
    expect(mockAuthApi.forgotPassword).not.toHaveBeenCalled();
  });

  it('erreurs : message transmis ou par défaut', async () => {
    const { result } = await setup();
    mockAuthApi.forgotPassword.mockRejectedValueOnce(new Error('Email inconnu'));
    await expect(result.current.forgotPassword('x')).rejects.toThrow('Email inconnu');
    mockAuthApi.forgotPassword.mockRejectedValueOnce({});
    await expect(result.current.forgotPassword('x')).rejects.toThrow('Erreur lors de la demande de réinitialisation');
  });
});

describe('profil', () => {
  it('updateUserProfile met à jour l’état et le stockage', async () => {
    mockUsersApi.updateProfile.mockResolvedValue({ ...apiUser, first_name: 'Max' });
    const { result } = await setup();
    await act(async () => { await result.current.updateUserProfile({ firstname: 'Max' } as never); });
    expect(mockUsersApi.updateProfile).toHaveBeenCalledWith({ firstname: 'Max' });
    expect(result.current.user?.firstname).toBe('Max');
    expect(JSON.parse((await AsyncStorage.getItem('user'))!).firstname).toBe('Max');
    expect(result.current.isLoading).toBe(false);
  });

  it('updateUserProfile remonte l’erreur et termine le chargement', async () => {
    const err = new Error('422');
    mockUsersApi.updateProfile.mockRejectedValue(err);
    const { result } = await setup();
    await act(async () => { await expect(result.current.updateUserProfile({} as never)).rejects.toBe(err); });
    expect(result.current.isLoading).toBe(false);
  });

  it('refreshUser recharge le profil, et ignore une erreur', async () => {
    const { result } = await setup();
    await act(async () => { await result.current.refreshUser(); });
    expect(result.current.user).toEqual(normalizedUser);
    mockUsersApi.getProfile.mockRejectedValueOnce(new Error('x'));
    await act(async () => { await result.current.refreshUser(); });
    expect(result.current.user).toEqual(normalizedUser);
    expect(console.error).toHaveBeenCalledWith('❌ Erreur lors de la synchronisation de l\'utilisateur:', expect.any(Error));
  });
});
