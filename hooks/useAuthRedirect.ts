import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '../app/context/auth';

/**
 * Hook pour gérer la redirection automatique vers les écrans d'authentification
 * quand l'utilisateur n'est pas connecté
 */
export function useAuthRedirect() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Ne rien faire pendant le chargement initial
    if (isLoading) {
      return;
    }

    // Si l'utilisateur n'est pas connecté, rediriger vers la connexion
    if (!user) {
      
      // Rediriger vers l'écran de connexion
      router.replace('/(auth)/login');
    }
  }, [user, isLoading, router]);

  return {
    isAuthenticated: !!user,
    isLoading,
    user,
  };
}

/**
 * Hook pour protéger les écrans qui nécessitent une authentification
 * Redirige automatiquement vers la connexion si l'utilisateur n'est pas connecté
 */
export function useProtectedRoute() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Ne rien faire pendant le chargement initial
    if (isLoading) {
      return;
    }

    // Si l'utilisateur n'est pas connecté, rediriger vers la connexion
    if (!user) {
      
      // Rediriger vers l'écran de connexion
      router.replace('/(auth)/login');
    }
  }, [user, isLoading, router]);

  return {
    isAuthenticated: !!user,
    isLoading,
    user,
  };
}

/**
 * Hook pour les écrans d'authentification
 * Redirige automatiquement vers l'app principal si l'utilisateur est déjà connecté
 */
export function useAuthScreen() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Ne rien faire pendant le chargement initial
    if (isLoading) {
      return;
    }

    // Si l'utilisateur est connecté, rediriger vers l'app principal
    if (user) {
      
      // Rediriger vers l'écran principal
      router.replace('/(tabs)');
    }
  }, [user, isLoading, router]);

  return {
    isAuthenticated: !!user,
    isLoading,
    user,
  };
} 