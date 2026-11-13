/**
 * Client HTTP de base : en-têtes, jeton, endpoints publics, extraction des messages d'erreur,
 * upload multipart et mode simulé (mocks).
 */
import { buildApiUrl, ENV } from '../../../config/env';
import { ApiError, baseApiService, isNonRetryableError } from '../baseApi';

const fetchMock = global.fetch as jest.Mock;

const ok = (body: unknown, status = 200) => ({ ok: true, status, json: async () => body });
const fail = (status: number, body?: unknown) => ({
  ok: false,
  status,
  json: body === undefined ? async () => { throw new Error('pas de JSON'); } : async () => body,
});

let errorSpy: jest.SpyInstance;
let warnSpy: jest.SpyInstance;

beforeEach(() => {
  fetchMock.mockReset();
  baseApiService.clearAuthToken();
  baseApiService.setUseMocks(false);
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  jest.useRealTimers();
  errorSpy.mockRestore();
  warnSpy.mockRestore();
});

describe('jeton et configuration', () => {
  it('garde, renvoie puis efface le jeton', () => {
    expect(baseApiService.getAuthToken()).toBeNull();
    baseApiService.setAuthToken('abc');
    expect(baseApiService.getAuthToken()).toBe('abc');
    baseApiService.clearAuthToken();
    expect(baseApiService.getAuthToken()).toBeNull();
  });

  it('décrit sa configuration', () => {
    baseApiService.setUseMocks(true);
    expect(baseApiService.getConfig()).toEqual({
      baseURL: ENV.API_BASE_URL,
      useMocks: true,
      environment: ENV.ENVIRONMENT,
      isDevelopment: expect.any(Boolean),
    });
  });

  it('401 : signale le jeton refusé une seule fois, réarmé par resetUnauthorized ou un nouveau jeton', async () => {
    const report = jest.fn();
    baseApiService.setLogoutCallback(report);
    baseApiService.setAuthToken('t');
    fetchMock.mockResolvedValue(fail(401, { message: 'Unauthenticated.' }));
    const error = await baseApiService.get('/users/profile').catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ message: 'Unauthenticated.', status: 401 });
    await baseApiService.get('/sessions').catch(() => {});
    await baseApiService.get('/notifications').catch(() => {});
    expect(report).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('401'));

    baseApiService.resetUnauthorized();
    await baseApiService.get('/sessions').catch(() => {});
    expect(report).toHaveBeenCalledTimes(2);

    baseApiService.setAuthToken('t2');
    await baseApiService.get('/sessions').catch(() => {});
    expect(report).toHaveBeenCalledTimes(3);
    baseApiService.clearAuthToken();
  });

  it('401 sur un endpoint public (connexion, aperçu de lien) : pas de signalement', async () => {
    const report = jest.fn();
    baseApiService.setLogoutCallback(report);
    baseApiService.setAuthToken('t');
    fetchMock.mockResolvedValue(fail(401, { message: 'Code invalide' }));
    await baseApiService.post('/auth/phone/verify', {}).catch(() => {});
    await baseApiService.get('/join/abc').catch(() => {});
    expect(report).not.toHaveBeenCalled();
    baseApiService.clearAuthToken();
  });

  it('isNonRetryableError : refus définitifs seulement', () => {
    expect(isNonRetryableError(new ApiError('x', 401))).toBe(true);
    expect(isNonRetryableError(new ApiError('x', 422))).toBe(true);
    expect(isNonRetryableError(new ApiError('x', 429))).toBe(false);
    expect(isNonRetryableError(new ApiError('x', 408))).toBe(false);
    expect(isNonRetryableError(new ApiError('x', 500))).toBe(false);
    expect(isNonRetryableError(new Error('Network request failed'))).toBe(false);
    expect(isNonRetryableError(null)).toBe(false);
  });
});

