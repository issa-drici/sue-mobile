import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ENV } from '../../config/env';
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

export function useGetNotifications() {
  const [data, setData] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (ENV.USE_MOCKS) {
        setData(mockNotifications);
      } else {
        const response = await NotificationsApi.getAll();
        setData(response);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des notifications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  return {
    data,
    isLoading,
    error,
    refetch: fetchNotifications,
  };
} 