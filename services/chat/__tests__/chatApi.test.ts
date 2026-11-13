/**
 * API du chat : URL et méthodes, jeton, erreurs avec code HTTP (renvoi possible ou non), délai dépassé.
 */
import { ENV } from '../../../config/env';
import { baseApiService } from '../../api/baseApi';
import { backendRootUrl, chatApi, ChatApiError, newClientId } from '../chatApi';

const fetchMock = global.fetch as jest.Mock;
const ok = (data: unknown) => ({ ok: true, status: 200, json: async () => ({ data }) });
const base = () => ENV.API_BASE_URL;

beforeEach(() => {
  fetchMock.mockReset();
  baseApiService.clearAuthToken();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('ChatApiError.retryable', () => {
  it.each([
    [0, true], [408, true], [429, true], [500, true], [503, true],
    [400, false], [401, false], [403, false], [422, false],
  ])('statut %i → %s', (status, expected) => {
    const error = new ChatApiError('x', status);
    expect(error.retryable).toBe(expected);
    expect(error.status).toBe(status);
    expect(error.message).toBe('x');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('backendRootUrl', () => {
  it('retire le suffixe /api de la base', () => {
    expect(backendRootUrl()).toBe(base().replace(/\/api\/?$/, ''));
    expect(backendRootUrl().endsWith('/api')).toBe(false);
  });

  it('force HTTPS en production', () => {
    const previous = process.env.NODE_ENV;
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    try {
      expect(backendRootUrl().startsWith('http://')).toBe(false);
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = previous;
    }
  });
});

describe('chatApi', () => {
  it('getMeta : GET sans corps, sans Authorization sans jeton, renvoie data', async () => {
    fetchMock.mockResolvedValueOnce(ok({ members: [] }));
    await expect(chatApi.getMeta('s1')).resolves.toEqual({ members: [] });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${base()}/sessions/s1/chat`);
    expect(init.method).toBe('GET');
    expect(init.body).toBeUndefined();
    expect(init.headers).toEqual(ENV.DEFAULT_HEADERS);
    expect(init.signal).toBeDefined();
  });

  it('ajoute le jeton courant', async () => {
    baseApiService.setAuthToken('jeton');
    fetchMock.mockResolvedValueOnce(ok(null));
    await chatApi.typing('s1');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${base()}/sessions/s1/chat/typing`);
    expect(init).toEqual(expect.objectContaining({ method: 'POST', body: undefined }));
    expect(init.headers.Authorization).toBe('Bearer jeton');
  });

  it.each([
    ['getLatest', () => chatApi.getLatest('s1'), 'GET', '/sessions/s1/chat/messages', undefined],
    ['getBefore', () => chatApi.getBefore('s1', 10), 'GET', '/sessions/s1/chat/messages?before=10', undefined],
    ['getAfter', () => chatApi.getAfter('s1', 20), 'GET', '/sessions/s1/chat/messages?after=20', undefined],
    ['send', () => chatApi.send('s1', 'c1', 'Salut', ['u2']), 'POST', '/sessions/s1/chat/messages', { clientId: 'c1', body: 'Salut', mentions: ['u2'] }],
    ['markRead', () => chatApi.markRead('s1', 5), 'POST', '/sessions/s1/chat/read', { messageId: 5 }],
    ['setMuted', () => chatApi.setMuted('s1', true), 'PUT', '/sessions/s1/chat/mute', { muted: true }],
  ])('%s', async (_name, call, method, path, body) => {
    fetchMock.mockResolvedValueOnce(ok('r'));
    await expect(call()).resolves.toBe('r');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${base()}${path}`);
    expect(init.method).toBe(method);
    expect(init.body).toBe(body === undefined ? undefined : JSON.stringify(body));
  });

  it('coupure réseau → ChatApiError statut 0', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
    const error = await chatApi.getMeta('s1').catch((e) => e);
    expect(error).toBeInstanceOf(ChatApiError);
    expect(error.status).toBe(0);
    expect(error.message).toBe('Pas de connexion');
    expect(error.retryable).toBe(true);
  });

  it.each([
    [{ error: { message: 'Trop long' } }, 'Trop long'],
    [{ message: 'Interdit' }, 'Interdit'],
    [{}, 'Erreur serveur'],
  ])('refus du serveur %j → « %s » avec le code HTTP', async (json, message) => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 422, json: async () => json });
    const error = await chatApi.send('s1', 'c', 'b', []).catch((e) => e);
    expect(error).toBeInstanceOf(ChatApiError);
    expect(error.message).toBe(message);
    expect(error.status).toBe(422);
    expect(error.retryable).toBe(false);
  });

  it('réponse non JSON en erreur → « Erreur serveur »', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 502, json: async () => { throw new Error('html'); } });
    const error = await chatApi.getLatest('s1').catch((e) => e);
    expect(error.message).toBe('Erreur serveur');
    expect(error.retryable).toBe(true);
  });

  it('réponse OK non JSON → undefined', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 204, json: async () => { throw new Error('vide'); } });
    await expect(chatApi.markRead('s1', 1)).resolves.toBeUndefined();
  });

  it('délai dépassé (15 s) : requête annulée → statut 0', async () => {
    jest.useFakeTimers();
    fetchMock.mockImplementationOnce((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal!.addEventListener('abort', () => reject(new Error('aborted')));
    }));
    const promise = chatApi.getMeta('s1').catch((e) => e);
    await jest.advanceTimersByTimeAsync(15000);
    const error = await promise;
    expect(error).toBeInstanceOf(ChatApiError);
    expect(error.status).toBe(0);
  });
});

describe('newClientId', () => {
  it('produit un UUID v4 différent à chaque appel', () => {
    const ids = new Set(Array.from({ length: 50 }, newClientId));
    expect(ids.size).toBe(50);
    ids.forEach((id) => expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/));
  });
});