describe('requêtes authentifiées', () => {
  it('refuse un endpoint privé sans jeton, sans appel réseau', async () => {
    await expect(baseApiService.get('/sessions')).rejects.toThrow('Authentification requise pour accéder à cette ressource');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('GET avec en-têtes JSON et Authorization', async () => {
    baseApiService.setAuthToken('jeton');
    fetchMock.mockResolvedValueOnce(ok({ data: [1] }));
    await expect(baseApiService.get('/sessions')).resolves.toEqual({ data: [1] });
    expect(fetchMock).toHaveBeenCalledWith(buildApiUrl('/sessions'), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: 'Bearer jeton' },
    });
  });

  it.each([
    ['post', 'POST'],
    ['put', 'PUT'],
    ['patch', 'PATCH'],
  ] as const)('%s envoie le corps en JSON', async (method, verb) => {
    baseApiService.setAuthToken('jeton');
    fetchMock.mockResolvedValueOnce(ok({ success: true }));
    await (baseApiService as any)[method]('/x', { a: 1 });
    expect(fetchMock).toHaveBeenCalledWith(buildApiUrl('/x'), expect.objectContaining({ method: verb, body: '{"a":1}' }));
  });

  it('DELETE sans corps, puis avec corps', async () => {
    baseApiService.setAuthToken('jeton');
    fetchMock.mockResolvedValue(ok({}));
    await baseApiService.delete('/x');
    expect(fetchMock.mock.calls[0][1]).toEqual(expect.objectContaining({ method: 'DELETE' }));
    expect(fetchMock.mock.calls[0][1].body).toBeUndefined();
    await baseApiService.delete('/x', { id: 2 });
    expect(fetchMock.mock.calls[1][1].body).toBe('{"id":2}');
  });
});

