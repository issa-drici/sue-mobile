/**
 * Services API par domaine (auth, sports, notifications, utilisateurs, sessions) : URL, méthode,
 * corps envoyé et mise en forme de la réponse. Le client HTTP de base est simulé.
 */
import { AuthApi } from '../authApi';
import { baseApiService } from '../baseApi';
import {
  AUTH_ENDPOINTS, FRIEND_REQUESTS_ENDPOINTS, NOTIFICATIONS_ENDPOINTS, SESSIONS_ENDPOINTS, SHARE_ENDPOINTS,
  SPORTS_ENDPOINTS, USERS_ENDPOINTS,
} from '../endpoints';
import { NotificationsApi } from '../notificationsApi';
import { SessionsApi } from '../sessionsApi';
import { SportsApi } from '../sportsApi';
import { UsersApi } from '../usersApi';

jest.mock('../baseApi', () => ({
  baseApiService: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    upload: jest.fn(),
  },
}));

const api = baseApiService as jest.Mocked<typeof baseApiService>;

let logSpy: jest.SpyInstance;
let errorSpy: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  logSpy.mockRestore();
  errorSpy.mockRestore();
});

describe('endpoints', () => {
  it('construit les chemins dynamiques', () => {
    expect(SESSIONS_ENDPOINTS.BY_ID('1')).toBe('/sessions/1');
    expect(SESSIONS_ENDPOINTS.UPDATE_COMMENT('1', '2')).toBe('/sessions/1/comments/2');
    expect(SESSIONS_ENDPOINTS.PROPOSED_SLOT('1', 's')).toBe('/sessions/1/slots/s');
    expect(SHARE_ENDPOINTS.RESOLVE_TOKEN('tok')).toBe('/join/tok');
    expect(USERS_ENDPOINTS.SEARCH('é a&b')).toBe('/users/search?q=%C3%A9%20a%26b');
    expect(FRIEND_REQUESTS_ENDPOINTS.RESPOND('r1')).toBe('/users/friend-requests/r1');
    expect(NOTIFICATIONS_ENDPOINTS.MARK_AS_READ('n1')).toBe('/notifications/n1/read');
  });
});

describe('AuthApi', () => {
  beforeEach(() => api.post.mockResolvedValue({ ok: true }));

  it('connexion, inscription, déconnexion, jeton, mot de passe oublié', async () => {
    await expect(AuthApi.login({ email: 'a', password: 'b' } as any)).resolves.toEqual({ ok: true });
    expect(api.post).toHaveBeenLastCalledWith(AUTH_ENDPOINTS.LOGIN, { email: 'a', password: 'b' });
    await AuthApi.register({ email: 'a' } as any);
    expect(api.post).toHaveBeenLastCalledWith(AUTH_ENDPOINTS.REGISTER, { email: 'a' });
    await AuthApi.logout();
    expect(api.post).toHaveBeenLastCalledWith(AUTH_ENDPOINTS.LOGOUT, {});
    await AuthApi.refreshToken();
    expect(api.post).toHaveBeenLastCalledWith(AUTH_ENDPOINTS.REFRESH_TOKEN, {});
    await AuthApi.forgotPassword('a@b.c');
    expect(api.post).toHaveBeenLastCalledWith(AUTH_ENDPOINTS.FORGOT_PASSWORD, { email: 'a@b.c' });
  });

  it('auth par téléphone : code, vérification, création du profil', async () => {
    await AuthApi.sendPhoneOtp('+33600000000');
    expect(api.post).toHaveBeenLastCalledWith(AUTH_ENDPOINTS.PHONE_SEND_OTP, { phone: '+33600000000' });
    await AuthApi.verifyPhoneOtp('+33600000000', '123456');
    expect(api.post).toHaveBeenLastCalledWith(AUTH_ENDPOINTS.PHONE_VERIFY, {
      phone: '+33600000000', code: '123456', device_name: 'SUE Mobile App',
    });
    await AuthApi.registerPhone('+33600000000', 'Alex', 'Martin');
    expect(api.post).toHaveBeenLastCalledWith(AUTH_ENDPOINTS.PHONE_REGISTER, {
      phone: '+33600000000', firstname: 'Alex', lastname: 'Martin', device_name: 'SUE Mobile App',
    });
  });
});

