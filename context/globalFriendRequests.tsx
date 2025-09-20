import React, { createContext, ReactNode, useContext, useEffect, useRef } from 'react';
import { useGetFriendRequestsCount } from '../services';

interface GlobalFriendRequestsContextType {
  friendRequestsCount: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const GlobalFriendRequestsContext = createContext<GlobalFriendRequestsContextType | undefined>(undefined);

interface GlobalFriendRequestsProviderProps {
  children: ReactNode;
}

export const GlobalFriendRequestsProvider: React.FC<GlobalFriendRequestsProviderProps> = ({ children }) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { count: friendRequestsCount, isLoading, error, refetch } = useGetFriendRequestsCount();
  
  // Polling global toutes les 10 secondes
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
        console.error('❌ [GlobalFriendRequests] Erreur lors du polling:', error);
      }
    }, 10000); // 10 secondes
    
    // Cleanup à la destruction du composant
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refetch]);
  
  const contextValue: GlobalFriendRequestsContextType = {
    friendRequestsCount: friendRequestsCount || 0,
    isLoading,
    error,
    refetch
  };

  return (
    <GlobalFriendRequestsContext.Provider value={contextValue}>
      {children}
    </GlobalFriendRequestsContext.Provider>
  );
};

export const useGlobalFriendRequests = (): GlobalFriendRequestsContextType => {
  const context = useContext(GlobalFriendRequestsContext);
  if (context === undefined) {
    throw new Error('useGlobalFriendRequests must be used within a GlobalFriendRequestsProvider');
  }
  return context;
};
