/**
 * File d'attente des messages : ordre, pas de doublon, renvoi après coupure, messages refusés,
 * cloisonnement entre comptes, reprise après redémarrage de l'app.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@react-native-community/netinfo', () => require('@react-native-community/netinfo/jest/netinfo-mock.js'));

const mockSend = jest.fn();
jest.mock('../chatApi', () => {
  const actual = jest.requireActual('../chatApi');
  return { ...actual, chatApi: { send: (...args: unknown[]) => mockSend(...args) } };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ChatApiError } = require('../chatApi');

type Outbox = typeof import('../outbox')['outbox'];
let outbox: Outbox;

const SESSION = 'session-1';
const flush = () => new Promise((resolve) => jest.requireActual('timers').setImmediate(resolve));
const settle = async () => { for (let i = 0; i < 10; i++) await flush(); };

const item = (clientId: string, body = clientId) => ({ clientId, body, mentions: [], createdAt: new Date().toISOString() });
const serverMessage = (clientId: string, id: number) => ({
  id, clientId, sessionId: SESSION, senderId: 'u1', senderFirstname: 'Alex', body: clientId, mentions: [], createdAt: new Date().toISOString(),
});

beforeEach(async () => {
  jest.useRealTimers();
  mockSend.mockReset();
  await AsyncStorage.clear();
  jest.isolateModules(() => {
    outbox = require('../outbox').outbox;
  });
});

// Arrête les renvois programmés (sinon un réseau simulé toujours coupé les relance sans fin)
afterEach(() => {
  outbox.setUser(null);
});

it('envoie les messages dans l’ordre, un à la fois, et vide la file', async () => {
  const order: string[] = [];
  mockSend.mockImplementation(async (_s: string, clientId: string) => {
    order.push(clientId);
    return serverMessage(clientId, order.length);
  });
  outbox.setUser('u1');
  await outbox.enqueue(SESSION, item('a'));
  await outbox.enqueue(SESSION, item('b'));
  await settle();

  expect(order).toEqual(['a', 'b']);
  expect(outbox.get(SESSION)).toEqual([]);
  expect(await AsyncStorage.getItem('chat_outbox_u1_session-1')).toBeNull();
});

it('garde le message sur le téléphone tant qu’il n’est pas parti (coupure réseau)', async () => {
  mockSend.mockRejectedValue(new ChatApiError('Pas de connexion', 0));
  outbox.setUser('u1');
  await outbox.enqueue(SESSION, item('a'));
  await settle();

  expect(outbox.get(SESSION).map((p) => p.clientId)).toEqual(['a']);
  const stored = JSON.parse((await AsyncStorage.getItem('chat_outbox_u1_session-1')) ?? '[]');
  expect(stored.map((p: { clientId: string }) => p.clientId)).toEqual(['a']);
});

it('réessaie tout seul après une coupure, sans doublon', async () => {
  jest.useFakeTimers();
  mockSend
    .mockRejectedValueOnce(new ChatApiError('Pas de connexion', 0))
    .mockResolvedValueOnce(serverMessage('a', 1));
  outbox.setUser('u1');
  await outbox.enqueue(SESSION, item('a'));
  await settle();
  expect(outbox.get(SESSION)).toHaveLength(1);

  jest.advanceTimersByTime(2000); // premier délai de renvoi
  await settle();

  expect(mockSend).toHaveBeenCalledTimes(2);
  expect(mockSend.mock.calls.map((c) => c[1])).toEqual(['a', 'a']); // même clientId : le serveur ne duplique pas
  expect(outbox.get(SESSION)).toEqual([]);
});

it('marque un message refusé par le serveur sans bloquer les suivants', async () => {
  mockSend.mockImplementation(async (_s: string, clientId: string) => {
    if (clientId === 'trop-long') throw new ChatApiError('Message trop long', 422);
    return serverMessage(clientId, 1);
  });
  outbox.setUser('u1');
  await outbox.enqueue(SESSION, item('trop-long'));
  await outbox.enqueue(SESSION, item('ok'));
  await settle();

  const queue = outbox.get(SESSION);
  expect(queue.map((p) => p.clientId)).toEqual(['trop-long']);
  expect(queue[0].rejected).toBe('Message trop long');
  expect(mockSend.mock.calls.map((c) => c[1])).toEqual(['trop-long', 'ok']);
});

it('un message confirmé par le temps réel sort de la file', async () => {
  mockSend.mockRejectedValue(new ChatApiError('Pas de connexion', 0));
  outbox.setUser('u1');
  await outbox.enqueue(SESSION, item('a'));
  await settle();

  outbox.confirm(SESSION, ['a']);
  expect(outbox.get(SESSION)).toEqual([]);
});

it('reprend l’envoi au démarrage, même sans ouvrir le chat', async () => {
  await AsyncStorage.setItem('chat_outbox_u1_session-1', JSON.stringify([item('hors-ligne')]));
  mockSend.mockResolvedValue(serverMessage('hors-ligne', 7));

  outbox.setUser('u1'); // connexion restaurée au lancement de l'app
  await settle();

  expect(mockSend).toHaveBeenCalledWith(SESSION, 'hors-ligne', 'hors-ligne', []);
  expect(await AsyncStorage.getItem('chat_outbox_u1_session-1')).toBeNull();
});

it('n’envoie jamais les messages d’un compte sous un autre compte', async () => {
  await AsyncStorage.setItem('chat_outbox_u1_session-1', JSON.stringify([item('de-u1')]));
  mockSend.mockResolvedValue(serverMessage('x', 1));

  outbox.setUser('u2');
  await outbox.load(SESSION);
  await settle();

  expect(outbox.get(SESSION)).toEqual([]);
  expect(mockSend).not.toHaveBeenCalled();
});

it('efface toutes les files à la déconnexion', async () => {
  await AsyncStorage.setItem('chat_outbox_u1_session-1', JSON.stringify([item('a')]));
  await AsyncStorage.setItem('chat_outbox_u2_session-2', JSON.stringify([item('b')]));
  await AsyncStorage.setItem('autre_cle', 'garder');

  await outbox.clearAll();

  expect(await AsyncStorage.getItem('chat_outbox_u1_session-1')).toBeNull();
  expect(await AsyncStorage.getItem('chat_outbox_u2_session-2')).toBeNull();
  expect(await AsyncStorage.getItem('autre_cle')).toBe('garder');
});

it('renvoie un message refusé quand l’utilisateur le demande, ou le supprime', async () => {
  mockSend.mockRejectedValueOnce(new ChatApiError('Erreur', 422)).mockResolvedValueOnce(serverMessage('a', 1));
  outbox.setUser('u1');
  await outbox.enqueue(SESSION, item('a'));
  await settle();
  expect(outbox.get(SESSION)[0].rejected).toBeTruthy();

  outbox.retry(SESSION, 'a');
  await settle();
  expect(outbox.get(SESSION)).toEqual([]);

  mockSend.mockRejectedValueOnce(new ChatApiError('Erreur', 422));
  await outbox.enqueue(SESSION, item('b'));
  await settle();
  outbox.discard(SESSION, 'b');
  expect(outbox.get(SESSION)).toEqual([]);
});
