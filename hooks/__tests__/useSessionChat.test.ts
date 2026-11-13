/**
 * Chat d'une session : cache du téléphone, synchronisation et rattrapage, temps réel, file
 * d'attente des messages, réseau, premier plan, lecture, frappe, anciens messages.
 */
import NetInfo from '@react-native-community/netinfo';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AppState } from 'react-native';
import type { ChatCache } from '../../services/chat/messageCache';
import type { PendingMessage } from '../../services/chat/outbox';
import type { ChatChannelHandlers } from '../../services/chat/realtime';
import type { ChatMessage } from '../../services/chat/types';
import { useSessionChat } from '../useSessionChat';

class MockChatApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

const mockChatApi = {
  getMeta: jest.fn(),
  getLatest: jest.fn(),
  getAfter: jest.fn(),
  getBefore: jest.fn(),
  typing: jest.fn(),
  markRead: jest.fn(),
};
jest.mock('../../services/chat/chatApi', () => ({
  get ChatApiError() { return MockChatApiError; },
  get chatApi() { return mockChatApi; },
  newClientId: () => 'new-client-id',
}));

const mockCache = { peek: jest.fn(), load: jest.fn(), update: jest.fn() };
jest.mock('../../services/chat/messageCache', () => ({ get messageCache() { return mockCache; } }));

const pendingStore: Record<string, PendingMessage[]> = {};
let changeCb: ((sessionId: string) => void) | null = null;
let sentCb: ((sessionId: string, message: ChatMessage) => void) | null = null;
const offChange = jest.fn();
const offSent = jest.fn();
const mockOutbox = {
  get: jest.fn((s: string) => pendingStore[s] ?? []),
  setUser: jest.fn(),
  onChange: jest.fn((cb) => { changeCb = cb; return offChange; }),
  onSent: jest.fn((cb) => { sentCb = cb; return offSent; }),
  load: jest.fn(() => Promise.resolve()),
  flush: jest.fn(),
  confirm: jest.fn(),
  enqueue: jest.fn(),
  retry: jest.fn(),
  discard: jest.fn(),
};
jest.mock('../../services/chat/outbox', () => ({ get outbox() { return mockOutbox; } }));

let handlers: ChatChannelHandlers | null = null;
const unsubscribe = jest.fn();
const mockSubscribe = jest.fn((_s: string, h: ChatChannelHandlers) => { handlers = h; return unsubscribe; });
const mockRetrySub = jest.fn();
jest.mock('../../services/chat/realtime', () => ({
  subscribeToChat: (s: string, h: ChatChannelHandlers) => mockSubscribe(s, h),
  retryChatSubscription: (...args: unknown[]) => mockRetrySub(...args),
}));

const SESSION = 's1';
const ME = { id: 'u1', firstname: 'Moi' };

const msg = (id: number, over: Partial<ChatMessage> = {}): ChatMessage => ({
  id,
  clientId: `c${id}`,
  sessionId: SESSION,
  senderId: 'u2',
  senderFirstname: 'Bob',
  body: `m${id}`,
  mentions: [],
  createdAt: '2026-01-01T10:00:00.000Z',
  ...over,
} as ChatMessage);

const cache = (over: Partial<ChatCache> = {}): ChatCache => ({
  messages: [msg(10), msg(11)],
  members: [{ id: 'u2' } as never],
  reads: { u2: 10 },
  myLastReadId: 10,
  hasOlder: true,
  header: { title: 'Tennis', subtitle: 'Lundi' },
  ...over,
});

const meta = (over = {}) => ({ members: [{ id: 'u2' }, { id: 'u1' }], reads: { u2: 2 }, lastReadMessageId: 1, ...over });

let netListener: ((s: { isConnected: boolean | null; isInternetReachable: boolean | null }) => void) | null = null;
const netUnsub = jest.fn();
let appListener: ((s: string) => void) | null = null;
const appRemove = jest.fn();

