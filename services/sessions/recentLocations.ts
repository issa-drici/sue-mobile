import { useEffect, useState } from 'react';
import { useAuth } from '../../app/context/auth';
import { baseApiService } from '../api/baseApi';

const MAX_LOCATIONS = 10;

// Lieux des sessions auxquelles l'utilisateur a participé (organisateur ou inscrit),
// du plus récent au plus ancien, sans doublon. Sert aux raccourcis du champ "Lieu".
export function useRecentLocations() {
  const { user } = useAuth();
  const [locations, setLocations] = useState<string[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    const extract = (response: any): any[] => {
      const data = response?.data ?? response;
      return Array.isArray(data) ? data : [];
    };

    Promise.allSettled([
      baseApiService.get('/sessions/history?limit=50'),
      baseApiService.get('/sessions?limit=50'),
    ]).then((results) => {
      if (cancelled) return;
      const sessions = results.flatMap((r) => (r.status === 'fulfilled' ? extract(r.value) : []));

      const hasPlayed = (session: any) =>
        session.organizer?.id === user.id ||
        (session.participants || []).some((p: any) => p.id === user.id && p.status === 'accepted');

      const seen = new Set<string>();
      const recent = sessions
        .filter((s) => s.location && hasPlayed(s))
        .sort((a, b) => String(b.startDate || b.date).localeCompare(String(a.startDate || a.date)))
        .map((s) => String(s.location).trim())
        .filter((location) => {
          const key = location.toLowerCase();
          if (!location || seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .slice(0, MAX_LOCATIONS);

      setLocations(recent);
    });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return locations;
}
