import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UpdatePhoneOverlay } from '../components/UpdatePhoneOverlay';
import { GlobalFriendRequestsProvider } from '../context/globalFriendRequests';
import { GlobalNotificationsProvider } from '../context/globalNotifications';
import { useAppState } from '../hooks/useAppState';
import { extractFromParam, extractShareToken, setPendingShareToken } from '../utils/shareLink';
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

  // Suivi de la vérification du lien initial (Universal Link) pour éviter tout flash :
  // on ne cache le splash qu'une fois l'URL de démarrage traitée.
  const [initialLinkChecked, setInitialLinkChecked] = useState(false);
  const initialLinkProcessed = useRef(false);

  // État d'auth accessible sans stale-closure dans le listener d'URL
  const authStateRef = useRef({ isAuthenticated: false, isOnboardingCompleted: false });
  authStateRef.current = {
    isAuthenticated: !!user,
    isOnboardingCompleted: isOnboardingCompleted === true,
  };

  // Cacher le SplashScreen une fois l'auth chargée ET le lien initial traité
  useEffect(() => {
    if (!authLoading && !isOnboardingLoading && initialLinkChecked) {
      SplashScreen.hideAsync().catch(() => { });
    }
  }, [authLoading, isOnboardingLoading, initialLinkChecked]);

  // Cas "app lancée depuis fermée par le clic sur le lien" (initial URL).
  // On attend que l'auth soit chargée pour décider où aller, puis on traite l'URL
  // avant de cacher le splash (pas de flash de l'écran de démarrage par défaut).
  useEffect(() => {
    if (initialLinkProcessed.current) return;
    if (authLoading || isOnboardingLoading) return;
    initialLinkProcessed.current = true;

    Linking.getInitialURL()
      .then(async (url) => {
        const shareToken = extractShareToken(url);
        if (shareToken) {
          const from = extractFromParam(url);
          if (user) {
            // Déjà connecté → aperçu/join direct
            router.replace(from ? `/join/${shareToken}?from=${from}` : `/join/${shareToken}`);
          } else {
            // Non connecté → on mémorise le lien (token + from), l'auth le reconsommera
            await setPendingShareToken(shareToken, from);
          }
        }
      })
      .catch(() => { })
      .finally(() => setInitialLinkChecked(true));
  }, [authLoading, isOnboardingLoading, user, isOnboardingCompleted, router]);

  // Cas "app déjà ouverte en arrière-plan" (link event)
  useEffect(() => {
    const subscription = Linking.addEventListener('url', async ({ url }) => {
      const shareToken = extractShareToken(url);
      if (!shareToken) return;

      const from = extractFromParam(url);
      if (authStateRef.current.isAuthenticated) {
        router.replace(from ? `/join/${shareToken}?from=${from}` : `/join/${shareToken}`);
      } else {
        await setPendingShareToken(shareToken, from);
        router.replace('/(auth)/login');
      }
    });

    return () => subscription.remove();
  }, [router]);

  // Navigation basée sur l'état d'authentification
  useEffect(() => {
    // Attendre que les segments et l'auth soient chargés
    if (!segments?.length || isOnboardingLoading) return;

    const currentGroup = segments[0];
    const isInOnboarding = currentGroup === '(onboarding)' || currentGroup === 'onboarding';
    const isInAuth = currentGroup === '(auth)';
    const isInTabs = currentGroup === '(tabs)';
    // Écran de réception d'un lien de partage (/join/[token]) : accessible même
    // non connecté pour afficher l'aperçu public de la session.
    const isInJoin = currentGroup === 'join';

    // ⚠️ Onboarding temporairement désactivé (jugé secondaire pour l'instant).
    // Pour le réactiver : décommenter le bloc ci-dessous et remettre la condition
    // `isOnboardingCompleted === true &&` devant la règle 1.
    // if (isOnboardingCompleted !== true && !isInOnboarding && !isInJoin) {
    //   router.replace('/(onboarding)/welcome');
    //   return;
    // }

    // 1. Pas d'utilisateur → rediriger vers login (sauf sur l'aperçu public /join)
    if (!user && !isInAuth && !isInJoin) {
      router.replace('/(auth)/login');
      return;
    }

    // 2. Utilisateur connecté mais dans onboarding/auth → rediriger vers tabs
    if (user && (isInOnboarding || isInAuth)) {
      router.replace('/(tabs)');
      return;
    }

    // 3. Protection : tabs sans utilisateur → rediriger vers login
    if (isInTabs && !user) {
      router.replace('/(auth)/login');
    }
  }, [user, isOnboardingCompleted, segments, isOnboardingLoading, router]);

  return (
    <><Stack
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
      <Stack.Screen name="join/[token]" />
      <Stack.Screen name="session/[id]" />
      <Stack.Screen name="edit-session/[id]" />
      <Stack.Screen name="create-session" />
      <Stack.Screen name="add-friend" />
      <Stack.Screen name="friend-requests" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="debug" />
    </Stack><UpdatePhoneOverlay /></>
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
