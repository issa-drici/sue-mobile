/**
 * Notifications push : niveau d'accès (iOS provisoire compris), demande « soft », jeton
 * Expo enregistré / supprimé côté serveur, écouteurs sans doublon, navigation au tap.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const mockN = {
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  getLastNotificationResponseAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
};
jest.mock('expo-notifications', () => ({
  ...mockN,
  IosAuthorizationStatus: { NOT_DETERMINED: 0, DENIED: 1, AUTHORIZED: 2, PROVISIONAL: 3, EPHEMERAL: 4 },
}));

const mockApplication = { applicationId: 'fr.sue.app' as string | null, getAndroidId: jest.fn(() => 'android-id') };
jest.mock('expo-application', () => ({
  get applicationId() { return mockApplication.applicationId; },
  getAndroidId: () => mockApplication.getAndroidId(),
}));

const mockRouter = { navigate: jest.fn(), dismissTo: jest.fn() };
jest.mock('expo-router', () => ({ router: mockRouter }));

const mockApi = { post: jest.fn(), delete: jest.fn() };
jest.mock('../../api/baseApi', () => ({ baseApiService: mockApi }));

type Mod = typeof import('../pushNotifications');
let service: Mod['pushNotificationService'];
let PushNotificationService: Mod['PushNotificationService'];
let activeChat: typeof import('../../chat/activeChat')['activeChat'];

const ORIGINAL_OS = Platform.OS;
const setOS = (os: string) => Object.defineProperty(Platform, 'OS', { value: os, configurable: true, writable: true });
const flush = () => new Promise((resolve) => jest.requireActual('timers').setImmediate(resolve));
const settle = async () => { for (let i = 0; i < 6; i++) await flush(); };

/** Permissions simulées : statut générique + statut iOS détaillé facultatif */
const permissions = (status: string, iosStatus?: number) =>
  mockN.getPermissionsAsync.mockResolvedValue({ status, ...(iosStatus === undefined ? {} : { ios: { status: iosStatus } }) });

let receivedListener: (n: any) => void;
let responseListener: (r: any) => void;
const subscriptions: { remove: jest.Mock }[] = [];

const response = (data: any, identifier: string | undefined = `id-${Math.random()}`) => ({
  notification: { request: { identifier, content: { data } } },
});

let spies: jest.SpyInstance[] = [];

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  setOS('ios');
  subscriptions.length = 0;
  mockApplication.applicationId = 'fr.sue.app';
  mockN.addNotificationReceivedListener.mockImplementation((cb) => {
    receivedListener = cb;
    const sub = { remove: jest.fn() };
    subscriptions.push(sub);
    return sub;
  });
  mockN.addNotificationResponseReceivedListener.mockImplementation((cb) => {
    responseListener = cb;
    const sub = { remove: jest.fn() };
    subscriptions.push(sub);
    return sub;
  });
  mockN.getLastNotificationResponseAsync.mockResolvedValue(null);
  mockN.getExpoPushTokenAsync.mockResolvedValue({ data: 'ExponentPushToken[abc]' });
  mockN.requestPermissionsAsync.mockResolvedValue({});
  permissions('granted', 2);
  spies = (['log', 'warn', 'error'] as const).map((m) => jest.spyOn(console, m).mockImplementation(() => {}));
  jest.isolateModules(() => {
    ({ pushNotificationService: service, PushNotificationService } = require('../pushNotifications'));
    activeChat = require('../../chat/activeChat').activeChat;
  });
});

afterEach(() => {
  setOS(ORIGINAL_OS);
  spies.forEach((s) => s.mockRestore());
});

