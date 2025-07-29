import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ENV } from '../../config/env';
import { UsersApi } from '../api/usersApi';
import { FriendRequest } from '../types/users';

export function useGetFriendRequests() {
  const [data, setData] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFriendRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (ENV.USE_MOCKS) {
        // Utiliser les mocks de demandes d'ami prédéfinis
        const mockRequests: FriendRequest[] = [
          {
            id: '5',
            fromUser: {
              id: '5',
              firstname: 'Emma',
              lastname: 'Leroy',
              avatar: 'https://i.pravatar.cc/150?img=5',
              email: 'emma.leroy@example.com',
            },
            toUser: {
              id: '1',
              firstname: 'Jean',
              lastname: 'Dupont',
              avatar: 'https://i.pravatar.cc/150?img=1',
              email: 'jean.dupont@example.com',
            },
            status: 'pending',
            createdAt: new Date().toISOString(),
            mutualFriends: 3, // Ajouté
          },
          {
            id: '6',
            fromUser: {
              id: '6',
              firstname: 'Hugo',
              lastname: 'Moreau',
              avatar: 'https://i.pravatar.cc/150?img=6',
              email: 'hugo.moreau@example.com',
            },
            toUser: {
              id: '1',
              firstname: 'Jean',
              lastname: 'Dupont',
              avatar: 'https://i.pravatar.cc/150?img=1',
              email: 'jean.dupont@example.com',
            },
            status: 'pending',
            createdAt: new Date().toISOString(),
            mutualFriends: 7, // Ajouté
          },
          {
            id: '7',
            fromUser: {
              id: '7',
              firstname: 'Léa',
              lastname: 'Petit',
              avatar: 'https://i.pravatar.cc/150?img=7',
              email: 'lea.petit@example.com',
            },
            toUser: {
              id: '1',
              firstname: 'Jean',
              lastname: 'Dupont',
              avatar: 'https://i.pravatar.cc/150?img=1',
              email: 'jean.dupont@example.com',
            },
            status: 'pending',
            createdAt: new Date().toISOString(),
            mutualFriends: 2, // Ajouté
          },
        ];
        setData(mockRequests);
      } else {
        const response = await UsersApi.getFriendRequests();
        setData(response);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des demandes d\'amis');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchFriendRequests();
    }, [fetchFriendRequests])
  );

  return {
    data,
    isLoading,
    error,
    refetch: fetchFriendRequests,
  };
} 