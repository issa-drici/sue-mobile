import { useCallback, useState } from 'react';
import { SportSession } from '../../types/sport';
import { SessionsApi } from '../api/sessionsApi';
import { Session, UpdateSessionData } from '../types/sessions';

// Fonction de conversion de SportSession vers UpdateSessionData
function convertToUpdateSessionData(sessionData: Partial<SportSession>): UpdateSessionData {
  return {
    title: sessionData.sport, // Utiliser le sport comme titre
    date: sessionData.date,
    time: sessionData.time,
    location: sessionData.location,
    sport: sessionData.sport,
    maxParticipants: sessionData.maxParticipants ?? null,
  };
}

// Fonction de conversion de Session vers SportSession
function convertToSportSession(session: Session): SportSession {
  return {
    id: session.id,
    sport: session.sport,
    date: session.date,
    time: session.time,
    location: session.location,
    maxParticipants: session.maxParticipants,
    organizer: {
      id: session.organizer?.id || '',
      firstname: session.organizer?.firstname || '',
      lastname: session.organizer?.lastname || '',
    },
    participants: (session.participants || []).map(participant => ({
      id: participant.id,
      firstname: participant.firstname || '',
      lastname: participant.lastname || '',
      status: participant.status,
    })),
    comments: session.comments.map(comment => ({
      id: comment.id,
      userId: comment.authorId,
      firstname: comment.authorName.split(' ')[0] || '',
      lastname: comment.authorName.split(' ').slice(1).join(' ') || '',
      content: comment.content,
      createdAt: comment.createdAt,
    })),
  };
}

export function useUpdateSession() {
  const [data, setData] = useState<SportSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateSession = useCallback(async (id: string, sessionData: Partial<SportSession>) => {
    setIsLoading(true);
    setError(null);

    try {
      const updateData = convertToUpdateSessionData(sessionData);
      const response = await SessionsApi.update(id, updateData);
      const sportSession = convertToSportSession(response);
      setData(sportSession);
      return sportSession;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour de la session');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    data,
    isLoading,
    error,
    updateSession,
  };
} 