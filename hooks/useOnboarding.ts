import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const ONBOARDING_COMPLETED_KEY = 'onboarding_completed';

export const useOnboarding = () => {
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const completed = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
      setIsOnboardingCompleted(completed === 'true');
    } catch (error) {
      console.error('Erreur lors de la vérification du statut onboarding:', error);
      setIsOnboardingCompleted(false);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
      setIsOnboardingCompleted(true);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du statut onboarding:', error);
    }
  };

  const resetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_COMPLETED_KEY);
      setIsOnboardingCompleted(false);
    } catch (error) {
      console.error('Erreur lors de la réinitialisation de l\'onboarding:', error);
    }
  };

  return {
    isOnboardingCompleted,
    isLoading,
    completeOnboarding,
    resetOnboarding,
  };
};
