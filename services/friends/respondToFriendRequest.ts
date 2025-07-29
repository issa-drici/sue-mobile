import { useCallback, useState } from 'react';
import { ENV } from '../../config/env';
import { UsersApi } from '../api/usersApi';

export function useRespondToFriendRequest() {
  const [data, setData] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const respondToFriendRequest = useCallback(async (requestId: string, response: 'accept' | 'decline') => {
    setIsLoading(true);
    setError(null);

    try {
      if (ENV.USE_MOCKS) {
        setData(true);
        return true;
      } else {
        const result = await UsersApi.respondToFriendRequest(requestId, response);
        setData(true);
        return result;
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la réponse à la demande d\'ami');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    data,
    isLoading,
    error,
    respondToFriendRequest,
  };
} 