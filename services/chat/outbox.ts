import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';
import { ChatApiError, chatApi } from './chatApi';
import { ChatMessage } from './types';

/**
 * File d'attente des messages de chat pas encore confirmés par le serveur.
 *
 * Service global (et pas l'état d'un écran) pour que :
 *  - un message parte même si l'écran du chat a été fermé entre-temps : la file est renvoyée au
 *    retour du réseau et au retour de l'app au premier plan, pour toutes les sessions ;
 *  - une seule source écrive dans le stockage (pas d'écrasement par un écran périmé) ;
 *  - chaque utilisateur ait sa file : à la déconnexion elle est effacée, jamais envoyée sous le
 *    compte suivant.
 *
 * Les messages d'une session partent dans l'ordre, un à la fois. Le clientId rend les renvois sans
 * risque : le serveur ne crée jamais deux fois le même message.
 */
export interface PendingMessage {
  clientId: string;
  body: string;
  mentions: string[];
  createdAt: string;
  /** Refusé par le serveur (pas une coupure) : ne repart que si l'utilisateur le demande */
  rejected?: string;
}

const STORAGE_PREFIX = 'chat_outbox_';
const RETRY_DELAYS_MS = [2000, 5000, 10000, 20000, 30000];

let currentUserId: string | null = null;
const queues = new Map<string, PendingMessage[]>(); // par session, pour l'utilisateur courant
const loading = new Map<string, Promise<void>>();
const flushing = new Set<string>();
const retryTimers = new Map<string, ReturnType<typeof setTimeout>>();
const retryAttempts = new Map<string, number>();
const changeListeners = new Set<(sessionId: string) => void>();
const sentListeners = new Set<(sessionId: string, message: ChatMessage) => void>();

const storageKey = (userId: string, sessionId: string) => `${STORAGE_PREFIX}${userId}_${sessionId}`;

function emitChange(sessionId: string) {
  changeListeners.forEach((listener) => listener(sessionId));
}

function save(sessionId: string, items: PendingMessage[]) {
  queues.set(sessionId, items);
  emitChange(sessionId);
  if (!currentUserId) return;
  const key = storageKey(currentUserId, sessionId);
  (items.length ? AsyncStorage.setItem(key, JSON.stringify(items)) : AsyncStorage.removeItem(key)).catch(() => {});
}

function clearTimers() {
  retryTimers.forEach((timer) => clearTimeout(timer));
  retryTimers.clear();
  retryAttempts.clear();
}

async function load(sessionId: string): Promise<void> {
  if (!currentUserId || queues.has(sessionId)) return;
  const existing = loading.get(sessionId);
  if (existing) return existing;
  const userId = currentUserId;
  const promise = AsyncStorage.getItem(storageKey(userId, sessionId))
    .then((raw) => {
      if (userId !== currentUserId || queues.has(sessionId)) return;
      queues.set(sessionId, raw ? JSON.parse(raw) : []);
      emitChange(sessionId);
    })
    .catch(() => {
      if (userId === currentUserId && !queues.has(sessionId)) queues.set(sessionId, []);
    })
    .finally(() => loading.delete(sessionId));
  loading.set(sessionId, promise);
  return promise;
}

async function flush(sessionId: string): Promise<void> {
  if (!currentUserId || flushing.has(sessionId)) return;
  await load(sessionId);
  flushing.add(sessionId);
  const timer = retryTimers.get(sessionId);
  if (timer) {
    clearTimeout(timer);
    retryTimers.delete(sessionId);
  }
  const userId = currentUserId;

  try {
    while (userId === currentUserId) {
      const next = (queues.get(sessionId) ?? []).find((p) => !p.rejected);
      if (!next) break;
      try {
        const message = await chatApi.send(sessionId, next.clientId, next.body, next.mentions);
        if (userId !== currentUserId) break;
        retryAttempts.delete(sessionId);
        sentListeners.forEach((listener) => listener(sessionId, message));
        confirm(sessionId, [message.clientId]);
      } catch (error) {
        if (userId !== currentUserId) break;
        if (error instanceof ChatApiError && !error.retryable) {
          const reason = error.message;
          save(sessionId, (queues.get(sessionId) ?? []).map((p) => (p.clientId === next.clientId ? { ...p, rejected: reason } : p)));
          continue;
        }
        // Coupure : nouvel essai plus tard (et tout de suite si le réseau ou l'app reviennent)
        const attempt = retryAttempts.get(sessionId) ?? 0;
        retryAttempts.set(sessionId, attempt + 1);
        retryTimers.set(sessionId, setTimeout(() => flush(sessionId), RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)]));
        break;
      }
    }
  } finally {
    flushing.delete(sessionId);
  }
}

