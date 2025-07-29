import { useCallback, useState } from 'react';
import { useAuth } from '../../app/context/auth';
import { ENV } from '../../config/env';
import { Comment, CommentsListResponse } from '../../types/comment';
import { SessionsApi } from '../api/sessionsApi';

export function useGetComments() {
  const [data, setData] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<CommentsListResponse['pagination'] | null>(null);
  const { user } = useAuth();

  const getComments = useCallback(async (sessionId: string, page: number = 1, limit: number = 20) => {
    
    setIsLoading(true);
    setError(null);

    try {
      if (ENV.USE_MOCKS) {
        // Mock data pour les commentaires
        const mockComments: Comment[] = [
          {
            id: '1',
            userId: 'user1',
            fullName: 'John Doe',
            content: 'Super session !',
            createdAt: new Date().toISOString(),
            user: {
              id: 'user1',
              firstname: 'John',
              lastname: 'Doe',
              avatar: null
            },
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            userId: 'user2',
            fullName: 'Jane Smith',
            content: 'On se retrouve la semaine prochaine ?',
            createdAt: new Date(Date.now() - 60000).toISOString(),
            user: {
              id: 'user2',
              firstname: 'Jane',
              lastname: 'Smith',
              avatar: null
            },
            created_at: new Date(Date.now() - 60000).toISOString()
          }
        ];

        const mockResponse: CommentsListResponse = {
          success: true,
          data: mockComments,
          pagination: {
            page: 1,
            limit: 20,
            total: 2,
            totalPages: 1
          }
        };

        setData(mockResponse.data);
        setPagination(mockResponse.pagination);
        return mockResponse;
      } else {
        const response = await SessionsApi.getComments(sessionId, page, limit);

        // Extraire les données de la réponse API
        // L'API retourne directement un tableau, pas {data: [...]}
        const commentsArray = Array.isArray(response) ? response : response?.data || [];

        // Adapter la structure de réponse du backend (format snake_case)
        const adaptedComments = commentsArray.map((comment: any) => {
          
          // Extraire les dates des objets complexes
          const createdAt = typeof comment.createdAt === 'object' && comment.createdAt?.date 
            ? comment.createdAt.date 
            : comment.createdAt;
          const updatedAt = typeof comment.updatedAt === 'object' && comment.updatedAt?.date 
            ? comment.updatedAt.date 
            : comment.updatedAt;
          
          return {
            id: comment.id,
            userId: comment.user_id, // snake_case from backend
            sessionId: comment.session_id, // snake_case from backend
            content: comment.content,
            mentions: comment.mentions,
            createdAt: comment.created_at, // snake_case from backend
            updatedAt: comment.updated_at, // snake_case from backend
            // Gérer le cas où user est vide
            user: {
              id: comment.user?.id || comment.user_id,
              firstname: comment.user?.firstname || 'Utilisateur',
              lastname: comment.user?.lastname || comment.user_id,
              avatar: comment.user?.avatar || null
            },
            // Adapter les dates
            created_at: comment.created_at,
            updated_at: comment.updated_at,
            // Ajouter fullName pour compatibilité
            fullName: comment.user?.firstname && comment.user?.lastname 
              ? `${comment.user.firstname} ${comment.user.lastname}` 
              : `Utilisateur ${comment.user_id}`
          };
        });


        // Trier les commentaires par ordre chronologique décroissant (plus récent en premier) pour la modal de chat
        const sortedComments = adaptedComments.sort((a, b) => 
          new Date(b.createdAt || b.created_at || '').getTime() - new Date(a.createdAt || a.created_at || '').getTime()
        );

        setData(sortedComments);
        setPagination(response?.pagination || null);
        return { data: sortedComments, pagination: response?.pagination || null };
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des commentaires');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user?.token]);

  return {
    data,
    isLoading,
    error,
    pagination,
    getComments,
  };
} 