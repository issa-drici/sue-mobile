import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GlobalFriendRequestsProvider } from '../context/globalFriendRequests';
import { GlobalNotificationsProvider } from '../context/globalNotifications';
import { useAppState } from '../hooks/useAppState';
import { AuthProvider, useAuth } from './context/auth';


// Set the animation options. This is optional.
SplashScreen.setOptions({
  duration: 1000,
  fade: true,
});

SplashScreen.preventAutoHideAsync();

// Composant wrapper pour les notifications (seulement si utilisateur connecté)
function NotificationWrapper({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading, isOnboardingLoading } = useAuth();
  
  // Initialiser les notifications seulement si l'utilisateur est connecté
  // Cela permet la synchronisation avec la BDD à chaque ouverture de l'app
  useEffect(() => {
    if (user && !authLoading && !isOnboardingLoading) {
      // Le hook useAppState sera appelé automatiquement
      console.log('🔔 Utilisateur connecté, initialisation des notifications...');
    }
  }, [user, authLoading, isOnboardingLoading]);
  
  // Appeler le hook de manière inconditionnelle mais il ne fera rien si pas connecté
  useAppState();
  
  return <>{children}</>;
}

function RootLayoutNav() {
  const { user, isLoading: authLoading, isOnboardingCompleted, isOnboardingLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Cacher le SplashScreen une fois que l'authentification est chargée
  useEffect(() => {
    const hideSplashScreen = async () => {
      if (!authLoading && !isOnboardingLoading) {
        try {
          // Attendre un petit délai pour une transition plus fluide
          await new Promise(resolve => setTimeout(resolve, 100));
          await SplashScreen.hideAsync();
          console.log('✅ SplashScreen caché');
        } catch (error) {
          console.warn('⚠️ Erreur lors du masquage du SplashScreen:', error);
        }
      }
    };

    hideSplashScreen();
  }, [authLoading, isOnboardingLoading]);

  useEffect(() => {
    // Ne pas bloquer la navigation pendant le chargement initial
    // Laisser l'utilisateur naviguer pendant que l'auth se charge en arrière-plan
    if (authLoading || isOnboardingLoading) {
      // Si on est déjà sur une page valide, ne pas rediriger
      const inAuthGroup = segments[0] === '(auth)';
      const inOnboardingGroup = segments[0] === '(onboarding)';
      const inTabsGroup = segments[0] === '(tabs)';

      // Si on est déjà sur une page appropriée, ne pas faire de redirection
      if (inAuthGroup || inOnboardingGroup || inTabsGroup) {
        return;
      }

      // Sinon, rediriger vers une page par défaut sans attendre
      router.replace('/(auth)/login');
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const inTabsGroup = segments[0] === '(tabs)';

    // Si l'onboarding n'est pas terminé, rediriger vers l'onboarding
    if (!isOnboardingCompleted && !inOnboardingGroup) {
      router.replace('/(onboarding)/welcome');
      return;
    }

    // Si l'onboarding est terminé mais l'utilisateur n'est pas connecté
    if (isOnboardingCompleted && !user && !inAuthGroup) {
      // Si on est dans les tabs sans utilisateur, rediriger vers login
      if (inTabsGroup) {
        router.replace('/(auth)/login');
        return;
      }
      router.replace('/(auth)/login');
      return;
    }

    // Si l'utilisateur est connecté mais dans l'onboarding ou l'auth
    if (isOnboardingCompleted && user && (inOnboardingGroup || inAuthGroup)) {
      router.replace('/(tabs)');
      return;
    }

    // Protection supplémentaire : si on est dans les tabs sans utilisateur connecté
    if (inTabsGroup && !user) {
      router.replace('/(auth)/login');
      return;
    }
  }, [user, isOnboardingCompleted, segments, authLoading, isOnboardingLoading, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // Optimiser les transitions pour plus de fluidité
        animation: 'fade',
        animationDuration: 200,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="session/[id]" />
      <Stack.Screen name="edit-session/[id]" />
      <Stack.Screen name="create-session" />
      <Stack.Screen name="add-friend" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="debug" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <GlobalNotificationsProvider>
          <GlobalFriendRequestsProvider>
            <NotificationWrapper>
              <RootLayoutNav />
            </NotificationWrapper>
          </GlobalFriendRequestsProvider>
        </GlobalNotificationsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
