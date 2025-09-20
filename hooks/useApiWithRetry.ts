import { useCallback, useEffect } from 'react';
import { useRetry } from './useRetry';

interface ApiHookResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch?: () => Promise<void>;
  [key: string]: any;
}

interface UseApiWithRetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  enabled?: boolean;
  onRetry?: (attempt: number, error: any) => void;
  onMaxRetriesReached?: (error: any) => void;
}

export function useApiWithRetry<T>(
  apiHook: () => ApiHookResult<T>,
  options: UseApiWithRetryOptions = {}
) {
  const {
    maxRetries = 5,
    retryDelay = 1000,
    enabled = true,
    onRetry,
    onMaxRetriesReached,
  } = options;

  const originalHook = apiHook();
  const { data, isLoading, error, refetch, ...rest } = originalHook;

  // Créer une fonction async qui utilise le refetch original
  const fetchWithRetry = useCallback(async () => {
    if (refetch) {
      await refetch();
    }
  }, [refetch]);

  // Utiliser le hook de retry
  const retryResult = useRetry(fetchWithRetry, {
    maxRetries,
    retryDelay,
    enabled,
    onRetry,
    onMaxRetriesReached,
  });

  // Combiner les résultats
  const combinedResult = {
    ...originalHook,
    ...retryResult,
    // Utiliser les données du retry si disponibles, sinon les données originales
    data: retryResult.data || data,
    isLoading: retryResult.isLoading || isLoading,
    error: retryResult.error || error,
    // Exposer les informations de retry
    retryCount: retryResult.retryCount,
    isRetrying: retryResult.isRetrying,
    cancelRetry: retryResult.cancelRetry,
    reset: retryResult.reset,
  };

  // Auto-retry quand il y a une erreur
  useEffect(() => {
    if (enabled && error && !retryResult.isRetrying && retryResult.retryCount === 0) {
      retryResult.execute();
    }
  }, [error, enabled, retryResult]);

  return combinedResult;
}

