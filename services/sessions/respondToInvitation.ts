import { useCallback, useState } from 'react';
import { ENV } from '../../config/env';
import { SessionsApi } from '../api/sessionsApi';

export function useRespondToInvitation() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const respondToInvitation = useCallback(async (sessionId: string, response: 'accept' | 'decline') => {
    setIsLoading(true);
    setError(null);

    try {
      if (ENV.USE_MOCKS) {
        // Simulation de réponse à invitation
        setData({ sessionId, response, status: 'success' });
        return { sessionId, response, status: 'success' };
      } else {
        const result = await SessionsApi.respondToInvitation(sessionId, response);
        setData(result);
        return result;
      }
    } catch (err: any) {
      // Extraire le message d'erreur de manière plus robuste
      let errorMessage = 'Erreur lors de la réponse à l\'invitation';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.error?.message) {
        errorMessage = err.error.message;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error?.message) {
        errorMessage = err.response.data.error.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    data,
    isLoading,
    error,
    respondToInvitation,
  };
} 