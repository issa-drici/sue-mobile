import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ENV } from '../../config/env';
import { SportSession } from '../../types/sport';
import { SessionsApi } from '../api/sessionsApi';

// Fonction de conversion de Session vers SportSession
function convertToSportSession(session: any): SportSession {
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
    organizer: {
      id: session.organizer?.id || '',
      firstname: organizerNameParts[0] || '',
      lastname: organizerNameParts.slice(1).join(' ') || '',
    },
    participants: participants,
    comments: (session.comments || []).map((comment: any) => ({
      id: comment.id,
      userId: comment.authorId || comment.userId || '',
      firstname: comment.authorName?.split(' ')[0] || comment.firstname || '',
      lastname: comment.authorName?.split(' ').slice(1).join(' ') || comment.lastname || '',
      content: comment.content,
      createdAt: comment.createdAt,
    })),
  };
}

export function useGetMyParticipations() {
  const [data, setData] = useState<SportSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (ENV.USE_MOCKS) {
        setData([]);
      } else {
        const response = await SessionsApi.getMyParticipations();
        
        const sessionsResponse = (response as any).data || response;
        const sessionsArray = Array.isArray(sessionsResponse) ? sessionsResponse : [];
        
        const convertedSessions = sessionsArray.map(convertToSportSession);
        
        setData(convertedSessions);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement de mes participations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
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