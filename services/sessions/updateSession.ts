import { useCallback, useState } from 'react';
import { SportSession } from '../../types/sport';
import { SessionsApi } from '../api/sessionsApi';
import { Session, UpdateSessionData } from '../types/sessions';

// Fonction de conversion de SportSession vers UpdateSessionData
function convertToUpdateSessionData(sessionData: Partial<SportSession>): UpdateSessionData {
  const updateData: UpdateSessionData = {
    title: sessionData.sport, // Utiliser le sport comme titre
    date: sessionData.date,
    location: sessionData.location,
    sport: sessionData.sport,
  };

  // Ajouter startTime et endTime si disponibles
  if (sessionData.startTime) {
    updateData.startTime = sessionData.startTime;
  }
  if (sessionData.endTime) {
    updateData.endTime = sessionData.endTime;
  }

  // Ajouter maxParticipants seulement s'il a une valeur
  if (sessionData.maxParticipants !== undefined && sessionData.maxParticipants !== null) {
    updateData.maxParticipants = sessionData.maxParticipants;
  }

  // Ajouter pricePerPerson seulement s'il a une valeur
  if (sessionData.pricePerPerson !== undefined && sessionData.pricePerPerson !== null) {
    updateData.pricePerPerson = sessionData.pricePerPerson;
  }

  return updateData;
}

// Fonction de conversion de Session vers SportSession
function convertToSportSession(session: Session): SportSession {
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