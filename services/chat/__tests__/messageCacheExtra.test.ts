/**
 * Cache des messages : cas limites (stockage illisible ou indisponible, préchargement,
 * sauvegardes regroupées, effacement en attente).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

type Cache = typeof import('../messageCache')['messageCache'];
let messageCache: Cache;

const msg = (id: number) => ({
  id, clientId: `c${id}`, sessionId: 's', senderId: 'u', senderFirstname: 'A', body: `m${id}`, mentions: [], createdAt: '2026-01-01T00:00:00Z',
});
const flush = () => new Promise((resolve) => jest.requireActual('timers').setImmediate(resolve));

beforeEach(async () => {
  jest.useRealTimers();
  await AsyncStorage.clear();
  jest.clearAllMocks();
  jest.isolateModules(() => {
    messageCache = require('../messageCache').messageCache;
  });
});

afterEach(async () => {
  jest.useRealTimers();
  jest.restoreAllMocks();
  await messageCache.clearAll();
});

it('load renvoie null quand rien n’est stocké', async () => {
  await expect(messageCache.load('u1', 's1')).resolves.toBeNull();
});

it('load renvoie null si le stockage est illisible', async () => {
  await AsyncStorage.setItem('chat_cache_u1_s1', '{pas du json');
  await expect(messageCache.load('u1', 's1')).resolves.toBeNull();
});

it('load renvoie directement la version en mémoire', async () => {
  messageCache.update('u1', 's1', { messages: [msg(1)] });
  const getItem = jest.spyOn(AsyncStorage, 'getItem');
  const cache = await messageCache.load('u1', 's1');
  expect(cache?.messages).toHaveLength(1);
  expect(getItem).not.toHaveBeenCalled();
});

it('load garde la version mémoire écrite pendant la lecture du stockage', async () => {
  await AsyncStorage.setItem('chat_cache_u1_s1', JSON.stringify({ messages: [msg(1)], members: [], reads: {}, myLastReadId: 0, hasOlder: false }));
  const pending = messageCache.load('u1', 's1');
  messageCache.update('u1', 's1', { messages: [msg(2)] }); // plus récent, écrit pendant la lecture
  const cache = await pending;
  expect(cache?.messages.map((m) => m.id)).toEqual([2]);
});

it('preload charge en mémoire pour un affichage instantané', async () => {
  await AsyncStorage.setItem('chat_cache_u1_s1', JSON.stringify({ messages: [msg(3)], members: [], reads: {}, myLastReadId: 3, hasOlder: false }));
  messageCache.preload('u1', 's1');
  await flush();
  await flush();
  expect(messageCache.peek('u1', 's1')?.myLastReadId).toBe(3);
});

it('update sans messages garde les messages existants, et regroupe les sauvegardes', async () => {
  jest.useFakeTimers();
  const setItem = jest.spyOn(AsyncStorage, 'setItem');
  messageCache.update('u1', 's1', { messages: [msg(2), msg(1)] });
  messageCache.update('u1', 's1', { myLastReadId: 2 });
  const cache = messageCache.peek('u1', 's1')!;
  expect(cache.messages.map((m) => m.id)).toEqual([1, 2]); // triés
  expect(cache.myLastReadId).toBe(2);
  expect(cache.hasOlder).toBe(false);
  expect(typeof cache.updatedAt).toBe('number');

  jest.advanceTimersByTime(399);
  expect(setItem).not.toHaveBeenCalled();
  jest.advanceTimersByTime(1);
  expect(setItem).toHaveBeenCalledTimes(1);
  expect(JSON.parse(setItem.mock.calls[0][1] as string).myLastReadId).toBe(2);
});

it('une sauvegarde qui échoue est ignorée', async () => {
  jest.useFakeTimers();
  jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disque plein'));
  messageCache.update('u1', 's1', { messages: [msg(1)] });
  jest.advanceTimersByTime(400);
  jest.useRealTimers();
  await flush();
  expect(messageCache.peek('u1', 's1')?.messages).toHaveLength(1);
});

it('prune : rien pour ce compte → aucun effacement', async () => {
  await AsyncStorage.setItem('chat_cache_u2_s1', '{}');
  const multiRemove = jest.spyOn(AsyncStorage, 'multiRemove');
  await messageCache.prune('u1');
  expect(multiRemove).not.toHaveBeenCalled();
});

it('prune : efface les entrées illisibles et annule leurs sauvegardes en attente', async () => {
  jest.useFakeTimers();
  messageCache.update('u1', 'ouvert', { messages: [msg(1)], endsAt: '2000-01-01T00:00:00Z' });
  jest.advanceTimersByTime(400); // sauvegardé
  messageCache.update('u1', 'ouvert', { endsAt: '2000-01-01T00:00:00Z' }); // nouvelle sauvegarde en attente
  jest.useRealTimers();
  await flush();
  await AsyncStorage.setItem('chat_cache_u1_illisible', '{oops');
  await AsyncStorage.setItem('chat_cache_u1_recente', JSON.stringify({ messages: [] })); // ni fin ni date : gardée

  await messageCache.prune('u1');

  const keys = [...(await AsyncStorage.getAllKeys())].sort();
  expect(keys).toEqual(['chat_cache_u1_recente']);
  expect(messageCache.peek('u1', 'ouvert')).toBeUndefined();
});

it('prune : tout est encore valide → rien n’est effacé', async () => {
  await AsyncStorage.setItem('chat_cache_u1_s1', JSON.stringify({ endsAt: new Date(Date.now() + 1e9).toISOString() }));
  const multiRemove = jest.spyOn(AsyncStorage, 'multiRemove');
  await messageCache.prune('u1');
  expect(multiRemove).not.toHaveBeenCalled();
});

it('prune et clearAll survivent à un stockage indisponible', async () => {
  jest.spyOn(AsyncStorage, 'getAllKeys').mockRejectedValue(new Error('indisponible'));
  await expect(messageCache.prune('u1')).resolves.toBeUndefined();
  await expect(messageCache.clearAll()).resolves.toBeUndefined();
});

it('clearAll annule les sauvegardes en attente et ne touche pas un stockage sans cache', async () => {
  jest.useFakeTimers();
  const setItem = jest.spyOn(AsyncStorage, 'setItem');
  const multiRemove = jest.spyOn(AsyncStorage, 'multiRemove');
  messageCache.update('u1', 's1', { messages: [msg(1)] });
  await messageCache.clearAll();
  jest.advanceTimersByTime(1000);
  expect(setItem).not.toHaveBeenCalled();
  expect(multiRemove).not.toHaveBeenCalled();
});
