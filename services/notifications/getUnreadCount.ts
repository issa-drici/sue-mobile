
import { useCallback, useMemo } from 'react';
import { ENV } from '../../config/env';
import { useApiRequest } from '../../hooks/useApiRequest';
import { NotificationsApi } from '../api/notificationsApi';

export function useGetUnreadCount() {
  const fetchUnreadCount = useCallback(async (): Promise<number> => {
    if (ENV.USE_MOCKS) {
      // En mode mock, retourner 0 pour éviter les badges de test
      return 0;
    } else {
      const unreadCount = await NotificationsApi.getUnreadCount();
      return unreadCount;
    }
  }, []);

  // Stabiliser les options pour éviter les re-créations
  const options = useMemo(() => ({
    maxRetries: 5,
    retryDelay: 1000,
    enableRetry: true,
    onRetry: (attempt: number, error: any) => {
      console.log(`🔄 Tentative ${attempt}/5 pour charger le compteur de notifications:`, error.message);
    },
    onMaxRetriesReached: (error: any) => {
      console.error('❌ Échec après 5 tentatives pour charger le compteur de notifications:', error.message);
    },
  }), []);

  const result = useApiRequest(fetchUnreadCount, options);

  return {
    count: result.data || 0,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
} 