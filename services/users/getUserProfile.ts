import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ENV } from '../../config/env';
import { mockUserProfile } from '../../mocks/users';
import { UserProfile } from '../../types/user';
import { baseApiService } from '../api/baseApi';
import { USERS_ENDPOINTS } from '../api/endpoints';

export const useGetUserProfile = () => {
  const [data, setData] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (ENV.USE_MOCKS) {
        // Utiliser les mocks
        setData(mockUserProfile);
      } else {
        // Appel API réel avec le bon endpoint
        const response = await baseApiService.get<any>(USERS_ENDPOINTS.PROFILE);
        
        // L'API retourne: { success: true, data: { id, firstname, lastname, email, avatar, stats } }
        const userData = response.data || response;
        
        const userProfile: UserProfile = {
          id: userData.id || '',
          firstname: userData.firstname || '',
          lastname: userData.lastname || '',
          email: userData.email || '',
          avatar: userData.avatar || undefined,
          // Stats adaptées à la structure de l'API
          stats: {
            sessionsCreated: userData.stats?.sessionsCreated || 0,
            sessionsParticipated: userData.stats?.sessionsParticipated || 0,
            favoriteSport: userData.stats?.favoriteSport || 'Aucun',
          },
        };
        
        setData(userProfile);
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la récupération du profil');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
    }, [fetchUserProfile])
  );

  return { data, isLoading, error, refetch: fetchUserProfile };
}; 