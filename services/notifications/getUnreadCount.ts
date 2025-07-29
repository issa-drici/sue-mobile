import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ENV } from '../../config/env';
import { NotificationsApi } from '../api/notificationsApi';

export function useGetUnreadCount() {
  const [count, setCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (ENV.USE_MOCKS) {
        // En mode mock, retourner un nombre aléatoire pour les tests
        setCount(Math.floor(Math.random() * 10));
      } else {
        const unreadCount = await NotificationsApi.getUnreadCount();
        setCount(unreadCount);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement du compteur');
      setCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount();
    }, [fetchUnreadCount])
  );

  return {
    count,
    isLoading,
    error,
    refetch: fetchUnreadCount,
  };
} 