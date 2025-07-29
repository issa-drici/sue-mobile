import { useCallback, useState } from 'react';
import { ENV } from '../../config/env';
import { UsersApi } from '../api/usersApi';

export function useRemoveFriend() {
  const [data, setData] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const removeFriend = useCallback(async (friendId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      if (ENV.USE_MOCKS) {
        // Simulation de suppression d'ami
        setData(true);
        return true;
      } else {
        const response = await UsersApi.removeFriend(friendId);
        setData(true);
        return response;
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression de l\'ami');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    data,
    isLoading,
    error,
    removeFriend,
  };
} 