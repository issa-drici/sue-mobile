import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { baseApiService } from '../api/baseApi';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface PushNotificationData {
  notification_id?: string;
  type?: string;
  session_id?: string;
  user_id?: string;
  [key: string]: any;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: PushNotificationData;
}

export class PushNotificationService {
  private static instance: PushNotificationService;
  private expoPushToken: string | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * Initialise le service de notifications push
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      // Demander les permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return false;
      }

      // Obtenir le token Expo
      const token = await this.getExpoPushToken();
      if (token) {
        await this.registerToken(token);
      } else {
        return false;
      }

      // Configurer les listeners
      this.setupNotificationListeners();

      this.isInitialized = true;
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtient le token Expo Push
   */
  private async getExpoPushToken(): Promise<string | null> {
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: '1b831c3a-2180-4050-b751-7e5248737d95',
      });
      
      this.expoPushToken = token.data;
      return token.data;
    } catch (error: any) {
      return null;
    }
  }

  /**
   * Enregistre le token côté backend
   */
  private async registerToken(token: string): Promise<boolean> {
    try {
      const response = await baseApiService.post('/push-tokens', {
        token,
        platform: Platform.OS,
      }) as any;

      if (response?.success) {
        return true;
      } else {
        return false;
      }
    } catch (error: any) {
      return false;
    }
  }

  /**
   * Configure les listeners de notifications
   */
  private setupNotificationListeners(): void {
    // Notification reçue quand l'app est en arrière-plan
    Notifications.addNotificationReceivedListener((notification) => {
      this.handleNotificationReceived(notification);
    });

    // Notification cliquée
    Notifications.addNotificationResponseReceivedListener((response) => {
      this.handleNotificationClicked(response);
    });
  }

  /**
   * Gère une notification reçue
   */
  private handleNotificationReceived(notification: Notifications.Notification): void {
    const { title, body, data } = notification.request.content;
    
    // Ici on peut ajouter de la logique pour traiter la notification
    // Par exemple, mettre à jour le badge, stocker en local, etc.
  }

  /**
   * Gère un clic sur une notification
   */
  private handleNotificationClicked(response: Notifications.NotificationResponse): void {
    const { title, body, data } = response.notification.request.content;
    
    // Navigation selon le type de notification
    this.handleNotificationNavigation(data as PushNotificationData);
  }

  /**
   * Gère la navigation selon le type de notification
   */
  private handleNotificationNavigation(data: PushNotificationData): void {
    if (!data) return;

    // Import dynamique pour éviter les dépendances circulaires
    import('expo-router').then(({ router }) => {
      switch (data.type) {
        case 'session_invitation':
          if (data.session_id) {
            router.push(`/session/${data.session_id}`);
          }
          break;
        case 'session_update':
          if (data.session_id) {
            router.push(`/session/${data.session_id}`);
          }
          break;
        case 'friend_request':
          router.push('/friends');
          break;
        case 'comment':
          if (data.session_id) {
            router.push(`/session/${data.session_id}`);
          }
          break;
        case 'general':
        default:
          // Notification générale, pas de navigation spécifique
          break;
      }
    });
  }

  /**
   * Envoie une notification locale (pour les tests)
   */
  async sendLocalNotification(payload: PushNotificationPayload): Promise<void> {
    try {
      const notificationContent = {
        content: {
          title: payload.title,
          body: payload.body,
          data: payload.data || {},
          sound: 'default',
        },
        trigger: null, // Immédiat
      };
      
      await Notifications.scheduleNotificationAsync(notificationContent);
    } catch (error: any) {
      // Gestion silencieuse des erreurs
    }
  }

  /**
   * Obtient le token actuel
   */
  getToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Debug: Afficher les informations du service
   */
  debugInfo(): void {
    if (this.expoPushToken) {
    }
  }

  /**
   * Vérifie si le service est initialisé
   */
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Nettoie les ressources
   */
  async cleanup(): Promise<void> {
    try {
      // Note: removeAllNotificationListeners n'existe pas dans expo-notifications
      // Les listeners sont automatiquement nettoyés quand l'app se ferme
    } catch (error) {
      // Gestion silencieuse des erreurs
    }
  }
}

// Instance singleton
export const pushNotificationService = PushNotificationService.getInstance(); 