import { useCallback, useState } from 'react';
import { ENV } from '../../config/env';
import { UsersApi } from '../api/usersApi';

export function useCancelFriendRequest() {
  const [data, setData] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelFriendRequest = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      if (ENV.USE_MOCKS) {
        // Simulation d'annulation de demande d'ami
        setData(true);
        return true;
      } else {
        // Appel à l'API réelle pour annuler la demande d'ami
        await UsersApi.cancelFriendRequest(userId);
        setData(true);
        return true;
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'annulation de la demande d\'ami');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    data,
    isLoading,
    error,
    cancelFriendRequest,
  };
} 