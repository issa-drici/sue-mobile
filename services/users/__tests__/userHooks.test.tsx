/**
 * Hooks des utilisateurs : profil, profil d'un autre joueur, recherche (plusieurs formats de
 * réponse), mises à jour (profil, email, mot de passe, sports), suppression du compte.
 */
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { ENV } from '../../../config/env';
import { mockUserProfile, mockUsers } from '../../../mocks/users';
import { baseApiService } from '../../api/baseApi';
import { UsersApi } from '../../api/usersApi';
import { useGetUsers, useSearchUsers, useUpdateUser } from '..';
import { useDeleteAccount } from '../deleteAccount';
import { useGetUserById } from '../getUserById';
import { useGetUserProfile } from '../getUserProfile';
import { useUpdateEmail } from '../updateEmail';
import { useUpdatePassword } from '../updatePassword';
import { useUpdateSportsPreferences } from '../updateSportsPreferences';

jest.mock('@react-navigation/native', () => {
  const React = jest.requireActual('react');
  return { useFocusEffect: (cb: () => void) => React.useEffect(cb, [cb]) };
});

jest.mock('../../api/usersApi', () => ({
  UsersApi: { searchUsers: jest.fn(), updateProfile: jest.fn(), updateEmail: jest.fn(), updatePassword: jest.fn(), deleteAccount: jest.fn() },
}));
jest.mock('../../api/baseApi', () => ({ baseApiService: { get: jest.fn(), put: jest.fn() } }));

const api = UsersApi as jest.Mocked<typeof UsersApi>;
const base = baseApiService as unknown as { get: jest.Mock; put: jest.Mock };
const env = ENV as { USE_MOCKS: boolean };
let spies: jest.SpyInstance[] = [];

