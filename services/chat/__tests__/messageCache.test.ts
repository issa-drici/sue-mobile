/**
 * Cache des messages sur le téléphone : limite de taille, effacement des sessions terminées,
 * cloisonnement par compte.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

type Cache = typeof import('../messageCache')['messageCache'];
let messageCache: Cache;

const DAY = 24 * 60 * 60 * 1000;
const msg = (id: number) => ({
  id, clientId: `c${id}`, sessionId: 's', senderId: 'u', senderFirstname: 'A', body: `m${id}`, mentions: [], createdAt: new Date().toISOString(),
});
const waitForSave = () => new Promise((resolve) => setTimeout(resolve, 450));

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.isolateModules(() => {
    messageCache = require('../messageCache').messageCache;
  });
});

it('garde seulement les 120 messages les plus récents et signale qu’il en existe d’autres', () => {
  messageCache.update('u1', 's1', { messages: Array.from({ length: 150 }, (_, i) => msg(i + 1)) });
  const cache = messageCache.peek('u1', 's1')!;
  expect(cache.messages).toHaveLength(120);
  expect(cache.messages[0].id).toBe(31);
  expect(cache.messages[119].id).toBe(150);
  expect(cache.hasOlder).toBe(true);
});

it('est relu depuis le téléphone après un redémarrage de l’app', async () => {
  messageCache.update('u1', 's1', { messages: [msg(1), msg(2)], header: { title: 'Foot', subtitle: 'sam.' } });
  await waitForSave();

  jest.isolateModules(() => { messageCache = require('../messageCache').messageCache; });
  expect(messageCache.peek('u1', 's1')).toBeUndefined(); // mémoire vide après redémarrage
  const cache = await messageCache.load('u1', 's1');
  expect(cache?.messages.map((m) => m.id)).toEqual([1, 2]);
  expect(cache?.header?.title).toBe('Foot');
});

it('est propre à chaque compte', () => {
  messageCache.update('u1', 's1', { messages: [msg(1)] });
  expect(messageCache.peek('u2', 's1')).toBeUndefined();
});

it('efface le chat d’une session terminée depuis plus d’un jour, garde les autres', async () => {
  const now = Date.now();
  await AsyncStorage.multiSet([
    ['chat_cache_u1_finie', JSON.stringify({ messages: [], endsAt: new Date(now - 2 * DAY).toISOString(), updatedAt: now })],
    ['chat_cache_u1_hier-soir', JSON.stringify({ messages: [], endsAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(), updatedAt: now })],
    ['chat_cache_u1_a-venir', JSON.stringify({ messages: [], endsAt: new Date(now + DAY).toISOString(), updatedAt: now })],
    ['chat_cache_u1_sans-date-recente', JSON.stringify({ messages: [], endsAt: null, updatedAt: now - 5 * DAY })],
    ['chat_cache_u1_sans-date-oubliee', JSON.stringify({ messages: [], endsAt: null, updatedAt: now - 31 * DAY })],
    ['chat_cache_u2_finie', JSON.stringify({ messages: [], endsAt: new Date(now - 2 * DAY).toISOString(), updatedAt: now })],
  ]);

  await messageCache.prune('u1');

  const keys = [...(await AsyncStorage.getAllKeys())].sort();
  expect(keys).toEqual([
    'chat_cache_u1_a-venir',
    'chat_cache_u1_hier-soir',
    'chat_cache_u1_sans-date-recente',
    'chat_cache_u2_finie', // autre compte : nettoyé à sa propre connexion
  ]);
});

it('efface tout à la déconnexion, sans toucher au reste du stockage', async () => {
  messageCache.update('u1', 's1', { messages: [msg(1)] });
  await waitForSave();
  await AsyncStorage.setItem('autre_cle', 'garder');

  await messageCache.clearAll();

  expect(messageCache.peek('u1', 's1')).toBeUndefined();
  expect(await AsyncStorage.getAllKeys()).toEqual(['autre_cle']);
});
