import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ENV } from '../../config/env';
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
  const [data, setData] = useState<SportSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (ENV.USE_MOCKS) {
        setData(mockSessions);
      } else {
        const response = await SessionsApi.getAll();
        
        // Extraire les données de la réponse Laravel
        const sessionsResponse = (response as any).data || response;
        const sessionsArray = Array.isArray(sessionsResponse) ? sessionsResponse : [];
        
        // Convertir les vraies sessions
        const convertedSessions = sessionsArray.map(convertToSportSession);
        
        setData(convertedSessions);
      }
    } catch (err: any) {
      // Ne pas afficher l'erreur si c'est une erreur d'authentification
      if (err.message !== 'Unauthenticated.') {
        setError(err.message || 'Erreur lors du chargement des sessions');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Recharger à chaque focus (comportement original)
      fetchSessions();
    }, [fetchSessions])
  );

  return {
    data,
    isLoading,
    error,
    refetch: fetchSessions,
  };
} 