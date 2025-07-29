import { useCallback, useState } from 'react';
import { ENV } from '../../config/env';
import { SessionsApi } from '../api/sessionsApi';

export function useInviteFriends() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inviteFriends = useCallback(async (sessionId: string, userIds: string[]) => {
    setIsLoading(true);
    setError(null);

    try {
      if (ENV.USE_MOCKS) {
        // Simulation d'invitation d'amis
        setData({ sessionId, invitedUsers: userIds, errors: [] });
        return { sessionId, invitedUsers: userIds, errors: [] };
      } else {
        const response = await SessionsApi.inviteFriends(sessionId, userIds);
        setData(response);
        return response;
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi des invitations');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    data,
    isLoading,
    error,
    inviteFriends,
  };
} 