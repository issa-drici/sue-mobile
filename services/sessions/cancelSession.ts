import { useCallback, useState } from 'react';
import { ENV } from '../../config/env';
import { SessionsApi } from '../api/sessionsApi';

export function useCancelSession() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelSession = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      if (ENV.USE_MOCKS) {
        setData({ sessionId, status: 'cancelled', success: true });
        return { sessionId, status: 'cancelled', success: true };
      } else {
        const result = await SessionsApi.cancelSession(sessionId);
        setData(result);
        return result;
      }
    } catch (err: any) {
      let errorMessage = 'Erreur lors de l\'annulation de la session';
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
    cancelSession,
  };
}
