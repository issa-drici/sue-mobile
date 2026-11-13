import Pusher, { Channel } from 'pusher-js';
import { ENV } from '../../config/env';
import { baseApiService } from '../api/baseApi';
import { backendRootUrl } from './chatApi';
import { ChatMessage } from './types';

/**
 * Temps réel du chat (serveur Soketi, protocole Pusher).
 *
 * Une seule connexion pour toute l'app, ouverte quand un chat s'affiche et fermée quand plus
 * aucun n'est affiché. Canal privé `session-chat.{id}` : le backend vérifie à l'abonnement que
 * l'utilisateur fait partie de la session. Un canal est partagé par tous les écrans qui l'écoutent
 * (chacun garde ses propres callbacks) et fermé quand le dernier se désabonne.
 *
 * Le temps réel n'est qu'un accélérateur : `onReady` est appelé à chaque (re)connexion pour que
 * le chat rattrape ce qu'il a pu manquer pendant la coupure.
 */
export interface ChatChannelHandlers {
  onMessage: (message: ChatMessage) => void;
  onTyping: (userId: string, firstname: string) => void;
  onRead: (userId: string, lastReadMessageId: number) => void;
  /** Abonnement actif (premier ou après une reconnexion) : moment de rattraper les messages */
  onReady: () => void;
  /** Accès refusé (plus membre de la session) */
  onForbidden?: () => void;
}

const SUBSCRIBE_RETRY_MS = 5000;
const MAX_SUBSCRIBE_RETRIES = 6;

interface Subscription {
  channel: Channel;
  handlers: Set<ChatChannelHandlers>;
  retries: number;
  forbidden: boolean;
}

let pusher: Pusher | null = null;
const subscriptions = new Map<string, Subscription>();

const channelName = (sessionId: string) => `private-session-chat.${sessionId}`;

function client(): Pusher {
  if (pusher) return pusher;

  pusher = new Pusher(ENV.PUSHER_APP_KEY, {
    cluster: 'mt1',
    wsHost: ENV.PUSHER_HOST,
    wsPort: parseInt(ENV.PUSHER_PORT, 10),
    wssPort: parseInt(ENV.PUSHER_PORT, 10),
    forceTLS: ENV.PUSHER_SCHEME === 'https',
    enabledTransports: ['ws', 'wss'],
    disableStats: true,
    channelAuthorization: {
      endpoint: `${backendRootUrl()}/broadcasting/auth`,
      transport: 'ajax',
      // Jeton lu à chaque abonnement : toujours celui de la session en cours
      customHandler: async ({ socketId, channelName: name }, callback) => {
        try {
          const token = baseApiService.getAuthToken();
          const response = await fetch(`${backendRootUrl()}/broadcasting/auth`, {
            method: 'POST',
            headers: {
              ...ENV.DEFAULT_HEADERS,
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ socket_id: socketId, channel_name: name }),
          });
          if (!response.ok) {
            const error: Error & { status?: number } = new Error(`Autorisation refusée (${response.status})`);
            error.status = response.status;
            callback(error, null);
            return;
          }
          callback(null, await response.json());
        } catch (error) {
          callback(error as Error, null);
        }
      },
    },
  });

  // Reconnexion après une coupure : chaque chat ouvert rattrape les messages manqués.
  // (Le premier abonnement est couvert par pusher:subscription_succeeded.)
  let wasConnected = false;
  pusher.connection.bind('state_change', ({ current }: { current: string }) => {
    if (current === 'connected') {
      if (wasConnected) {
        subscriptions.forEach((sub) => sub.handlers.forEach((h) => h.onReady()));
      }
      wasConnected = true;
    }
  });

  return pusher;
}

function createSubscription(sessionId: string): Subscription {
  const channel = client().subscribe(channelName(sessionId));
  const sub: Subscription = { channel, handlers: new Set(), retries: 0, forbidden: false };

  channel.bind('pusher:subscription_succeeded', () => {
    sub.retries = 0;
    sub.forbidden = false;
    sub.handlers.forEach((h) => h.onReady());
  });
  // Refus : 403 = plus membre, on n'insiste pas ; sinon (jeton pas prêt, serveur indisponible)
  // quelques nouvelles tentatives espacées, puis à chaque chargement réussi (retryChatSubscription)
  channel.bind('pusher:subscription_error', (error: { status?: number }) => {
    if (error?.status === 403) {
      sub.forbidden = true;
      sub.handlers.forEach((h) => h.onForbidden?.());
      return;
    }
    if (sub.retries < MAX_SUBSCRIBE_RETRIES) {
      sub.retries += 1;
      setTimeout(() => retryChatSubscription(sessionId), SUBSCRIBE_RETRY_MS);
    }
  });
  channel.bind('message.sent', (data: { message: ChatMessage }) => {
    if (data?.message) sub.handlers.forEach((h) => h.onMessage(data.message));
  });
  channel.bind('user.typing', (data: { userId: string; firstname: string }) => {
    if (data?.userId) sub.handlers.forEach((h) => h.onTyping(data.userId, data.firstname));
  });
  channel.bind('read.updated', (data: { userId: string; lastReadMessageId: number }) => {
    if (data?.userId) sub.handlers.forEach((h) => h.onRead(data.userId, data.lastReadMessageId));
  });

  subscriptions.set(sessionId, sub);
  return sub;
}

/** Réessaie l'abonnement s'il a échoué (sans effet s'il est actif, en cours, ou refusé pour de bon) */
export function retryChatSubscription(sessionId: string, force = false): void {
  const sub = subscriptions.get(sessionId);
  if (!sub || !pusher || sub.channel.subscribed || sub.channel.subscriptionPending) return;
  if (sub.forbidden && !force) return;
  pusher.subscribe(sub.channel.name);
}

export function subscribeToChat(sessionId: string, handlers: ChatChannelHandlers): () => void {
  const sub = subscriptions.get(sessionId) ?? createSubscription(sessionId);
  sub.handlers.add(handlers);
  // Canal déjà actif (ouvert par un autre écran) : ce nouvel écran doit aussi rattraper
  if (sub.channel.subscribed) handlers.onReady();

  return () => {
    const current = subscriptions.get(sessionId);
    if (!current) return;
    current.handlers.delete(handlers);
    if (current.handlers.size > 0) return;
    current.channel.unbind_all();
    pusher?.unsubscribe(channelName(sessionId));
    subscriptions.delete(sessionId);
    if (subscriptions.size === 0 && pusher) {
      pusher.disconnect();
      pusher = null;
    }
  };
}
