import { useState } from 'react';
import { ENV } from '../../config/env';
import { UsersApi } from '../api/usersApi';

export function useUpdatePassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    try {
      if (ENV.USE_MOCKS) {
        await new Promise(res => setTimeout(res, 500));
        setSuccess(true);
      } else {
        await UsersApi.updatePassword(currentPassword, newPassword);
        setSuccess(true);
      }
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la mise à jour du mot de passe');
    } finally {
      setIsLoading(false);
    }
  };

  return { updatePassword, isLoading, error, success };
} 