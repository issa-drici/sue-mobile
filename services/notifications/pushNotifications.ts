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
  // Flag local : la demande "soft" (bottom sheet) a déjà été traitée (activée OU refusée)
  private static readonly SOFT_PROMPT_KEY = 'notif_soft_prompt_handled';

  // Abonnements aux listeners (pour éviter les doublons lors de ré-initialisations)
  private receivedSubscription: Notifications.Subscription | null = null;
  private responseSubscription: Notifications.Subscription | null = null;
  // Déduplication des taps déjà traités (cold start + listener peuvent délivrer le même)
  private handledResponseIds = new Set<string>();

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
      // NE PAS demander la permission ici. L'initialisation ne configure le service
      // (token + listeners) QUE si la permission est DÉJÀ accordée. La demande native
      // est déclenchée uniquement par la demande "soft" (bottom sheet) via
      // activateFromPrompt() -> requestPermissions(). Cela évite que la popup Apple
      // s'affiche automatiquement au login/au foreground, sans contexte pour l'utilisateur.
      const { status } = await Notifications.getPermissionsAsync();

      if (status !== 'granted') {
        return false;
      }

      // Obtenir et stocker le token localement
      const token = await this.getExpoPushToken();
      if (!token) {
        console.warn('⚠️ Impossible d\'obtenir le token Expo Push');
        console.warn('   Le service sera initialisé partiellement (notifications locales uniquement)');
        // On initialise quand même pour permettre les notifications locales
        this.setupNotificationListeners();
        // On ne marque pas comme initialisé car pas de token pour les push
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
   * 
   * Note: Sur iOS, fonctionne directement avec APNs via Expo.
   * Sur Android, nécessite Firebase Cloud Messaging (FCM) configuré.
   * Pour le développement local Android, ajoutez google-services.json.
   * Pour les builds EAS, configurez les credentials FCM via `eas credentials`.
   */
  private async getExpoPushToken(): Promise<string | null> {
    try {
      // Configuration identique pour iOS et Android
      // Sur iOS: utilise APNs automatiquement
      // Sur Android: nécessite FCM configuré (google-services.json ou EAS credentials)
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: '1b831c3a-2180-4050-b751-7e5248737d95',
      });
      
      this.expoPushToken = token.data;
      
      // Stocker le token localement
      await AsyncStorage.setItem(PushNotificationService.STORAGE_KEY, token.data);
      
      return token.data;
    } catch (error: any) {
      // Log détaillé de l'erreur pour diagnostic
      const errorMessage = error?.message || String(error);
      const errorCode = error?.code || 'UNKNOWN';
      const errorStack = error?.stack || '';
      
      console.error(`❌ Erreur lors de l'obtention du token Expo Push (${Platform.OS}):`);
      console.error('   Message:', errorMessage);
      console.error('   Code:', errorCode);
      
      // Gestion spécifique selon la plateforme
      if (Platform.OS === 'android') {
        // Sur Android, les erreurs Firebase sont courantes si FCM n'est pas configuré
        if (errorMessage.includes('FirebaseApp') || errorMessage.includes('FCM') || errorMessage.includes('Firebase')) {
          console.warn('⚠️ Firebase non configuré sur Android');
          console.warn('   Les notifications push Android nécessitent Firebase Cloud Messaging (FCM)');
          console.warn('   Options:');
          console.warn('   1. Développement local: Ajoutez google-services.json à la racine du projet');
          console.warn('   2. Build EAS: Configurez les credentials FCM via `eas credentials`');
          console.warn('   Documentation: https://docs.expo.dev/push-notifications/using-fcm/');
        } else {
          console.error('   Stack:', errorStack);
        }
      } else if (Platform.OS === 'ios') {
        // Sur iOS, les erreurs sont moins courantes (APNs géré automatiquement)
        if (errorMessage.includes('network') || errorMessage.includes('Network')) {
          console.warn('⚠️ Erreur réseau lors de l\'obtention du token (iOS)');
        } else if (errorMessage.includes('permission') || errorMessage.includes('Permission')) {
          console.warn('⚠️ Permissions de notifications non accordées (iOS)');
        } else {
          console.error('   Stack:', errorStack);
        }
      }
      
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
      console.log('🔄 Tentative d\'enregistrement du token en base de données...');
      
      // D'abord, essayer d'obtenir un token si on n'en a pas
      let token = await this.getStoredToken();
      if (!token) {
        token = await this.getExpoPushToken();
        if (!token) {
          console.error('❌ Impossible d\'obtenir un token Expo Push pour l\'enregistrement');
          console.error('   Vérifiez que les permissions sont accordées et que Firebase est configuré (Android)');
          return false;
        }
      }

      const payload = {
        token,
        platform: Platform.OS
      };

      const response = await baseApiService.post('/push-tokens', payload) as any;

      if (response?.success) {
        return true;
      } else {
        console.error('❌ Échec de l\'enregistrement du token en BDD');
        console.error('   Réponse:', response);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'enregistrement du token en BDD:');
      console.error('   Message:', error?.message || String(error));
      console.error('   Code:', error?.code || 'UNKNOWN');
      if (error?.response) {
        console.error('   Status:', error.response.status);
        console.error('   Data:', error.response.data);
      }
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
        return true; // Pas d'erreur si pas de token
      }

      const response = await baseApiService.delete('/push-tokens', { token }) as any;

      if (response?.success) {
        return true;
      } else {
        console.error('❌ Échec de la suppression du token de la BDD');
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
   * Détermine s'il faut afficher la demande "soft" (bottom sheet) avant la popup native.
   * Ne réutilise que des méthodes existantes. Retourne false si :
   *  - la demande soft a déjà été traitée (flag local) ;
   *  - la permission est déjà accordée OU refusée (status ≠ 'undetermined') ;
   *  - un token push existe déjà.
   */
  async shouldShowSoftPrompt(): Promise<boolean> {
    try {
      const handled = await AsyncStorage.getItem(PushNotificationService.SOFT_PROMPT_KEY);
      if (handled === 'true') return false;

      const { status } = await this.getPermissions();
      if (status !== 'undetermined') return false;

      const token = await this.getStoredToken();
      if (token) return false;

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Marque la demande soft comme traitée (pour ne jamais la réafficher en boucle).
   */
  async markSoftPromptHandled(): Promise<void> {
    try {
      await AsyncStorage.setItem(PushNotificationService.SOFT_PROMPT_KEY, 'true');
    } catch {
      // silencieux
    }
  }

  /**
   * Active les notifications depuis la demande soft : compose la logique EXISTANTE
   * (permission native -> initialisation -> enregistrement du token en BDD).
   * Aucune logique dupliquée.
   */
  async activateFromPrompt(): Promise<boolean> {
    const granted = await this.requestPermissions();
    if (!granted) {
      return false;
    }
    await this.initialize();
    await this.registerTokenInDatabase();
    return true;
  }

  /**
   * Vérifie si les permissions sont accordées et réinitialise si nécessaire
   */
  async checkAndReinitializePermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      
      if (status === 'granted') {
        // Les permissions sont accordées
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
            
            return true;
          } else {
            // Permissions OK mais token non obtenu (probablement Firebase non configuré)
            // On retourne true car les permissions sont OK, c'est juste Firebase qui manque
            return true;
          }
        } else {
          // Token déjà stocké, on vérifie juste que les listeners sont configurés
          if (!this.isInitialized) {
            this.setupNotificationListeners();
            this.isInitialized = true;
          }
          
          return true;
        }
      } else {
        // Les permissions ne sont plus accordées
        console.warn('⚠️ Permissions de notifications non accordées ou révoquées');
        
        // Supprimer le token de la BDD si l'utilisateur est connecté
        try {
          await this.unregisterTokenFromDatabase();
        } catch (error) {
          console.warn('⚠️ Erreur lors de la suppression du token après révocation:', error);
        }
        
        // Nettoyer l'état local
        this.expoPushToken = null;
        this.isInitialized = false;
        
        // Supprimer le token du stockage local
        try {
          await AsyncStorage.removeItem(PushNotificationService.STORAGE_KEY);
        } catch (error) {
          console.warn('⚠️ Erreur lors de la suppression du token du stockage local:', error);
        }
        
        return false;
      }
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
    // Retirer d'éventuels listeners précédents : setupNotificationListeners peut être
    // appelé plusieurs fois (ré-init au foreground). Sans ça, les listeners s'empilent
    // et un seul tap déclenche plusieurs navigations (écrans dupliqués / retour cassé).
    this.receivedSubscription?.remove();
    this.responseSubscription?.remove();

    // Notification reçue (app au premier plan / arrière-plan)
    this.receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      this.handleNotificationReceived(notification);
    });

    // Notification cliquée (app ouverte ou en arrière-plan)
    this.responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      this.handleNotificationClicked(response);
    });

    // Cold start : traiter la notification qui a lancé l'app depuis un état tué.
    // Le listener ci-dessus ne capte pas toujours ce cas → on récupère la dernière réponse.
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) {
          this.handleNotificationClicked(response);
        }
      })
      .catch(() => { });
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
    // Dédup : le cold start (getLastNotificationResponseAsync) et le listener peuvent
    // délivrer le même tap ; getLastNotificationResponseAsync renvoie aussi toujours la
    // même réponse à chaque ré-init → on ne traite chaque tap qu'une seule fois.
    const identifier = response.notification.request.identifier;
    if (identifier) {
      if (this.handledResponseIds.has(identifier)) {
        return;
      }
      this.handledResponseIds.add(identifier);
    }

    const { data } = response.notification.request.content;

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
      // On utilise router.navigate (et non push) : ça réutilise l'écran de session s'il
      // est déjà affiché au lieu d'empiler un doublon → retour propre.
      const sessionId = data.session_id || data.sessionId;

      switch (data.type) {
        // Toutes les notifications liées à une session mènent à l'écran de la session
        case 'session_invitation':
        case 'session_update':
        case 'session_cancelled':
        case 'session_organizer_changed':
        case 'reminder':
          if (sessionId) {
            router.navigate(`/session/${sessionId}`);
          } else {
            router.navigate('/(tabs)');
          }
          break;

        case 'comment':
          if (sessionId) {
            // Ouvre directement la modal de commentaires
            router.navigate(`/session/${sessionId}?openComments=true`);
          } else {
            router.navigate('/(tabs)');
          }
          break;

        case 'friend_request':
          // Écran dédié où l'on accepte/refuse la demande
          router.navigate('/friend-requests');
          break;

        default:
          // Type inconnu : si un session_id est présent, on tente quand même la session
          // (robuste aux futurs types portant un session_id), sinon on ne fait rien.
          if (sessionId) {
            router.navigate(`/session/${sessionId}`);
          }
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