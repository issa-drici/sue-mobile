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
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { InlineLoading } from '../../components/OptimizedLoading';
import { useAuth } from '../context/auth';

const ACCENT_COLOR = '#D4FC79'; // Electric Volt

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [firstname, setFirstName] = useState('');
  const [lastname, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!firstname || !lastname || !email || !password || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    try {
      setIsLoading(true);
      await signUp(firstname, lastname, email, password, confirmPassword);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
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
          onPress={() => router.back()}
          disabled={isLoading}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.header}>
          <Text style={styles.brandTitle}>REJOINDRE</Text>
          <Text style={styles.brandSubtitle}>DEVENEZ UN ATHLÈTE SUE.</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.form}>

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
                placeholder="CRÉER UN MOT DE PASSE"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password-new"
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

          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.registerButtonText}>
              {isLoading ? 'CRÉATION...' : 'CRÉER MON COMPTE'}
            </Text>
            {!isLoading && <Ionicons name="arrow-forward" size={24} color="#000" />}
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(600).springify()} style={styles.footer}>
          <Text style={styles.footerText}>
            DÉJÀ MEMBRE ?
          </Text>
          <TouchableOpacity onPress={() => router.back()} disabled={isLoading}>
            <Text style={styles.footerLink}>SE CONNECTER</Text>
          </TouchableOpacity>
        </Animated.View>
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