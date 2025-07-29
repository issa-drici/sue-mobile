// Types pour les notifications
export interface Notification {
  id: string;
  type: 'friend_request' | 'session_invitation' | 'session_update' | 'comment' | 'system' | 'invitation' | 'reminder' | 'update';
  title: string;
  message: string;
  isRead: boolean;
  read: boolean; // Pour compatibilité avec l'ancien type
  createdAt: string;
  sessionId?: string; // Pour compatibilité avec l'ancien type
  data?: {
    sessionId?: string;
    userId?: string;
    commentId?: string;
  };
} 