describe('SportsApi', () => {
  it('renvoie la liste, ou un tableau vide sans données', async () => {
    api.get.mockResolvedValueOnce({ data: ['tennis'] });
    await expect(SportsApi.getAll()).resolves.toEqual(['tennis']);
    expect(api.get).toHaveBeenLastCalledWith(SPORTS_ENDPOINTS.ALL);
    api.get.mockResolvedValueOnce({});
    await expect(SportsApi.getAll()).resolves.toEqual([]);
  });

  it('sports joués par l’utilisateur', async () => {
    api.get.mockResolvedValueOnce({ data: [{ sport: 'padel', count: 3 }] });
    await expect(SportsApi.getPlayedByUser()).resolves.toEqual([{ sport: 'padel', count: 3 }]);
    expect(api.get).toHaveBeenLastCalledWith(SPORTS_ENDPOINTS.PLAYED_BY_USER);
    api.get.mockResolvedValueOnce({ data: null });
    await expect(SportsApi.getPlayedByUser()).resolves.toEqual([]);
  });
});

describe('NotificationsApi', () => {
  const raw = {
    id: 'n1', user_id: 'u', type: 'reminder', title: 'T', message: 'M', session_id: 's1',
    created_at: '2026-01-01', read: false, push_sent: true, push_sent_at: null, push_data: { a: 1 },
  };

  it('getAll : convertit les notifications et garde la pagination', async () => {
    api.get.mockResolvedValueOnce({ data: [raw], pagination: { page: 2 } });
    const result = await NotificationsApi.getAll(2, 10);
    expect(api.get).toHaveBeenCalledWith('/notifications?page=2&limit=10');
    expect(result).toEqual({
      data: [{
        id: 'n1', type: 'reminder', title: 'T', message: 'M', sessionId: 's1', createdAt: '2026-01-01',
        read: false, isRead: false, data: { a: 1 },
      }],
      pagination: { page: 2 },
    });
  });

  it('getAll : accepte un objet à clés numériques, valeurs par défaut', async () => {
    api.get.mockResolvedValueOnce({ data: { 0: { ...raw, session_id: null, push_data: null } } });
    const result = await NotificationsApi.getAll();
    expect(api.get).toHaveBeenCalledWith('/notifications?page=1&limit=20');
    expect(result.data[0]).toEqual(expect.objectContaining({ sessionId: '', data: {} }));
    expect(result.pagination).toEqual({});
  });

  it('marquer lu, tout marquer lu, supprimer', async () => {
    api.patch.mockResolvedValue({ data: 'ok' });
    api.delete.mockResolvedValue({ data: undefined });
    await expect(NotificationsApi.markAsRead('n1')).resolves.toBe('ok');
    expect(api.patch).toHaveBeenLastCalledWith(NOTIFICATIONS_ENDPOINTS.MARK_AS_READ('n1'), {});
    await NotificationsApi.markAllAsRead();
    expect(api.patch).toHaveBeenLastCalledWith(NOTIFICATIONS_ENDPOINTS.MARK_ALL_AS_READ, {});
    await NotificationsApi.delete('n1');
    expect(api.delete).toHaveBeenLastCalledWith(NOTIFICATIONS_ENDPOINTS.DELETE('n1'));
  });

  it('jetons push et compteur de non lues', async () => {
    api.post.mockResolvedValueOnce({ data: 'r' });
    await expect(NotificationsApi.registerPushToken({ token: 'x' })).resolves.toBe('r');
    expect(api.post).toHaveBeenLastCalledWith(NOTIFICATIONS_ENDPOINTS.PUSH_TOKENS, { token: 'x' });
    api.delete.mockResolvedValueOnce({ data: 'd' });
    await expect(NotificationsApi.deletePushToken('x')).resolves.toBe('d');
    expect(api.delete).toHaveBeenLastCalledWith('/push-tokens/x');
    api.get.mockResolvedValueOnce({ data: { unreadCount: 4 } });
    await expect(NotificationsApi.getUnreadCount()).resolves.toBe(4);
    expect(api.get).toHaveBeenLastCalledWith(NOTIFICATIONS_ENDPOINTS.UNREAD_COUNT);
  });
});

