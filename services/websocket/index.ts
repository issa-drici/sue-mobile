import { io, Socket } from 'socket.io-client';
import { ENV } from '../../config/env';

// Types pour les événements WebSocket
export interface WebSocketEvent {
  event: string;
  data: any;
}

export interface CommentEvent {
  id: string;
  content: string;
  user: {
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
  created_at: string;
  updated_at?: string;
}

export interface PresenceEvent {
  userId: string;
  user: {
    id: string;
    firstname: string;
    lastname: string;
    avatar: string | null;
  };
  isTyping?: boolean;
  joinedAt?: string;
  leftAt?: string;
  lastSeen?: string;
}

export interface OnlineUser {
  socketId: string;
  user: {
    id: string;
    firstname: string;
    lastname: string;
    avatar: string | null;
  };
  joinedAt: string;
}

export interface WebSocketConfig {
  sessionId: string;
  token: string;
  userId?: string; // Added userId to the interface
  user?: { // Added user to the interface
    id: string;
    firstname: string;
    lastname: string;
    avatar: string | null;
  };
  onCommentCreated?: (comment: CommentEvent) => void;
  onCommentUpdated?: (comment: CommentEvent) => void;
  onCommentDeleted?: (commentId: string) => void;
  onUserTyping?: (presence: PresenceEvent) => void;
  onUserStoppedTyping?: (userId: string) => void;
  onUserOnline?: (presence: PresenceEvent) => void;
  onUserOffline?: (presence: PresenceEvent) => void;
  onOnlineUsers?: (users: OnlineUser[]) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

class WebSocketService {
  private socket: Socket | null = null;
  private config: WebSocketConfig | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnected = false;

  // Connexion à un canal de session
  connect(config: WebSocketConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      try {

        // Configuration du client Socket.IO selon le guide
        this.socket = io(ENV.WEBSOCKET_URL, {
          transports: ['websocket', 'polling'],
          auth: {
            token: config.token
          },
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
          reconnectionDelayMax: 5000,
          timeout: 20000,
          forceNew: true,
          forceBase64: true // Optimisation mobile
        });

        this.config = config;

        // Événements de connexion
        this.socket.on('connect', () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.config?.onConnect?.();
          resolve();
        });

        this.socket.on('disconnect', (reason: string) => {
          this.isConnected = false;
          this.config?.onDisconnect?.();
        });

        this.socket.on('connect_error', (error: Error) => {
          this.handleReconnection();
          this.config?.onError?.(error);
          reject(error);
        });

        this.socket.on('reconnect', (attemptNumber: number) => {
          this.reconnectAttempts = 0;
          this.isConnected = true;
        });

        this.socket.on('reconnect_failed', () => {
          this.config?.onError?.('Échec de la reconnexion');
        });

        // Événements Laravel Broadcasting (format utilisé par le backend)
        this.socket.on('laravel-broadcast', (data: any) => {
          
          if (data.event === 'comment.created') {
            this.config?.onCommentCreated?.(data.data.comment);
          } else if (data.event === 'comment.updated') {
            this.config?.onCommentUpdated?.(data.data.comment);
          } else if (data.event === 'comment.deleted') {
            this.config?.onCommentDeleted?.(data.data.commentId);
          }
        });

        // COMMENTÉ - Événements de présence (typing) désactivés pour l'instant
        /*
        // Événements de présence (typing)
        this.socket.on('user.typing', (data: PresenceEvent) => {
          this.config?.onUserTyping?.(data);
        });

        this.socket.on('user.stopped-typing', (userId: string) => {
          this.config?.onUserStoppedTyping?.(userId);
        });
        */

        // Événement des utilisateurs en ligne
        this.socket.on('online-users', (users: OnlineUser[]) => {
          this.config?.onOnlineUsers?.(users);
        });

        // Rejoindre le canal de la session selon le guide
        this.socket.emit('join-session', {
          sessionId: config.sessionId,
          userId: config.userId || 'current-user-id', // Utiliser l'ID réel de l'utilisateur
          user: config.user || {
            id: config.userId || 'current-user-id',
            firstname: 'Utilisateur',
            lastname: 'Actuel',
            avatar: null
          }
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  // Déconnexion
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.config = null;
      this.isConnected = false;
    }
  }

  // COMMENTÉ - Envoyer un événement de frappe (désactivé pour l'instant)
  /*
  // Envoyer un événement de frappe
  sendTyping(sessionId: string, isTyping: boolean): void {
    if (this.socket && this.config) {
      this.socket.emit('typing', {
        sessionId: sessionId,
        userId: this.config.userId || 'current-user-id',
        isTyping,
        user: this.config.user || {
          id: this.config.userId || 'current-user-id',
          firstname: 'Utilisateur',
          lastname: 'Actuel',
          avatar: null
        }
      });
    }
  }
  */

  // Vérifier si connecté
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Obtenir l'ID de socket
  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  // Gestion de la reconnexion
  private handleReconnection(): void {
    this.reconnectAttempts++;
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  // Mettre à jour les informations utilisateur
  updateUserInfo(userId: string, userInfo: { firstname: string; lastname: string; avatar?: string | null }): void {
    if (this.socket && this.config) {
      // Mettre à jour les événements avec les vraies informations utilisateur
      this.socket.emit('update-user-info', {
        userId,
        user: {
          id: userId,
          firstname: userInfo.firstname,
          lastname: userInfo.lastname,
          avatar: userInfo.avatar || null
        }
      });
    }
  }
}

// Instance singleton
export const webSocketService = new WebSocketService(); 