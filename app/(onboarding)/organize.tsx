import { BrandColors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import OnboardingProgress from '../../components/OnboardingProgress';

export default function OrganizeScreen() {
  const router = useRouter();

  const handleContinue = () => {
    router.push('/(onboarding)/notifications');
  };


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <OnboardingProgress currentStep={2} totalSteps={3} />
        
        <View style={styles.textContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              En 2 secondes tu crées une session, invites tes potes et tout le monde sait qui vient.
            </Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Continuer</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
  button: {
    backgroundColor: BrandColors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});
