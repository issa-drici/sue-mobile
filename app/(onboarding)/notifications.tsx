import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import OnboardingProgress from '../../components/OnboardingProgress';
import { ScreenLayout } from '../../components/ui/ScreenLayout';
import { DesignTokens } from '../../constants/DesignSystem';
import { pushNotificationService } from '../../services/notifications/pushNotifications';
import { useAuth } from '../context/auth';



export default function NotificationsScreen() {
  const router = useRouter();
  const { completeOnboarding } = useAuth();

  const handleActivateNotifications = async () => {
    try {
      // Demander les permissions de notifications
      const hasPermission = await pushNotificationService.requestPermissions();

      if (hasPermission) {
        // Initialiser les notifications et stocker le token localement
        await pushNotificationService.initialize();
        console.log('✅ Notifications activées et token stocké localement');
      } else {
        console.log('⚠️ Permissions de notifications refusées');
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'activation des notifications:', error);
    } finally {
      // Terminer l'onboarding dans tous les cas
      await completeOnboarding();
      router.replace('/(auth)/login');
    }
  };



  return (
    <ScreenLayout style={styles.container}>
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