beforeEach(() => {
  jest.useRealTimers();
  Object.values(mockChatApi).forEach((f) => f.mockReset());
  Object.values(mockCache).forEach((f) => f.mockReset());
  [offChange, offSent, unsubscribe, mockRetrySub, netUnsub, appRemove, mockSubscribe].forEach((f) => f.mockClear());
  Object.values(mockOutbox).forEach((f) => f.mockClear());
  Object.keys(pendingStore).forEach((k) => delete pendingStore[k]);
  changeCb = null;
  sentCb = null;
  handlers = null;

  mockChatApi.getMeta.mockResolvedValue(meta());
  mockChatApi.getLatest.mockResolvedValue({ messages: [msg(2), msg(1)], hasMore: true });
  mockChatApi.getAfter.mockResolvedValue({ messages: [], hasMore: false });
  mockChatApi.getBefore.mockResolvedValue({ messages: [], hasMore: false });
  mockChatApi.typing.mockResolvedValue(undefined);
  mockChatApi.markRead.mockResolvedValue(undefined);
  mockCache.peek.mockReturnValue(undefined);
  mockCache.load.mockResolvedValue(null);

  (NetInfo.addEventListener as jest.Mock).mockImplementation((cb) => { netListener = cb; return netUnsub; });
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_t, cb) => {
    appListener = cb as never;
    return { remove: appRemove } as never;
  });
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

const flush = () => act(async () => { await new Promise((r) => jest.requireActual('timers').setImmediate(r)); });
const settle = async () => { for (let i = 0; i < 5; i++) await flush(); };

describe('ouverture sans cache', () => {
  it('charge les derniers messages, les infos du chat et se marque synchronisé', async () => {
    const { result } = renderHook(() => useSessionChat(SESSION, ME));
    expect(result.current.hydrated).toBe(false);
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.synced).toBe(true));

    expect(mockOutbox.setUser).toHaveBeenCalledWith('u1');
    expect(mockCache.load).toHaveBeenCalledWith('u1', SESSION);
    expect(mockChatApi.getLatest).toHaveBeenCalledWith(SESSION);
    expect(mockChatApi.getAfter).toHaveBeenCalledWith(SESSION, 2);
    expect(result.current.messages.map((m) => [m.id, m.status])).toEqual([[1, 'sent'], [2, 'sent']]);
    expect(result.current.members).toEqual(meta().members);
    expect(result.current.reads).toEqual({ u2: 2 });
    expect(result.current.initialLastReadId).toBe(1);
    expect(result.current.initialLatestId).toBe(2);
    expect(result.current.hasOlder).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.hydrated).toBe(true);
    expect(result.current.loadError).toBeNull();
    expect(mockRetrySub).toHaveBeenCalledWith(SESSION, true);
    expect(mockOutbox.confirm).toHaveBeenCalledWith(SESSION, ['c2', 'c1']);
    expect(mockOutbox.flush).toHaveBeenCalledWith(SESSION);
    // Gardé sur le téléphone
    expect(mockCache.update).toHaveBeenLastCalledWith('u1', SESSION, expect.objectContaining({
      messages: expect.arrayContaining([expect.objectContaining({ id: 1 }), expect.objectContaining({ id: 2 })]),
      hasOlder: true,
    }));
  });

  it('meta sans reads : objet vide', async () => {
    mockChatApi.getMeta.mockResolvedValue(meta({ reads: undefined }));
    const { result } = renderHook(() => useSessionChat(SESSION, ME));
    await waitFor(() => expect(result.current.synced).toBe(true));
    expect(result.current.reads).toEqual({});
  });

  it('rattrape page par page tant qu’il y en a', async () => {
    mockChatApi.getAfter
      .mockResolvedValueOnce({ messages: [msg(3)], hasMore: true })
      .mockResolvedValueOnce({ messages: [msg(4)], hasMore: true })
      .mockResolvedValueOnce({ messages: [], hasMore: true });
    const { result } = renderHook(() => useSessionChat(SESSION, ME));
    await waitFor(() => expect(result.current.synced).toBe(true));
    expect(mockChatApi.getAfter.mock.calls.map((c) => c[1])).toEqual([2, 3, 4]);
    expect(result.current.messages.map((m) => m.id)).toEqual([1, 2, 3, 4]);
    expect(result.current.initialLatestId).toBe(4);
  });

  it('cache du téléphone chargé : affiché, puis seule la suite est demandée', async () => {
    mockCache.load.mockResolvedValue(cache());
    const { result } = renderHook(() => useSessionChat(SESSION, ME));
    await waitFor(() => expect(result.current.synced).toBe(true));
    expect(mockChatApi.getLatest).not.toHaveBeenCalled();
    expect(mockChatApi.getAfter).toHaveBeenCalledWith(SESSION, 11);
    expect(result.current.header).toEqual({ title: 'Tennis', subtitle: 'Lundi' });
    expect(result.current.initialLastReadId).toBe(10);
    expect(result.current.messages.map((m) => m.id)).toEqual([10, 11]);
  });

  it('cache du téléphone vide : reste en chargement jusqu’au serveur', async () => {
    mockCache.load.mockResolvedValue(cache({ messages: [] }));
    let resolveMeta: (v: unknown) => void = () => {};
    mockChatApi.getMeta.mockImplementation(() => new Promise((r) => { resolveMeta = r; }));
    const { result } = renderHook(() => useSessionChat(SESSION, ME));
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.loading).toBe(true);
    await act(async () => { resolveMeta(meta()); });
    await waitFor(() => expect(result.current.loading).toBe(false));
  });
});

