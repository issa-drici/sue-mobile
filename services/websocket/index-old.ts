import Pusher from 'pusher-js';
import { ENV } from '../../config/env';

// Import des types existants (on garde les mêmes interfaces)
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
  userId?: string;
  user?: {
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
  private pusher: Pusher | null = null;
  private config: WebSocketConfig | null = null;
  private isConnected = false;
  private sessionChannel: any = null;

  // Connexion à Soketi via Laravel Echo
  connect(config: WebSocketConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔌 Connexion à Soketi...', {
          host: ENV.PUSHER_HOST,
          port: ENV.PUSHER_PORT,
          key: ENV.PUSHER_APP_KEY
        });

        // Configuration de Pusher pour Soketi
        (window as any).Pusher = Pusher;

        // Configuration de Laravel Echo
        this.echo = new Echo({
          broadcaster: 'pusher',
          key: ENV.PUSHER_APP_KEY,
          wsHost: ENV.PUSHER_HOST,
          wsPort: parseInt(ENV.PUSHER_PORT),
          wssPort: parseInt(ENV.PUSHER_PORT),
          forceTLS: ENV.PUSHER_SCHEME === 'https',
          enabledTransports: ['ws', 'wss'],
          cluster: '',
          disableStats: true,
          auth: {
            headers: {
              Authorization: `Bearer ${config.token}`,
            },
          },
        });

        this.config = config;

        // Événements de connexion
        this.echo.connector.pusher.connection.bind('connected', () => {
          console.log('✅ Connecté à Soketi');
          console.log('🔑 Socket ID:', this.echo?.socketId());
          console.log('🌐 Host:', ENV.PUSHER_HOST);
          console.log('🔑 App Key:', ENV.PUSHER_APP_KEY);
          console.log('📱 Session ID:', config.sessionId);
          this.isConnected = true;
          
          // Maintenant que la connexion est établie, rejoindre le canal
          this.joinSessionChannel(config.sessionId);
          
          this.config?.onConnect?.();
          resolve();
        });

        this.echo.connector.pusher.connection.bind('disconnected', () => {
          console.log('❌ Déconnecté de Soketi');
          this.isConnected = false;
          this.config?.onDisconnect?.();
        });

        this.echo.connector.pusher.connection.bind('error', (error: any) => {
          console.error('🚨 Erreur Soketi:', error);
          this.config?.onError?.(error);
          reject(error);
        });

        // Ne PAS rejoindre le canal ici - attendre la connexion
        // this.joinSessionChannel(config.sessionId);

      } catch (error) {
        console.error('🚨 Erreur lors de la connexion:', error);
        reject(error);
      }
    });
  }

  // Rejoindre le canal d'une session
  private joinSessionChannel(sessionId: string): void {
    if (!this.echo) return;
    
    // Éviter la double subscription
    if (this.sessionChannel) {
      console.log('⚠️ Canal déjà souscrit, déconnexion d\'abord...');
      this.echo.leaveChannel(`sport-session.${this.config?.sessionId}`);
      this.sessionChannel = null;
    }

    console.log(`📡 Rejoindre le canal sport-session.${sessionId}`);
    console.log('🔑 Socket ID au moment de la subscription:', this.echo.socketId());

    // Canal public pour les commentaires (avec le bon préfixe backend)
    this.sessionChannel = this.echo.channel(`sport-session.${sessionId}`);

    // Debug : Écouter TOUS les événements sur le canal
    console.log('🎧 Écoute de tous les événements sur le canal sport-session...');
    console.log('🔍 Canal complet:', `sport-session.${sessionId}`);
    console.log('🔑 Socket ID:', this.echo.socketId());
    
    // Écouter les événements de base Pusher (subscription)
    this.sessionChannel.listen('pusher:subscription_succeeded', (data: any) => {
      console.log('🎉 Subscription réussie au canal');
      console.log('📊 Données subscription:', JSON.stringify(data, null, 2));
    });
    
    this.sessionChannel.listen('pusher:subscription_error', (data: any) => {
      console.log('❌ Erreur de subscription:', JSON.stringify(data, null, 2));
    });
    
    // Écouter TOUS les événements avec un wildcard (debug)
    this.sessionChannel.listen('*', (eventName: string, data: any) => {
      console.log('🔔 ÉVÉNEMENT RECU (wildcard):', eventName);
      console.log('📊 Données:', JSON.stringify(data, null, 2));
    });
    
    // Écouter spécifiquement les événements de commentaires
    this.sessionChannel.listen('comment.created', (data: any) => {
      console.log('📨 NOUVEAU COMMENTAIRE RECU !');
      console.log('📊 Données commentaire:', JSON.stringify(data, null, 2));
      this.config?.onCommentCreated?.(data.comment || data);
    });
    
    this.sessionChannel.listen('comment.updated', (data: any) => {
      console.log('✏️ COMMENTAIRE MODIFIÉ !');
      console.log('📊 Données commentaire:', JSON.stringify(data, null, 2));
      this.config?.onCommentUpdated?.(data.comment || data);
    });
    
    this.sessionChannel.listen('comment.deleted', (data: any) => {
      console.log('🗑️ COMMENTAIRE SUPPRIMÉ !');
      console.log('📊 Données commentaire:', JSON.stringify(data, null, 2));
      this.config?.onCommentDeleted?.(data.commentId || data.id);
    });

    // Événements de présence (si canal privé/présence disponible)
    // TODO: Implémenter quand le backend supportera les canaux de présence
    /*
    const presenceChannel = this.echo.join(`session.${sessionId}`);
    presenceChannel
      .here((users: any[]) => {
        console.log('👥 Utilisateurs en ligne:', users);
        this.config?.onOnlineUsers?.(users);
      })
      .joining((user: any) => {
        console.log('👋 Utilisateur rejoint:', user);
        this.config?.onUserOnline?.(user);
      })
      .leaving((user: any) => {
        console.log('👋 Utilisateur quitte:', user);
        this.config?.onUserOffline?.(user);
      });
    */
  }

  // Déconnexion
  disconnect(): void {
    if (this.echo) {
      console.log('🔌 Déconnexion de Soketi...');
      
      // Quitter le canal de session
      if (this.sessionChannel) {
        this.echo.leaveChannel(`sport-session.${this.config?.sessionId}`);
        this.sessionChannel = null;
      }

      // Déconnecter Echo
      this.echo.disconnect();
      this.echo = null;
      this.config = null;
      this.isConnected = false;
    }
  }

  // COMMENTÉ - Envoyer un événement de frappe (à implémenter plus tard)
  /*
  sendTyping(sessionId: string, isTyping: boolean): void {
    if (this.sessionChannel && this.config) {
      this.sessionChannel.whisper('typing', {
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
    return this.isConnected && this.echo?.connector?.pusher?.connection?.state === 'connected';
  }

  // Obtenir l'ID de socket
  getSocketId(): string | undefined {
    return this.echo?.socketId();
  }

  // Mettre à jour les informations utilisateur
  updateUserInfo(userId: string, userInfo: { firstname: string; lastname: string; avatar?: string | null }): void {
    if (this.config) {
      this.config.user = {
        id: userId,
        firstname: userInfo.firstname,
        lastname: userInfo.lastname,
        avatar: userInfo.avatar || null
      };
      console.log('👤 Informations utilisateur mises à jour:', this.config.user);
    }
  }
}

// Instance singleton
export const webSocketService = new WebSocketService();