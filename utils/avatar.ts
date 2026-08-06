import { ENV } from '../config/env';

/**
 * Formate l'URL de l'avatar pour s'assurer qu'elle est absolue et accessible par React Native.
 */
export function formatAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // Si c'est un URI de fichier local (iOS/Android local picker), on le laisse tel quel
  if (url.startsWith('file://') || url.startsWith('ph://') || url.startsWith('assets-library://')) {
    return url;
  }

  // Si c'est déjà une URL absolue complète (ex: http:// ou https://)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Nettoyer l'URL de base pour obtenir le domaine racine du backend (sans le suffixe /api)
  const baseUrl = ENV.API_BASE_URL.replace(/\/api\/?$/, '');

  // S'assurer qu'il y a un seul slash de séparation
  const cleanPath = url.startsWith('/') ? url : `/${url}`;

  return `${baseUrl}${cleanPath}`;
}
