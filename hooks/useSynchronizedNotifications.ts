import { useEffect, useRef } from 'react';
import { useGetNotifications } from '../services/notifications/getNotifications';
import { useGetUnreadCount } from '../services/notifications/getUnreadCount';

export const useSynchronizedNotifications = (page: number = 1, limit: number = 20) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Hooks individuels
  const unreadCountResult = useGetUnreadCount();
  const notificationsResult = useGetNotifications(page, limit);
  
  // Fonction de synchronisation
  const syncRefresh = async () => {
    console.log('🔄 [useSynchronizedNotifications] Synchronisation des notifications');
    
    try {
      // Refetch les deux en parallèle
      await Promise.all([
        unreadCountResult.refetch(),
        notificationsResult.refetch()
      ]);
      
      console.log('✅ [useSynchronizedNotifications] Synchronisation terminée');
    } catch (error) {
      console.error('❌ [useSynchronizedNotifications] Erreur lors de la synchronisation:', error);
    }
  };
  
  // Polling synchronisé toutes les 30 secondes
  useEffect(() => {
    // Nettoyer l'intervalle existant
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Créer un nouvel intervalle
    intervalRef.current = setInterval(syncRefresh, 10000);
    
    console.log('🔄 [useSynchronizedNotifications] Polling synchronisé démarré (10s)');
    
    // Cleanup à la destruction du composant
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        console.log('🔄 [useSynchronizedNotifications] Polling synchronisé arrêté');
      }
    };
  }, [page, limit]); // Redémarrer le polling si page ou limit changent
  
  return {
    unreadCount: unreadCountResult.data,
    notifications: notificationsResult.data,
    pagination: notificationsResult.pagination,
    isLoading: unreadCountResult.isLoading || notificationsResult.isLoading,
    error: unreadCountResult.error || notificationsResult.error,
    refetch: syncRefresh,
    refetchUnreadCount: unreadCountResult.refetch,
    refetchNotifications: notificationsResult.refetch
  };
};