describe('ouverture avec un cache en mémoire', () => {
  it('affiche tout de suite sans attendre', async () => {
    mockCache.peek.mockReturnValue(cache());
    const { result } = renderHook(() => useSessionChat(SESSION, ME));
    expect(result.current.hydrated).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.messages.map((m) => m.id)).toEqual([10, 11]);
    expect(result.current.header?.title).toBe('Tennis');
    expect(result.current.initialLastReadId).toBe(10);
    await waitFor(() => expect(result.current.synced).toBe(true));
    expect(mockCache.load).not.toHaveBeenCalled();
    // le dernier lu en cache est gardé, pas remplacé par celui du serveur
    expect(result.current.initialLastReadId).toBe(10);
  });

  it('erreur réseau avec un cache : pas de message d’erreur', async () => {
    mockCache.peek.mockReturnValue(cache());
    mockChatApi.getMeta.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useSessionChat(SESSION, ME));
    await settle();
    expect(result.current.loadError).toBeNull();
    expect(result.current.synced).toBe(false);
  });
});

describe('erreurs de chargement', () => {
  it('403 : n’est plus membre', async () => {
    mockChatApi.getMeta.mockRejectedValue(new MockChatApiError('forbidden', 403));
    const { result } = renderHook(() => useSessionChat(SESSION, ME));
    await waitFor(() => expect(result.current.loadError).toBe('Tu ne fais plus partie de cette session.'));
    expect(result.current.loading).toBe(false);
  });

  it('sans cache ni réseau : impossible de charger', async () => {
    mockChatApi.getMeta.mockRejectedValue(new MockChatApiError('down', 500));
    const { result } = renderHook(() => useSessionChat(SESSION, ME));
    await waitFor(() => expect(result.current.loadError).toBe('Impossible de charger la discussion.'));
  });

  it('rattrapage en échec : pas synchronisé, et resynchronise au retour du réseau', async () => {
    mockChatApi.getAfter.mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useSessionChat(SESSION, ME));
    await settle();
    expect(result.current.synced).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.initialLatestId).toBeNull();
    await act(async () => { netListener!({ isConnected: true, isInternetReachable: true }); });
    await waitFor(() => expect(result.current.synced).toBe(true));
    expect(mockChatApi.getMeta).toHaveBeenCalledTimes(2);
  });
});

