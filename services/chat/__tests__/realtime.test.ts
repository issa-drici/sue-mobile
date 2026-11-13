/**
 * Temps réel du chat : une connexion partagée, un canal par session partagé entre écrans,
 * rattrapage à la (re)connexion, refus d'accès, nouvelles tentatives, autorisation par jeton.
 */
import { ENV } from '../../../config/env';

type Handler = (data?: any) => void;

class MockChannel {
  name: string;
  subscribed = false;
  subscriptionPending = true;
  handlers = new Map<string, Handler>();
  constructor(name: string) { this.name = name; }
  bind(event: string, handler: Handler) { this.handlers.set(event, handler); }
  unbind_all = jest.fn(() => this.handlers.clear());
  emit(event: string, data?: any) { this.handlers.get(event)?.(data); }
}

const mockInstances: MockPusher[] = [];

class MockPusher {
  key: string;
  options: any;
  channels = new Map<string, MockChannel>();
  connectionHandlers = new Map<string, Handler>();
  connection = { bind: (event: string, handler: Handler) => this.connectionHandlers.set(event, handler) };
  subscribe = jest.fn((name: string) => {
    const channel = this.channels.get(name) ?? new MockChannel(name);
    this.channels.set(name, channel);
    return channel;
  });
  unsubscribe = jest.fn();
  disconnect = jest.fn();
  constructor(key: string, options: any) {
    this.key = key;
    this.options = options;
    mockInstances.push(this);
  }
}

jest.mock('pusher-js', () => ({ __esModule: true, default: function Pusher(key: string, options: any) { return new MockPusher(key, options); } }));

type Realtime = typeof import('../realtime');
let realtime: Realtime;
let baseApiService: typeof import('../../api/baseApi')['baseApiService'];
const fetchMock = global.fetch as jest.Mock;

const handlers = () => ({
  onMessage: jest.fn(),
  onTyping: jest.fn(),
  onRead: jest.fn(),
  onReady: jest.fn(),
  onForbidden: jest.fn(),
});

const lastPusher = () => mockInstances[mockInstances.length - 1];
const channelOf = (sessionId: string) => lastPusher().channels.get(`private-session-chat.${sessionId}`)!;

beforeEach(() => {
  mockInstances.length = 0;
  fetchMock.mockReset();
  jest.isolateModules(() => {
    realtime = require('../realtime');
    baseApiService = require('../../api/baseApi').baseApiService;
  });
});

afterEach(() => {
  jest.useRealTimers();
});

it('ouvre une seule connexion configurée pour Soketi', () => {
  const off1 = realtime.subscribeToChat('s1', handlers());
  const off2 = realtime.subscribeToChat('s2', handlers());
  expect(mockInstances).toHaveLength(1);
  const { key, options } = lastPusher();
  expect(key).toBe(ENV.PUSHER_APP_KEY);
  expect(options).toEqual(expect.objectContaining({
    cluster: 'mt1',
    wsHost: ENV.PUSHER_HOST,
    wsPort: parseInt(ENV.PUSHER_PORT, 10),
    wssPort: parseInt(ENV.PUSHER_PORT, 10),
    forceTLS: ENV.PUSHER_SCHEME === 'https',
    enabledTransports: ['ws', 'wss'],
    disableStats: true,
  }));
  expect(options.channelAuthorization.endpoint).toMatch(/\/broadcasting\/auth$/);
  off1();
  off2();
});

it('relaie messages, saisie et lectures à tous les écrans du canal', () => {
  const a = handlers();
  const b = handlers();
  const offA = realtime.subscribeToChat('s1', a);
  const offB = realtime.subscribeToChat('s1', b);
  expect(lastPusher().subscribe).toHaveBeenCalledTimes(1);
  const channel = channelOf('s1');

  const message = { id: 1 };
  channel.emit('message.sent', { message });
  channel.emit('message.sent', {}); // sans message : ignoré
  channel.emit('user.typing', { userId: 'u2', firstname: 'Léa' });
  channel.emit('user.typing', {});
  channel.emit('read.updated', { userId: 'u2', lastReadMessageId: 9 });
  channel.emit('read.updated', null);

  for (const h of [a, b]) {
    expect(h.onMessage).toHaveBeenCalledTimes(1);
    expect(h.onMessage).toHaveBeenCalledWith(message);
    expect(h.onTyping).toHaveBeenCalledTimes(1);
    expect(h.onTyping).toHaveBeenCalledWith('u2', 'Léa');
    expect(h.onRead).toHaveBeenCalledTimes(1);
    expect(h.onRead).toHaveBeenCalledWith('u2', 9);
  }
  offA();
  offB();
});

it('abonnement réussi : chaque écran rattrape, et un nouvel écran sur un canal actif aussi', () => {
  const a = handlers();
  const offA = realtime.subscribeToChat('s1', a);
  const channel = channelOf('s1');
  channel.subscribed = true;
  channel.subscriptionPending = false;
  channel.emit('pusher:subscription_succeeded');
  expect(a.onReady).toHaveBeenCalledTimes(1);

  const b = handlers();
  const offB = realtime.subscribeToChat('s1', b);
  expect(b.onReady).toHaveBeenCalledTimes(1);
  offA();
  offB();
});

it('reconnexion après coupure : rattrapage, mais pas à la première connexion', () => {
  const a = handlers();
  const off = realtime.subscribeToChat('s1', a);
  const stateChange = lastPusher().connectionHandlers.get('state_change')!;
  stateChange({ current: 'connecting' });
  stateChange({ current: 'connected' });
  expect(a.onReady).not.toHaveBeenCalled();
  stateChange({ current: 'unavailable' });
  stateChange({ current: 'connected' });
  expect(a.onReady).toHaveBeenCalledTimes(1);
  off();
});

