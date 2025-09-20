import { useCallback, useState } from 'react';
import { ENV } from '../../config/env';
import { NotificationsApi } from '../api/notificationsApi';

export const useDeleteNotification = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!notificationId) {
      setError('ID de notification manquant');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      if (ENV.USE_MOCKS) {
        // Simulation en mode mock
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('🗑️ [useDeleteNotification] Mock - Notification supprimée:', notificationId);
      } else {
        console.log('🗑️ [useDeleteNotification] Suppression de la notification:', notificationId);
        await NotificationsApi.delete(notificationId);
        console.log('✅ [useDeleteNotification] Notification supprimée avec succès');
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Erreur lors de la suppression de la notification';
      setError(errorMessage);
      console.error('❌ [useDeleteNotification] Erreur:', errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    deleteNotification,
    isLoading,
    error,
  };
};







