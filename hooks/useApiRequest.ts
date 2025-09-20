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
    console.log(`🚀 [useApiRequest] executeRequest appelé - attempt: ${attemptNumber}, isRetry: ${isRetryAttempt}, mounted: ${isMountedRef.current}`);
    
    if (!isMountedRef.current) {
      console.log(`❌ [useApiRequest] Component non monté, abandon`);
      return;
    }

    // Vérifier l'authentification si nécessaire
    if (requiresAuth && !isAuthenticated) {
      console.log(`🔐 [useApiRequest] Requête nécessitant une authentification mais utilisateur non connecté, abandon`);
      if (!isRetryAttempt) {
        setIsLoading(false);
        setError(null);
      }
      return;
    }

    // Seulement définir loading si ce n'est pas un retry automatique
    if (!isRetryAttempt) {
      console.log(`⏳ [useApiRequest] Début de requête manuelle - reset des états`);
      setIsLoading(true);
      setError(null);
      setRetryCount(0);
      setIsRetrying(false);
    } else {
      console.log(`🔄 [useApiRequest] Retry automatique ${attemptNumber}/${maxRetries}`);
    }

    try {
      console.log(`📡 [useApiRequest] Appel de l'API...`);
      const result = await apiCall();
      console.log(`✅ [useApiRequest] API réussie, résultat:`, result);
      
      if (isMountedRef.current) {
        console.log(`💾 [useApiRequest] Sauvegarde du résultat et reset des états`);
        setData(result);
        setIsLoading(false);
        setError(null);
        setRetryCount(0);
        setIsRetrying(false);
        
        // Annuler tout retry en cours
        if (timeoutRef.current) {
          console.log(`🛑 [useApiRequest] Annulation du timeout de retry en cours`);
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        console.log(`🎉 [useApiRequest] Requête terminée avec succès`);
      } else {
        console.log(`⚠️ [useApiRequest] Component démonté pendant la requête, ignore le résultat`);
      }
    } catch (err: any) {
      console.log(`❌ [useApiRequest] Erreur dans la requête:`, err);
      
      if (!isMountedRef.current) {
        console.log(`⚠️ [useApiRequest] Component démonté pendant l'erreur, abandon`);
        return;
      }

      const errorMessage = err.message || 'Une erreur est survenue';
      console.log(`📝 [useApiRequest] Message d'erreur: ${errorMessage}`);
      
      // Si le retry est activé et qu'on n'a pas atteint le maximum de tentatives
      // ET qu'on n'est PAS sur un écran d'authentification
      if (enableRetry && attemptNumber < maxRetries && !isAuthScreen) {
        console.log(`🔄 [useApiRequest] Programmation du retry ${attemptNumber + 1}/${maxRetries} dans ${retryDelay}ms`);
        setRetryCount(attemptNumber + 1);
        setIsRetrying(true);
        
        onRetry?.(attemptNumber + 1, err);
        
        // Programmer le prochain essai
        timeoutRef.current = setTimeout(() => {
          console.log(`⏰ [useApiRequest] Timeout déclenché pour retry ${attemptNumber + 1}`);
          if (isMountedRef.current) {
            executeRequest(attemptNumber + 1, true); // Marquer comme retry
          } else {
            console.log(`⚠️ [useApiRequest] Component démonté, annulation du retry`);
          }
        }, retryDelay) as unknown as NodeJS.Timeout;
      } else {
        // Échec final ou retry désactivé
        if (isAuthScreen) {
          console.log(`🔐 [useApiRequest] Retry désactivé car sur écran d'authentification`);
        } else {
          console.log(`💥 [useApiRequest] Échec final ou retry désactivé`);
        }
        setError(errorMessage);
        setIsLoading(false);
        setIsRetrying(false);
        
        if (enableRetry && attemptNumber >= maxRetries && !isAuthScreen) {
          console.log(`🚫 [useApiRequest] Maximum de tentatives atteint`);
          onMaxRetriesReached?.(err);
        }
      }
    }
  }, [apiCall, enableRetry, maxRetries, retryDelay, onRetry, onMaxRetriesReached, isAuthScreen, requiresAuth, isAuthenticated]);

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
      console.log(`👁️ [useApiRequest] useFocusEffect déclenché - autoFetch: ${autoFetch}`);
      if (autoFetch && isMountedRef.current) {
        // Délai pour éviter les crashes au démarrage
        const timeoutId = setTimeout(() => {
          if (isMountedRef.current) {
            console.log(`🎯 [useApiRequest] Lancement de executeRequest depuis useFocusEffect`);
            executeRequest();
          }
        }, 100);
        
        return () => clearTimeout(timeoutId);
      } else {
        console.log(`⏸️ [useApiRequest] autoFetch désactivé ou component démonté, pas de requête`);
      }
    }, [executeRequest, autoFetch])
  );

  const manualRefetch = useCallback(() => {
    console.log(`🔄 [useApiRequest] manualRefetch appelé`);
    // Annuler tout retry en cours
    if (timeoutRef.current) {
      console.log(`🛑 [useApiRequest] Annulation du timeout en cours pour refetch manuel`);
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    console.log(`🎯 [useApiRequest] Lancement de executeRequest(0, false) pour refetch manuel`);
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
