import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
import { ENV } from '../../config/env';
import { mockSessions } from '../../mocks/sessions';
import { SportSession } from '../../types/sport';
import { SessionsApi } from '../api/sessionsApi';
import { formatAvatarUrl } from '../../utils';

// Fonction de conversion de Session vers SportSession
function convertToSportSession(session: any): SportSession {
  // Fonction pour extraire firstname et lastname de fullName
  const extractNames = (fullName: string | undefined | null) => {
    if (!fullName || typeof fullName !== 'string') {
      return { firstname: 'Utilisateur', lastname: '' };
    }
    const parts = fullName.split(' ');
    const lastname = parts.pop() || '';
    const firstname = parts.join(' ') || '';
    return { firstname, lastname };
  };

  // Adapter selon la structure réelle de l'API
  const organizerNames = extractNames(session.organizer?.fullName);
  
  // Convertir les participants selon la structure réelle de l'API
  const participants = (session.participants || []).map((participant: any) => {
    const participantNames = extractNames(participant.fullName);
    
    return {
      id: participant.id || '',
      firstname: participantNames.firstname,
      lastname: participantNames.lastname,
      status: participant.status || 'pending',
      avatar: formatAvatarUrl(participant.avatar || participant.avatarUrl) || null,
      hasGivenAvailability: !!participant.hasGivenAvailability,
      hasNewSlots: !!participant.hasNewSlots,
    };
  });
  
  return {
    id: session.id,
    sport: session.sport,
    date: session.date,
    startTime: session.startTime || session.time || '18:00',
    endTime: session.endTime || '20:00',
    location: session.location,
    maxParticipants: session.maxParticipants,
    pricePerPerson: session.pricePerPerson,
    status: session.status, // Ajouter le champ status
    shareToken: session.shareToken, // Token de partage (Universal Links)
    scheduling: session.scheduling,
    slotProposals: session.slotProposals || [],
    organizer: {
      id: session.organizer?.id || '',
      firstname: organizerNames.firstname,
      lastname: organizerNames.lastname,
      avatar: formatAvatarUrl(session.organizer?.avatar || session.organizer?.avatarUrl) || null,
    },
    participants: participants,
    comments: (session.comments || []).map((comment: any) => {
      const commentNames = extractNames(comment.fullName);
      return {
        id: comment.id,
        userId: comment.authorId || comment.userId || '',
        firstname: commentNames.firstname,
        lastname: commentNames.lastname,
        content: comment.content,
        createdAt: comment.createdAt,
      };
    }),
  };
}

/**
 * Sessions déjà connues (fiches ouvertes, liste de l'accueil) : une fiche s'affiche tout de suite,
 * puis se met à jour en silence. Jamais d'écran de chargement pour une session déjà vue.
 */
const sessionCache = new Map<string, SportSession>();

/** L'accueil y dépose ses sessions : ouvrir une carte affiche la fiche sans attendre */
export function primeSessionCache(sessions: SportSession[]) {
  sessions.forEach((session) => {
    // Une fiche déjà chargée en entier (lien de partage…) n'est pas remplacée par la version liste
    const known = sessionCache.get(session.id);
    sessionCache.set(session.id, known ? { ...session, shareToken: known.shareToken } : session);
  });
}

export function clearSessionCache() {
  sessionCache.clear();
}

export function useGetSessionById() {
  const [data, setData] = useState<SportSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const dataRef = useRef<SportSession | null>(null);
  dataRef.current = data;

  const getSessionById = useCallback(async (id: string, showLoading = true) => {
    setCurrentSessionId(id);
    // Déjà connue : affichée tout de suite, rechargée en silence
    const known = dataRef.current?.id === id ? dataRef.current : sessionCache.get(id) ?? null;
    if (known && dataRef.current?.id !== id) {
      dataRef.current = known;
      setData(known);
    }
    if (showLoading && !known) {
      setIsLoading(true);
    }
    setError(null);

    try {
      if (ENV.USE_MOCKS) {
        const session = mockSessions.find(s => s.id === id);
        setData(session || null);
        return session || null;
      } else {
        const response = await SessionsApi.getById(id);
        
        // Extraire les données de la réponse Laravel
        const sessionData = (response as any).data || response;
        
        const sportSession = convertToSportSession(sessionData);
        sessionCache.set(id, sportSession);
        setData(sportSession);
        
        
        return sportSession;
      }
    } catch (err: any) {
      const status = (err as { status?: number })?.status;
      if (status === 404 || status === 403) {
        // Session supprimée ou plus accessible : on ne la montre plus, même depuis la mémoire
        sessionCache.delete(id);
        dataRef.current = null;
        setData(null);
        setError(err.message || 'Session introuvable');
      } else if (dataRef.current?.id !== id) {
        setError(err.message || 'Erreur lors du chargement de la session');
      }
      // Sinon (réseau, serveur) : la fiche déjà affichée reste, sans message
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Recharger la session quand l'écran est focusé
  useFocusEffect(
    useCallback(() => {
      if (currentSessionId) {
        getSessionById(currentSessionId, !dataRef.current);
      }
    }, [currentSessionId, getSessionById])
  );

  return {
    data,
    isLoading,
    error,
    getSessionById,
  };
} 