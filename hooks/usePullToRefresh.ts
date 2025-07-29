import { useCallback, useRef, useState } from 'react';

interface UsePullToRefreshProps {
  onRefresh: () => Promise<void>;
  onError?: (error: any) => void;
  minDelay?: number; // Délai minimum en millisecondes
}

interface UsePullToRefreshReturn {
  refreshing: boolean;
  onRefresh: () => Promise<void>;
}

/**
 * Hook personnalisé pour gérer le pull-to-refresh avec délai minimum
 * 
 * Ce hook fournit une gestion uniforme du rafraîchissement
 * avec gestion d'état, logs, gestion d'erreur et délai minimum
 * pour une expérience utilisateur plus fluide.
 */
export const usePullToRefresh = ({ 
  onRefresh, 
  onError,
  minDelay = 1000 // Délai minimum de 1 seconde par défaut
}: UsePullToRefreshProps): UsePullToRefreshReturn => {
  const [refreshing, setRefreshing] = useState(false);
  const isRefreshingRef = useRef(false);

  const handleRefresh = useCallback(async () => {
    // Protection contre les appels multiples avec useRef
    if (isRefreshingRef.current) {
      return;
    }
    
    isRefreshingRef.current = true;
    setRefreshing(true);
    const startTime = Date.now();
    
    try {
      await onRefresh();
      
      // Calculer le temps écoulé
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minDelay - elapsedTime);
      
      // Attendre le délai minimum si nécessaire
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
      
    } catch (error) {
      if (onError) {
        onError(error);
      }
    } finally {
      // Animation douce pour la disparition
      setRefreshing(false);
      isRefreshingRef.current = false;
    }
  }, [onRefresh, onError, minDelay]);

  return {
    refreshing,
    onRefresh: handleRefresh,
  };
}; 