it('403 : accès refusé, sans nouvelle tentative (sauf forcée)', () => {
  const a = handlers();
  const off = realtime.subscribeToChat('s1', a);
  const pusher = lastPusher();
  const channel = channelOf('s1');
  channel.subscriptionPending = false;
  channel.emit('pusher:subscription_error', { status: 403 });
  expect(a.onForbidden).toHaveBeenCalledTimes(1);

  realtime.retryChatSubscription('s1');
  expect(pusher.subscribe).toHaveBeenCalledTimes(1);
  realtime.retryChatSubscription('s1', true);
  expect(pusher.subscribe).toHaveBeenCalledTimes(2);
  expect(pusher.subscribe).toHaveBeenLastCalledWith('private-session-chat.s1');

  // Un écran sans onForbidden ne plante pas
  const { onForbidden: _ignored, ...withoutForbidden } = handlers();
  const off2 = realtime.subscribeToChat('s1', withoutForbidden);
  channel.emit('pusher:subscription_error', { status: 403 });
  off();
  off2();
});

it('autre erreur : jusqu’à 6 nouvelles tentatives espacées de 5 s', () => {
  jest.useFakeTimers();
  const off = realtime.subscribeToChat('s1', handlers());
  const pusher = lastPusher();
  const channel = channelOf('s1');
  channel.subscriptionPending = false;

  for (let i = 0; i < 8; i++) {
    channel.emit('pusher:subscription_error', { status: 500 });
    jest.advanceTimersByTime(5000);
  }
  // 1 abonnement initial + 6 nouvelles tentatives maximum
  expect(pusher.subscribe).toHaveBeenCalledTimes(7);

  // Un succès remet le compteur à zéro
  channel.emit('pusher:subscription_succeeded');
  channel.emit('pusher:subscription_error', undefined);
  jest.advanceTimersByTime(5000);
  expect(pusher.subscribe).toHaveBeenCalledTimes(8);
  off();
});

it('retryChatSubscription sans effet : inconnu, actif ou en cours', () => {
  realtime.retryChatSubscription('inconnu'); // aucune connexion
  const off = realtime.subscribeToChat('s1', handlers());
  const pusher = lastPusher();
  const channel = channelOf('s1');
  realtime.retryChatSubscription('autre');
  channel.subscriptionPending = true;
  realtime.retryChatSubscription('s1');
  channel.subscriptionPending = false;
  channel.subscribed = true;
  realtime.retryChatSubscription('s1');
  expect(pusher.subscribe).toHaveBeenCalledTimes(1);
  channel.subscribed = false;
  realtime.retryChatSubscription('s1');
  expect(pusher.subscribe).toHaveBeenCalledTimes(2);
  off();
});

it('ferme le canal au dernier écran et la connexion quand plus aucun chat n’est ouvert', () => {
  const offA = realtime.subscribeToChat('s1', handlers());
  const offB = realtime.subscribeToChat('s1', handlers());
  const offC = realtime.subscribeToChat('s2', handlers());
  const pusher = lastPusher();
  const channel = channelOf('s1');

  offA();
  expect(pusher.unsubscribe).not.toHaveBeenCalled();
  offB();
  expect(channel.unbind_all).toHaveBeenCalled();
  expect(pusher.unsubscribe).toHaveBeenCalledWith('private-session-chat.s1');
  expect(pusher.disconnect).not.toHaveBeenCalled();
  offB(); // deuxième appel : sans effet
  offC();
  expect(pusher.disconnect).toHaveBeenCalledTimes(1);

  // Nouveau chat : nouvelle connexion
  const offD = realtime.subscribeToChat('s3', handlers());
  expect(mockInstances).toHaveLength(2);
  offD();
});

describe('autorisation des canaux privés', () => {
  const authorize = (params = { socketId: '1.2', channelName: 'private-session-chat.s1' }) => {
    const off = realtime.subscribeToChat('s1', handlers());
    const { customHandler } = lastPusher().options.channelAuthorization;
    const callback = jest.fn();
    return { off, run: () => customHandler(params, callback), callback };
  };

  it('envoie le jeton courant et renvoie la réponse du serveur', async () => {
    baseApiService.setAuthToken('jeton');
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ auth: 'sig' }) });
    const { off, run, callback } = authorize();
    await run();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/broadcasting\/auth$/);
    expect(url).not.toMatch(/\/api\/broadcasting/);
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer jeton');
    expect(JSON.parse(init.body)).toEqual({ socket_id: '1.2', channel_name: 'private-session-chat.s1' });
    expect(callback).toHaveBeenCalledWith(null, { auth: 'sig' });
    off();
  });

  it('sans jeton : pas d’Authorization ; refus → erreur avec le statut', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 403, json: async () => ({}) });
    const { off, run, callback } = authorize();
    await run();
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
    const [error, data] = callback.mock.calls[0];
    expect(error.message).toBe('Autorisation refusée (403)');
    expect(error.status).toBe(403);
    expect(data).toBeNull();
    off();
  });

  it('coupure réseau : erreur relayée', async () => {
    const failure = new Error('offline');
    fetchMock.mockRejectedValueOnce(failure);
    const { off, run, callback } = authorize();
    await run();
    expect(callback).toHaveBeenCalledWith(failure, null);
    off();
  });
});