describe('UsersApi', () => {
  describe('updateAvatar', () => {
    let appendSpy: jest.SpyInstance;
    beforeEach(() => {
      appendSpy = jest.spyOn(FormData.prototype, 'append');
      api.upload.mockResolvedValue({ avatar_url: 'https://x/a.png' });
    });
    afterEach(() => appendSpy.mockRestore());

    it.each([
      ['file:///tmp/photo.PNG', 'photo.PNG', 'image/png'],
      ['file:///tmp/anim.gif', 'anim.gif', 'image/gif'],
      ['file:///tmp/pic.heic', 'pic.heic', 'image/jpeg'],
      ['file:///tmp/sansextension', 'sansextension', 'image/jpeg'],
    ])('%s → %s (%s)', async (uri, name, type) => {
      await expect(UsersApi.updateAvatar(uri)).resolves.toEqual({ avatar_url: 'https://x/a.png' });
      expect(appendSpy).toHaveBeenCalledWith('avatar', { uri, name, type });
      expect(api.upload).toHaveBeenCalledWith(USERS_ENDPOINTS.PROFILE_AVATAR, expect.any(FormData), 'POST');
    });

    it('URI se terminant par « / » : nom généré', async () => {
      await UsersApi.updateAvatar('file:///tmp/');
      expect(appendSpy).toHaveBeenCalledWith('avatar', expect.objectContaining({ name: expect.stringMatching(/^avatar_\d+\.jpg$/), type: 'image/jpeg' }));
    });
  });

  it('checkContacts : renvoie data, sinon la réponse brute, et relaie les erreurs', async () => {
    api.post.mockResolvedValueOnce({ data: { matches: [] } });
    await expect(UsersApi.checkContacts(['+33600000000'])).resolves.toEqual({ matches: [] });
    expect(api.post).toHaveBeenLastCalledWith(USERS_ENDPOINTS.CHECK_CONTACTS, { phoneNumbers: ['+33600000000'] });
    api.post.mockResolvedValueOnce({ other: 1 });
    await expect(UsersApi.checkContacts([])).resolves.toEqual({ other: 1 });
    const err: any = new Error('boom');
    err.response = { data: 'x' };
    api.post.mockRejectedValueOnce(err);
    await expect(UsersApi.checkContacts([])).rejects.toThrow('boom');
  });

  it('profil : lecture et mise à jour', async () => {
    api.get.mockResolvedValueOnce({ data: { id: 'u' } });
    await expect(UsersApi.getProfile()).resolves.toEqual({ id: 'u' });
    expect(api.get).toHaveBeenLastCalledWith(USERS_ENDPOINTS.PROFILE);
    api.put.mockResolvedValueOnce({ data: { id: 'u', firstname: 'A' } });
    await expect(UsersApi.updateProfile({ firstname: 'A' } as any)).resolves.toEqual({ id: 'u', firstname: 'A' });
    expect(api.put).toHaveBeenLastCalledWith(USERS_ENDPOINTS.PROFILE, { firstname: 'A' });
  });

  it('amis et demandes : tableau vide par défaut', async () => {
    api.get.mockResolvedValueOnce({ data: [{ id: 'f' }] });
    await expect(UsersApi.getFriends()).resolves.toEqual([{ id: 'f' }]);
    api.get.mockResolvedValueOnce({});
    await expect(UsersApi.getFriends()).resolves.toEqual([]);
    api.get.mockResolvedValueOnce({ data: [{ id: 'r' }] });
    await expect(UsersApi.getFriendRequests()).resolves.toEqual([{ id: 'r' }]);
    expect(api.get).toHaveBeenLastCalledWith(USERS_ENDPOINTS.FRIEND_REQUESTS);
    api.get.mockResolvedValueOnce({});
    await expect(UsersApi.getFriendRequests()).resolves.toEqual([]);
  });

  it('sendFriendRequest : valide l’ID, envoie userId, relaie les erreurs', async () => {
    await expect(UsersApi.sendFriendRequest('')).rejects.toThrow('ID utilisateur invalide');
    await expect(UsersApi.sendFriendRequest('   ')).rejects.toThrow('ID utilisateur invalide');
    expect(api.post).not.toHaveBeenCalled();
    api.post.mockResolvedValueOnce({ data: { id: 'req' } });
    await expect(UsersApi.sendFriendRequest('u2')).resolves.toEqual({ id: 'req' });
    expect(api.post).toHaveBeenLastCalledWith(USERS_ENDPOINTS.FRIEND_REQUESTS, { userId: 'u2' });
    api.post.mockRejectedValueOnce(new Error('déjà amis'));
    await expect(UsersApi.sendFriendRequest('u2')).rejects.toThrow('déjà amis');
  });

  it('répondre, annuler, retirer un ami, rechercher', async () => {
    api.patch.mockResolvedValueOnce({ data: { id: 'r1', status: 'accepted' } });
    await expect(UsersApi.respondToFriendRequest('r1', 'accept')).resolves.toEqual({ id: 'r1', status: 'accepted' });
    expect(api.patch).toHaveBeenLastCalledWith(FRIEND_REQUESTS_ENDPOINTS.RESPOND('r1'), { response: 'accept' });
    api.delete.mockResolvedValueOnce({ data: undefined });
    await UsersApi.cancelFriendRequest('u3');
    expect(api.delete).toHaveBeenLastCalledWith(FRIEND_REQUESTS_ENDPOINTS.CANCEL, { target_user_id: 'u3' });
    api.delete.mockResolvedValueOnce({ data: undefined });
    await UsersApi.removeFriend('f1');
    expect(api.delete).toHaveBeenLastCalledWith(USERS_ENDPOINTS.REMOVE_FRIEND('f1'));
    api.get.mockResolvedValueOnce({ data: [{ id: 'x' }] });
    await expect(UsersApi.searchUsers('al')).resolves.toEqual([{ id: 'x' }]);
    expect(api.get).toHaveBeenLastCalledWith(USERS_ENDPOINTS.SEARCH('al'));
    api.get.mockResolvedValueOnce({});
    await expect(UsersApi.searchUsers('al')).resolves.toEqual([]);
  });

  it('email, mot de passe, suppression du compte', async () => {
    api.post.mockResolvedValue({ data: undefined });
    api.delete.mockResolvedValue({ data: undefined });
    await UsersApi.updateEmail('new@x', 'old@x');
    expect(api.post).toHaveBeenLastCalledWith(USERS_ENDPOINTS.UPDATE_EMAIL, { newEmail: 'new@x', currentEmail: 'old@x' });
    await UsersApi.updatePassword('a', 'b');
    expect(api.post).toHaveBeenLastCalledWith(USERS_ENDPOINTS.UPDATE_PASSWORD, { currentPassword: 'a', newPassword: 'b' });
    await UsersApi.deleteAccount('123456');
    expect(api.delete).toHaveBeenLastCalledWith(USERS_ENDPOINTS.DELETE_ACCOUNT, { code: '123456' });
  });

  it('changement de numéro en plusieurs étapes', async () => {
    api.post.mockResolvedValue({});
    await UsersApi.sendAccountCode();
    expect(api.post).toHaveBeenLastCalledWith(USERS_ENDPOINTS.SEND_ACCOUNT_CODE, {});
    await UsersApi.verifyCurrentPhone('111111');
    expect(api.post).toHaveBeenLastCalledWith(USERS_ENDPOINTS.VERIFY_CURRENT_PHONE, { code: '111111' });
    await UsersApi.sendNewPhoneCode('+33700000000');
    expect(api.post).toHaveBeenLastCalledWith(USERS_ENDPOINTS.SEND_NEW_PHONE_CODE, { phone: '+33700000000' });
    api.post.mockResolvedValueOnce({ phone: '+33700000000' });
    await expect(UsersApi.confirmNewPhone('+33700000000', '222222')).resolves.toBe('+33700000000');
    expect(api.post).toHaveBeenLastCalledWith(USERS_ENDPOINTS.CONFIRM_NEW_PHONE, { phone: '+33700000000', code: '222222' });
  });

  it('compteur de demandes d’amis (0 par défaut)', async () => {
    api.get.mockResolvedValueOnce({ data: { count: 5 } });
    await expect(UsersApi.getFriendRequestsCount()).resolves.toBe(5);
    expect(api.get).toHaveBeenLastCalledWith(FRIEND_REQUESTS_ENDPOINTS.COUNT);
    api.get.mockResolvedValueOnce({ data: {} });
    await expect(UsersApi.getFriendRequestsCount()).resolves.toBe(0);
  });
});

