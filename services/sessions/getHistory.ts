import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ENV } from '../../config/env';
import { mockSessions } from '../../mocks/sessions';
import { SportSession } from '../../types/sport';
import { baseApiService } from '../api/baseApi';

// Fonction de conversion de Session vers SportSession (même que dans getSessions)
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
    startTime: session.startTime || session.time || '18:00',
    endTime: session.endTime || '20:00',
    location: session.location,
    maxParticipants: session.maxParticipants,
    pricePerPerson: session.pricePerPerson,
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

export function useGetHistory() {
  const [data, setData] = useState<SportSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (ENV.USE_MOCKS) {
        // Pour les mocks, filtrer les sessions passées
        const now = new Date();
        const pastSessions = mockSessions.filter(session => {
          const sessionDate = new Date(session.date);
          return sessionDate < now;
        });
        setData(pastSessions);
      } else {
        // Appeler l'endpoint spécifique pour l'historique
        const response = await baseApiService.get('/sessions/history');
        
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
        setError(err.message || 'Erreur lors du chargement de l\'historique');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Recharger à chaque focus (comportement original)
      fetchHistory();
    }, [fetchHistory])
  );

  return {
    data,
    isLoading,
    error,
    refetch: fetchHistory,
  };
} 