describe('endpoints publics', () => {
  it.each([
    '/login', '/register', '/refresh', '/password/reset', '/forgot-password', '/verify-email',
    '/resend-verification', '/join/abc', '/auth/phone/send-otp',
  ])('%s passe sans jeton (et sans Authorization)', async (endpoint) => {
    fetchMock.mockResolvedValueOnce(ok({ ok: 1 }));
    await expect(baseApiService.post(endpoint, {})).resolves.toEqual({ ok: 1 });
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it('garde le jeton sur un endpoint public s’il existe', async () => {
    baseApiService.setAuthToken('t');
    fetchMock.mockResolvedValueOnce(ok({}));
    await baseApiService.get('/join/abc');
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer t');
  });
});

describe('messages d’erreur', () => {
  beforeEach(() => baseApiService.setAuthToken('t'));

  it.each([
    [{ message: 'Message direct' }, 'Message direct'],
    [{ error: { message: 'Message imbriqué' } }, 'Message imbriqué'],
    [{ error: 'Erreur texte' }, 'Erreur texte'],
    [{ error: { code: 'X' } }, '{"code":"X"}'],
    [{ detail: 'Détail' }, 'Détail'],
    [{}, 'HTTP error! status: 500'],
  ])('%j → « %s »', async (body, expected) => {
    fetchMock.mockResolvedValueOnce(fail(500, body));
    await expect(baseApiService.get('/x')).rejects.toThrow(expected);
  });

  it('réponse d’erreur sans JSON : message HTTP générique', async () => {
    fetchMock.mockResolvedValueOnce(fail(502));
    await expect(baseApiService.get('/x')).rejects.toThrow('HTTP error! status: 502');
  });

  it('403 : action interdite, jamais de signalement de déconnexion', async () => {
    const report = jest.fn();
    baseApiService.setLogoutCallback(report);
    fetchMock.mockResolvedValueOnce(fail(403, { message: 'Interdit' }));
    const error = await baseApiService.get('/x').catch((e) => e);
    expect(error).toMatchObject({ message: 'Interdit', status: 403 });
    expect(report).not.toHaveBeenCalled();
  });

  it('erreur réseau : relayée telle quelle', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network request failed'));
    await expect(baseApiService.get('/x')).rejects.toThrow('Network request failed');
  });
});

describe('upload multipart', () => {
  it('POST sans Content-Type, avec Accept et Authorization', async () => {
    baseApiService.setAuthToken('t');
    const form = new FormData();
    fetchMock.mockResolvedValueOnce(ok({ avatar_url: 'u' }));
    await expect(baseApiService.upload('/profile/avatar', form)).resolves.toEqual({ avatar_url: 'u' });
    expect(fetchMock).toHaveBeenCalledWith(buildApiUrl('/profile/avatar'), {
      method: 'POST',
      headers: { Accept: 'application/json', Authorization: 'Bearer t' },
      body: form,
    });
  });

  it('PUT sans jeton : pas d’Authorization', async () => {
    fetchMock.mockResolvedValueOnce(ok({}));
    await baseApiService.upload('/u', new FormData(), 'PUT');
    expect(fetchMock.mock.calls[0][1]).toEqual(expect.objectContaining({ method: 'PUT', headers: { Accept: 'application/json' } }));
  });

  it.each([
    [{ message: 'Trop gros' }, 'Trop gros'],
    [{ error: { message: 'Format' } }, 'Format'],
    [{ error: 'Texte' }, 'Texte'],
    [{ error: { code: 1 } }, 'HTTP error! status: 422'],
  ])('erreur %j → « %s »', async (body, expected) => {
    fetchMock.mockResolvedValueOnce(fail(422, body));
    await expect(baseApiService.upload('/u', new FormData())).rejects.toThrow(expected);
  });

  it('erreur sans JSON : message générique', async () => {
    fetchMock.mockResolvedValueOnce(fail(401));
    await expect(baseApiService.upload('/u', new FormData())).rejects.toThrow('HTTP error! status: 401');
  });

  it('en mode mock : passe par la simulation', async () => {
    jest.useFakeTimers();
    baseApiService.setUseMocks(true);
    const promise = baseApiService.upload('/profile/avatar', new FormData());
    const assertion = expect(promise).rejects.toThrow('Endpoint non implémenté en mode mock: /profile/avatar');
    await jest.advanceTimersByTimeAsync(500);
    await assertion;
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('mode simulé (mocks)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    baseApiService.setUseMocks(true);
  });

  /** Lance la requête et avance le faux délai réseau de 500 ms */
  async function run<T>(promise: Promise<T>) {
    const settled = promise.then((value) => ({ value }), (error) => ({ error }));
    await jest.advanceTimersByTimeAsync(500);
    return settled as Promise<{ value?: any; error?: Error }>;
  }

  it('inscription réussie', async () => {
    const { value } = await run(baseApiService.post('/register', { firstname: 'A', lastname: 'B', email: 'a@b.c', password: 'secret1' }));
    expect(value.success).toBe(true);
    expect(value.data.user).toEqual(expect.objectContaining({ email: 'a@b.c', firstname: 'A', lastname: 'B' }));
    expect(value.data.token).toMatch(/^mock-jwt-token-/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('inscription : champs manquants', async () => {
    const { error } = await run(baseApiService.post('/register', { firstname: 'A' }));
    expect(error?.message).toBe('Tous les champs sont requis');
  });

  it('inscription : mot de passe trop court', async () => {
    const { error } = await run(baseApiService.post('/register', { firstname: 'A', lastname: 'B', email: 'e', password: '123' }));
    expect(error?.message).toBe('Le mot de passe doit contenir au moins 6 caractères');
  });

  it('connexion réussie puis identifiants manquants', async () => {
    const { value } = await run(baseApiService.post('/login', { email: 'x@y.z', password: 'p' }));
    expect(value.data.user.email).toBe('x@y.z');
    const { error } = await run(baseApiService.post('/login', { email: 'x@y.z' }));
    expect(error?.message).toBe('Email et mot de passe requis');
  });

  it('déconnexion et rafraîchissement du jeton', async () => {
    expect((await run(baseApiService.post('/logout', {}))).value).toEqual({ success: true, message: 'Déconnexion réussie' });
    const { value } = await run(baseApiService.post('/refresh', {}));
    expect(value.data.token).toMatch(/^mock-jwt-token-refreshed-/);
  });

  it('annulation de demande d’ami', async () => {
    const { value } = await run(baseApiService.delete('/users/friend-requests', { target_user_id: '42' }));
    expect(value.data).toEqual(expect.objectContaining({ receiverId: '42', status: 'cancelled' }));
    const { error } = await run(baseApiService.delete('/users/friend-requests'));
    expect(error?.message).toBe('L\'ID de l\'utilisateur cible est requis');
  });

  it('endpoint inconnu : erreur explicite (même sans jeton)', async () => {
    const { error } = await run(baseApiService.get('/sessions'));
    expect(error?.message).toBe('Endpoint non implémenté en mode mock: /sessions');
  });
});
