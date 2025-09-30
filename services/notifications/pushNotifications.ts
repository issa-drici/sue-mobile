import AsyncStorage from '@react-native-async-storage/async-storage';
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
  private static readonly STORAGE_KEY = 'expo_push_token';

  private constructor() {}

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * Initialise le service de notifications push (onboarding)
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

      // Obtenir et stocker le token localement
      const token = await this.getExpoPushToken();
      if (!token) {
        return false;
      }

      // Configurer les listeners
      this.setupNotificationListeners();

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation:', error);
      return false;
    }
  }

  /**
   * Obtient le token Expo Push et le stocke localement
   */
  private async getExpoPushToken(): Promise<string | null> {
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: '1b831c3a-2180-4050-b751-7e5248737d95',
      });
      
      this.expoPushToken = token.data;
      
      // Stocker le token localement
      await AsyncStorage.setItem(PushNotificationService.STORAGE_KEY, token.data);
      
      console.log('📱 Token Expo obtenu et stocké localement:', token.data);
      return token.data;
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'obtention du token:', error);
      return null;
    }
  }

  /**
   * Récupère le token stocké localement
   */
  private async getStoredToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(PushNotificationService.STORAGE_KEY);
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du token stocké:', error);
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
   * Enregistre le token en base de données (lors de la connexion)
   */
  async registerTokenInDatabase(): Promise<boolean> {
    try {
      const token = await this.getStoredToken();
      if (!token) {
        console.log('⚠️ Aucun token stocké localement');
        return false;
      }

      const payload = {
        token,
        platform: Platform.OS
      };

      const response = await baseApiService.post('/push-tokens', payload) as any;

      if (response?.success) {
        console.log('✅ Token enregistré en BDD avec succès');
        return true;
      } else {
        console.log('❌ Échec de l\'enregistrement du token en BDD');
        return false;
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'enregistrement du token en BDD:', error);
      return false;
    }
  }

  /**
   * Supprime le token de la base de données (lors de la déconnexion)
   */
  async unregisterTokenFromDatabase(): Promise<boolean> {
    try {
      const token = await this.getStoredToken();
      if (!token) {
        console.log('⚠️ Aucun token stocké localement');
        return true; // Pas d'erreur si pas de token
      }

      const response = await baseApiService.delete('/push-tokens', { token }) as any;

      if (response?.success) {
        console.log('✅ Token supprimé de la BDD avec succès');
        return true;
      } else {
        console.log('❌ Échec de la suppression du token de la BDD');
        return false;
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de la suppression du token de la BDD:', error);
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
   * Récupère le statut des permissions
   */
  async getPermissions(): Promise<{ status: string }> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return { status };
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des permissions:', error);
      return { status: 'unknown' };
    }
  }

  /**
   * Vérifie si les permissions sont accordées et réinitialise si nécessaire
   */
  async checkAndReinitializePermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      
      if (status === 'granted') {
        // Les permissions sont maintenant accordées
        const storedToken = await this.getStoredToken();
        
        if (!storedToken) {
          // Pas de token stocké, on en obtient un nouveau
          console.log('🔄 Permissions accordées, obtention d\'un nouveau token...');
          const token = await this.getExpoPushToken();
          
          if (token) {
            // Configurer les listeners si pas déjà fait
            if (!this.isInitialized) {
              this.setupNotificationListeners();
              this.isInitialized = true;
            }
            
            console.log('✅ Token obtenu après activation des permissions');
            return true;
          }
        } else {
          // Token déjà stocké, on vérifie juste que les listeners sont configurés
          if (!this.isInitialized) {
            this.setupNotificationListeners();
            this.isInitialized = true;
          }
          
          console.log('✅ Permissions accordées, token déjà disponible');
          return true;
        }
      } else {
        // Les permissions ne sont plus accordées
        console.log('⚠️ Permissions de notifications révoquées');
        
        // Supprimer le token de la BDD si l'utilisateur est connecté
        try {
          await this.unregisterTokenFromDatabase();
          console.log('✅ Token supprimé de la BDD après révocation des permissions');
        } catch (error) {
          console.warn('⚠️ Erreur lors de la suppression du token après révocation:', error);
        }
        
        // Nettoyer l'état local
        this.expoPushToken = null;
        this.isInitialized = false;
        
        // Supprimer le token du stockage local
        try {
          await AsyncStorage.removeItem(PushNotificationService.STORAGE_KEY);
          console.log('✅ Token supprimé du stockage local');
        } catch (error) {
          console.warn('⚠️ Erreur lors de la suppression du token du stockage local:', error);
        }
      }
      
      return false;
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des permissions:', error);
      return false;
    }
  }

  /**
   * Enregistre le token push (méthode de compatibilité)
   */
  async registerToken(): Promise<boolean> {
    try {
      const token = await this.getExpoPushToken();
      if (token) {
        return await this.registerTokenInDatabase();
      }
      return false;
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement du token:', error);
      return false;
    }
  }

  /**
   * Désinscrit le token côté backend (méthode de compatibilité)
   */
  async unregisterToken(): Promise<boolean> {
    try {
      const result = await this.unregisterTokenFromDatabase();
      
      // Nettoyer l'état local
      this.expoPushToken = null;
      this.isInitialized = false;
      
      return result;
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
   * Envoie une notification de test pour les commentaires
   */
  async sendTestCommentNotification(sessionId: string, userId?: string): Promise<boolean> {
    try {
      console.log('📤 Envoi d\'une notification de test pour commentaire...');
      
      const recipientId = userId || 'self';
      
      const response = await baseApiService.post('/notifications/send', {
        recipientId,
        title: 'Nouveau commentaire',
        body: 'Test: Un nouveau commentaire a été ajouté à la session',
        data: {
          type: 'comment',
          session_id: sessionId,
          notification_id: `comment-test-${Date.now()}`,
          extra: { test: true }
        }
      }) as any;

      if (response?.success) {
        console.log('✅ Notification de commentaire de test envoyée avec succès');
        return true;
      } else {
        console.log('❌ Échec de l\'envoi de la notification de commentaire de test');
        return false;
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'envoi de la notification de commentaire de test:', error);
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
    // Ici on peut ajouter de la logique pour traiter la notification
    // Par exemple, mettre à jour le badge, stocker en local, etc.
    console.log('📨 Notification reçue:', notification.request.content.title);
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
            // Passer un paramètre pour ouvrir automatiquement la modal de commentaires
            router.push(`/session/${sessionIdComment}?openComments=true`);
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
    } catch {
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
      console.log('🔍 Debug - Token Expo:', this.expoPushToken);
      console.log('🔍 Debug - Service initialisé:', this.isInitialized);
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
      console.log('🧹 Nettoyage des ressources de notifications');
    } catch {
      // Gestion silencieuse des erreurs
    }
  }
}

// Instance singleton
export const pushNotificationService = PushNotificationService.getInstance(); 