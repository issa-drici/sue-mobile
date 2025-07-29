import { useState } from 'react';
import { ENV } from '../../config/env';
import { UsersApi } from '../api/usersApi';

export function useDeleteAccount() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const deleteAccount = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    try {
      if (ENV.USE_MOCKS) {
        await new Promise(res => setTimeout(res, 500));
        setSuccess(true);
      } else {
        await UsersApi.deleteAccount();
        setSuccess(true);
      }
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la suppression du compte');
    } finally {
      setIsLoading(false);
    }
  };

  return { deleteAccount, isLoading, error, success };
} 