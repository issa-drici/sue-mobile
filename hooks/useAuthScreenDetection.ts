import { usePathname } from 'expo-router';

/**
 * Hook pour détecter si on est actuellement sur un écran d'authentification
 * Les écrans d'authentification sont ceux où on ne veut pas de retry automatique
 */
export function useAuthScreenDetection() {
  const pathname = usePathname();
  
  // Liste des routes d'authentification
  const authRoutes = [
    '/login',
    '/register',
    '/(auth)/login', 
    '/(auth)/register'
  ];
  
  // Vérifier si la route actuelle est une route d'authentification
  const isAuthScreen = authRoutes.some(route => pathname === route || pathname.includes(route));
  
  return {
    isAuthScreen,
    currentPath: pathname
  };
}

