import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ENV } from '../../config/env';
import { mockUsers } from '../../mocks/users';
import { User } from '../../types/user';
import { UsersApi } from '../api/usersApi';

export function useGetUsers() {
  const [data, setData] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (ENV.USE_MOCKS) {
        setData(mockUsers);
      } else {
        // Note: getUsers n'existe pas dans la nouvelle API, on utilise searchUsers avec une requête vide
        const response = await UsersApi.searchUsers('');
        setData(response);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des utilisateurs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [fetchUsers])
  );

  return {
    data,
    isLoading,
    error,
    refetch: fetchUsers,
  };
} 