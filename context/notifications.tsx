import React, { createContext, ReactNode, useContext } from 'react';
import { useSynchronizedNotifications } from '../hooks/useSynchronizedNotifications';

interface NotificationsContextType {
  unreadCount: number;
  notifications: any[];
  pagination: any;
  isLoading: boolean;
  error: any;
  refetch: () => Promise<void>;
  refetchUnreadCount: () => Promise<void>;
  refetchNotifications: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const useNotificationsContext = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotificationsContext must be used within a NotificationsProvider');
  }
  return context;
};

interface NotificationsProviderProps {
  children: ReactNode;
  page?: number;
  limit?: number;
}

export const NotificationsProvider: React.FC<NotificationsProviderProps> = ({ 
  children, 
  page = 1, 
  limit = 20 
}) => {
  const notificationsData = useSynchronizedNotifications(page, limit);

  return (
    <NotificationsContext.Provider value={notificationsData}>
      {children}
    </NotificationsContext.Provider>
  );
};