beforeEach(() => {
  Object.values(api).forEach((fn) => (fn as jest.Mock).mockReset());
  base.get.mockReset();
  base.put.mockReset();
  env.USE_MOCKS = false;
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

/** Exécute une action qui, en mode simulé, attend 500 ms */
async function callWithDelay<T>(fn: () => Promise<T>) {
  jest.useFakeTimers();
  let pending!: Promise<T>;
  act(() => { pending = fn(); });
  let value!: T;
  await act(async () => { await jest.advanceTimersByTimeAsync(500); value = await pending; });
  jest.useRealTimers();
  return value;
}

describe('useGetUserProfile', () => {
  it('charge /users/profile et complète les valeurs manquantes', async () => {
    base.get.mockResolvedValueOnce({
      data: { id: 'u', firstname: 'A', lastname: 'B', email: 'e', phone: '+33', avatar_url: 'https://x/a.png', sports_preferences: ['golf'], stats: { sessionsCreated: 2, sessionsParticipated: 3, favoriteSport: 'golf' } },
    });
    const { result } = renderHook(() => useGetUserProfile());
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(base.get).toHaveBeenCalledWith('/users/profile');
    expect(result.current.data).toEqual({
      id: 'u', firstname: 'A', lastname: 'B', email: 'e', phone: '+33', avatar: 'https://x/a.png', sports_preferences: ['golf'],
      stats: { sessionsCreated: 2, sessionsParticipated: 3, favoriteSport: 'golf' },
    });

    base.get.mockResolvedValueOnce({ avatarUrl: '/storage/b.png' });
    await act(async () => { await result.current.refetch(); });
    expect(result.current.data).toEqual({
      id: '', firstname: '', lastname: '', email: '', phone: undefined, avatar: expect.stringMatching(/\/storage\/b\.png$/),
      sports_preferences: [], stats: { sessionsCreated: 0, sessionsParticipated: 0, favoriteSport: 'Aucun' },
    });
    base.get.mockResolvedValueOnce({ data: { avatar: 'file:///a.jpg' } });
    await act(async () => { await result.current.refetch(); });
    expect(result.current.data?.avatar).toBe('file:///a.jpg');
    base.get.mockResolvedValueOnce({ data: {} });
    await act(async () => { await result.current.refetch(); });
    expect(result.current.data?.avatar).toBeUndefined();
  });

  it('erreurs et mode simulé', async () => {
    base.get.mockRejectedValueOnce(new Error('panne'));
    const { result } = renderHook(() => useGetUserProfile());
    await waitFor(() => expect(result.current.error).toBe('panne'));
    base.get.mockRejectedValueOnce(null);
    await act(async () => { await result.current.refetch(); });
    expect(result.current.error).toBe('Erreur lors de la récupération du profil');
    env.USE_MOCKS = true;
    await act(async () => { await result.current.refetch(); });
    expect(result.current.data).toBe(mockUserProfile);
  });
});

describe('useGetUserById', () => {
  it('ID vide : rien', async () => {
    const { result } = renderHook(() => useGetUserById());
    await call(() => result.current.fetchUserById(''));
    expect(base.get).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('charge le profil d’un joueur, avec valeurs par défaut', async () => {
    base.get.mockResolvedValueOnce({
      data: { id: 'u2', firstname: 'Léa', lastname: 'M', email: 'l@m', avatar: 'a', stats: { sessionsCreated: 1, sessionsParticipated: 2 }, isAlreadyFriend: true, hasPendingRequest: true, relationshipStatus: 'friends' },
    });
    const { result } = renderHook(() => useGetUserById());
    await call(() => result.current.fetchUserById('u2'));
    expect(base.get).toHaveBeenCalledWith('/users/u2');
    expect(result.current.data).toEqual({
      id: 'u2', firstname: 'Léa', lastname: 'M', email: 'l@m', avatar: 'a', stats: { sessionsCreated: 1, sessionsParticipated: 2 },
      isAlreadyFriend: true, hasPendingRequest: true, relationshipStatus: 'friends',
    });
    base.get.mockResolvedValueOnce({});
    await call(() => result.current.fetchUserById('u3'));
    expect(result.current.data).toEqual({
      id: '', firstname: '', lastname: '', email: '', avatar: undefined, stats: { sessionsCreated: 0, sessionsParticipated: 0 },
      isAlreadyFriend: false, hasPendingRequest: false, relationshipStatus: 'none',
    });
  });

  it('erreurs et mode simulé', async () => {
    const { result } = renderHook(() => useGetUserById());
    base.get.mockRejectedValueOnce(new Error('404'));
    await call(() => result.current.fetchUserById('x'));
    expect(result.current.error).toBe('404');
    base.get.mockRejectedValueOnce(undefined);
    await call(() => result.current.fetchUserById('x'));
    expect(result.current.error).toBe('Erreur lors de la récupération du profil utilisateur');

    env.USE_MOCKS = true;
    await call(() => result.current.fetchUserById('2'));
    expect(result.current.data).toEqual(expect.objectContaining({ id: '2', firstname: 'Marie', relationshipStatus: 'none', isAlreadyFriend: false }));
    expect(result.current.data?.stats.sessionsCreated).toBeGreaterThanOrEqual(1);
    await call(() => result.current.fetchUserById('inconnu'));
    expect(result.current.error).toBe('Utilisateur non trouvé');
  });
});

describe('useGetUsers', () => {
  it('recherche vide au focus, erreurs et mode simulé', async () => {
    api.searchUsers.mockResolvedValueOnce([{ id: 'x' }] as any);
    const { result } = renderHook(() => useGetUsers());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(api.searchUsers).toHaveBeenCalledWith('');
    expect(result.current.data).toEqual([{ id: 'x' }]);
    api.searchUsers.mockRejectedValueOnce(new Error('panne'));
    await act(async () => { await result.current.refetch(); });
    expect(result.current.error).toBe('panne');
    api.searchUsers.mockRejectedValueOnce({});
    await act(async () => { await result.current.refetch(); });
    expect(result.current.error).toBe('Erreur lors du chargement des utilisateurs');
    env.USE_MOCKS = true;
    await act(async () => { await result.current.refetch(); });
    expect(result.current.data).toBe(mockUsers);
  });
});

describe('useSearchUsers', () => {
  const search = async (response: any, query = 'al') => {
    api.searchUsers.mockResolvedValueOnce(response);
    const { result } = renderHook(() => useSearchUsers());
    await call(() => result.current.searchUsers(query));
    return result;
  };

  it('requête vide : vide la liste sans appel', async () => {
    const { result } = renderHook(() => useSearchUsers());
    await call(() => result.current.searchUsers('   '));
    expect(result.current.data).toEqual([]);
    expect(api.searchUsers).not.toHaveBeenCalled();
  });

  it('format { success, data } avec relation', async () => {
    const result = await search({ success: true, data: [
      { id: '1', firstname: 'Al', lastname: 'B', email: 'e', avatar: 'a', relationship: { isFriend: true, hasPendingRequest: true, mutualFriends: 2, status: 'friends' } },
      { id: '2' },
    ] });
    expect(api.searchUsers).toHaveBeenCalledWith('al');
    expect(result.current.data).toEqual([
      { id: '1', firstname: 'Al', lastname: 'B', email: 'e', avatar: 'a', isFriend: true, hasPendingRequest: true, mutualFriends: 2, relationshipStatus: 'friends' },
      { id: '2', firstname: '', lastname: '', email: undefined, avatar: undefined, isFriend: false, hasPendingRequest: false, mutualFriends: 0, relationshipStatus: 'none' },
    ]);
  });

  it('tableau direct (champs à plat ou relation)', async () => {
    const result = await search([
      { id: '1', firstname: 'A', lastname: 'B', isFriend: true, hasPendingRequest: true, mutualFriends: 3 },
      { id: '2', relationship: { isFriend: true, hasPendingRequest: true, mutualFriends: 1, status: 'pending' } },
      { id: '3' },
    ]);
    expect(result.current.data).toEqual([
      expect.objectContaining({ id: '1', isFriend: true, hasPendingRequest: true, mutualFriends: 3, relationshipStatus: 'none' }),
      expect.objectContaining({ id: '2', firstname: '', isFriend: true, mutualFriends: 1, relationshipStatus: 'pending' }),
      expect.objectContaining({ id: '3', isFriend: false, hasPendingRequest: false, mutualFriends: 0 }),
    ]);
  });

  it('ancien format { data } avec full_name', async () => {
    const result = await search({ data: [
      { id: '1', full_name: 'Jean Paul Sartre', email: 'e', avatar: 'a', isFriend: true, hasPendingRequest: true },
      { id: '2' },
    ] });
    expect(result.current.data).toEqual([
      { id: '1', firstname: 'Jean', lastname: 'Paul Sartre', email: 'e', avatar: 'a', isFriend: true, hasPendingRequest: true },
      { id: '2', firstname: '', lastname: '', email: undefined, avatar: undefined, isFriend: false, hasPendingRequest: false },
    ]);
  });

  it('objet unique', async () => {
    const result = await search({ id: '9', firstname: 'Solo', isFriend: true });
    expect(result.current.data).toEqual([
      { id: '9', firstname: 'Solo', lastname: '', email: undefined, avatar: undefined, isFriend: true, hasPendingRequest: false, mutualFriends: 0 },
    ]);
    const full = await search({ id: '8', firstname: 'A', lastname: 'B', email: 'e', avatar: 'a', hasPendingRequest: true, mutualFriends: 4 });
    expect(full.current.data[0]).toEqual(expect.objectContaining({ lastname: 'B', hasPendingRequest: true, mutualFriends: 4 }));
  });

  it('format inconnu ou réponse vide : liste vide', async () => {
    expect((await search({ success: true, data: 'x' })).current.data).toEqual([]);
    expect((await search({ id: '1' })).current.data).toEqual([]);
    expect((await search(null)).current.data).toEqual([]);
    expect((await search('texte')).current.data).toEqual([]);
  });

  it('erreurs', async () => {
    const { result } = renderHook(() => useSearchUsers());
    api.searchUsers.mockRejectedValueOnce(new Error('panne'));
    await call(() => result.current.searchUsers('a'));
    expect(result.current.error).toBe('panne');
    api.searchUsers.mockRejectedValueOnce({});
    await call(() => result.current.searchUsers('a'));
    expect(result.current.error).toBe('Erreur lors de la recherche d\'utilisateurs');
    expect(result.current.isLoading).toBe(false);
  });

  it('mode simulé : filtre prénom, nom ou email, insensible à la casse', async () => {
    env.USE_MOCKS = true;
    const { result } = renderHook(() => useSearchUsers());
    await call(() => result.current.searchUsers('MARIE'));
    expect(result.current.data.map((u) => u.id)).toEqual(['2']);
    expect(result.current.data[0]).toEqual(expect.objectContaining({ isFriend: false, hasPendingRequest: false, email: 'marie.martin@example.com' }));
    await call(() => result.current.searchUsers('moreau'));
    expect(result.current.data.map((u) => u.id)).toEqual(['5']);
    await call(() => result.current.searchUsers('durand@'));
    expect(result.current.data.map((u) => u.id)).toEqual(['3']);
    await call(() => result.current.searchUsers('zzz'));
    expect(result.current.data).toEqual([]);
  });
});

describe('useUpdateUser', () => {
  it('API, erreurs et mode simulé', async () => {
    api.updateProfile.mockResolvedValueOnce({ id: 'u', firstname: 'N' } as any);
    const { result } = renderHook(() => useUpdateUser());
    expect((await call(() => result.current.updateUser({ firstname: 'N' }))).value).toEqual({ id: 'u', firstname: 'N' });
    expect(api.updateProfile).toHaveBeenCalledWith({ firstname: 'N' });
    expect(result.current.data).toEqual({ id: 'u', firstname: 'N' });
    api.updateProfile.mockRejectedValueOnce(new Error('non'));
    expect((await call(() => result.current.updateUser({}))).error.message).toBe('non');
    expect(result.current.error).toBe('non');
    api.updateProfile.mockRejectedValueOnce({});
    await call(() => result.current.updateUser({}));
    expect(result.current.error).toBe('Erreur lors de la mise à jour de l\'utilisateur');

    env.USE_MOCKS = true;
    expect((await call(() => result.current.updateUser({}))).value).toEqual({
      id: '1', firstname: 'Utilisateur', lastname: 'Test', email: 'user@test.com', avatar: undefined,
    });
    const full = { firstname: 'A', lastname: 'B', email: 'a@b', avatar: 'x' };
    expect((await call(() => result.current.updateUser(full))).value).toEqual({ id: '1', ...full });
  });
});

describe('email et mot de passe', () => {
  it.each([
    ['useUpdateEmail', useUpdateEmail, 'updateEmail', ['new@x', 'old@x'], 'Erreur lors de la mise à jour de l\'email'],
    ['useUpdatePassword', useUpdatePassword, 'updatePassword', ['ancien', 'nouveau'], 'Erreur lors de la mise à jour du mot de passe'],
  ] as const)('%s : succès, erreurs, mode simulé', async (_name, hook: any, method, args, fallback) => {
    (api as any)[method].mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => hook());
    await call(() => result.current[method](...args));
    expect((api as any)[method]).toHaveBeenCalledWith(...args);
    expect(result.current.success).toBe(true);
    expect(result.current.error).toBeNull();

    (api as any)[method].mockRejectedValueOnce(new Error('refus'));
    await call(() => result.current[method](...args));
    expect(result.current.success).toBe(false);
    expect(result.current.error).toBe('refus');
    (api as any)[method].mockRejectedValueOnce({});
    await call(() => result.current[method](...args));
    expect(result.current.error).toBe(fallback);

    env.USE_MOCKS = true;
    await callWithDelay(() => result.current[method](...args));
    expect(result.current.success).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect((api as any)[method]).toHaveBeenCalledTimes(3);
  });
});

describe('useDeleteAccount', () => {
  it('erreurs relayées et mode simulé', async () => {
    const { result } = renderHook(() => useDeleteAccount());
    api.deleteAccount.mockRejectedValueOnce(new Error('code invalide'));
    await call(() => result.current.deleteAccount());
    expect(result.current.error).toBe('code invalide');
    api.deleteAccount.mockRejectedValueOnce({});
    await call(() => result.current.deleteAccount());
    expect(result.current.error).toBe('Erreur lors de la suppression du compte');
    api.deleteAccount.mockResolvedValueOnce(undefined);
    await call(() => result.current.deleteAccount());
    expect(result.current.success).toBe(true);

    env.USE_MOCKS = true;
    await callWithDelay(() => result.current.deleteAccount());
    expect(result.current.success).toBe(true);
  });

  // BUG: services/users/deleteAccount.ts:19 appelle UsersApi.deleteAccount() sans le code SMS, alors que
  // UsersApi.deleteAccount(code) l'exige (erreur TypeScript TS2554, et le serveur reçoit un DELETE /users
  // sans `code`, donc refusé). Le hook n'est utilisé nulle part dans l'app (code mort), mais s'il l'était
  // la suppression échouerait toujours. Correctif : deleteAccount(code: string) → UsersApi.deleteAccount(code).
  it.skip('transmet le code SMS de confirmation à l’API', async () => {
    api.deleteAccount.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useDeleteAccount());
    await call(() => (result.current.deleteAccount as any)('123456'));
    expect(api.deleteAccount).toHaveBeenCalledWith('123456');
  });
});

describe('useUpdateSportsPreferences', () => {
  it('PUT des sports préférés ; succès → vrai', async () => {
    base.put.mockResolvedValueOnce({ success: true });
    const { result } = renderHook(() => useUpdateSportsPreferences());
    expect((await call(() => result.current.updateSportsPreferences(['golf'] as any))).value).toBe(true);
    expect(base.put).toHaveBeenCalledWith('/users/sports-preferences', { sports_preferences: ['golf'] });
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it.each([
    [() => Promise.resolve({ success: false }), 'Erreur lors de la mise à jour'],
    [() => Promise.reject({ response: { data: { message: 'invalide' } } }), 'invalide'],
    [() => Promise.reject(new Error('panne')), 'panne'],
    [() => Promise.reject(null), 'Erreur lors de la mise à jour des sports préférés'],
  ])('échec → faux avec message (%#)', async (impl, expected) => {
    base.put.mockImplementationOnce(impl);
    const { result } = renderHook(() => useUpdateSportsPreferences());
    expect((await call(() => result.current.updateSportsPreferences([]))).value).toBe(false);
    expect(result.current.error).toBe(expected);
  });

  it('mode simulé : vrai après 500 ms, sans appel', async () => {
    env.USE_MOCKS = true;
    const { result } = renderHook(() => useUpdateSportsPreferences());
    expect(await callWithDelay(() => result.current.updateSportsPreferences([]))).toBe(true);
    expect(base.put).not.toHaveBeenCalled();
  });
});
