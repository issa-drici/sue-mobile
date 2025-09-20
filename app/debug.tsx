import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from './context/auth';

export default function DebugScreen() {
  const router = useRouter();
  const { forceSignOut, resetOnboarding, completeOnboarding, isOnboardingCompleted } = useAuth();

  const handleResetOnboarding = async () => {
    await resetOnboarding();
    router.replace('/(onboarding)/welcome');
  };

  const handleForceSignOut = async () => {
    await forceSignOut();
    router.replace('/(auth)/login');
  };

  const handleForceCompleteOnboarding = async () => {
    await completeOnboarding();
    console.log('✅ Onboarding forcé comme terminé');
    router.replace('/(auth)/login');
  };

  const handleCheckStorage = async () => {
    try {
      const onboardingStatus = await AsyncStorage.getItem('onboarding_completed');
      console.log('🔍 Statut onboarding dans AsyncStorage:', onboardingStatus);
      console.log('🔍 Statut onboarding dans le contexte:', isOnboardingCompleted);
      alert(`AsyncStorage: ${onboardingStatus}\nContexte: ${isOnboardingCompleted}`);
    } catch (error) {
      console.error('❌ Erreur lors de la vérification:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debug</Text>
      
      <TouchableOpacity style={styles.button} onPress={handleCheckStorage}>
        <Text style={styles.buttonText}>Vérifier le statut onboarding</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={handleForceCompleteOnboarding}>
        <Text style={styles.buttonText}>Forcer la completion onboarding</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={handleResetOnboarding}>
        <Text style={styles.buttonText}>Réinitialiser l'onboarding</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={handleForceSignOut}>
        <Text style={styles.buttonText}>Déconnexion forcée</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#ff4444',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginVertical: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});


