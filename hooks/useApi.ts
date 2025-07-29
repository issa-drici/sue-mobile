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
}

export function useApi<T = any>(
  url: string,
  options: UseApiOptions = {}
) {
  const { autoFetch = true, headers = {}, onSuccess, onError } = options;
  
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const fetchData = useCallback(async () => {
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
      
      setState({
        data,
        loading: false,
        error: null,
      });

      onSuccess?.(data);
    } catch (error: any) {
      const errorMessage = error.message || 'Une erreur est survenue';
      
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      });

      onError?.(errorMessage);
    }
  }, [url, headers, onSuccess, onError]);

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

  return {
    ...state,
    fetchData,
    postData,
    putData,
    deleteData,
    refetch,
    reset,
  };
} 