describe('sans utilisateur connecté', () => {
  it('ne touche ni à la file ni au cache, et n’envoie rien', async () => {
    const { result } = renderHook(() => useSessionChat(SESSION, null));
    expect(result.current.hydrated).toBe(true);
    await waitFor(() => expect(result.current.synced).toBe(true));
    expect(mockOutbox.setUser).not.toHaveBeenCalled();
    expect(mockCache.peek).not.toHaveBeenCalled();
    expect(mockCache.load).not.toHaveBeenCalled();
    expect(mockCache.update).not.toHaveBeenCalled();
    act(() => { result.current.send('salut', []); });
    expect(mockOutbox.enqueue).not.toHaveBeenCalled();
    act(() => { result.current.setHeader('T', 'S', null); });
    expect(result.current.header).toEqual({ title: 'T', subtitle: 'S' });
    act(() => { result.current.markRead(); });
    expect(mockChatApi.markRead).toHaveBeenCalledWith(SESSION, 2);
    expect(mockCache.update).not.toHaveBeenCalled();
  });

  it('les messages en attente sans utilisateur ont un auteur vide', async () => {
    pendingStore[SESSION] = [{ clientId: 'p1', body: 'x', mentions: [], createdAt: new Date().toISOString() }];
    const { result } = renderHook(() => useSessionChat(SESSION, null));
    await settle();
    const p = result.current.messages.find((m) => m.clientId === 'p1')!;
    expect(p.senderId).toBe('');
    expect(p.senderFirstname).toBeNull();
  });
});

describe('rafraîchissement', () => {
  it('une fois synchronisé, le retour au premier plan rattrape et met à jour les infos', async () => {
    const { result } = renderHook(() => useSessionChat(SESSION, ME));
    await waitFor(() => expect(result.current.synced).toBe(true));
    mockChatApi.getAfter.mockResolvedValueOnce({ messages: [msg(3)], hasMore: false });
    mockChatApi.getMeta.mockResolvedValueOnce(meta({ reads: { u2: 3 }, members: [{ id: 'u9' }] }));
    await act(async () => { appListener!('background'); });
    expect(mockChatApi.getAfter).toHaveBeenCalledTimes(1);
    await act(async () => { appListener!('active'); });
    await waitFor(() => expect(result.current.reads).toEqual({ u2: 3 }));
    expect(result.current.members).toEqual([{ id: 'u9' }]);
    expect(result.current.messages.map((m) => m.id)).toEqual([1, 2, 3]);
  });

  it('erreur des infos ignorée, reads absents → objet vide', async () => {
    const { result } = renderHook(() => useSessionChat(SESSION, ME));
    await waitFor(() => expect(result.current.synced).toBe(true));
    mockChatApi.getMeta.mockRejectedValueOnce(new Error('x'));
    await act(async () => { handlers!.onReady!(); });
    await settle();
    mockChatApi.getMeta.mockResolvedValueOnce(meta({ reads: undefined }));
    await act(async () => { handlers!.onReady!(); });
    await waitFor(() => expect(result.current.reads).toEqual({}));
  });

  it('hors ligne : messages en attente « en attente du réseau »', async () => {
    pendingStore[SESSION] = [{ clientId: 'p1', body: 'x', mentions: [], createdAt: new Date().toISOString() }];
    const { result } = renderHook(() => useSessionChat(SESSION, ME));
    await waitFor(() => expect(result.current.synced).toBe(true));
    await act(async () => { netListener!({ isConnected: false, isInternetReachable: null }); });
    expect(result.current.isOnline).toBe(false);
    expect(result.current.messages.find((m) => m.clientId === 'p1')!.status).toBe('waiting');
    await act(async () => { netListener!({ isConnected: true, isInternetReachable: false }); });
    expect(result.current.isOnline).toBe(false);
    await act(async () => { netListener!({ isConnected: null, isInternetReachable: null }); });
    expect(result.current.isOnline).toBe(true);
  });

  it('reload relance une synchronisation, une seule à la fois', async () => {
    const { result } = renderHook(() => useSessionChat(SESSION, ME));
    await waitFor(() => expect(result.current.synced).toBe(true));
    let resolveMeta: (v: unknown) => void = () => {};
    mockChatApi.getMeta.mockImplementation(() => new Promise((r) => { resolveMeta = r; }));
    act(() => { result.current.reload(); result.current.reload(); });
    expect(mockChatApi.getMeta).toHaveBeenCalledTimes(2);
    await act(async () => { resolveMeta(meta()); });
    await settle();
  });

  it('un seul rattrapage à la fois', async () => {
    const { result } = renderHook(() => useSessionChat(SESSION, ME));
    await waitFor(() => expect(result.current.synced).toBe(true));
    let resolveAfter: (v: unknown) => void = () => {};
    mockChatApi.getAfter.mockImplementation(() => new Promise((r) => { resolveAfter = r; }));
    await act(async () => { appListener!('active'); appListener!('active'); });
    expect(mockChatApi.getAfter).toHaveBeenCalledTimes(2);
    await act(async () => { resolveAfter({ messages: [], hasMore: false }); });
    await settle();
  });
});

