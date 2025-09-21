import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GlobalFriendRequestsProvider } from '../context/globalFriendRequests';
import { GlobalNotificationsProvider } from '../context/globalNotifications';
import { AuthProvider, useAuth } from './context/auth';

function RootLayoutNav() {
  const { user, isLoading: authLoading, isOnboardingCompleted, isOnboardingLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

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

    // Si l'onboarding n'est pas terminé, rediriger vers l'onboarding
    if (!isOnboardingCompleted && !inOnboardingGroup) {
      router.replace('/(onboarding)/welcome');
      return;
    }

    // Si l'onboarding est terminé mais l'utilisateur n'est pas connecté
    if (isOnboardingCompleted && !user && !inAuthGroup) {
      router.replace('/(auth)/login');
      return;
    }

    // Si l'utilisateur est connecté mais dans l'onboarding ou l'auth
    if (isOnboardingCompleted && user && (inOnboardingGroup || inAuthGroup)) {
      router.replace('/(tabs)');
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
            <RootLayoutNav />
          </GlobalFriendRequestsProvider>
        </GlobalNotificationsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
