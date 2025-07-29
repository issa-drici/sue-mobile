import { useEffect, useState } from 'react';
import { PushNotificationPayload, pushNotificationService } from '../services/notifications/pushNotifications';

export interface UsePushNotificationsReturn {
  isInitialized: boolean;
  isInitializing: boolean;
  token: string | null;
  initialize: () => Promise<boolean>;
  sendLocalNotification: (payload: PushNotificationPayload) => Promise<void>;
}

/**
 * Hook pour gérer les notifications push
 */
export const usePushNotifications = (): UsePushNotificationsReturn => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const initialize = async (): Promise<boolean> => {
    if (isInitialized || isInitializing) {
      return isInitialized;
    }

    setIsInitializing(true);
    
    try {
      const success = await pushNotificationService.initialize();
      
      setIsInitialized(success);
      const currentToken = pushNotificationService.getToken();
      setToken(currentToken);
      
      return success;
    } catch (error) {
      return false;
    } finally {
      setIsInitializing(false);
    }
  };

  const sendLocalNotification = async (payload: PushNotificationPayload): Promise<void> => {
    await pushNotificationService.sendLocalNotification(payload);
  };

  // Initialisation automatique au montage du composant
  useEffect(() => {
    initialize();
  }, []);

  return {
    isInitialized,
    isInitializing,
    token,
    initialize,
    sendLocalNotification,
  };
}; 