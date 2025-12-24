import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { InlineLoading } from '../../components/OptimizedLoading';
import { useAuthScreen } from '../../hooks/useAuthRedirect';
import { useAuth } from '../context/auth';

const ACCENT_COLOR = '#D4FC79'; // Electric Volt

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { isLoading: isAuthLoading } = useAuthScreen();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      setIsLoading(true);
      await signIn(email, password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading) {
    return <InlineLoading message="Vérification..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.header}>
            <Text style={styles.brandTitle}>SUE</Text>
            <Text style={styles.brandSubtitle}>DEVENEZ UNE LÉGENDE.</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.form}>
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
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>MOT DE PASSE</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="VOTRE MOT DE PASSE"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                  editable={!isLoading}
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

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>
                MOT DE PASSE OUBLIÉ ?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'CONNEXION...' : 'SE CONNECTER'}
              </Text>
              {!isLoading && <Ionicons name="arrow-forward" size={24} color="#000" />}
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(600).springify()} style={styles.footer}>
            <Text style={styles.footerText}>
              PAS ENCORE MEMBRE ?
            </Text>
            <TouchableOpacity onPress={() => router.push('/register')} disabled={isLoading}>
              <Text style={styles.footerLink}>REJOINDRE LE SQUAD</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
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
    justifyContent: 'center',
  },
  header: {
    marginBottom: 60,
  },
  brandTitle: {
    fontSize: 80,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#000',
    letterSpacing: -4,
    lineHeight: 80,
  },
  brandSubtitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 2,
    marginTop: 8,
  },

  form: {
    marginBottom: 40,
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

  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 40,
  },
  forgotPasswordText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  loginButton: {
    backgroundColor: ACCENT_COLOR,
    height: 64,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: "#D4FC79",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#F5F5F5',
    shadowOpacity: 0,
  },
  loginButtonText: {
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