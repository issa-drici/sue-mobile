import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMember, ChatMessage } from './types';

/**
 * Derniers messages de chaque chat gardés sur le téléphone, comme WhatsApp ou Snapchat :
 * le chat s'affiche instantanément à l'ouverture (même sans réseau), puis seuls les nouveaux
 * messages sont demandés au serveur.
 *
 * Deux niveaux : la mémoire (lecture synchrone, aucun délai d'affichage) et AsyncStorage (survit à
 * la fermeture de l'app). Propre à chaque utilisateur, effacé à la déconnexion.
 */
export interface ChatCache {
  messages: ChatMessage[];
  members: ChatMember[];
  reads: Record<string, number>;
  /** Jusqu'où j'avais lu : séparateur « Nouveaux messages » dès l'ouverture */
  myLastReadId: number;
  hasOlder: boolean;
  header?: { title: string; subtitle: string };
  /** Fin de la session (ISO) : le cache est effacé un jour après (session plus accessible) */
  endsAt?: string | null;
  /** Dernière mise à jour (ms) : filet de sécurité pour les sessions sans date de fin connue */
  updatedAt?: number;
}

const STORAGE_PREFIX = 'chat_cache_';
const MAX_MESSAGES = 120; // par chat : de quoi remplir plusieurs écrans sans peser sur le téléphone
const SAVE_DELAY_MS = 400;
// Une session terminée n'est plus accessible : son chat est effacé du téléphone ce délai après la fin
// (délai à ajuster plus tard)
const KEEP_AFTER_END_MS = 24 * 60 * 60 * 1000;
// Sessions sans date de fin connue (créneau jamais trouvé) : effacées après ce délai sans ouverture
const KEEP_UNDATED_MS = 30 * 24 * 60 * 60 * 1000;

const memory = new Map<string, ChatCache>();
const pendingSaves = new Map<string, ReturnType<typeof setTimeout>>();

const keyOf = (userId: string, sessionId: string) => `${STORAGE_PREFIX}${userId}_${sessionId}`;

export const messageCache = {
  /** Lecture instantanée (déjà en mémoire), ou undefined s'il faut d'abord charger depuis le stockage */
  peek(userId: string, sessionId: string): ChatCache | undefined {
    return memory.get(keyOf(userId, sessionId));
  },

  /** Charge depuis le stockage (sans effet si déjà en mémoire) */
  async load(userId: string, sessionId: string): Promise<ChatCache | null> {
    const key = keyOf(userId, sessionId);
    const inMemory = memory.get(key);
    if (inMemory) return inMemory;
    try {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return null;
      const cache: ChatCache = JSON.parse(raw);
      if (!memory.has(key)) memory.set(key, cache);
      return memory.get(key) ?? null;
    } catch {
      return null;
    }
  },

  /** À appeler en amont (fiche session) pour que l'ouverture du chat soit instantanée */
  preload(userId: string, sessionId: string) {
    messageCache.load(userId, sessionId);
  },

  /** Met à jour le cache (mémoire tout de suite, stockage peu après, regroupé) */
  update(userId: string, sessionId: string, patch: Partial<ChatCache>) {
    const key = keyOf(userId, sessionId);
    const current: ChatCache = memory.get(key) ?? { messages: [], members: [], reads: {}, myLastReadId: 0, hasOlder: false };
    const next: ChatCache = { ...current, ...patch, updatedAt: Date.now() };
    if (patch.messages) {
      // On garde les plus récents ; s'il en reste d'autres plus anciens, l'historique se recharge en remontant
      const sorted = [...patch.messages].sort((a, b) => a.id - b.id);
      next.messages = sorted.slice(-MAX_MESSAGES);
      if (sorted.length > MAX_MESSAGES) next.hasOlder = true;
    }
    memory.set(key, next);

    const timer = pendingSaves.get(key);
    if (timer) clearTimeout(timer);
    pendingSaves.set(key, setTimeout(() => {
      pendingSaves.delete(key);
      const latest = memory.get(key);
      if (latest) AsyncStorage.setItem(key, JSON.stringify(latest)).catch(() => {});
    }, SAVE_DELAY_MS));
  },

  /**
   * Efface le cache des sessions terminées depuis plus d'un jour (elles ne sont plus accessibles).
   * Appelé au démarrage de l'app et à la connexion.
   */
  async prune(userId: string) {
    const prefix = `${STORAGE_PREFIX}${userId}_`;
    try {
      const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(prefix));
      if (!keys.length) return;
      const now = Date.now();
      const expired = (await AsyncStorage.multiGet(keys))
        .filter(([, raw]) => {
          if (!raw) return true;
          try {
            const cache: ChatCache = JSON.parse(raw);
            if (cache.endsAt) return new Date(cache.endsAt).getTime() + KEEP_AFTER_END_MS < now;
            return !!cache.updatedAt && cache.updatedAt + KEEP_UNDATED_MS < now;
          } catch {
            return true; // illisible : inutile de le garder
          }
        })
        .map(([key]) => key);
      if (!expired.length) return;
      expired.forEach((key) => {
        memory.delete(key);
        const timer = pendingSaves.get(key);
        if (timer) clearTimeout(timer);
        pendingSaves.delete(key);
      });
      await AsyncStorage.multiRemove(expired);
    } catch {
      // Stockage indisponible : on réessaiera au prochain démarrage
    }
  },

  /** Déconnexion : rien ne reste sur le téléphone pour le compte suivant */
  async clearAll() {
    memory.clear();
    pendingSaves.forEach((timer) => clearTimeout(timer));
    pendingSaves.clear();
    try {
      const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(STORAGE_PREFIX));
      if (keys.length) await AsyncStorage.multiRemove(keys);
    } catch {
      // ignoré
    }
  },
};
