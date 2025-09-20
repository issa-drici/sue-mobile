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

  // Connexion à Soketi via Pusher directement
  connect(config: WebSocketConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔌 Connexion à Soketi via Pusher...', {
          host: ENV.PUSHER_HOST,
          port: ENV.PUSHER_PORT,
          key: ENV.PUSHER_APP_KEY
        });

        // Configuration de Pusher pour Soketi
        this.pusher = new Pusher(ENV.PUSHER_APP_KEY, {
          wsHost: ENV.PUSHER_HOST,
          wsPort: parseInt(ENV.PUSHER_PORT),
          wssPort: parseInt(ENV.PUSHER_PORT),
          forceTLS: ENV.PUSHER_SCHEME === 'https',
          enabledTransports: ['ws', 'wss'],
          disableStats: true,
          cluster: 'mt1',
          auth: {
            headers: {
              Authorization: `Bearer ${config.token}`,
            },
          },
        });

        this.config = config;

        // Événements de connexion
        this.pusher.connection.bind('connected', () => {
          console.log('✅ Connecté à Soketi');
          console.log('🔑 Socket ID:', this.pusher?.connection.socket_id);
          console.log('🌐 Host:', ENV.PUSHER_HOST);
          console.log('🔑 App Key:', ENV.PUSHER_APP_KEY);
          console.log('📱 Session ID:', config.sessionId);
          this.isConnected = true;
          
          // Maintenant que la connexion est établie, rejoindre le canal
          this.joinSessionChannel(config.sessionId);
          
          this.config?.onConnect?.();
          resolve();
        });

        this.pusher.connection.bind('disconnected', () => {
          console.log('❌ Déconnecté de Soketi');
          this.isConnected = false;
          this.config?.onDisconnect?.();
        });

        this.pusher.connection.bind('error', (error: any) => {
          console.error('🚨 Erreur Soketi:', error);
          this.config?.onError?.(error);
          reject(error);
        });

      } catch (error) {
        console.error('🚨 Erreur lors de la connexion:', error);
        reject(error);
      }
    });
  }

  // Rejoindre le canal d'une session
  private joinSessionChannel(sessionId: string): void {
    if (!this.pusher) return;
    
    // Éviter la double subscription
    if (this.sessionChannel) {
      console.log('⚠️ Canal déjà souscrit, déconnexion d\'abord...');
      this.pusher.unsubscribe(`sport-session.${this.config?.sessionId}`);
      this.sessionChannel = null;
    }

    console.log(`📡 Rejoindre le canal sport-session.${sessionId}`);
    console.log('🔑 Socket ID au moment de la subscription:', this.pusher.connection.socket_id);

    // Canal public pour les commentaires (avec le bon préfixe backend)
    this.sessionChannel = this.pusher.subscribe(`sport-session.${sessionId}`);

    // Debug : Écouter TOUS les événements sur le canal
    console.log('🎧 Écoute de tous les événements sur le canal sport-session...');
    console.log('🔍 Canal complet:', `sport-session.${sessionId}`);
    console.log('🔑 Socket ID:', this.pusher.connection.socket_id);
    
    // Écouter les événements de base Pusher (subscription)
    this.sessionChannel.bind('pusher:subscription_succeeded', (data: any) => {
      console.log('🎉 Subscription réussie au canal');
      console.log('📊 Données subscription:', JSON.stringify(data, null, 2));
    });
    
    this.sessionChannel.bind('pusher:subscription_error', (data: any) => {
      console.log('❌ Erreur de subscription:', JSON.stringify(data, null, 2));
    });
    
    // Écouter TOUS les événements avec un wildcard (debug)
    this.sessionChannel.bind_global((eventName: string, data: any) => {
      if (eventName !== 'pusher:subscription_succeeded') {
        console.log('🔔 ÉVÉNEMENT RECU (global):', eventName);
        console.log('📊 Données:', JSON.stringify(data, null, 2));
      }
    });
    
    // Écouter spécifiquement les événements de commentaires
    this.sessionChannel.bind('comment.created', (data: any) => {
      console.log('📨 NOUVEAU COMMENTAIRE RECU !');
      console.log('📊 Données commentaire:', JSON.stringify(data, null, 2));
      this.config?.onCommentCreated?.(data.comment || data);
    });
    
    this.sessionChannel.bind('comment.updated', (data: any) => {
      console.log('✏️ COMMENTAIRE MODIFIÉ !');
      console.log('📊 Données commentaire:', JSON.stringify(data, null, 2));
      this.config?.onCommentUpdated?.(data.comment || data);
    });
    
    this.sessionChannel.bind('comment.deleted', (data: any) => {
      console.log('🗑️ COMMENTAIRE SUPPRIMÉ !');
      console.log('📊 Données commentaire:', JSON.stringify(data, null, 2));
      this.config?.onCommentDeleted?.(data.commentId || data.id);
    });

    // Événements de présence (si canal privé/présence disponible)
    // TODO: Implémenter quand le backend supportera les canaux de présence
    /*
    const presenceChannel = this.pusher.subscribe(`presence-session.${sessionId}`);
    presenceChannel.bind('pusher:subscription_succeeded', (data: any) => {
      console.log('👥 Canal de présence rejoint:', data);
    });
    */
  }

  // Déconnexion
  disconnect(): void {
    if (this.pusher) {
      console.log('🔌 Déconnexion de Soketi...');
      
      // Quitter le canal de session
      if (this.sessionChannel) {
        this.pusher.unsubscribe(`sport-session.${this.config?.sessionId}`);
        this.sessionChannel = null;
      }

      // Déconnecter Pusher
      this.pusher.disconnect();
      this.pusher = null;
      this.config = null;
      this.isConnected = false;
    }
  }

  // Obtenir le statut de la connexion
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Obtenir l'ID du socket
  getSocketId(): string | undefined {
    return this.pusher?.connection.socket_id;
  }

  // Mettre à jour les informations utilisateur
  updateUserInfo(userId: string, userInfo: { firstname: string; lastname: string; avatar?: string | null }): void {
    // TODO: Implémenter si nécessaire pour les canaux de présence
    console.log('👤 Mise à jour des infos utilisateur:', { userId, userInfo });
  }
}

// Instance singleton
export const webSocketService = new WebSocketService();
