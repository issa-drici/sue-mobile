import { useCallback, useState } from 'react';
import { ENV } from '../../config/env';
import { mockUsers } from '../../mocks/users';
import { UserProfile } from '../../types/user';
import { baseApiService } from '../api/baseApi';
import { USERS_ENDPOINTS } from '../api/endpoints';

export const useGetUserById = () => {
  const [data, setData] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserById = useCallback(async (userId: string) => {
    if (!userId) return;
    
    console.log('🔍 [useGetUserById] fetchUserById appelé avec userId:', userId);
    
    try {
      setIsLoading(true);
      setError(null);

      if (ENV.USE_MOCKS) {
        // Utiliser les mocks - trouver l'utilisateur par ID
        const mockUser = mockUsers.find(user => user.id === userId);
        if (mockUser) {
          const userProfile: UserProfile = {
            id: mockUser.id,
            firstname: mockUser.firstname,
            lastname: mockUser.lastname,
            email: mockUser.email,
            avatar: mockUser.avatar,
            stats: {
              sessionsCreated: Math.floor(Math.random() * 10) + 1, // Mock data
              sessionsParticipated: Math.floor(Math.random() * 20) + 5, // Mock data
            },
            isAlreadyFriend: false, // En mode mock, on simule que ce n'est pas un ami
            hasPendingRequest: false, // En mode mock, on simule qu'il n'y a pas de demande en attente
            relationshipStatus: 'none', // En mode mock, on simule qu'il n'y a pas de relation
          };
          setData(userProfile);
        } else {
          setError('Utilisateur non trouvé');
        }
      } else {
        // Appel API réel
        console.log('📡 [useGetUserById] Appel API réel vers:', USERS_ENDPOINTS.GET_USER_BY_ID(userId));
        const response = await baseApiService.get<any>(USERS_ENDPOINTS.GET_USER_BY_ID(userId));
        
        console.log('✅ [useGetUserById] Réponse API reçue:', response);
        
        // L'API retourne: { success: true, data: { id, firstname, lastname, email, avatar, stats } }
        const userData = response.data || response;
        
        console.log('🔍 [useGetUserById] userData extrait:', userData);
        
        const userProfile: UserProfile = {
          id: userData.id || '',
          firstname: userData.firstname || '',
          lastname: userData.lastname || '',
          email: userData.email || '',
          avatar: userData.avatar || undefined,
          stats: {
            sessionsCreated: userData.stats?.sessionsCreated || 0,
            sessionsParticipated: userData.stats?.sessionsParticipated || 0,
          },
          isAlreadyFriend: userData.isAlreadyFriend || false,
          hasPendingRequest: userData.hasPendingRequest || false,
          relationshipStatus: userData.relationshipStatus || 'none',
        };
        
        console.log('✅ [useGetUserById] userProfile créé:', userProfile);
        setData(userProfile);
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la récupération du profil utilisateur');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading, error, fetchUserById };
};
