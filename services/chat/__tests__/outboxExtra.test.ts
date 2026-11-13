/**
 * File d'attente des messages : abonnements, réveils (premier plan, retour du réseau),
 * stockage indisponible, changement de compte pendant un envoi.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';

const mockSend = jest.fn();
jest.mock('../chatApi', () => {
  const actual = jest.requireActual('../chatApi');
  return { ...actual, chatApi: { send: (...args: unknown[]) => mockSend(...args) } };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ChatApiError } = require('../chatApi');

type Outbox = typeof import('../outbox')['outbox'];
let outbox: Outbox;
let appStateListener: (state: string) => void;
let netInfoListener: (state: { isConnected: boolean }) => void;

const SESSION = 'session-1';
const flush = () => new Promise((resolve) => jest.requireActual('timers').setImmediate(resolve));
const settle = async () => { for (let i = 0; i < 10; i++) await flush(); };
const item = (clientId: string) => ({ clientId, body: clientId, mentions: [], createdAt: '2026-01-01T00:00:00Z' });
const serverMessage = (clientId: string, id = 1) => ({
  id, clientId, sessionId: SESSION, senderId: 'u1', senderFirstname: 'Alex', body: clientId, mentions: [], createdAt: '2026-01-01T00:00:00Z',
});

beforeEach(async () => {
  jest.useRealTimers();
  mockSend.mockReset();
  await AsyncStorage.clear();
  const appSpy = jest.spyOn(AppState, 'addEventListener');
  const netSpy = NetInfo.addEventListener as jest.Mock;
  netSpy.mockClear();
  jest.isolateModules(() => {
    outbox = require('../outbox').outbox;
  });
  appStateListener = appSpy.mock.calls[appSpy.mock.calls.length - 1][1] as any;
  // NetInfo du module isolé : même fonction simulée (mock global du setup)
  const isolatedNetInfo = netSpy.mock.calls.length ? netSpy : null;
  netInfoListener = isolatedNetInfo ? (isolatedNetInfo.mock.calls[isolatedNetInfo.mock.calls.length - 1][0] as any) : () => {};
  appSpy.mockRestore();
});

afterEach(() => {
  outbox.setUser(null);
  jest.restoreAllMocks();
});

it('enregistre les réveils globaux au chargement', () => {
  expect(typeof appStateListener).toBe('function');
  expect(typeof netInfoListener).toBe('function');
});

it('prévient les abonnés des changements et des envois, jusqu’au désabonnement', async () => {
  mockSend.mockImplementation(async (_s: string, clientId: string) => serverMessage(clientId));
  const onChange = jest.fn();
  const onSent = jest.fn();
  const offChange = outbox.onChange(onChange);
  const offSent = outbox.onSent(onSent);
  outbox.setUser('u1');
  await outbox.enqueue(SESSION, item('a'));
  await settle();
  expect(onChange).toHaveBeenCalledWith(SESSION);
  expect(onSent).toHaveBeenCalledWith(SESSION, serverMessage('a'));

  offChange();
  offSent();
  onChange.mockClear();
  onSent.mockClear();
  await outbox.enqueue(SESSION, item('b'));
  await settle();
  expect(onChange).not.toHaveBeenCalled();
  expect(onSent).not.toHaveBeenCalled();
});

it('retour au premier plan : renvoie les files stockées', async () => {
  outbox.setUser('u1');
  await settle();
  await AsyncStorage.setItem('chat_outbox_u1_s9', JSON.stringify([item('x')]));
  mockSend.mockResolvedValue(serverMessage('x'));
  appStateListener('background');
  await settle();
  expect(mockSend).not.toHaveBeenCalled();
  appStateListener('active');
  await settle();
  expect(mockSend).toHaveBeenCalledWith('s9', 'x', 'x', []);
});

it('retour du réseau : renvoie tout de suite, même pendant l’attente d’un nouvel essai', async () => {
  mockSend.mockRejectedValueOnce(new ChatApiError('Pas de connexion', 0)).mockResolvedValue(serverMessage('a'));
  outbox.setUser('u1');
  await outbox.enqueue(SESSION, item('a'));
  await settle();
  expect(outbox.get(SESSION)).toHaveLength(1);

  netInfoListener({ isConnected: false });
  await settle();
  expect(mockSend).toHaveBeenCalledTimes(1);
  netInfoListener({ isConnected: true });
  await settle();
  expect(mockSend).toHaveBeenCalledTimes(2);
  expect(outbox.get(SESSION)).toEqual([]);
});

it('sans utilisateur : rien n’est chargé ni envoyé, rien n’est stocké', async () => {
  await outbox.load(SESSION);
  await outbox.flush(SESSION);
  expect(outbox.get(SESSION)).toEqual([]);
  appStateListener('active');
  await settle();
  outbox.discard(SESSION, 'x'); // file vide, aucun utilisateur
  expect(await AsyncStorage.getAllKeys()).toEqual([]);
  expect(mockSend).not.toHaveBeenCalled();
});

it('stockage illisible : file vide', async () => {
  jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('indisponible'));
  outbox.setUser('u1');
  await outbox.load(SESSION);
  expect(outbox.get(SESSION)).toEqual([]);
});

it('deux chargements simultanés partagent la même lecture', async () => {
  const getItem = jest.spyOn(AsyncStorage, 'getItem');
  outbox.setUser('u1');
  await settle();
  getItem.mockClear();
  await Promise.all([outbox.load('s2'), outbox.load('s2')]);
  expect(getItem).toHaveBeenCalledTimes(1);
});

it('flushAll survit à un stockage indisponible', async () => {
  jest.spyOn(AsyncStorage, 'getAllKeys').mockRejectedValue(new Error('indisponible'));
  outbox.setUser('u1');
  await settle();
  await expect(outbox.clearAll()).resolves.toBeUndefined();
});

it('setUser avec le même compte ne réinitialise rien', async () => {
  mockSend.mockRejectedValue(new ChatApiError('Pas de connexion', 0));
  outbox.setUser('u1');
  await outbox.enqueue(SESSION, item('a'));
  await settle();
  outbox.setUser('u1');
  expect(outbox.get(SESSION)).toHaveLength(1);
});

it('changement de compte pendant un envoi : la réponse est ignorée', async () => {
  let resolveSend!: (m: unknown) => void;
  mockSend.mockImplementationOnce(() => new Promise((resolve) => { resolveSend = resolve; }));
  const onSent = jest.fn();
  const off = outbox.onSent(onSent);
  outbox.setUser('u1');
  await outbox.enqueue(SESSION, item('a'));
  await settle();
  outbox.setUser('u2');
  resolveSend(serverMessage('a'));
  await settle();
  expect(onSent).not.toHaveBeenCalled();
  off();
});

it('changement de compte pendant un envoi qui échoue : pas de nouvel essai programmé', async () => {
  jest.useFakeTimers();
  let rejectSend!: (e: unknown) => void;
  mockSend.mockImplementationOnce(() => new Promise((_r, reject) => { rejectSend = reject; }));
  outbox.setUser('u1');
  await outbox.enqueue(SESSION, item('a'));
  await settle();
  outbox.setUser('u2');
  rejectSend(new ChatApiError('Pas de connexion', 0));
  await settle();
  jest.advanceTimersByTime(60000);
  await settle();
  expect(mockSend).toHaveBeenCalledTimes(1);
});

it('les délais de renvoi s’allongent puis plafonnent à 30 s', async () => {
  jest.useFakeTimers();
  mockSend.mockRejectedValue(new ChatApiError('Erreur serveur', 503));
  outbox.setUser('u1');
  await outbox.enqueue(SESSION, item('a'));
  await settle();
  const delays = [2000, 5000, 10000, 20000, 30000, 30000];
  for (const [i, delay] of delays.entries()) {
    jest.advanceTimersByTime(delay - 1);
    await settle();
    expect(mockSend).toHaveBeenCalledTimes(i + 1);
    jest.advanceTimersByTime(1);
    await settle();
    expect(mockSend).toHaveBeenCalledTimes(i + 2);
  }
});

it('une erreur inattendue (pas ChatApiError) est traitée comme une coupure', async () => {
  mockSend.mockRejectedValueOnce(new Error('bizarre'));
  outbox.setUser('u1');
  await outbox.enqueue(SESSION, item('a'));
  await settle();
  expect(outbox.get(SESSION)[0].rejected).toBeUndefined();
});

it('confirm sur une file vide ou sans correspondance ne change rien', async () => {
  const onChange = jest.fn();
  const off = outbox.onChange(onChange);
  outbox.confirm('vide', ['a']);
  mockSend.mockRejectedValue(new ChatApiError('Pas de connexion', 0));
  outbox.setUser('u1');
  await outbox.enqueue(SESSION, item('a'));
  await settle();
  onChange.mockClear();
  outbox.confirm(SESSION, ['autre']);
  expect(onChange).not.toHaveBeenCalled();
  off();
});
