import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../app/context/auth';
import { useAuthScreenDetection } from './useAuthScreenDetection';

interface UseApiRequestOptions {
  maxRetries?: number;
  retryDelay?: number;
  enableRetry?: boolean;
  autoFetch?: boolean;
  requiresAuth?: boolean; // Nouvelle option pour indiquer si la requête nécessite une authentification
  onRetry?: (attempt: number, error: any) => void;
  onMaxRetriesReached?: (error: any) => void;
}

export function useApiRequest<T>(
  apiCall: () => Promise<T>,
  options: UseApiRequestOptions = {}
) {
  const {
    maxRetries = 5,
    retryDelay = 1000,
    enableRetry = true,
    autoFetch = true,
    requiresAuth = true, // Par défaut, les requêtes nécessitent une authentification
    onRetry,
    onMaxRetriesReached,
  } = options;

  // Détecter si on est sur un écran d'authentification
  const { isAuthScreen } = useAuthScreenDetection();
  
  // Protection contre isAuthScreen undefined
  const isOnAuthScreen = isAuthScreen || false;
  
  // Vérifier l'état d'authentification
  const { isAuthenticated } = useAuth();

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const executeRequest = useCallback(async (attemptNumber: number = 0, isRetryAttempt: boolean = false) => {
    if (!isMountedRef.current) {
      return;
    }

    // Vérifier l'authentification si nécessaire
    if (requiresAuth && !isAuthenticated) {
      if (!isRetryAttempt) {
        setIsLoading(false);
        setError(null);
      }
      return;
    }

    // Seulement définir loading si ce n'est pas un retry automatique
    if (!isRetryAttempt) {
      setIsLoading(true);
      setError(null);
      setRetryCount(0);
      setIsRetrying(false);
    }

    try {
      const result = await apiCall();
      
      if (isMountedRef.current) {
        setData(result);
        setIsLoading(false);
        setError(null);
        setRetryCount(0);
        setIsRetrying(false);
        
        // Annuler tout retry en cours
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }
    } catch (err: any) {
      if (!isMountedRef.current) {
        return;
      }

      const errorMessage = err.message || 'Une erreur est survenue';
      
      // Si le retry est activé et qu'on n'a pas atteint le maximum de tentatives
      // ET qu'on n'est PAS sur un écran d'authentification
      if (enableRetry && attemptNumber < maxRetries && !isOnAuthScreen) {
        setRetryCount(attemptNumber + 1);
        setIsRetrying(true);
        
        onRetry?.(attemptNumber + 1, err);
        
        // Programmer le prochain essai
        timeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            executeRequest(attemptNumber + 1, true); // Marquer comme retry
          }
        }, retryDelay) as unknown as NodeJS.Timeout;
      } else {
        // Échec final ou retry désactivé
        setError(errorMessage);
        setIsLoading(false);
        setIsRetrying(false);
        
        if (enableRetry && attemptNumber >= maxRetries && !isOnAuthScreen) {
          onMaxRetriesReached?.(err);
        }
      }
    }
  }, [apiCall, enableRetry, maxRetries, retryDelay, onRetry, onMaxRetriesReached, isOnAuthScreen, requiresAuth, isAuthenticated]);

  const cancelRetry = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsRetrying(false);
    setIsLoading(false);
  }, []);

  const reset = useCallback(() => {
    cancelRetry();
    setData(null);
    setError(null);
    setRetryCount(0);
    setIsRetrying(false);
  }, [cancelRetry]);

  // Auto-fetch quand l'écran est focusé - avec protection contre les crashes
  useFocusEffect(
    useCallback(() => {
      if (autoFetch && isMountedRef.current) {
        // Délai pour éviter les crashes au démarrage
        const timeoutId = setTimeout(() => {
          if (isMountedRef.current) {
            executeRequest();
          }
        }, 100);
        
        return () => clearTimeout(timeoutId);
      }
    }, [executeRequest, autoFetch])
  );

  const manualRefetch = useCallback(() => {
    // Annuler tout retry en cours
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    executeRequest(0, false); // Redémarrer depuis le début
  }, [executeRequest]);

  return {
    data,
    isLoading,
    error,
    retryCount,
    isRetrying,
    refetch: manualRefetch,
    cancelRetry,
    reset,
  };
}
