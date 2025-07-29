export interface Comment {
  id: string | number;
  userId: string;
  fullName: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  // Champs optionnels pour compatibilité
  user?: {
    id: string;
    firstname: string;
    lastname: string;
    avatar: string | null;
  };
  mentions?: {
    id: string;
    firstname: string;
    lastname: string;
  }[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateCommentData {
  content: string;
  mentions?: string[]; // IDs des utilisateurs mentionnés
}

export interface UpdateCommentData {
  content: string;
  mentions?: string[];
}

export interface CommentResponse {
  success: boolean;
  data: Comment;
  message: string;
}

export interface CommentsListResponse {
  success: boolean;
  data: Comment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PresenceUser {
  id: string;
  firstname: string;
  lastname: string;
  avatar: string | null;
  isTyping: boolean;
  lastSeen: string;
}

export interface PresenceResponse {
  success: boolean;
  data: PresenceUser[];
  total: number;
}

export interface TypingData {
  isTyping: boolean;
} 