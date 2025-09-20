import { BrandColors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../context/auth';

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
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={isLoading}
          >
            <Ionicons name="arrow-back" size={24} color={BrandColors.white} />
          </TouchableOpacity>
          <Image 
            source={require('../../assets/images/logo.png')} 
            style={styles.logo}
          />
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>
            Rejoignez la communauté sportive
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.nameContainer}>
            <View style={[styles.inputContainer, styles.nameInput]}>
              <Ionicons name="person-outline" size={20} color="#666" />
              <TextInput
                style={styles.input}
                placeholder="Prénom"
                placeholderTextColor="#999"
                value={firstname}
                onChangeText={setFirstName}
                autoCapitalize="words"
                autoComplete="given-name"
                editable={!isLoading}
              />
            </View>
            <View style={[styles.inputContainer, styles.nameInput]}>
              <Ionicons name="person-outline" size={20} color="#666" />
              <TextInput
                style={styles.input}
                placeholder="Nom"
                placeholderTextColor="#999"
                value={lastname}
                onChangeText={setLastName}
                autoCapitalize="words"
                autoComplete="family-name"
                editable={!isLoading}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#666" />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
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
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" />
            <TextInput
              style={styles.input}
              placeholder="Confirmer le mot de passe"
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
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.registerButtonText}>
              {isLoading ? 'Inscription...' : 'S\'inscrire'}
            </Text>
          </TouchableOpacity>

          {/* <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtons}>
            <TouchableOpacity style={styles.socialButton} disabled={isLoading}>
              <Ionicons name="logo-google" size={24} color="#DB4437" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton} disabled={isLoading}>
              <Ionicons name="logo-facebook" size={24} color="#4267B2" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton} disabled={isLoading}>
              <Ionicons name="logo-apple" size={24} color="#000" />
            </TouchableOpacity>
          </View> */}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Vous avez déjà un compte ?
          </Text>
          <TouchableOpacity onPress={() => router.back()} disabled={isLoading}>
            <Text style={styles.footerLink}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.primary,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 48,
    marginBottom: 48,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
  },
  logo: {
    width: 200,
    height: 108,
    marginBottom: 24,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: BrandColors.white,
  },
  subtitle: {
    fontSize: 16,
    color: BrandColors.white,
    textAlign: 'center',
    opacity: 0.9,
  },
  form: {
    marginBottom: 24,
  },
  nameContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  nameInput: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 56,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#000',
  },
  eyeIcon: {
    padding: 8,
  },
  registerButton: {
    backgroundColor: BrandColors.white,
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: BrandColors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666',
    fontSize: 14,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingVertical: 24,
  },
  footerText: {
    color: BrandColors.white,
    fontSize: 14,
    opacity: 0.9,
  },
  footerLink: {
    color: BrandColors.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
    textDecorationLine: 'underline',
  },
}); 