describe('affichage des notifications au premier plan', () => {
  const handler = () => mockN.setNotificationHandler.mock.calls[0][0].handleNotification;
  const notif = (data: any) => ({ request: { content: { data } } });

  it('affiche bannière, liste et son pour une notification ordinaire', async () => {
    await expect(handler()(notif({ type: 'reminder' }))).resolves.toEqual({
      shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: true,
    });
    await expect(handler()(notif(undefined))).resolves.toEqual(expect.objectContaining({ shouldShowBanner: true }));
  });

  it('silencieux pour un message du chat affiché à l’écran', async () => {
    activeChat.focus('s1');
    await expect(handler()(notif({ type: 'chat_message', session_id: 's1' }))).resolves.toEqual({
      shouldShowBanner: false, shouldShowList: false, shouldPlaySound: false, shouldSetBadge: true,
    });
    await expect(handler()(notif({ type: 'chat_mention', sessionId: 's1' }))).resolves.toEqual(expect.objectContaining({ shouldShowBanner: false }));
    await expect(handler()(notif({ type: 'chat_message', session_id: 's2' }))).resolves.toEqual(expect.objectContaining({ shouldShowBanner: true }));
    await expect(handler()(notif({ type: 'reminder', session_id: 's1' }))).resolves.toEqual(expect.objectContaining({ shouldShowBanner: true }));
  });
});

describe('singleton', () => {
  it('getInstance renvoie toujours la même instance', () => {
    expect(PushNotificationService.getInstance()).toBe(service);
  });
});

describe('getAccess', () => {
  it.each([
    [2, 'full'], [4, 'full'], [3, 'provisional'], [1, 'denied'], [0, 'undetermined'],
  ])('iOS statut %i → %s', async (iosStatus, expected) => {
    permissions('undetermined', iosStatus);
    await expect(service.getAccess()).resolves.toBe(expected);
  });

  it.each([
    ['granted', 'full'], ['denied', 'denied'], ['undetermined', 'undetermined'],
  ])('Android %s → %s', async (status, expected) => {
    setOS('android');
    permissions(status, 2);
    await expect(service.getAccess()).resolves.toBe(expected);
  });

  it('iOS sans statut détaillé : statut générique', async () => {
    permissions('granted');
    await expect(service.getAccess()).resolves.toBe('full');
  });

  it('erreur → undetermined', async () => {
    mockN.getPermissionsAsync.mockRejectedValue(new Error('x'));
    await expect(service.getAccess()).resolves.toBe('undetermined');
  });
});

describe('ensureProvisional', () => {
  it('iOS jamais demandé : demande provisoire sans fenêtre', async () => {
    mockN.getPermissionsAsync
      .mockResolvedValueOnce({ status: 'undetermined', ios: { status: 0 } })
      .mockResolvedValueOnce({ status: 'undetermined', ios: { status: 3 } });
    await expect(service.ensureProvisional()).resolves.toBe('provisional');
    expect(mockN.requestPermissionsAsync).toHaveBeenCalledWith({
      ios: { allowAlert: true, allowBadge: true, allowSound: true, allowProvisional: true },
    });
  });

  it('iOS : échec de la demande provisoire toléré', async () => {
    permissions('undetermined', 0);
    mockN.requestPermissionsAsync.mockRejectedValueOnce(new Error('x'));
    await expect(service.ensureProvisional()).resolves.toBe('undetermined');
  });

  it('déjà décidé, ou Android : rien n’est demandé', async () => {
    permissions('denied', 1);
    await expect(service.ensureProvisional()).resolves.toBe('denied');
    setOS('android');
    permissions('undetermined');
    await expect(service.ensureProvisional()).resolves.toBe('undetermined');
    expect(mockN.requestPermissionsAsync).not.toHaveBeenCalled();
  });
});

