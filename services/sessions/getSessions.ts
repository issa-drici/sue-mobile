import { useCallback, useMemo } from 'react';
import { ENV } from '../../config/env';
import { useApiRequest } from '../../hooks/useApiRequest';
import { mockSessions } from '../../mocks/sessions';
import { SportSession } from '../../types/sport';
import { SessionsApi } from '../api/sessionsApi';

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
    organizer: {
      id: session.organizer?.id || '',
      firstname: organizerNames.firstname,
      lastname: organizerNames.lastname,
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

export function useGetSessions() {
  const fetchSessions = useCallback(async (): Promise<SportSession[]> => {
    if (ENV.USE_MOCKS) {
      return mockSessions;
    } else {
      const response = await SessionsApi.getAll();
      
      // Extraire les données de la réponse Laravel
      const sessionsResponse = (response as any).data || response;
      const sessionsArray = Array.isArray(sessionsResponse) ? sessionsResponse : [];
      
      // Convertir les vraies sessions
      const convertedSessions = sessionsArray.map(convertToSportSession);
      
      return convertedSessions;
    }
  }, []);

  // Stabiliser les options pour éviter les re-créations
  const options = useMemo(() => ({
    maxRetries: 5,
    retryDelay: 1000,
    enableRetry: true,
    onRetry: (attempt: number, error: any) => {
      console.log(`🔄 Tentative ${attempt}/5 pour charger les sessions:`, error.message);
    },
    onMaxRetriesReached: (error: any) => {
      console.error('❌ Échec après 5 tentatives pour charger les sessions:', error.message);
    },
  }), []);

  const result = useApiRequest(fetchSessions, options);
  
  // S'assurer que data est toujours un tableau
  return {
    ...result,
    data: result.data || [],
  };
} 