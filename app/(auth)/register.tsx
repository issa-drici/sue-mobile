import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, FadeOutDown } from 'react-native-reanimated';

import { InlineLoading } from '../../components/OptimizedLoading';
import { clearPendingShareToken, getPendingShareToken } from '../../utils/shareLink';
import { useAuth } from '../context/auth';

const ACCENT_COLOR = '#D4FC79'; // Electric Volt

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [step, setStep] = useState(1);
  const [firstname, setFirstName] = useState('');
  const [lastname, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateStep1 = () => {
    if (!firstname || !lastname) {
      Alert.alert('Erreur', 'Veuillez remplir votre prénom et nom');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!email || !phone) {
      Alert.alert('Erreur', 'Veuillez remplir votre email et téléphone');
      return false;
    }
    // Basic email validation could go here
    return true;
  };

  const validateStep3 = () => {
    if (!password || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez choisir un mot de passe');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const handleRegister = async () => {
    if (!validateStep3()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      setIsLoading(true);
      // Format phone number to international format (+33 for France)
      const formattedPhone = phone.startsWith('0')
        ? '+33' + phone.substring(1)
        : phone;

      await signUp(firstname, lastname, email, formattedPhone, password, confirmPassword);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Si l'utilisateur venait d'un lien de partage, le reconduire vers la session
      const pending = await getPendingShareToken();
      if (pending) {
        await clearPendingShareToken();
        const query = pending.from ? `?from=${pending.from}&auto=1` : '?auto=1';
        router.replace(`/join/${pending.token}${query}`);
      } else {
        router.replace('/(tabs)');
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <InlineLoading message="Création du compte..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          disabled={isLoading}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.header}>
          <Text style={styles.brandTitle}>
            {step === 1 ? 'QUI ÊTES-VOUS ?' : step === 2 ? 'CONTACT' : 'SÉCURITÉ'}
          </Text>
          <Text style={styles.brandSubtitle}>
            ÉTAPE {step}/3 • {step === 1 ? 'VOS INFORMATIONS' : step === 2 ? 'POUR VOUS JOINDRE' : 'PROTÉGEZ VOTRE COMPTE'}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.form}>

          {step === 1 && (
            <Animated.View entering={FadeInUp} exiting={FadeOutDown}>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                  <Text style={styles.label}>PRÉNOM</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="PRÉNOM"
                    placeholderTextColor="#999"
                    value={firstname}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                    autoComplete="given-name"
                    editable={!isLoading}
                    autoFocus
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                  <Text style={styles.label}>NOM</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="NOM"
                    placeholderTextColor="#999"
                    value={lastname}
                    onChangeText={setLastName}
                    autoCapitalize="words"
                    autoComplete="family-name"
                    editable={!isLoading}
                  />
                </View>
              </View>
            </Animated.View>
          )}

          {step === 2 && (
            <Animated.View entering={FadeInUp} exiting={FadeOutDown}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>EMAIL</Text>
                <TextInput
                  style={styles.input}
                  placeholder="VOTRE EMAIL"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!isLoading}
                  autoFocus
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>NUMÉRO DE TÉLÉPHONE</Text>
                <TextInput
                  style={styles.input}
                  placeholder="VOTRE NUMÉRO"
                  placeholderTextColor="#999"
                  value={phone}
                  onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ''))}
                  maxLength={10}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  autoComplete="tel"
                  editable={!isLoading}
                />
              </View>
            </Animated.View>
          )}

          {step === 3 && (
            <Animated.View entering={FadeInUp} exiting={FadeOutDown}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>MOT DE PASSE</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="CRÉER UN MOT DE PASSE"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="password-new"
                    editable={!isLoading}
                    autoFocus
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                    disabled={isLoading}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={24}
                      color="#000"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>CONFIRMATION</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="CONFIRMER LE MOT DE PASSE"
                    placeholderTextColor="#999"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoComplete="password-new"
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                    disabled={isLoading}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off' : 'eye'}
                      size={24}
                      color="#000"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          )}

          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
            onPress={step === 3 ? handleRegister : handleNext}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.registerButtonText}>
              {isLoading ? 'CRÉATION...' : step === 3 ? 'CRÉER MON COMPTE' : 'CONTINUER'}
            </Text>
            {!isLoading && <Ionicons name="arrow-forward" size={24} color="#000" />}
          </TouchableOpacity>
        </Animated.View>

        {step === 1 && (
          <Animated.View entering={FadeInUp.delay(600).springify()} style={styles.footer}>
            <Text style={styles.footerText}>
              DÉJÀ MEMBRE ?
            </Text>
            <TouchableOpacity onPress={() => router.back()} disabled={isLoading}>
              <Text style={styles.footerLink}>SE CONNECTER</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 24,
  },
  header: {
    marginBottom: 40,
  },
  brandTitle: {
    fontSize: 48,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#000',
    letterSpacing: -2,
    lineHeight: 48,
  },
  brandSubtitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 1,
    marginTop: 8,
  },

  form: {
    marginBottom: 40,
  },
  row: {
    flexDirection: 'row',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    paddingVertical: 12,
    flex: 1,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },
  eyeIcon: {
    padding: 8,
  },

  registerButton: {
    backgroundColor: ACCENT_COLOR,
    height: 64,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
    shadowColor: "#D4FC79",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  registerButtonDisabled: {
    backgroundColor: '#F5F5F5',
    shadowOpacity: 0,
  },
  registerButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 'auto',
    paddingBottom: 20,
  },
  footerText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  footerLink: {
    color: '#000',
    fontSize: 12,
    fontWeight: '900',
    textDecorationLine: 'underline',
  },
});