import { useCallback, useMemo } from 'react';
import { ENV } from '../../config/env';
import { useApiRequest } from '../../hooks/useApiRequest';
import { mockUsers } from '../../mocks/users';
import { UsersApi } from '../api/usersApi';
import { Friend } from '../types/users';

export function useGetFriends() {
  const fetchFriends = useCallback(async (): Promise<Friend[]> => {
    if (ENV.USE_MOCKS) {
      // Simuler des amis (utilisateurs 1, 2, 3)
      const mockFriends: Friend[] = mockUsers.slice(0, 3).map(user => ({
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        avatar: user.avatar,
        email: user.email
      }));
      return mockFriends;
    } else {
      const response = await UsersApi.getFriends();
      return response;
    }
  }, []); // Dépendances vides pour stabiliser

  // Stabiliser les options pour éviter les re-créations
  const options = useMemo(() => ({
    maxRetries: 5,
    retryDelay: 1000,
    enableRetry: true,
    onRetry: (attempt: number, error: any) => {
      console.log(`🔄 [useGetFriends] Tentative ${attempt}/5 pour charger les amis:`, error.message);
    },
    onMaxRetriesReached: (error: any) => {
      console.error('❌ [useGetFriends] Échec après 5 tentatives pour charger les amis:', error.message);
    },
  }), []); // Dépendances vides pour stabiliser

  const result = useApiRequest(fetchFriends, options);
  
  // S'assurer que data est toujours un tableau
  return {
    ...result,
    data: result.data || [],
  };
} 