import { useCallback, useState } from 'react';
import { ENV } from '../../config/env';
import { Comment, CreateCommentData } from '../../types/comment';
import { SessionsApi } from '../api/sessionsApi';

export function useCreateComment() {
  const [data, setData] = useState<Comment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createComment = useCallback(async (sessionId: string, commentData: CreateCommentData) => {
    setIsLoading(true);
    setError(null);

    try {
      if (ENV.USE_MOCKS) {
        // Mock data pour la création de commentaire
        const mockComment: Comment = {
          id: `comment-${Date.now()}`,
          content: commentData.content,
          user: {
            id: 'current-user',
            firstname: 'Moi',
            lastname: 'Utilisateur',
            avatar: null
          },
          mentions: commentData.mentions?.map(id => ({
            id,
            firstname: 'Utilisateur',
            lastname: 'Mentionné'
          })),
          created_at: new Date().toISOString()
        };

        setData(mockComment);
        return mockComment;
      } else {
        const response = await SessionsApi.createComment(sessionId, commentData);
        setData(response);
        return response;
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du commentaire');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    data,
    isLoading,
    error,
    createComment,
  };
} 