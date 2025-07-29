import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ENV } from '../../config/env';
import { mockUsers } from '../../mocks/users';
import { UsersApi } from '../api/usersApi';
import { Friend } from '../types/users';

export function useGetFriends() {
  const [data, setData] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFriends = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (ENV.USE_MOCKS) {
        // Simuler des amis (utilisateurs 1, 2, 3)
        const mockFriends: Friend[] = mockUsers.slice(0, 3).map(user => ({
          id: user.id,
          firstname: user.firstname,
          lastname: user.lastname,
          avatar: user.avatar,
          email: user.email
        }));
        setData(mockFriends);
      } else {
        const response = await UsersApi.getFriends();
        setData(response);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des amis');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchFriends();
    }, [fetchFriends])
  );

  return {
    data,
    isLoading,
    error,
    refetch: fetchFriends,
  };
} 