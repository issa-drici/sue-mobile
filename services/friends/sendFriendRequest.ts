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
      setError(err.message || 'Erreur lors de l\'envoi de la demande d\'ami');
      throw err;
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