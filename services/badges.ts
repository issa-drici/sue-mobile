import { useCallback, useEffect, useState } from 'react';
import { baseApiService } from './api/baseApi';

// Badges (gamification) : calculés par le serveur à partir de l'activité.

export interface Badge {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
  target: number;
  seen?: boolean; // seulement pour ses propres badges
}

export const fetchBadges = async (userId?: string): Promise<Badge[]> => {
  const response = await baseApiService.get<{ data: Badge[] }>(userId ? `/users/${userId}/badges` : '/badges');
  return response.data ?? [];
};

export const markBadgesSeen = (badgeIds: string[]) =>
  baseApiService.post('/badges/seen', { badgeIds });

/** Badges d'un joueur (soi-même si userId absent), rechargés quand refreshKey change */
export function useBadges(userId?: string, refreshKey: unknown = null) {
  const [badges, setBadges] = useState<Badge[] | null>(null);

  const reload = useCallback(() => {
    fetchBadges(userId).then(setBadges).catch(() => setBadges([]));
  }, [userId]);

  useEffect(() => {
    reload();
  }, [reload, refreshKey]);

  return { badges, reload };
}
