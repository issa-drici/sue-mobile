import * as Application from 'expo-application';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { baseApiService } from '../api/baseApi';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushNotificationData {
  notification_id?: string;
  type?: string;
  session_id?: string;
  sessionId?: string; // Support du format alternatif
  user_id?: string;
  userId?: string; // Support du format alternatif
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
      console.log('📱 Expo Push Token obtenu:', token.data);
      return token.data;
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'obtention du token:', error);
      return null;
    }
  }

  /**
   * Obtient l'ID du device
   */
  private getDeviceId(): string | null {
    try {
      // Sur iOS, on utilise l'applicationId
      // Sur Android, on utilise androidId
      if (Platform.OS === 'android') {
        return Application.getAndroidId?.() || null;
      } else {
        return Application.applicationId || null;
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'obtention du device ID:', error);
      return null;
    }
  }

  /**
   * Enregistre le token côté backend
   */
  private async registerToken(token: string): Promise<boolean> {
    try {
      const deviceId = this.getDeviceId();
      
      const payload: any = {
        token,
        platform: Platform.OS,
      };

      // Ajouter device_id si disponible
      if (deviceId) {
        payload.device_id = deviceId;
      }

      console.log('📤 Enregistrement du token:', payload);
      
      const response = await baseApiService.post('/push-tokens', payload) as any;

      if (response?.success) {
        console.log('✅ Token enregistré avec succès');
        return true;
      } else {
        console.log('❌ Échec de l\'enregistrement du token');
        return false;
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'enregistrement du token:', error);
      return false;
    }
  }

  /**
   * Demande les permissions de notifications
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (error) {
      console.error('❌ Erreur lors de la demande de permissions:', error);
      return false;
    }
  }

  /**
   * Enregistre le token push
   */
  async registerToken(): Promise<boolean> {
    try {
      const token = await this.getExpoPushToken();
      if (token) {
        return await this.registerTokenWithBackend(token);
      }
      return false;
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement du token:', error);
      return false;
    }
  }

  /**
   * Désinscrit le token côté backend
   */
  async unregisterToken(): Promise<boolean> {
    try {
      if (!this.expoPushToken) {
        console.log('⚠️ Aucun token à désinscrire');
        return true;
      }

      console.log('📤 Désinscription du token:', this.expoPushToken);
      
      const response = await baseApiService.delete('/push-tokens', {
        data: { token: this.expoPushToken }
      }) as any;

      if (response?.success) {
        console.log('✅ Token désinscrit avec succès');
        this.expoPushToken = null;
        this.isInitialized = false;
        return true;
      } else {
        console.log('❌ Échec de la désinscription du token');
        return false;
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de la désinscription du token:', error);
      // Même en cas d'erreur, on nettoie localement
      this.expoPushToken = null;
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Envoie une notification de test via le backend
   */
  async sendTestNotification(userId?: string): Promise<boolean> {
    try {
      console.log('📤 Envoi d\'une notification de test...');
      
      // Si pas d'userId fourni, on utilise l'utilisateur connecté
      const recipientId = userId || 'self';
      
      const response = await baseApiService.post('/notifications/send', {
        recipientId,
        title: 'Test Notification',
        body: 'Ceci est un test de notification push ✅',
        data: {
          type: 'general',
          notification_id: `test-${Date.now()}`,
          extra: { test: true }
        }
      }) as any;

      if (response?.success) {
        console.log('✅ Notification de test envoyée avec succès');
        return true;
      } else {
        console.log('❌ Échec de l\'envoi de la notification de test');
        return false;
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'envoi de la notification de test:', error);
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
    
    console.log('👆 Notification cliquée:', title);
    console.log('👆 Contenu notification:', body);
    console.log('👆 Données notification:', JSON.stringify(data, null, 2));
    
    // Navigation selon le type de notification
    this.handleNotificationNavigation(data as PushNotificationData);
  }

  /**
   * Gère la navigation selon le type de notification
   */
  private handleNotificationNavigation(data: PushNotificationData): void {
    if (!data) {
      console.log('❌ Données de notification manquantes');
      return;
    }

    console.log('🔔 Navigation notification - Type:', data.type);
    console.log('🔔 Navigation notification - Données:', JSON.stringify(data, null, 2));

    // Import dynamique pour éviter les dépendances circulaires
    import('expo-router').then(({ router }) => {
      switch (data.type) {
        case 'session_invitation':
          const sessionIdInvitation = data.session_id || data.sessionId;
          if (sessionIdInvitation) {
            console.log('📍 Redirection vers session (invitation):', sessionIdInvitation);
            router.push(`/session/${sessionIdInvitation}`);
          } else {
            console.log('❌ session_id manquant pour invitation');
          }
          break;
        case 'session_update':
          const sessionIdUpdate = data.session_id || data.sessionId;
          if (sessionIdUpdate) {
            console.log('📍 Redirection vers session (update):', sessionIdUpdate);
            router.push(`/session/${sessionIdUpdate}`);
          } else {
            console.log('❌ session_id manquant pour update');
          }
          break;
        case 'friend_request':
          console.log('📍 Redirection vers amis');
          router.push('/friends');
          break;
        case 'comment':
          const sessionIdComment = data.session_id || data.sessionId;
          if (sessionIdComment) {
            console.log('📍 Redirection vers session (commentaire):', sessionIdComment);
            router.push(`/session/${sessionIdComment}`);
          } else {
            console.log('❌ session_id manquant pour commentaire - données:', JSON.stringify(data, null, 2));
            // Fallback vers la liste des sessions si pas de session_id
            console.log('📍 Fallback vers liste des sessions');
            router.push('/(tabs)');
          }
          break;
        case 'general':
        default:
          console.log('📍 Notification générale - pas de navigation');
          break;
      }
    }).catch(error => {
      console.error('❌ Erreur lors de la navigation:', error);
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