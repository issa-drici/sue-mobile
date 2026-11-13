import { ENV } from '../../config/env';
import { baseApiService } from '../api/baseApi';
import { ChatMessage, ChatMeta, ChatPage } from './types';

/**
 * API du chat. Appelle fetch directement (et pas baseApiService) pour garder le code HTTP :
 * l'envoi d'un message doit distinguer « pas de réseau, on réessaiera » de « refusé par le
 * serveur, inutile de réessayer ».
 */
export class ChatApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }

  /** Coupure réseau, délai dépassé ou erreur serveur passagère : on peut renvoyer tel quel */
  get retryable(): boolean {
    return this.status === 0 || this.status === 408 || this.status === 429 || this.status >= 500;
  }
}

const TIMEOUT_MS = 15000;

function apiBaseUrl(): string {
  const base = ENV.API_BASE_URL;
  return process.env.NODE_ENV === 'production' ? base.replace('http://', 'https://') : base;
}

/** Racine du backend (sans /api) : la route d'authentification du temps réel n'est pas sous /api */
export function backendRootUrl(): string {
  return apiBaseUrl().replace(/\/api\/?$/, '');
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const token = baseApiService.getAuthToken();

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}${path}`, {
      method,
      headers: {
        ...ENV.DEFAULT_HEADERS,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    throw new ChatApiError('Pas de connexion', 0);
  } finally {
    clearTimeout(timer);
  }

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ChatApiError(json?.error?.message || json?.message || 'Erreur serveur', response.status);
  }
  return json.data as T;
}

const base = (sessionId: string) => `/sessions/${sessionId}/chat`;

export const chatApi = {
  getMeta: (sessionId: string) => request<ChatMeta>('GET', base(sessionId)),

  getLatest: (sessionId: string) => request<ChatPage>('GET', `${base(sessionId)}/messages`),

  getBefore: (sessionId: string, beforeId: number) =>
    request<ChatPage>('GET', `${base(sessionId)}/messages?before=${beforeId}`),

  getAfter: (sessionId: string, afterId: number) =>
    request<ChatPage>('GET', `${base(sessionId)}/messages?after=${afterId}`),

  send: (sessionId: string, clientId: string, body: string, mentions: string[]) =>
    request<ChatMessage>('POST', `${base(sessionId)}/messages`, { clientId, body, mentions }),

  markRead: (sessionId: string, messageId: number) =>
    request<null>('POST', `${base(sessionId)}/read`, { messageId }),

  setMuted: (sessionId: string, muted: boolean) =>
    request<{ muted: boolean }>('PUT', `${base(sessionId)}/mute`, { muted }),

  typing: (sessionId: string) => request<null>('POST', `${base(sessionId)}/typing`),
};

/** Identifiant créé par le téléphone pour chaque message (évite les doublons en cas de renvoi) */
export function newClientId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
