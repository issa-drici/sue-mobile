import { useCallback, useState } from 'react';
import { ENV } from '../../config/env';
import { NotificationsApi } from '../api/notificationsApi';

export function useMarkAllNotificationsAsRead() {
  const [data, setData] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markAllAsRead = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (ENV.USE_MOCKS) {
        // Simulation de marquage de toutes les notifications comme lues
        setData(true);
        return true;
      } else {
        const response = await NotificationsApi.markAllAsRead();
        setData(true);
        return response;
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du marquage de toutes les notifications');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    data,
    isLoading,
    error,
    markAllAsRead,
  };
} 