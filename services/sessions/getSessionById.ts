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

export function useGetSessionById() {
  const [data, setData] = useState<SportSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const dataRef = useRef<SportSession | null>(null);
  dataRef.current = data;

  const getSessionById = useCallback(async (id: string, showLoading = true) => {
    setCurrentSessionId(id);
    if (showLoading) {
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
        setData(sportSession);
        
        
        return sportSession;
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement de la session');
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