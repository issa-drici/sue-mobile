import NetInfo from '@react-native-community/netinfo';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { ChatApiError, chatApi, newClientId } from '../services/chat/chatApi';
import { ChatCache, messageCache } from '../services/chat/messageCache';
import { PendingMessage, outbox } from '../services/chat/outbox';
import { retryChatSubscription, subscribeToChat } from '../services/chat/realtime';
import { ChatMember, ChatMessage, DisplayMessage } from '../services/chat/types';

/**
 * État d'un chat de session.
 *
 * Règles qui le rendent fiable et sans à-coup :
 *  - les derniers messages sont gardés sur le téléphone (services/chat/messageCache) : le chat
 *    s'affiche instantanément à l'ouverture, même sans réseau, puis seuls les nouveaux messages
 *    sont demandés au serveur et s'ajoutent en bas ;
 *  - la base reste la référence : à l'ouverture, au retour au premier plan et à chaque reconnexion
 *    du temps réel, on rattrape tout ce qui suit le dernier message connu (`after`) ;
 *  - un message envoyé s'affiche tout de suite et part dans la file d'attente globale
 *    (services/chat/outbox) : gardée sur le téléphone, renvoyée toute seule au retour du réseau,
 *    même si ce chat a été fermé. Son clientId empêche les doublons côté serveur ;
 *  - « moi » = l'auteur décidé par le serveur (senderId) comparé à l'id de l'utilisateur connecté.
 */

const TYPING_VISIBLE_MS = 5000;
const TYPING_SEND_INTERVAL_MS = 3000;
// Au-delà, un message pas encore parti alors que le réseau est là s'affiche « non envoyé »
// (il repart quand même tout seul)
const SHOW_FAILED_AFTER_MS = 30000;

const toMap = (messages: ChatMessage[]) => new Map(messages.map((m) => [m.id, m]));

