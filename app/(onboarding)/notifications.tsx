import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import OnboardingProgress from '../../components/OnboardingProgress';
import { ScreenLayout } from '../../components/ui/ScreenLayout';
import { DesignTokens } from '../../constants/DesignSystem';
import { useAuth } from '../context/auth';



export default function NotificationsScreen() {
  const router = useRouter();
  const { completeOnboarding } = useAuth();

  const handleActivateNotifications = async () => {
    console.log('🔘 Bouton "Activer les notifications" cliqué');
    
    // Terminer l'onboarding immédiatement
    console.log('🔄 Appel de completeOnboarding...');
    await completeOnboarding();
    console.log('🔄 completeOnboarding terminé');
    
    // Attendre un peu pour que l'état soit bien mis à jour dans le contexte
    await new Promise(resolve => setTimeout(resolve, 50));
    
    console.log('🔄 Redirection vers login...');
    router.replace('/(auth)/login');

    // NOTE: la demande de permission notifications a été DÉPLACÉE hors de l'onboarding.
    // Elle est désormais affichée (bottom sheet) après que l'utilisateur rejoint une
    // session, sur l'écran de détail de session. Voir NotificationPermissionSheet.
  };



  return (
    <ScreenLayout containerStyle={styles.container} showHeader={false}>
      <View style={styles.content}>
        <OnboardingProgress currentStep={3} totalSteps={3} />

        <View style={styles.textContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              Active les notifications🔔 pour savoir quand un pote t&apos;invite ou pour discuter de l&apos;organisation.
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleActivateNotifications}>
          <Text style={styles.primaryButtonText}>Activer les notifications</Text>
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: 'flex-start',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 0,
  },
  title: {
    fontSize: 46,
    fontWeight: '900',
    color: '#000000',
    lineHeight: 54,
    textAlign: 'left',
  },
  titleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    maxWidth: '100%',
    justifyContent: 'flex-start',
  },
  primaryButton: {
    backgroundColor: DesignTokens.colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});
