import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../app/context/auth';
import { useCreateComment, useGetComments } from '../services';
import { OnlineUser, PresenceEvent, webSocketService } from '../services/websocket';

export const useComments = (sessionId: string) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<PresenceEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  
  const { getComments, data: commentsData, isLoading: isLoadingComments } = useGetComments();
  const { createComment, isLoading: isCreatingComment } = useCreateComment();

  // Référence pour le timeout de frappe
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Charger les commentaires initiaux
  useEffect(() => {
    if (sessionId) {
      loadComments();
    }
  }, [sessionId]);

  // Mettre à jour les commentaires quand les données changent
  useEffect(() => {
    if (commentsData) {
      setComments(commentsData);
    }
  }, [commentsData]);

  // Configuration WebSocket (optionnel pour l'instant)
  useEffect(() => {
    if (!sessionId || !user) return;

    
    // Connexion WebSocket réelle
    webSocketService.connect({
      token: user.token || 'mock-token',
      sessionId,
      userId: user.id,
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        avatar: user.avatar
      },
      onCommentCreated: (comment) => {
        
        // Adapter le commentaire reçu
        const adaptedComment = {
          ...comment,
          user: {
            id: comment.user?.id || comment.userId,
            firstname: comment.user?.firstname || 'Utilisateur',
            lastname: comment.user?.lastname || comment.userId,
            avatar: comment.user?.avatar || null
          },
          created_at: comment.created_at,
          updated_at: comment.updated_at,
          fullName: comment.user?.firstname ? `${comment.user.firstname} ${comment.user.lastname}` : `Utilisateur ${comment.userId}`
        };
        
        
        // Ajouter le nouveau commentaire à la liste (au début pour la FlatList inversée)
        setComments(prev => {
          // Vérifier si le commentaire existe déjà pour éviter les doublons
          // TODO: Revenir à la vérification par ID une fois que le backend génère des IDs uniques
          const commentExists = prev.some(c => {
            // Si l'ID n'est pas "0", utiliser l'ID pour la vérification
            if (adaptedComment.id && adaptedComment.id !== "0") {
              return c.id === adaptedComment.id;
            }
            // Sinon, utiliser le contenu et le timestamp (fallback temporaire)
            return c.content === adaptedComment.content && 
                   c.created_at === adaptedComment.created_at &&
                   c.user?.id === adaptedComment.user?.id;
          });
          
          if (commentExists) {
            return prev;
          }
          
          const newList = [adaptedComment, ...prev];
          return newList;
        });
      },
      onCommentUpdated: (comment) => {
        setComments(prev => prev.map(c => c.id === comment.id ? {
          ...c,
          content: comment.content,
          updated_at: comment.updated_at
        } : c));
      },
      onCommentDeleted: (commentId) => {
        setComments(prev => prev.filter(c => c.id !== commentId));
      },
      onUserTyping: (typingEvent) => {
        setTypingUsers(prev => {
          const filtered = prev.filter(t => t.userId !== typingEvent.userId);
          return [...filtered, typingEvent];
        });
      },
      onUserStoppedTyping: (userId) => {
        setTypingUsers(prev => prev.filter(t => t.userId !== userId));
      },
      onOnlineUsers: (users) => {
        setOnlineUsers(users);
      },
      onConnectionStatusChange: (status) => {
        setIsConnected(status);
      }
    });

    return () => {
      webSocketService.disconnect();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [sessionId, user]);

  const loadComments = async () => {
    try {
      await getComments(sessionId);
    } catch (error) {
    }
  };

  const sendComment = async (content: string, mentions: string[] = []) => {
    try {
      
      const response = await createComment(sessionId, {
        content: content.trim(),
        mentions
      });
      
      
      // Extraire la date de l'objet complexe
      const createdAt = typeof response.createdAt === 'object' && response.createdAt?.date 
        ? response.createdAt.date 
        : response.createdAt;
      const updatedAt = typeof response.updatedAt === 'object' && response.updatedAt?.date 
        ? response.updatedAt.date 
        : response.updatedAt;
      
      // Ajouter le nouveau commentaire à la liste localement
      const newComment = {
        ...response,
        user: {
          id: response.userId,
          firstname: user?.firstname || 'Utilisateur',
          lastname: user?.lastname || response.userId,
          avatar: user?.avatar || null
        },
        created_at: createdAt,
        updated_at: updatedAt,
        fullName: user?.firstname && user?.lastname ? `${user.firstname} ${user.lastname}` : `Utilisateur ${response.userId}`
      };
      
      // Ajouter localement en fallback (au cas où l'événement WebSocket n'arrive pas)
      setComments(prev => {
        // Vérifier si le commentaire existe déjà pour éviter les doublons
        // TODO: Revenir à la vérification par ID une fois que le backend génère des IDs uniques
        const commentExists = prev.some(c => {
          // Si l'ID n'est pas "0", utiliser l'ID pour la vérification
          if (newComment.id && newComment.id !== "0") {
            return c.id === newComment.id;
          }
          // Sinon, utiliser le contenu et le timestamp (fallback temporaire)
          return c.content === newComment.content && 
                 c.created_at === newComment.created_at &&
                 c.user?.id === newComment.user?.id;
        });
        
        if (commentExists) {
          return prev;
        }
        
        const newList = [newComment, ...prev];
        return newList;
      });
      
      // Pas de refetch immédiat: éviter les relayouts qui cassent l'ancrage en bas
      
      // Arrêter la frappe
      stopTyping();
      
      return true;
    } catch (error: any) {
      throw error;
    }
  };

  const startTyping = () => {
    // COMMENTÉ - Indicateurs de frappe désactivés pour l'instant
    /*
    webSocketService.sendTyping(sessionId, true);
    */
  };

  const stopTyping = () => {
    // COMMENTÉ - Indicateurs de frappe désactivés pour l'instant
    /*
    webSocketService.sendTyping(sessionId, false);
    */
  };

  const handleTyping = (text: string) => {
    // COMMENTÉ - Indicateurs de frappe désactivés pour l'instant
    /*
    // Démarrer la frappe si ce n'est pas déjà fait
    if (text.length === 1) {
      startTyping();
    }

    // Arrêter la frappe après un délai
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
    */
  };

  const getTypingUsersNames = (): string[] => {
    return typingUsers
      .filter(u => u.userId !== user?.id) // Exclure l'utilisateur actuel
      .map(u => `${u.user.firstname} ${u.user.lastname}`);
  };

  const getOnlineUsersCount = (): number => {
    return onlineUsers.length;
  };

  return {
    comments,
    onlineUsers,
    typingUsers,
    isConnected,
    isLoadingComments,
    isCreatingComment,
    sendComment,
    startTyping,
    stopTyping,
    handleTyping,
    getTypingUsersNames,
    getOnlineUsersCount,
    reloadComments: loadComments // Exposer la fonction de rechargement
  };
  
}; 