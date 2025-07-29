import { useCallback, useState } from 'react';
import { ENV } from '../../config/env';
import { SessionsApi } from '../api/sessionsApi';

export function useDeleteSession() {
  const [data, setData] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteSession = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      if (ENV.USE_MOCKS) {
        // Simulation de suppression
        setData(true);
        return true;
      } else {
        await SessionsApi.delete(id);
        setData(true);
        return true;
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression de la session');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    data,
    isLoading,
    error,
    deleteSession,
  };
} 