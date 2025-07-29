import { useCallback, useState } from 'react';
import { ENV } from '../../config/env';
import { NotificationsApi } from '../api/notificationsApi';

export function useMarkNotificationAsRead() {
  const [data, setData] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markAsRead = useCallback(async (notificationId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      if (ENV.USE_MOCKS) {
        // Simulation de marquage comme lu
        setData(true);
        return true;
      } else {
        const response = await NotificationsApi.markAsRead(notificationId);
        setData(true);
        return response;
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du marquage de la notification');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    data,
    isLoading,
    error,
    markAsRead,
  };
} 