import { useCallback, useState } from 'react';
import { ENV } from '../../config/env';
import { User } from '../../types/user';
import { UsersApi } from '../api/usersApi';

export function useUpdateUser() {
  const [data, setData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateUser = useCallback(async (userData: Partial<User>) => {
    setIsLoading(true);
    setError(null);

    try {
      if (ENV.USE_MOCKS) {
        // Simulation de mise à jour
        const updatedUser: User = {
          id: '1',
          firstname: userData.firstname || 'Utilisateur',
          lastname: userData.lastname || 'Test',
          email: userData.email || 'user@test.com',
          avatar: userData.avatar || undefined,
        };
        setData(updatedUser);
        return updatedUser;
      } else {
        const response = await UsersApi.updateProfile(userData);
        setData(response);
        return response;
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour de l\'utilisateur');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    data,
    isLoading,
    error,
    updateUser,
  };
} 