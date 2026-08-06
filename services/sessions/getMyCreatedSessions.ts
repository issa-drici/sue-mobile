import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ENV } from '../../config/env';
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

  const organizerNames = extractNames(session.organizer?.fullName);
  
  // Convertir les participants selon la structure réelle de l'API
  const participants = (session.participants || []).map((participant: any) => {
    const participantNames = extractNames(participant.fullName);
    
    return {
      id: participant.id || '',
      firstname: participantNames.firstname,
      lastname: participantNames.lastname,
      status: participant.status || 'pending',
      avatar: participant.avatar || participant.avatarUrl || null,
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
    organizer: {
      id: session.organizer?.id || '',
      firstname: organizerNames.firstname,
      lastname: organizerNames.lastname,
      avatar: session.organizer?.avatar || session.organizer?.avatarUrl || null,
    },
    participants: participants,
    comments: (session.comments || []).map((comment: any) => {
      const commentNames = extractNames(comment.authorName || comment.fullName);
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

export function useGetMyCreatedSessions() {
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
        const response = await SessionsApi.getMyCreated();
        
        const sessionsResponse = (response as any).data || response;
        const sessionsArray = Array.isArray(sessionsResponse) ? sessionsResponse : [];
        
        const convertedSessions = sessionsArray.map(convertToSportSession);
        
        setData(convertedSessions);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement de mes sessions créées');
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