describe('temps réel', () => {
  it('ajoute un message reçu et efface l’indicateur de frappe de son auteur', async () => {
    const { result } = renderHook(() => useSessionChat(SESSION, ME));
    await waitFor(() => expect(result.current.synced).toBe(true));
    act(() => { handlers!.onTyping!('u2', 'Bob'); handlers!.onTyping!('u3', 'Zoé'); });
    expect(result.current.typingUsers).toEqual([{ id: 'u2', firstname: 'Bob' }, { id: 'u3', firstname: 'Zoé' }]);
    act(() => { handlers!.onMessage!(msg(5)); });
    expect(result.current.messages.map((m) => m.id)).toEqual([1, 2, 5]);
    expect(result.current.typingUsers).toEqual([{ id: 'u3', firstname: 'Zoé' }]);
    // message d'un auteur qui n'écrivait pas : indicateur inchangé
    act(() => { handlers!.onMessage!(msg(6, { senderId: 'u8' })); });
    expect(result.current.typingUsers).toEqual([{ id: 'u3', firstname: 'Zoé' }]);
  });

  it('ignore ma propre frappe', async () => {
    const { result } = renderHook(() => useSessionChat(SESSION, ME));
    await settle();
    act(() => { handlers!.onTyping!('u1', 'Moi'); });
    expect(result.current.typingUsers).toEqual([]);
  });

  it('l’indicateur de frappe expire au bout de 5 s', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useSessionChat(SESSION, ME));
    await act(async () => { await jest.advanceTimersByTimeAsync(0); });
    act(() => { handlers!.onTyping!('u2', 'Bob'); });
    await act(async () => { await jest.advanceTimersByTimeAsync(3000); });
    expect(result.current.typingUsers).toHaveLength(1);
    await act(async () => { await jest.advanceTimersByTimeAsync(3000); });
    expect(result.current.typingUsers).toHaveLength(0);
  });

  it('accusés de lecture : ne recule jamais', async () => {
    const { result } = renderHook(() => useSessionChat(SESSION, ME));
    await waitFor(() => expect(result.current.synced).toBe(true));
    act(() => { handlers!.onRead!('u2', 5); });
    expect(result.current.reads.u2).toBe(5);
    act(() => { handlers!.onRead!('u2', 3); });
    expect(result.current.reads.u2).toBe(5);
    act(() => { handlers!.onRead!('u7', 1); });
    expect(result.current.reads.u7).toBe(1);
  });

  it('accès refusé : message d’erreur', async () => {
    const { result } = renderHook(() => useSessionChat(SESSION, ME));
    await settle();
    act(() => { handlers!.onForbidden!(); });
    expect(result.current.loadError).toBe('Tu ne fais plus partie de cette session.');
  });
});