/** Retire de la file les messages que le serveur a confirmés (réponse, temps réel ou rattrapage) */
function confirm(sessionId: string, clientIds: string[]) {
  const items = queues.get(sessionId);
  if (!items?.length) return;
  const done = new Set(clientIds);
  if (items.some((p) => done.has(p.clientId))) {
    save(sessionId, items.filter((p) => !done.has(p.clientId)));
  }
}

/** Envoie les files de toutes les sessions de l'utilisateur courant (y compris celles jamais ouvertes depuis le lancement) */
async function flushAll(): Promise<void> {
  if (!currentUserId) return;
  const prefix = `${STORAGE_PREFIX}${currentUserId}_`;
  try {
    const keys = await AsyncStorage.getAllKeys();
    const sessionIds = new Set(keys.filter((k) => k.startsWith(prefix)).map((k) => k.slice(prefix.length)));
    queues.forEach((items, sessionId) => { if (items.length) sessionIds.add(sessionId); });
    sessionIds.forEach((sessionId) => { flush(sessionId); });
  } catch {
    // Stockage indisponible : on réessaiera au prochain réveil
  }
}

export const outbox = {
  /** Utilisateur connecté (null à la déconnexion). Appelé par le contexte d'authentification. */
  setUser(userId: string | null) {
    if (userId === currentUserId) return;
    currentUserId = userId;
    queues.clear();
    loading.clear();
    clearTimers();
    if (userId) flushAll();
  },

  /** Déconnexion : efface les files de tous les comptes de ce téléphone */
  async clearAll() {
    queues.clear();
    clearTimers();
    try {
      const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(STORAGE_PREFIX));
      if (keys.length) await AsyncStorage.multiRemove(keys);
    } catch {
      // ignoré
    }
  },

  load,
  flush,
  confirm,

  get(sessionId: string): PendingMessage[] {
    return queues.get(sessionId) ?? [];
  },

  async enqueue(sessionId: string, item: PendingMessage) {
    await load(sessionId);
    save(sessionId, [...(queues.get(sessionId) ?? []), item]);
    retryAttempts.delete(sessionId);
    flush(sessionId);
  },

  retry(sessionId: string, clientId: string) {
    save(sessionId, (queues.get(sessionId) ?? []).map((p) => (
      p.clientId === clientId ? { ...p, rejected: undefined, createdAt: new Date().toISOString() } : p
    )));
    retryAttempts.delete(sessionId);
    flush(sessionId);
  },

  discard(sessionId: string, clientId: string) {
    save(sessionId, (queues.get(sessionId) ?? []).filter((p) => p.clientId !== clientId));
  },

  onChange(listener: (sessionId: string) => void) {
    changeListeners.add(listener);
    return () => { changeListeners.delete(listener); };
  },

  onSent(listener: (sessionId: string, message: ChatMessage) => void) {
    sentListeners.add(listener);
    return () => { sentListeners.delete(listener); };
  },
};

// Réveils globaux : retour au premier plan et retour du réseau
AppState.addEventListener('change', (state) => {
  if (state === 'active') flushAll();
});
NetInfo.addEventListener((state) => {
  if (state.isConnected) {
    retryAttempts.clear();
    flushAll();
  }
});
