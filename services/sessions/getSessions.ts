import { useCallback, useMemo } from 'react';
import { ENV } from '../../config/env';
import { useApiRequest } from '../../hooks/useApiRequest';
import { mockSessions } from '../../mocks/sessions';
import { SportSession } from '../../types/sport';
import { SessionsApi } from '../api/sessionsApi';

// Fonction de conversion de Session vers SportSession
function convertToSportSession(session: any): SportSession {
  // Adapter selon la structure réelle de l'API
  const organizerName = session.organizer?.fullName || 'Organisateur';
  const organizerNameParts = organizerName.split(' ');
  
  // Convertir les participants selon la structure réelle de l'API
  const participants = (session.participants || []).map((participant: any) => {
    const participantName = participant.fullName || 'Participant';
    const nameParts = participantName.split(' ');
    
    return {
      id: participant.id || '',
      firstname: nameParts[0] || '',
      lastname: nameParts.slice(1).join(' ') || '',
      status: participant.status || 'pending',
    };
  });
  
  return {
    id: session.id,
    sport: session.sport,
    date: session.date,
    time: session.time,
    location: session.location,
    maxParticipants: session.maxParticipants,
    status: session.status, // Ajouter le champ status
    organizer: {
      id: session.organizer?.id || '',
      firstname: organizerNameParts[0] || '',
      lastname: organizerNameParts.slice(1).join(' ') || '',
    },
    participants: participants,
    comments: (session.comments || []).map((comment: any) => ({
      id: comment.id,
      userId: comment.authorId || comment.userId || '',
      firstname: comment.fullName?.split(' ')[0] || '',
      lastname: comment.fullName?.split(' ').slice(1).join(' ') || '',
      content: comment.content,
      createdAt: comment.createdAt,
    })),
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