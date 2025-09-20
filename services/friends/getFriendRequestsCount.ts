import { useCallback, useMemo } from 'react';
import { ENV } from '../../config/env';
import { useApiRequest } from '../../hooks/useApiRequest';
import { UsersApi } from '../api/usersApi';

export function useGetFriendRequestsCount() {
  const fetchFriendRequestsCount = useCallback(async (): Promise<number> => {
    if (ENV.USE_MOCKS) {
      // Simuler 2 demandes d'amis en attente
      const mockCount = 2;
      return mockCount;
    } else {
      const response = await UsersApi.getFriendRequestsCount();
      return response;
    }
  }, []);

  // Stabiliser les options pour éviter les re-créations
  const options = useMemo(() => ({
    maxRetries: 3,
    retryDelay: 1000,
    enableRetry: true,
    onRetry: (attempt: number, error: any) => {
      console.log(`🔄 [useGetFriendRequestsCount] Tentative ${attempt}/3:`, error.message);
    },
    onMaxRetriesReached: (error: any) => {
      console.error('❌ [useGetFriendRequestsCount] Échec après 3 tentatives:', error.message);
    },
  }), []);

  const result = useApiRequest(fetchFriendRequestsCount, options);

  // Pas de polling ici - c'est géré par le contexte global

  return {
    count: result.data || 0,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}
