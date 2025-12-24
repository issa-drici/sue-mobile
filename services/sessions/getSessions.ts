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
    console.log('📡 [useGetSessions] Début du fetch - USE_MOCKS:', ENV.USE_MOCKS);
    if (ENV.USE_MOCKS) {
      console.log('📡 [useGetSessions] Utilisation des mocks, nombre:', mockSessions.length);
      return mockSessions;
    } else {
      console.log('📡 [useGetSessions] Appel API SessionsApi.getAll()');
      const response = await SessionsApi.getAll();
      console.log('📡 [useGetSessions] Réponse brute de l\'API:', JSON.stringify(response, null, 2));
      
      // Extraire les données de la réponse Laravel
      const sessionsResponse = (response as any).data || response;
      console.log('📡 [useGetSessions] sessionsResponse extrait:', JSON.stringify(sessionsResponse, null, 2));
      console.log('📡 [useGetSessions] sessionsResponse est un array?', Array.isArray(sessionsResponse));
      
      const sessionsArray = Array.isArray(sessionsResponse) ? sessionsResponse : [];
      console.log('📡 [useGetSessions] sessionsArray length:', sessionsArray.length);
      
      // Convertir les vraies sessions
      const convertedSessions = sessionsArray.map(convertToSportSession);
      console.log('📡 [useGetSessions] Sessions converties:', convertedSessions.length);
      console.log('📡 [useGetSessions] Première session convertie:', convertedSessions[0] ? JSON.stringify(convertedSessions[0], null, 2) : 'aucune');
      
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
  
  // Logs pour voir ce qui est retourné par useApiRequest
  console.log('📡 [useGetSessions] Résultat de useApiRequest:', {
    hasData: !!result.data,
    dataType: typeof result.data,
    isArray: Array.isArray(result.data),
    dataLength: result.data?.length ?? 0,
    isLoading: result.isLoading,
    error: result.error,
  });
  
  // S'assurer que data est toujours un tableau
  const finalData = result.data || [];
  console.log('📡 [useGetSessions] Données finales retournées:', finalData.length);
  
  return {
    ...result,
    data: finalData,
  };
} 