describe('file d’attente', () => {
  it('affiche les messages en attente, met à jour sur changement et confirme à l’envoi', async () => {
    const createdAt = new Date().toISOString();
    pendingStore[SESSION] = [{ clientId: 'p1', body: 'coucou', mentions: ['u2'], createdAt }];
    const { result } = renderHook(() => useSessionChat(SESSION, ME));
    await waitFor(() => expect(result.current.synced).toBe(true));
    const p = result.current.messages[result.current.messages.length - 1];
    expect(p).toMatchObject({ id: null, clientId: 'p1', senderId: 'u1', senderFirstname: 'Moi', status: 'sending', mentions: ['u2'] });

    pendingStore[SESSION] = [...pendingStore[SESSION], { clientId: 'p2', body: 'refusé', mentions: [], createdAt, rejected: 'Trop long' }];
    act(() => { changeCb!('autre'); });
    expect(result.current.messages.some((m) => m.clientId === 'p2')).toBe(false);
    act(() => { changeCb!(SESSION); });
    expect(result.current.messages.find((m) => m.clientId === 'p2')!.status).toBe('failed');
    expect(result.current.rejectionReason('p2')).toBe('Trop long');
    expect(result.current.rejectionReason('p1')).toBeNull();

    // envoyé : la version serveur remplace celle en attente
    act(() => { sentCb!('autre', msg(50, { clientId: 'p1' })); });
    expect(result.current.messages.some((m) => m.id === 50)).toBe(false);
    act(() => { sentCb!(SESSION, msg(50, { clientId: 'p1', senderId: 'u1' })); });
    const p1 = result.current.messages.filter((m) => m.clientId === 'p1');
    expect(p1).toHaveLength(1);
    expect(p1[0]).toMatchObject({ id: 50, status: 'sent' });
    expect(mockOutbox.confirm).toHaveBeenLastCalledWith(SESSION, ['p1']);
  });

  it('un message pas parti après 30 s s’affiche « non envoyé »', async () => {
    jest.useFakeTimers();
    pendingStore[SESSION] = [{ clientId: 'p1', body: 'x', mentions: [], createdAt: new Date().toISOString() }];
    const { result } = renderHook(() => useSessionChat(SESSION, ME));
    await act(async () => { await jest.advanceTimersByTimeAsync(0); });
    expect(result.current.messages.find((m) => m.clientId === 'p1')!.status).toBe('sending');
    await act(async () => { await jest.advanceTimersByTimeAsync(31000); });
    expect(result.current.messages.find((m) => m.clientId === 'p1')!.status).toBe('failed');
  });

  it('send nettoie le texte et ignore un message vide ; retry / discard délèguent', async () => {
    const { result } = renderHook(() => useSessionChat(SESSION, ME));
    await settle();
    act(() => { result.current.send('   ', []); });
    expect(mockOutbox.enqueue).not.toHaveBeenCalled();
    act(() => { result.current.send('  salut  ', ['u2']); });
    expect(mockOutbox.enqueue).toHaveBeenCalledWith(SESSION, {
      clientId: 'new-client-id', body: 'salut', mentions: ['u2'], createdAt: expect.any(String),
    });
    act(() => { result.current.retry('p1'); result.current.discard('p2'); });
    expect(mockOutbox.retry).toHaveBeenCalledWith(SESSION, 'p1');
    expect(mockOutbox.discard).toHaveBeenCalledWith(SESSION, 'p2');
  });
});

