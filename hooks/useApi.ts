import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  autoFetch?: boolean;
  headers?: Record<string, string>;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  maxRetries?: number;
  retryDelay?: number;
  enableRetry?: boolean;
}

export function useApi<T = any>(
  url: string,
  options: UseApiOptions = {}
) {
  const { 
    autoFetch = true, 
    headers = {}, 
    onSuccess, 
    onError,
    maxRetries = 5,
    retryDelay = 1000,
    enableRetry = true
  } = options;
  
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

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

  const fetchData = useCallback(async (attemptNumber: number = 0) => {
    if (!isMountedRef.current) return;

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (isMountedRef.current) {
        setState({
          data,
          loading: false,
          error: null,
        });
        setRetryCount(0);
        setIsRetrying(false);
      }

      onSuccess?.(data);
    } catch (error: any) {
      if (!isMountedRef.current) return;

      const errorMessage = error.message || 'Une erreur est survenue';
      
      // Si le retry est activé et qu'on n'a pas atteint le maximum de tentatives
      if (enableRetry && attemptNumber < maxRetries) {
        setRetryCount(attemptNumber + 1);
        setIsRetrying(true);
        
        console.log(`🔄 Tentative ${attemptNumber + 1}/${maxRetries} pour ${url}:`, errorMessage);
        
        // Programmer le prochain essai
        timeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            fetchData(attemptNumber + 1);
          }
        }, retryDelay);
      } else {
        // Échec final ou retry désactivé
        setState({
          data: null,
          loading: false,
          error: errorMessage,
        });
        setIsRetrying(false);
        
        if (enableRetry && attemptNumber >= maxRetries) {
          console.error(`❌ Échec après ${maxRetries} tentatives pour ${url}:`, errorMessage);
        }

        onError?.(errorMessage);
      }
    }
  }, [url, headers, onSuccess, onError, enableRetry, maxRetries, retryDelay]);

  const postData = useCallback(async (data: any) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      
      setState({
        data: responseData,
        loading: false,
        error: null,
      });

      onSuccess?.(responseData);
      return responseData;
    } catch (error: any) {
      const errorMessage = error.message || 'Une erreur est survenue';
      
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      });

      onError?.(errorMessage);
      throw error;
    }
  }, [url, headers, onSuccess, onError]);

  const putData = useCallback(async (data: any) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      
      setState({
        data: responseData,
        loading: false,
        error: null,
      });

      onSuccess?.(responseData);
      return responseData;
    } catch (error: any) {
      const errorMessage = error.message || 'Une erreur est survenue';
      
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      });

      onError?.(errorMessage);
      throw error;
    }
  }, [url, headers, onSuccess, onError]);

  const deleteData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      
      setState({
        data: responseData,
        loading: false,
        error: null,
      });

      onSuccess?.(responseData);
      return responseData;
    } catch (error: any) {
      const errorMessage = error.message || 'Une erreur est survenue';
      
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      });

      onError?.(errorMessage);
      throw error;
    }
  }, [url, headers, onSuccess, onError]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  // Auto-fetch quand l'écran est focusé
  useFocusEffect(
    useCallback(() => {
      if (autoFetch) {
        fetchData();
      }
    }, [fetchData, autoFetch])
  );

  const cancelRetry = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsRetrying(false);
  }, []);

  return {
    ...state,
    fetchData,
    postData,
    putData,
    deleteData,
    refetch,
    reset,
    retryCount,
    isRetrying,
    cancelRetry,
  };
} 