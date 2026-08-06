import AsyncStorage from '@react-native-async-storage/async-storage';

// Clé de stockage du lien de partage en attente (parcours "je clique sur le lien
// mais je ne suis pas encore connecté"). Il persiste à travers l'authentification,
// puis est consommé pour rediriger vers la session. On stocke le token ET le
// paramètre `from` (identité de la personne qui a partagé le lien).
const PENDING_SHARE_TOKEN_KEY = 'pending_share_token';

export interface PendingShareLink {
  token: string;
  from?: string | null;
}

/**
 * Extrait le token de partage d'une URL de type https://sue-app.fr/join/{token}
 * (ou sue://join/{token}). Retourne null si l'URL ne correspond pas.
 */
export function extractShareToken(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(/\/join\/([^/?#]+)/);
  if (match && match[1]) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }
  return null;
}

/**
 * Extrait le paramètre ?from={userId} d'une URL de partage (la personne qui invite).
 */
export function extractFromParam(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(/[?&]from=([^&#]+)/);
  if (match && match[1]) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }
  return null;
}

export async function setPendingShareToken(token: string, from?: string | null): Promise<void> {
  try {
    await AsyncStorage.setItem(
      PENDING_SHARE_TOKEN_KEY,
      JSON.stringify({ token, from: from ?? null })
    );
  } catch (error) {
    console.warn('⚠️ Impossible de stocker le lien de partage en attente:', error);
  }
}

export async function getPendingShareToken(): Promise<PendingShareLink | null> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_SHARE_TOKEN_KEY);
    if (!raw) return null;
    // Rétro-compat : une ancienne version stockait un simple token (string)
    if (raw[0] !== '{') {
      return { token: raw, from: null };
    }
    const obj = JSON.parse(raw);
    return obj?.token ? { token: obj.token, from: obj.from ?? null } : null;
  } catch {
    return null;
  }
}

export async function clearPendingShareToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PENDING_SHARE_TOKEN_KEY);
  } catch {
    // silencieux
  }
}