describe('anciens messages', () => {
  it('charge les messages précédant le plus ancien', async () => {
    mockChatApi.getBefore.mockResolvedValue({ messages: [msg(0)], hasMore: false });
    const { result } = renderHook(() => useSessionChat(SESSION, ME));
    await waitFor(() => expect(result.current.synced).toBe(true));
    await act(async () => { await result.current.loadOlder(); });
    expect(mockChatApi.getBefore).toHaveBeenCalledWith(SESSION, 1);
    expect(result.current.messages[0].id).toBe(0);
    expect(result.current.hasOlder).toBe(false);
    expect(result.current.loadingOlder).toBe(false);
    // plus rien avant
    await act(async () => { await result.current.loadOlder(); });
    expect(mockChatApi.getBefore).toHaveBeenCalledTimes(1);
  });

  it('erreur réseau ignorée (réessai au prochain défilement)', async () => {
    mockChatApi.getBefore.mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useSessionChat(SESSION, ME));
    await waitFor(() => expect(result.current.synced).toBe(true));
    await act(async () => { await result.current.loadOlder(); });
    expect(result.current.hasOlder).toBe(true);
    expect(result.current.loadingOlder).toBe(false);
  });

  it('ne fait rien sans message connu', async () => {
    mockCache.peek.mockReturnValue(cache({ messages: [], hasOlder: true }));
    mockChatApi.getMeta.mockImplementation(() => new Promise(() => {}));
    const { result } = renderHook(() => useSessionChat(SESSION, ME));
    await act(async () => { await result.current.loadOlder(); });
    expect(mockChatApi.getBefore).not.toHaveBeenCalled();
  });

  it('ignore un second appel pendant un chargement', async () => {
    let resolve: (v: unknown) => void = () => {};
    mockChatApi.getBefore.mockImplementation(() => new Promise((r) => { resolve = r; }));
    const { result } = renderHook(() => useSessionChat(SESSION, ME));
    await waitFor(() => expect(result.current.synced).toBe(true));
    act(() => { result.current.loadOlder(); });
    expect(result.current.loadingOlder).toBe(true);
    await act(async () => { await result.current.loadOlder(); });
    expect(mockChatApi.getBefore).toHaveBeenCalledTimes(1);
    await act(async () => { resolve({ messages: [], hasMore: true }); });
  });
});

describe('frappe et lecture', () => {
  it('prévient les autres au plus toutes les 3 s', async () => {
    jest.useFakeTimers();
    mockChatApi.typing.mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useSessionChat(SESSION, ME));
    act(() => { result.current.notifyTyping(); result.current.notifyTyping(); });
    expect(mockChatApi.typing).toHaveBeenCalledTimes(1);
    await act(async () => { await jest.advanceTimersByTimeAsync(3000); });
    act(() => { result.current.notifyTyping(); });
    expect(mockChatApi.typing).toHaveBeenCalledTimes(2);
  });

  it('marque comme lu jusqu’au dernier message, une seule fois, et réessaie après un échec', async () => {
    const { result } = renderHook(() => useSessionChat(SESSION, ME));
    await waitFor(() => expect(result.current.synced).toBe(true));
    act(() => { result.current.markRead(); });
    expect(mockChatApi.markRead).toHaveBeenCalledWith(SESSION, 2);
    expect(mockCache.update).toHaveBeenCalledWith('u1', SESSION, { myLastReadId: 2 });
    act(() => { result.current.markRead(); });
    expect(mockChatApi.markRead).toHaveBeenCalledTimes(1);

    mockChatApi.markRead.mockRejectedValueOnce(new Error('x'));
    act(() => { handlers!.onMessage!(msg(3)); });
    await act(async () => { result.current.markRead(); });
    await settle();
    act(() => { result.current.markRead(); });
    expect(mockChatApi.markRead).toHaveBeenCalledTimes(3);
  });

  it('setHeader garde le titre et la fin de session dans le cache', async () => {
    const { result } = renderHook(() => useSessionChat(SESSION, ME));
    act(() => { result.current.setHeader('Padel', 'Mardi', '2026-02-01T10:00:00Z'); });
    expect(result.current.header).toEqual({ title: 'Padel', subtitle: 'Mardi' });
    expect(mockCache.update).toHaveBeenCalledWith('u1', SESSION, {
      header: { title: 'Padel', subtitle: 'Mardi' }, endsAt: '2026-02-01T10:00:00Z',
    });
    await settle();
  });
});

