import { useCallback, useState } from 'react';
import { ENV } from '../../config/env';
import { UsersApi } from '../api/usersApi';

export function useSendFriendRequest() {
  const [data, setData] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendFriendRequest = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      if (ENV.USE_MOCKS) {
        // Simulation d'envoi de demande d'ami
        setData(true);
        return true;
      } else {
        const response = await UsersApi.sendFriendRequest(userId);
        setData(true);
        return response;
      }
    } catch (err: any) {
      console.error('❌ [useSendFriendRequest] Erreur API:', err);
      
      // Extraire le message d'erreur de manière plus robuste
      let errorMessage = 'Erreur lors de l\'envoi de la demande d\'ami';
      
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
    sendFriendRequest,
  };
} 