export function useSessionChat(sessionId: string, currentUser: { id: string; firstname?: string } | null) {
  const userId = currentUser?.id ?? null;
  // Cache déjà en mémoire (chat déjà ouvert, ou préchargé depuis la fiche session) : affichage immédiat
  const [initialCache] = useState<ChatCache | undefined>(() => (userId ? messageCache.peek(userId, sessionId) : undefined));

  const [serverMessages, setServerMessages] = useState<Map<number, ChatMessage>>(() => toMap(initialCache?.messages ?? []));
  const [pending, setPending] = useState<PendingMessage[]>(() => outbox.get(sessionId));
  const [members, setMembers] = useState<ChatMember[]>(initialCache?.members ?? []);
  const [reads, setReads] = useState<Record<string, number>>(initialCache?.reads ?? {});
  const [initialLastReadId, setInitialLastReadId] = useState<number | null>(initialCache ? initialCache.myLastReadId : null);
  // Dernier message connu une fois la première synchronisation faite : « Nouveaux messages » ne
  // marque que ce qui attendait à l'ouverture, pas ce qui arrive pendant qu'on lit.
  // null = pas encore synchronisé (les messages rattrapés à l'ouverture comptent comme non lus).
  const [initialLatestId, setInitialLatestId] = useState<number | null>(null);
  // Le cache du téléphone a été lu (ou il n'y en a pas) : on peut afficher quelque chose
  const [hydrated, setHydrated] = useState(!userId || !!initialCache);
  const [loading, setLoading] = useState(!initialCache?.messages.length);
  const [synced, setSynced] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasOlder, setHasOlder] = useState(initialCache?.hasOlder ?? false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [header, setHeaderState] = useState(initialCache?.header);
  const [typing, setTyping] = useState<Record<string, { firstname: string; until: number }>>({});
  const [now, setNow] = useState(Date.now());
  const [isOnline, setIsOnline] = useState(true);

  // Miroir synchrone des messages confirmés : les callbacks (temps réel, rattrapage) doivent
  // toujours voir le dernier état, y compris juste après un ajout dans le même tick
  const serverRef = useRef(serverMessages);
  const syncedRef = useRef(false);
  const syncingRef = useRef(false);
  const catchingUpRef = useRef(false);
  const lastTypingSentRef = useRef(0);
  const lastMarkedReadRef = useRef(0);
  const mountedRef = useRef(true);

  const maxServerId = () => {
    let max = 0;
    serverRef.current.forEach((_, id) => { if (id > max) max = id; });
    return max;
  };

  /** Ajoute des messages confirmés par le serveur et retire leur version « en attente » */
  const addServerMessages = useCallback((messages: ChatMessage[]) => {
    if (!messages.length || !mountedRef.current) return;
    const next = new Map(serverRef.current);
    messages.forEach((m) => next.set(m.id, m));
    serverRef.current = next;
    setServerMessages(next);
    outbox.confirm(sessionId, messages.map((m) => m.clientId));
    // Un message reçu efface « est en train d'écrire » pour son auteur
    setTyping((prev) => {
      const authors = messages.map((m) => m.senderId).filter((id) => prev[id]);
      if (!authors.length) return prev;
      const copy = { ...prev };
      authors.forEach((id) => delete copy[id]);
      return copy;
    });
  }, [sessionId]);

  /** Tout ce qui a été posté depuis le dernier message connu. Renvoie false si le réseau a manqué. */
  const catchUp = useCallback(async (): Promise<boolean> => {
    if (catchingUpRef.current) return true;
    catchingUpRef.current = true;
    try {
      let hasMore = true;
      while (hasMore && mountedRef.current) {
        const page = await chatApi.getAfter(sessionId, maxServerId());
        addServerMessages(page.messages);
        hasMore = page.hasMore && page.messages.length > 0;
      }
      return true;
    } catch {
      return false; // hors ligne : on réessaiera à la prochaine reconnexion / au retour au premier plan
    } finally {
      catchingUpRef.current = false;
    }
  }, [sessionId, addServerMessages]);

  /**
   * Synchronisation avec le serveur : infos du chat + messages. Avec un cache, on ne demande que
   * la suite (rien ne bouge à l'écran, les nouveaux s'ajoutent en bas) ; sans cache, les derniers.
   */
  const sync = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setLoadError(null);
    try {
      const fromCache = serverRef.current.size > 0;
      const [meta, page] = await Promise.all([
        chatApi.getMeta(sessionId),
        fromCache ? Promise.resolve(null) : chatApi.getLatest(sessionId),
      ]);
      if (!mountedRef.current) return;
      setMembers(meta.members);
      setReads(meta.reads ?? {});
      setInitialLastReadId((current) => current ?? meta.lastReadMessageId);
      if (page) {
        setHasOlder(page.hasMore);
        addServerMessages(page.messages);
      }
      // Ce qui a été posté depuis : depuis le cache, ou entre les deux requêtes. Part bien du dernier
      // message connu : le miroir est mis à jour de façon synchrone par addServerMessages
      const caughtUp = await catchUp();
      if (!mountedRef.current) return;
      if (caughtUp) {
        syncedRef.current = true;
        setSynced(true);
        setInitialLatestId((current) => current ?? maxServerId());
      }
      setLoading(false);
      retryChatSubscription(sessionId, true);
    } catch (error) {
      if (!mountedRef.current) return;
      setLoading(false);
      if (error instanceof ChatApiError && error.status === 403) {
        setLoadError('Tu ne fais plus partie de cette session.');
      } else if (serverRef.current.size === 0) {
        // Sans cache ni réseau : rien à montrer. Avec un cache, on reste dessus sans message d'erreur
        // (le sous-titre dit « En attente du réseau… »), et on resynchronise dès que possible.
        setLoadError('Impossible de charger la discussion.');
      }
    } finally {
      syncingRef.current = false;
    }
  }, [sessionId, addServerMessages, catchUp]);

  /** Retour du réseau / de l'app / du temps réel : resynchronise si besoin, sinon rattrape */
  const refresh = useCallback(() => {
    if (!syncedRef.current) {
      sync();
      return;
    }
    catchUp();
    chatApi.getMeta(sessionId).then((meta) => {
      if (!mountedRef.current) return;
      setReads(meta.reads ?? {});
      setMembers(meta.members);
    }).catch(() => {});
  }, [sessionId, sync, catchUp]);

  // Ouverture : cache du téléphone, file d'attente, synchronisation, temps réel
  useEffect(() => {
    mountedRef.current = true;
    // Ouvert au démarrage depuis une notification, l'écran peut passer avant le contexte
    // d'authentification : on rattache la file à l'utilisateur ici aussi (sans effet si déjà fait)
    if (userId) outbox.setUser(userId);

    const offChange = outbox.onChange((changed) => {
      if (changed === sessionId) setPending(outbox.get(sessionId));
    });
    const offSent = outbox.onSent((sentSession, message) => {
      if (sentSession === sessionId) addServerMessages([message]);
    });
    outbox.load(sessionId).then(() => {
      if (!mountedRef.current) return;
      setPending(outbox.get(sessionId));
      outbox.flush(sessionId);
    });

    (async () => {
      if (userId && !initialCache) {
        const cache = await messageCache.load(userId, sessionId);
        if (!mountedRef.current) return;
        if (cache) {
          serverRef.current = toMap(cache.messages);
          setServerMessages(serverRef.current);
          setMembers(cache.members);
          setReads(cache.reads);
          setHasOlder(cache.hasOlder);
          setHeaderState(cache.header);
          setInitialLastReadId(cache.myLastReadId);
          if (cache.messages.length) setLoading(false);
        }
        setHydrated(true);
      }
      sync();
    })();

    const unsubscribe = subscribeToChat(sessionId, {
      onMessage: (message) => addServerMessages([message]),
      onTyping: (typingUserId, firstname) => {
        if (typingUserId === userId) return;
        setTyping((prev) => ({ ...prev, [typingUserId]: { firstname, until: Date.now() + TYPING_VISIBLE_MS } }));
      },
      onRead: (readerId, lastReadMessageId) => {
        setReads((prev) => (lastReadMessageId > (prev[readerId] ?? 0) ? { ...prev, [readerId]: lastReadMessageId } : prev));
      },
      onReady: refresh,
      onForbidden: () => {
        if (mountedRef.current) setLoadError('Tu ne fais plus partie de cette session.');
      },
    });

    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });

    const netSub = NetInfo.addEventListener((state) => {
      const online = state.isConnected !== false && state.isInternetReachable !== false;
      setIsOnline(online);
      if (online) refresh();
    });

    return () => {
      mountedRef.current = false;
      offChange();
      offSent();
      unsubscribe();
      appStateSub.remove();
      netSub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Garder sur le téléphone ce que le serveur a confirmé (pour la prochaine ouverture)
  useEffect(() => {
    if (!userId || !hydrated) return;
    messageCache.update(userId, sessionId, {
      messages: Array.from(serverMessages.values()),
      members,
      reads,
      hasOlder,
    });
  }, [userId, sessionId, hydrated, serverMessages, members, reads, hasOlder]);

  // Horloge : expiration de « est en train d'écrire » et passage en « non envoyé »
  useEffect(() => {
    const timer = setInterval(() => {
      const t = Date.now();
      setNow(t);
      setTyping((prev) => {
        const expired = Object.keys(prev).filter((id) => prev[id].until <= t);
        if (!expired.length) return prev;
        const copy = { ...prev };
        expired.forEach((id) => delete copy[id]);
        return copy;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const send = useCallback((body: string, mentions: string[]) => {
    const text = body.trim();
    if (!text || !currentUser) return;
    outbox.enqueue(sessionId, {
      clientId: newClientId(),
      body: text,
      mentions,
      createdAt: new Date().toISOString(),
    });
  }, [sessionId, currentUser]);

  const retry = useCallback((clientId: string) => outbox.retry(sessionId, clientId), [sessionId]);
  const discard = useCallback((clientId: string) => outbox.discard(sessionId, clientId), [sessionId]);

  const loadOlder = useCallback(async () => {
    if (loadingOlder || !hasOlder) return;
    let minId = Infinity;
    serverRef.current.forEach((_, id) => { if (id < minId) minId = id; });
    if (!isFinite(minId)) return;
    setLoadingOlder(true);
    try {
      const page = await chatApi.getBefore(sessionId, minId);
      addServerMessages(page.messages);
      setHasOlder(page.hasMore);
    } catch {
      // On réessaiera au prochain défilement
    } finally {
      setLoadingOlder(false);
    }
  }, [sessionId, loadingOlder, hasOlder, addServerMessages]);

  /** À appeler à chaque frappe : prévient les autres au plus toutes les 3 s */
  const notifyTyping = useCallback(() => {
    const t = Date.now();
    if (t - lastTypingSentRef.current < TYPING_SEND_INTERVAL_MS) return;
    lastTypingSentRef.current = t;
    chatApi.typing(sessionId).catch(() => {});
  }, [sessionId]);

  /** Marque comme lu jusqu'au dernier message (à appeler seulement quand le chat est réellement affiché) */
  const markRead = useCallback(() => {
    const latest = maxServerId();
    if (latest > lastMarkedReadRef.current) {
      lastMarkedReadRef.current = latest;
      if (userId) messageCache.update(userId, sessionId, { myLastReadId: latest });
      chatApi.markRead(sessionId, latest).catch(() => {
        lastMarkedReadRef.current = 0; // réessai au prochain affichage / message
      });
    }
  }, [sessionId, userId]);

  /**
   * Titre du chat (sport, date) et fin de la session, gardés avec le cache : titre affiché tout de
   * suite à la prochaine ouverture, cache effacé un jour après la fin de la session
   */
  const setHeader = useCallback((title: string, subtitle: string, endsAt: string | null) => {
    setHeaderState({ title, subtitle });
    if (userId) messageCache.update(userId, sessionId, { header: { title, subtitle }, endsAt });
  }, [sessionId, userId]);

  /** Messages du plus ancien au plus récent : confirmés, puis ceux en attente */
  const messages: DisplayMessage[] = useMemo(() => {
    const confirmed: DisplayMessage[] = Array.from(serverMessages.values())
      .sort((a, b) => a.id - b.id)
      .map((m) => ({ ...m, status: 'sent' }));
    const confirmedIds = new Set(confirmed.map((m) => m.clientId));
    const waiting: DisplayMessage[] = pending
      .filter((p) => !confirmedIds.has(p.clientId))
      .map((p) => ({
        id: null,
        clientId: p.clientId,
        sessionId,
        senderId: currentUser?.id ?? '',
        senderFirstname: currentUser?.firstname ?? null,
        body: p.body,
        mentions: p.mentions,
        createdAt: p.createdAt,
        status: p.rejected
          ? 'failed'
          : !isOnline
            ? 'waiting'
            : now - new Date(p.createdAt).getTime() > SHOW_FAILED_AFTER_MS ? 'failed' : 'sending',
      }));
    return [...confirmed, ...waiting];
  }, [serverMessages, pending, sessionId, currentUser?.id, currentUser?.firstname, now, isOnline]);

  const rejectionReason = useCallback(
    (clientId: string) => pending.find((p) => p.clientId === clientId)?.rejected ?? null,
    [pending]
  );

  const typingUsers = useMemo(
    () => Object.entries(typing)
      .filter(([id]) => id !== currentUser?.id)
      .map(([id, t]) => ({ id, firstname: t.firstname })),
    [typing, currentUser?.id]
  );

  return {
    messages,
    members,
    reads,
    hydrated,
    loading,
    synced,
    loadError,
    hasOlder,
    loadingOlder,
    typingUsers,
    isOnline,
    initialLastReadId,
    initialLatestId,
    header,
    setHeader,
    send,
    retry,
    discard,
    rejectionReason,
    loadOlder,
    notifyTyping,
    markRead,
    reload: sync,
  };
}
