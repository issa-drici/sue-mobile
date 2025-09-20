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

export function useGetSessionById() {
  const [data, setData] = useState<SportSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const getSessionById = useCallback(async (id: string) => {
    setCurrentSessionId(id);
    setIsLoading(true);
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
        getSessionById(currentSessionId);
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