describe('fermeture', () => {
  it('se désabonne de tout au démontage', async () => {
    const { unmount } = renderHook(() => useSessionChat(SESSION, ME));
    await settle();
    unmount();
    expect(offChange).toHaveBeenCalled();
    expect(offSent).toHaveBeenCalled();
    expect(unsubscribe).toHaveBeenCalled();
    expect(appRemove).toHaveBeenCalled();
    expect(netUnsub).toHaveBeenCalled();
  });

  it('ignore les réponses arrivées après la fermeture', async () => {
    let resolveMeta: (v: unknown) => void = () => {};
    let resolveLoad: (v: unknown) => void = () => {};
    let resolveOutbox: () => void = () => {};
    mockOutbox.load.mockImplementationOnce(() => new Promise<void>((r) => { resolveOutbox = r; }));
    mockCache.load.mockImplementationOnce(() => new Promise((r) => { resolveLoad = r; }));
    mockChatApi.getMeta.mockImplementation(() => new Promise((r) => { resolveMeta = r; }));
    const { unmount, result } = renderHook(() => useSessionChat(SESSION, ME));
    unmount();
    await act(async () => { resolveOutbox(); resolveLoad(cache()); });
    expect(mockOutbox.flush).not.toHaveBeenCalled();
    expect(result.current.messages).toEqual([]);
    // la synchronisation n'a pas démarré (fermé avant) : on la lance à la main pour couvrir le retour tardif
    act(() => { result.current.reload(); });
    await act(async () => { resolveMeta(meta()); });
    // réception d'un message après fermeture : ignorée
    act(() => { handlers!.onMessage!(msg(9)); handlers!.onForbidden!(); });
    expect(result.current.loadError).toBeNull();
  });

  it('fermé pendant le rattrapage ou après une erreur : n’écrit plus rien', async () => {
    let resolveAfter: (v: unknown) => void = () => {};
    mockChatApi.getAfter.mockImplementationOnce(() => new Promise((r) => { resolveAfter = r; }));
    const a = renderHook(() => useSessionChat(SESSION, ME));
    await waitFor(() => expect(mockChatApi.getAfter).toHaveBeenCalled());
    a.unmount();
    await act(async () => { resolveAfter({ messages: [msg(3)], hasMore: true }); });
    expect(mockRetrySub).not.toHaveBeenCalled();

    let rejectMeta: (e: unknown) => void = () => {};
    mockChatApi.getMeta.mockImplementationOnce(() => new Promise((_, r) => { rejectMeta = r; }));
    const b = renderHook(() => useSessionChat(SESSION, ME));
    await waitFor(() => expect(mockChatApi.getMeta).toHaveBeenCalledTimes(2));
    b.unmount();
    await act(async () => { rejectMeta(new Error('x')); });
    expect(b.result.current.loadError).toBeNull();

    // infos du rafraîchissement arrivées après la fermeture
    const c = renderHook(() => useSessionChat(SESSION, ME));
    await waitFor(() => expect(c.result.current.synced).toBe(true));
    let resolveMeta2: (v: unknown) => void = () => {};
    mockChatApi.getMeta.mockImplementationOnce(() => new Promise((r) => { resolveMeta2 = r; }));
    await act(async () => { appListener!('active'); });
    c.unmount();
    await act(async () => { resolveMeta2(meta({ reads: { u2: 99 } })); });
    expect(c.result.current.reads).toEqual({ u2: 2 });
  });
});