describe('requestPermissions', () => {
  it('déjà autorisé → vrai sans demander ; refusé → faux sans demander', async () => {
    await expect(service.requestPermissions()).resolves.toBe(true);
    permissions('denied', 1);
    await expect(service.requestPermissions()).resolves.toBe(false);
    expect(mockN.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('provisoire : vraie demande iOS, puis relit l’accès', async () => {
    mockN.getPermissionsAsync
      .mockResolvedValueOnce({ status: 'undetermined', ios: { status: 3 } })
      .mockResolvedValueOnce({ status: 'granted', ios: { status: 2 } });
    await expect(service.requestPermissions()).resolves.toBe(true);
    expect(mockN.requestPermissionsAsync).toHaveBeenCalledWith({ ios: { allowAlert: true, allowBadge: true, allowSound: true } });
  });

  it('demande refusée ou en erreur → faux', async () => {
    permissions('undetermined', 0);
    await expect(service.requestPermissions()).resolves.toBe(false);
    mockN.requestPermissionsAsync.mockRejectedValueOnce(new Error('x'));
    await expect(service.requestPermissions()).resolves.toBe(false);
  });
});

describe('getPermissions', () => {
  it('renvoie le statut, ou « unknown » en cas d’erreur', async () => {
    await expect(service.getPermissions()).resolves.toEqual({ status: 'granted' });
    mockN.getPermissionsAsync.mockRejectedValueOnce(new Error('x'));
    await expect(service.getPermissions()).resolves.toEqual({ status: 'unknown' });
  });
});

describe('initialize', () => {
  it('autorisé : jeton stocké, écouteurs posés, initialisé une seule fois', async () => {
    await expect(service.initialize()).resolves.toBe(true);
    expect(mockN.getExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: '1b831c3a-2180-4050-b751-7e5248737d95' });
    expect(await AsyncStorage.getItem('expo_push_token')).toBe('ExponentPushToken[abc]');
    expect(service.getToken()).toBe('ExponentPushToken[abc]');
    expect(service.isServiceInitialized()).toBe(true);
    expect(mockN.addNotificationReceivedListener).toHaveBeenCalledTimes(1);

    await expect(service.initialize()).resolves.toBe(true);
    expect(mockN.getExpoPushTokenAsync).toHaveBeenCalledTimes(1);
  });

  it('refusé : rien n’est configuré', async () => {
    permissions('denied', 1);
    await expect(service.initialize()).resolves.toBe(false);
    expect(mockN.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  it('provisoire : configure quand même (notifications rangées en silence)', async () => {
    permissions('undetermined', 3);
    await expect(service.initialize()).resolves.toBe(true);
  });

  it('jeton impossible : écouteurs posés mais non initialisé', async () => {
    mockN.getExpoPushTokenAsync.mockRejectedValueOnce(new Error('fail'));
    await expect(service.initialize()).resolves.toBe(false);
    expect(mockN.addNotificationReceivedListener).toHaveBeenCalledTimes(1);
    expect(service.isServiceInitialized()).toBe(false);
  });

  it('erreur inattendue → faux', async () => {
    jest.spyOn(service, 'ensureProvisional').mockRejectedValueOnce(new Error('x'));
    await expect(service.initialize()).resolves.toBe(false);
  });
});

describe('obtention du jeton : diagnostics par plateforme', () => {
  const failWith = async (os: string, message: string | undefined) => {
    setOS(os);
    mockN.getExpoPushTokenAsync.mockRejectedValueOnce(message === undefined ? 'brut' : Object.assign(new Error(message), { code: 'E1' }));
    return service.registerToken();
  };

  it.each([
    ['android', 'Default FirebaseApp is not initialized'],
    ['android', 'autre erreur'],
    ['ios', 'network down'],
    ['ios', 'permission missing'],
    ['ios', 'autre'],
    ['web', 'peu importe'],
    ['ios', undefined],
  ])('%s « %s » → pas de jeton', async (os, message) => {
    await expect(failWith(os, message)).resolves.toBe(false);
    expect(mockApi.post).not.toHaveBeenCalled();
  });
});

describe('enregistrement du jeton côté serveur', () => {
  it('jeton déjà stocké : envoyé avec la plateforme', async () => {
    await AsyncStorage.setItem('expo_push_token', 'stocké');
    mockApi.post.mockResolvedValueOnce({ success: true });
    await expect(service.registerTokenInDatabase()).resolves.toBe(true);
    expect(mockApi.post).toHaveBeenCalledWith('/push-tokens', { token: 'stocké', platform: 'ios' });
    expect(mockN.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  it('sans jeton stocké : en obtient un', async () => {
    mockApi.post.mockResolvedValueOnce({ success: true });
    await expect(service.registerTokenInDatabase()).resolves.toBe(true);
    expect(mockApi.post).toHaveBeenCalledWith('/push-tokens', { token: 'ExponentPushToken[abc]', platform: 'ios' });
  });

  it('aucun jeton possible → faux', async () => {
    mockN.getExpoPushTokenAsync.mockRejectedValueOnce(new Error('x'));
    await expect(service.registerTokenInDatabase()).resolves.toBe(false);
  });

  it('réponse sans succès ou erreur réseau → faux', async () => {
    mockApi.post.mockResolvedValueOnce({ success: false });
    await expect(service.registerTokenInDatabase()).resolves.toBe(false);
    mockApi.post.mockRejectedValueOnce(Object.assign(new Error('500'), { response: { status: 500, data: {} } }));
    await expect(service.registerTokenInDatabase()).resolves.toBe(false);
    mockApi.post.mockRejectedValueOnce('brut');
    await expect(service.registerTokenInDatabase()).resolves.toBe(false);
  });

  it('stockage illisible : traité comme absent', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('x'));
    mockApi.post.mockResolvedValueOnce({ success: true });
    await expect(service.registerTokenInDatabase()).resolves.toBe(true);
  });

  it('registerToken : obtient puis enregistre ; erreur → faux', async () => {
    mockApi.post.mockResolvedValueOnce({ success: true });
    await expect(service.registerToken()).resolves.toBe(true);
    jest.spyOn(service, 'registerTokenInDatabase').mockRejectedValueOnce(new Error('x'));
    await expect(service.registerToken()).resolves.toBe(false);
  });
});

describe('suppression du jeton côté serveur', () => {
  it('sans jeton stocké : rien à faire', async () => {
    await expect(service.unregisterTokenFromDatabase()).resolves.toBe(true);
    expect(mockApi.delete).not.toHaveBeenCalled();
  });

  it('avec jeton : DELETE avec le jeton', async () => {
    await AsyncStorage.setItem('expo_push_token', 'tok');
    mockApi.delete.mockResolvedValueOnce({ success: true });
    await expect(service.unregisterTokenFromDatabase()).resolves.toBe(true);
    expect(mockApi.delete).toHaveBeenCalledWith('/push-tokens', { token: 'tok' });
    mockApi.delete.mockResolvedValueOnce({});
    await expect(service.unregisterTokenFromDatabase()).resolves.toBe(false);
    mockApi.delete.mockRejectedValueOnce(new Error('x'));
    await expect(service.unregisterTokenFromDatabase()).resolves.toBe(false);
  });

  it('unregisterToken : nettoie l’état local même en cas d’erreur', async () => {
    await service.initialize();
    mockApi.delete.mockResolvedValueOnce({ success: true });
    await expect(service.unregisterToken()).resolves.toBe(true);
    expect(service.getToken()).toBeNull();
    expect(service.isServiceInitialized()).toBe(false);

    await service.initialize();
    jest.spyOn(service, 'unregisterTokenFromDatabase').mockRejectedValueOnce(new Error('x'));
    await expect(service.unregisterToken()).resolves.toBe(false);
    expect(service.getToken()).toBeNull();
    expect(service.isServiceInitialized()).toBe(false);
  });
});

describe('demande « soft »', () => {
  it('affichée si jamais traitée et accès indéterminé ou provisoire', async () => {
    permissions('undetermined', 0);
    await expect(service.shouldShowSoftPrompt()).resolves.toBe(true);
    permissions('undetermined', 3);
    await expect(service.shouldShowSoftPrompt()).resolves.toBe(true);
    permissions('granted', 2);
    await expect(service.shouldShowSoftPrompt()).resolves.toBe(false);
  });

  it('jamais réaffichée une fois traitée', async () => {
    permissions('undetermined', 0);
    await service.markSoftPromptHandled();
    expect(await AsyncStorage.getItem('notif_soft_prompt_handled')).toBe('true');
    await expect(service.shouldShowSoftPrompt()).resolves.toBe(false);
  });

  it('stockage en erreur : pas d’affichage, marquage silencieux', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('x'));
    await expect(service.shouldShowSoftPrompt()).resolves.toBe(false);
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('x'));
    await expect(service.markSoftPromptHandled()).resolves.toBeUndefined();
  });

  it('activateFromPrompt : permission → initialisation → enregistrement', async () => {
    mockApi.post.mockResolvedValueOnce({ success: true });
    await expect(service.activateFromPrompt()).resolves.toBe(true);
    expect(service.isServiceInitialized()).toBe(true);
    expect(mockApi.post).toHaveBeenCalledWith('/push-tokens', expect.any(Object));
  });

  it('activateFromPrompt : refus → faux, rien d’autre', async () => {
    permissions('denied', 1);
    await expect(service.activateFromPrompt()).resolves.toBe(false);
    expect(mockApi.post).not.toHaveBeenCalled();
  });
});

describe('checkAndReinitializePermissions', () => {
  it('autorisé sans jeton stocké : nouveau jeton et écouteurs', async () => {
    await expect(service.checkAndReinitializePermissions()).resolves.toBe(true);
    expect(service.isServiceInitialized()).toBe(true);
    expect(mockN.addNotificationReceivedListener).toHaveBeenCalledTimes(1);
    // Déjà initialisé : pas de nouveaux écouteurs
    await AsyncStorage.clear();
    await expect(service.checkAndReinitializePermissions()).resolves.toBe(true);
    expect(mockN.addNotificationReceivedListener).toHaveBeenCalledTimes(1);
  });

  it('autorisé mais jeton impossible : vrai quand même', async () => {
    mockN.getExpoPushTokenAsync.mockRejectedValueOnce(new Error('Firebase'));
    await expect(service.checkAndReinitializePermissions()).resolves.toBe(true);
    expect(service.isServiceInitialized()).toBe(false);
  });

  it('autorisé avec jeton stocké : écouteurs posés une fois', async () => {
    await AsyncStorage.setItem('expo_push_token', 'tok');
    await expect(service.checkAndReinitializePermissions()).resolves.toBe(true);
    await expect(service.checkAndReinitializePermissions()).resolves.toBe(true);
    expect(mockN.addNotificationReceivedListener).toHaveBeenCalledTimes(1);
    expect(mockN.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  it('permission retirée : jeton supprimé du serveur et du téléphone', async () => {
    await service.initialize();
    permissions('denied', 1);
    mockApi.delete.mockResolvedValueOnce({ success: true });
    await expect(service.checkAndReinitializePermissions()).resolves.toBe(false);
    expect(mockApi.delete).toHaveBeenCalledWith('/push-tokens', { token: 'ExponentPushToken[abc]' });
    expect(await AsyncStorage.getItem('expo_push_token')).toBeNull();
    expect(service.getToken()).toBeNull();
    expect(service.isServiceInitialized()).toBe(false);
  });

  it('permission retirée : erreurs de nettoyage tolérées', async () => {
    permissions('denied', 1);
    jest.spyOn(service, 'unregisterTokenFromDatabase').mockRejectedValueOnce(new Error('x'));
    jest.spyOn(AsyncStorage, 'removeItem').mockRejectedValueOnce(new Error('x'));
    await expect(service.checkAndReinitializePermissions()).resolves.toBe(false);
  });

  it('erreur inattendue → faux', async () => {
    jest.spyOn(service, 'ensureProvisional').mockRejectedValueOnce(new Error('x'));
    await expect(service.checkAndReinitializePermissions()).resolves.toBe(false);
  });
});

describe('écouteurs et navigation au tap', () => {
  beforeEach(async () => {
    await service.initialize();
    await settle();
  });

  it('ré-initialisation : les anciens écouteurs sont retirés (pas d’empilement)', async () => {
    await AsyncStorage.setItem('expo_push_token', 'tok');
    (service as any).isInitialized = false;
    await service.checkAndReinitializePermissions();
    expect(subscriptions).toHaveLength(4);
    expect(subscriptions[0].remove).toHaveBeenCalled();
    expect(subscriptions[1].remove).toHaveBeenCalled();
  });

  it('notification reçue : simplement journalisée', () => {
    receivedListener({ request: { content: { title: 'Salut' } } });
    expect(console.log).toHaveBeenCalledWith('📨 Notification reçue:', 'Salut');
  });

  it.each([
    'session_invitation', 'session_update', 'session_cancelled', 'session_organizer_changed', 'slot_availability',
    'slot_confirmed', 'slot_added', 'slot_removed', 'slot_reminder', 'slot_expired', 'reminder',
  ])('%s → écran de la session (ou accueil sans session)', async (type) => {
    responseListener(response({ type, session_id: 's1' }));
    responseListener(response({ type }));
    await settle();
    expect(mockRouter.navigate).toHaveBeenNthCalledWith(1, '/session/s1');
    expect(mockRouter.navigate).toHaveBeenNthCalledWith(2, '/(tabs)');
  });

  it.each(['chat_message', 'chat_mention', 'comment'])('%s → chat de la session (ou accueil)', async (type) => {
    responseListener(response({ type, sessionId: 's2' }));
    await settle();
    expect(mockRouter.navigate).toHaveBeenLastCalledWith('/chat/s2');
    activeChat.mount('s2');
    responseListener(response({ type, sessionId: 's2' }));
    await settle();
    expect(mockRouter.dismissTo).toHaveBeenLastCalledWith('/chat/s2');
    responseListener(response({ type }));
    await settle();
    expect(mockRouter.navigate).toHaveBeenLastCalledWith('/(tabs)');
  });

  it('friend_request → écran des demandes', async () => {
    responseListener(response({ type: 'friend_request' }));
    await settle();
    expect(mockRouter.navigate).toHaveBeenCalledWith('/friend-requests');
  });

  it('type inconnu : session si présente, sinon rien', async () => {
    responseListener(response({ type: 'nouveau', session_id: 's3' }));
    responseListener(response({ type: 'nouveau' }));
    await settle();
    expect(mockRouter.navigate).toHaveBeenCalledTimes(1);
    expect(mockRouter.navigate).toHaveBeenCalledWith('/session/s3');
  });

  it('données absentes : rien', async () => {
    responseListener(response(undefined));
    await settle();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('un même tap n’est traité qu’une fois ; sans identifiant, toujours traité', async () => {
    responseListener(response({ type: 'friend_request' }, 'meme'));
    responseListener(response({ type: 'friend_request' }, 'meme'));
    responseListener(response({ type: 'friend_request' }, ''));
    responseListener(response({ type: 'friend_request' }, ''));
    await settle();
    expect(mockRouter.navigate).toHaveBeenCalledTimes(3);
  });

  it('erreur de navigation : journalisée sans planter', async () => {
    mockRouter.navigate.mockImplementationOnce(() => { throw new Error('pas prêt'); });
    responseListener(response({ type: 'friend_request' }));
    await settle();
    expect(console.error).toHaveBeenCalledWith('❌ Erreur lors de la navigation:', expect.any(Error));
  });
});

describe('démarrage à froid', () => {
  it('traite la notification qui a lancé l’app', async () => {
    mockN.getLastNotificationResponseAsync.mockResolvedValueOnce(response({ type: 'friend_request' }, 'cold'));
    await service.initialize();
    await settle();
    expect(mockRouter.navigate).toHaveBeenCalledWith('/friend-requests');
  });

  it('erreur de lecture ignorée', async () => {
    mockN.getLastNotificationResponseAsync.mockRejectedValueOnce(new Error('x'));
    await service.initialize();
    await settle();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });
});

describe('notifications de test', () => {
  it('sendTestNotification : destinataire « self » par défaut', async () => {
    mockApi.post.mockResolvedValueOnce({ success: true });
    await expect(service.sendTestNotification()).resolves.toBe(true);
    expect(mockApi.post).toHaveBeenCalledWith('/notifications/send', expect.objectContaining({
      recipientId: 'self', title: 'Test Notification', data: expect.objectContaining({ type: 'general' }),
    }));
    mockApi.post.mockResolvedValueOnce({ success: false });
    await expect(service.sendTestNotification('u2')).resolves.toBe(false);
    expect(mockApi.post).toHaveBeenLastCalledWith('/notifications/send', expect.objectContaining({ recipientId: 'u2' }));
    mockApi.post.mockRejectedValueOnce(new Error('x'));
    await expect(service.sendTestNotification()).resolves.toBe(false);
  });

  it('sendTestCommentNotification : type comment avec la session', async () => {
    mockApi.post.mockResolvedValueOnce({ success: true });
    await expect(service.sendTestCommentNotification('s1')).resolves.toBe(true);
    expect(mockApi.post).toHaveBeenCalledWith('/notifications/send', expect.objectContaining({
      recipientId: 'self', data: expect.objectContaining({ type: 'comment', session_id: 's1' }),
    }));
    mockApi.post.mockResolvedValueOnce({});
    await expect(service.sendTestCommentNotification('s1', 'u2')).resolves.toBe(false);
    mockApi.post.mockRejectedValueOnce(new Error('x'));
    await expect(service.sendTestCommentNotification('s1')).resolves.toBe(false);
  });

  it('sendLocalNotification : immédiate, erreurs silencieuses', async () => {
    await service.sendLocalNotification({ title: 'T', body: 'B' });
    expect(mockN.scheduleNotificationAsync).toHaveBeenCalledWith({
      content: { title: 'T', body: 'B', data: {}, sound: 'default' },
      trigger: null,
    });
    await service.sendLocalNotification({ title: 'T', body: 'B', data: { type: 'x' } });
    expect(mockN.scheduleNotificationAsync).toHaveBeenLastCalledWith(expect.objectContaining({
      content: expect.objectContaining({ data: { type: 'x' } }),
    }));
    mockN.scheduleNotificationAsync.mockRejectedValueOnce(new Error('x'));
    await expect(service.sendLocalNotification({ title: 'T', body: 'B' })).resolves.toBeUndefined();
  });
});

describe('divers', () => {
  it('identifiant de l’appareil selon la plateforme', () => {
    expect((service as any).getDeviceId()).toBe('fr.sue.app');
    mockApplication.applicationId = null;
    expect((service as any).getDeviceId()).toBeNull();
    setOS('android');
    expect((service as any).getDeviceId()).toBe('android-id');
    mockApplication.getAndroidId.mockReturnValueOnce(null as any);
    expect((service as any).getDeviceId()).toBeNull();
    mockApplication.getAndroidId.mockImplementationOnce(() => { throw new Error('x'); });
    expect((service as any).getDeviceId()).toBeNull();
  });

  it('debugInfo n’affiche rien sans jeton, puis le jeton', async () => {
    service.debugInfo();
    expect(console.log).not.toHaveBeenCalled();
    await service.initialize();
    service.debugInfo();
    expect(console.log).toHaveBeenCalledWith('🔍 Debug - Token Expo:', 'ExponentPushToken[abc]');
  });

  it('cleanup se termine sans erreur', async () => {
    await expect(service.cleanup()).resolves.toBeUndefined();
  });
});
