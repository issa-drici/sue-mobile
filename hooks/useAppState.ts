import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from '../app/context/auth';
import { pushNotificationService } from '../services/notifications/pushNotifications';

/**
 * Hook pour gérer les changements d'état de l'application
 * Utile pour vérifier les permissions de notifications quand l'utilisateur revient dans l'app
 */
export const useAppState = () => {
  const appState = useRef(AppState.currentState);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Initialiser le service de notifications au démarrage SEULEMENT si l'utilisateur est connecté
    const initializeService = async () => {
      try {
        // Ne pas initialiser les notifications si l'utilisateur n'est pas connecté
        if (!isAuthenticated) {
          console.log('ℹ️ Utilisateur non connecté, pas d\'initialisation des notifications');
          return;
        }

        const isInitialized = pushNotificationService.isServiceInitialized();
        if (!isInitialized) {
          console.log('🚀 Initialisation du service de notifications...');
          await pushNotificationService.initialize();
        }
      } catch (error) {
        console.warn('⚠️ Erreur lors de l\'initialisation du service:', error);
      }
    };

    initializeService();

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      // Si l'app passe de "background" ou "inactive" à "active"
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('🔄 App revenue au premier plan, vérification des permissions...');
        
        try {
          // Vérifier si les permissions ont été modifiées dans les réglages
          const permissionsGranted = await pushNotificationService.checkAndReinitializePermissions();
          
          if (permissionsGranted && isAuthenticated) {
            // Si l'utilisateur est connecté, enregistrer le token en BDD
            await pushNotificationService.registerTokenInDatabase();
            console.log('✅ Token push enregistré après activation des permissions');
          } else if (!permissionsGranted) {
            console.log('ℹ️ Permissions de notifications non accordées ou révoquées');
          } else if (!isAuthenticated) {
            console.log('ℹ️ Utilisateur non connecté, pas d\'enregistrement de token');
          }
        } catch (error) {
          console.warn('⚠️ Erreur lors de la vérification des permissions:', error);
        }
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [isAuthenticated]); // Dépendance ajoutée pour réagir aux changements d'authentification
};
