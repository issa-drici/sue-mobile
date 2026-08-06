import { useCallback, useEffect, useMemo } from 'react';
import { ENV } from '../../config/env';
import { useApiRequest } from '../../hooks/useApiRequest';
import { mockNotifications as oldMockNotifications } from '../../mocks/notifications';
import { NotificationsApi } from '../api/notificationsApi';
import { Notification } from '../types/notifications';

// Conversion des anciens mocks vers le nouveau format
const mockNotifications: Notification[] = oldMockNotifications.map(notification => ({
  id: notification.id,
  type: notification.type,
  title: notification.title,
  message: notification.message,
  isRead: notification.read,
  read: notification.read, // Pour compatibilité
  createdAt: notification.createdAt,
  sessionId: notification.sessionId, // Pour compatibilité
  data: {
    sessionId: notification.sessionId,
  },
}));

export function useGetNotifications(page: number = 1, limit: number = 20) {
  const fetchNotifications = useCallback(async (): Promise<{ data: Notification[], pagination: any }> => {
    if (ENV.USE_MOCKS) {
      return { data: mockNotifications, pagination: { page: 1, limit, total: mockNotifications.length, totalPages: 1 } };
    } else {
      const response = await NotificationsApi.getAll(page, limit);
      return response;
    }
  }, [page, limit]);

  // Stabiliser les options pour éviter les re-créations
  const options = useMemo(() => ({
    maxRetries: 5,
    retryDelay: 1000,
    enableRetry: true,
    onRetry: (attempt: number, error: any) => {
      // Retry en silence
    },
    onMaxRetriesReached: (error: any) => {
      console.error('❌ Échec après 5 tentatives pour charger les notifications:', error.message);
    },
  }), []);

  const result = useApiRequest(fetchNotifications, options);
  
  // Polling automatique toutes les 30 secondes comme recommandé dans la documentation
  useEffect(() => {
    if (!ENV.USE_MOCKS) {
      const interval = setInterval(() => {
        result.refetch();
      }, 30000); // 30 secondes

      return () => clearInterval(interval);
    }
  }, [result.refetch]);
  
  // Extraire les données et la pagination
  const notifications = result.data?.data || [];
  const pagination = result.data?.pagination || {};
  
  return {
    ...result,
    data: notifications,
    pagination,
  };
} 