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
    if (authLoading || isOnboardingLoading) return;

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
    <Stack>
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="session/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="edit-session/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="create-session" options={{ headerShown: false }} />
      <Stack.Screen name="add-friend" options={{ headerShown: false }} />
      <Stack.Screen name="privacy" options={{ headerShown: false }} />
      <Stack.Screen name="debug" options={{ headerShown: false }} />
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