describe('SessionsApi', () => {
  it('listes : tableau vide par défaut', async () => {
    for (const [fn, endpoint] of [
      [SessionsApi.getAll, SESSIONS_ENDPOINTS.ALL],
      [SessionsApi.getMyCreated, SESSIONS_ENDPOINTS.MY_CREATED],
      [SessionsApi.getMyParticipations, SESSIONS_ENDPOINTS.MY_PARTICIPATIONS],
    ] as const) {
      api.get.mockResolvedValueOnce({ data: [{ id: '1' }] });
      await expect(fn()).resolves.toEqual([{ id: '1' }]);
      expect(api.get).toHaveBeenLastCalledWith(endpoint);
      api.get.mockResolvedValueOnce({});
      await expect(fn()).resolves.toEqual([]);
    }
  });

  it('getById, create, update, delete', async () => {
    api.get.mockResolvedValueOnce({ data: { id: 's1' } });
    await expect(SessionsApi.getById('s1')).resolves.toEqual({ id: 's1' });
    expect(api.get).toHaveBeenLastCalledWith('/sessions/s1');

    const data = { title: 'tennis', date: '2026-01-01', startTime: '18:00', endTime: '19:00' } as any;
    api.post.mockResolvedValueOnce({ data: { id: 's2', startTime: '18:00', endTime: '19:00' } });
    await expect(SessionsApi.create(data)).resolves.toEqual({ id: 's2', startTime: '18:00', endTime: '19:00' });
    expect(api.post).toHaveBeenLastCalledWith(SESSIONS_ENDPOINTS.ALL, data);
    api.post.mockResolvedValueOnce({});
    await expect(SessionsApi.create(data)).resolves.toBeUndefined();

    api.put.mockResolvedValueOnce({ data: { id: 's1' } });
    await SessionsApi.update('s1', { location: 'L' } as any);
    expect(api.put).toHaveBeenLastCalledWith('/sessions/s1', { location: 'L' });

    api.delete.mockResolvedValueOnce({ data: undefined });
    await SessionsApi.delete('s1');
    expect(api.delete).toHaveBeenLastCalledWith('/sessions/s1');
  });

  it('invitations et annulations', async () => {
    api.patch.mockResolvedValue({ data: { id: 's1' } });
    api.post.mockResolvedValue({ data: { invited: 2 } });
    await SessionsApi.respondToInvitation('s1', 'decline');
    expect(api.patch).toHaveBeenLastCalledWith('/sessions/s1/respond', { response: 'decline' });
    await SessionsApi.cancelParticipation('s1');
    expect(api.patch).toHaveBeenLastCalledWith('/sessions/s1/cancel-participation', { status: 'declined' });
    await SessionsApi.cancelSession('s1');
    expect(api.patch).toHaveBeenLastCalledWith('/sessions/s1/cancel', { status: 'cancelled' });
    await expect(SessionsApi.inviteFriends('s1', ['a', 'b'])).resolves.toEqual({ invited: 2 });
    expect(api.post).toHaveBeenLastCalledWith('/sessions/s1/invite', { userIds: ['a', 'b'] });
    await SessionsApi.changeOrganizer('s1', 'u9');
    expect(api.patch).toHaveBeenLastCalledWith('/sessions/s1/change-organizer', { newOrganizerId: 'u9' });
  });

  it('commentaires', async () => {
    api.post.mockResolvedValue({ data: { id: 'c' } });
    api.get.mockResolvedValue({ data: { comments: [] } });
    api.put.mockResolvedValue({ data: { id: 'c' } });
    api.delete.mockResolvedValue({ data: undefined });
    await SessionsApi.addComment('s1', 'Salut');
    expect(api.post).toHaveBeenLastCalledWith('/sessions/s1/comments', { content: 'Salut' });
    await SessionsApi.getComments('s1');
    expect(api.get).toHaveBeenLastCalledWith('/sessions/s1/comments?page=1&limit=20');
    await SessionsApi.getComments('s1', 3, 5);
    expect(api.get).toHaveBeenLastCalledWith('/sessions/s1/comments?page=3&limit=5');
    await SessionsApi.createComment('s1', { content: 'x' } as any);
    expect(api.post).toHaveBeenLastCalledWith('/sessions/s1/comments', { content: 'x' });
    await SessionsApi.updateComment('s1', 'c', { content: 'y' } as any);
    expect(api.put).toHaveBeenLastCalledWith('/sessions/s1/comments/c', { content: 'y' });
    await SessionsApi.deleteComment('s1', 'c');
    expect(api.delete).toHaveBeenLastCalledWith('/sessions/s1/comments/c');
  });

  it('présence', async () => {
    api.post.mockResolvedValue({ data: 'p' });
    api.get.mockResolvedValue({ data: { users: [] } });
    await expect(SessionsApi.joinPresence('s1')).resolves.toBe('p');
    expect(api.post).toHaveBeenLastCalledWith('/sessions/s1/presence/join', {});
    await SessionsApi.leavePresence('s1');
    expect(api.post).toHaveBeenLastCalledWith('/sessions/s1/presence/leave', {});
    await SessionsApi.sendTyping('s1', { isTyping: true } as any);
    expect(api.post).toHaveBeenLastCalledWith('/sessions/s1/presence/typing', { isTyping: true });
    await expect(SessionsApi.getPresenceUsers('s1')).resolves.toEqual({ users: [] });
    expect(api.get).toHaveBeenLastCalledWith('/sessions/s1/presence/users');
  });

  it('liens de partage : avec et sans « from »', async () => {
    api.get.mockResolvedValue({ data: { title: 'x' } });
    api.post.mockResolvedValue({ data: { id: 's1' } });
    await SessionsApi.resolveShareToken('tok');
    expect(api.get).toHaveBeenLastCalledWith('/join/tok');
    await SessionsApi.resolveShareToken('tok', 'u 1');
    expect(api.get).toHaveBeenLastCalledWith('/join/tok?from=u%201');
    await SessionsApi.joinByShareToken('tok');
    expect(api.post).toHaveBeenLastCalledWith('/join/tok', {});
    await SessionsApi.joinByShareToken('tok', 'u1');
    expect(api.post).toHaveBeenLastCalledWith('/join/tok', { from: 'u1' });
  });

  it('trouver un créneau', async () => {
    api.put.mockResolvedValue({ data: { id: 's1' } });
    api.post.mockResolvedValue({ data: { id: 's1' } });
    api.delete.mockResolvedValue({ data: { id: 's1' } });
    const slot = { date: '2026-01-01', startTime: '10:00', endTime: '11:00' };
    await SessionsApi.setSlotAvailability('s1', ['a']);
    expect(api.put).toHaveBeenLastCalledWith('/sessions/s1/availability', { slotIds: ['a'] });
    await SessionsApi.confirmSlot('s1', 'a');
    expect(api.post).toHaveBeenLastCalledWith('/sessions/s1/confirm-slot', { slotId: 'a' });
    await SessionsApi.updateSlots('s1', [slot]);
    expect(api.put).toHaveBeenLastCalledWith('/sessions/s1/slots', { slots: [slot] });
    await SessionsApi.proposeSlot('s1', slot);
    expect(api.post).toHaveBeenLastCalledWith('/sessions/s1/slots/propose', slot);
    await expect(SessionsApi.removeProposedSlot('s1', 'a')).resolves.toEqual({ id: 's1' });
    expect(api.delete).toHaveBeenLastCalledWith('/sessions/s1/slots/a');
  });
});
