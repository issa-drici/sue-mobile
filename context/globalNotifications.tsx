import React, { createContext, ReactNode, useContext, useEffect, useRef } from 'react';
import { useGetUnreadCount } from '../services/notifications/getUnreadCount';

interface GlobalNotificationsContextType {
  unreadCount: number;
  isLoading: boolean;
  error: any;
  refetch: () => Promise<void>;
}

const GlobalNotificationsContext = createContext<GlobalNotificationsContextType | undefined>(undefined);

export const useGlobalNotifications = () => {
  const context = useContext(GlobalNotificationsContext);
  if (!context) {
    throw new Error('useGlobalNotifications must be used within a GlobalNotificationsProvider');
  }
  return context;
};

interface GlobalNotificationsProviderProps {
  children: ReactNode;
}

export const GlobalNotificationsProvider: React.FC<GlobalNotificationsProviderProps> = ({ children }) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { count: unreadCount, isLoading, error, refetch } = useGetUnreadCount();
  
  // Polling global toutes les 30 secondes
  useEffect(() => {
    // Nettoyer l'intervalle existant
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Créer un nouvel intervalle
    intervalRef.current = setInterval(async () => {
      try {
        await refetch();
      } catch (error) {
        console.error('❌ [GlobalNotifications] Erreur lors du polling:', error);
      }
    }, 30000); // 30 secondes comme avant
    
    // Cleanup à la destruction du composant
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refetch]);
  
  const contextValue: GlobalNotificationsContextType = {
    unreadCount: unreadCount || 0,
    isLoading,
    error,
    refetch
  };

  return (
    <GlobalNotificationsContext.Provider value={contextValue}>
      {children}
    </GlobalNotificationsContext.Provider>
  );
};
