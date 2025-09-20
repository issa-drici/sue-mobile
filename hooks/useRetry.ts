import { useCallback, useEffect, useRef, useState } from 'react';

interface UseRetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  enabled?: boolean;
  onRetry?: (attempt: number, error: any) => void;
  onMaxRetriesReached?: (error: any) => void;
}

export function useRetry<T>(
  asyncFunction: () => Promise<T>,
  options: UseRetryOptions = {}
) {
  const {
    maxRetries = 5,
    retryDelay = 1000, // 1 seconde
    enabled = true,
    onRetry,
    onMaxRetriesReached,
  } = options;

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

  const executeWithRetry = useCallback(async () => {
    if (!enabled || !isMountedRef.current) return;

    setIsLoading(true);
    setError(null);
    setRetryCount(0);
    setIsRetrying(false);

    const attempt = async (attemptNumber: number): Promise<void> => {
      try {
        const result = await asyncFunction();
        
        if (isMountedRef.current) {
          setData(result);
          setIsLoading(false);
          setError(null);
          setIsRetrying(false);
        }
      } catch (err: any) {
        if (!isMountedRef.current) return;

        const errorMessage = err.message || 'Une erreur est survenue';
        setError(errorMessage);

        if (attemptNumber < maxRetries) {
          // Relancer dans 1 seconde
          setIsRetrying(true);
          setRetryCount(attemptNumber + 1);
          
          onRetry?.(attemptNumber + 1, err);

          timeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              attempt(attemptNumber + 1);
            }
          }, retryDelay);
        } else {
          // Nombre maximum de tentatives atteint
          setIsLoading(false);
          setIsRetrying(false);
          onMaxRetriesReached?.(err);
        }
      }
    };

    await attempt(0);
  }, [asyncFunction, enabled, maxRetries, retryDelay, onRetry, onMaxRetriesReached]);

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

  return {
    data,
    isLoading,
    error,
    retryCount,
    isRetrying,
    execute: executeWithRetry,
    cancelRetry,
    reset,
  };
}

