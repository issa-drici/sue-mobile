import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import {
  Alert,
  Image,
  Keyboard,
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
import { AuthApi } from '../../services/api/authApi';
import { clearPendingShareToken, getPendingShareToken } from '../../utils/shareLink';
import { useAuth } from '../context/auth';

const VOLT_COLOR = '#D4FC79'; // Electric Volt

export default function LoginScreen() {
  const router = useRouter();
  const { authenticateWithSession } = useAuth();
  const { isLoading: isAuthLoading } = useAuthScreen();

  const [step, setStep] = useState(1); // 1: Phone, 2: OTP, 3: Profile Register
  const [phone, setPhone] = useState(''); // Allows numbers and '+'
  const [phoneError, setPhoneError] = useState('');
  const [otp, setOtp] = useState('');
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Timers for Step 2
  const [secondsLeft, setSecondsLeft] = useState(300); // 5 minutes
  const [resendTimer, setResendTimer] = useState(45); // 45 seconds

  const otpInputRef = useRef<TextInput>(null);

  // Countdown timer for OTP expiry
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (step === 2 && secondsLeft > 0) {
      timer = setInterval(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, secondsLeft]);

  // Countdown timer for Resend button
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (step === 2 && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendTimer]);

  // Focus hidden input when entering Step 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 200);
    }
  }, [step]);

  // Handle phone input formatting: accepts only digits and '+'
  const handlePhoneChange = (text: string) => {
    let cleaned = text.replace(/[^0-9+]/g, '');
    
    // Strip country code if pasted
    if (cleaned.startsWith('+33')) {
      cleaned = cleaned.substring(3);
    } else if (cleaned.startsWith('33') && cleaned.length > 9) {
      cleaned = cleaned.substring(2);
    }
    
    // Strip leading 0 if typing/pasting a full number (e.g. 06...)
    if (cleaned.startsWith('0') && cleaned.length > 1) {
      cleaned = cleaned.substring(1);
    }
    
    setPhone(cleaned);
    setPhoneError('');
  };

  // Validation function
  const validatePhoneNumber = (input: string): { isValid: boolean; error?: string; formatted?: string } => {
    const cleaned = input.trim();
    if (!cleaned) {
      return { isValid: false, error: 'Veuillez saisir votre numéro de téléphone' };
    }

    if (cleaned.startsWith('+33')) {
      const digitsAfter = cleaned.substring(3);
      const onlyDigits = /^[0-9]+$/.test(digitsAfter);
      if (!onlyDigits || digitsAfter.length !== 9) {
        return { isValid: false, error: 'Format invalide. Exemple: +33612345678' };
      }
      return { isValid: true, formatted: cleaned };
    }

    if (cleaned.startsWith('0')) {
      const onlyDigits = /^[0-9]+$/.test(cleaned);
      if (!onlyDigits || cleaned.length !== 10) {
        return { isValid: false, error: 'Le numéro doit comporter 10 chiffres (ex: 0612345678)' };
      }
      return { isValid: true, formatted: '+33' + cleaned.substring(1) };
    }

    if (cleaned.startsWith('6') || cleaned.startsWith('7')) {
      const onlyDigits = /^[0-9]+$/.test(cleaned);
      if (!onlyDigits || cleaned.length !== 9) {
        return { isValid: false, error: 'Le numéro doit comporter 9 chiffres (ex: 612345678)' };
      }
      return { isValid: true, formatted: '+33' + cleaned };
    }

    const onlyDigits = /^[0-9]+$/.test(cleaned);
    if (!onlyDigits) {
      return { isValid: false, error: 'Le numéro doit contenir uniquement des chiffres et le symbole +' };
    }

    return { isValid: false, error: 'Format invalide (ex: 0612345678 ou +33612345678)' };
  };

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Redirection après authentification réussie (respecte un éventuel lien de partage en attente)
  const goAfterAuth = async () => {
    const pending = await getPendingShareToken();
    if (pending) {
      await clearPendingShareToken();
      const query = pending.from ? `?from=${pending.from}&auto=1` : '?auto=1';
      router.replace(`/join/${pending.token}${query}`);
    } else {
      router.replace('/(tabs)');
    }
  };

  // Step 1: Send SMS OTP
  const handleSendOtp = async () => {
    const validation = validatePhoneNumber(phone);
    if (!validation.isValid) {
      setPhoneError(validation.error || 'Numéro invalide');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Transition immédiate
    setOtp('');
    setSecondsLeft(300);
    setResendTimer(45);
    setStep(2);

    // Envoi en arrière-plan
    try {
      await AuthApi.sendPhoneOtp(validation.formatted!);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', error?.message || 'Impossible de vous envoyer le code. Veuillez réessayer.');
      setStep(1);
    }
  };

  // Step 2: Resend SMS OTP
  const handleResendCode = async () => {
    if (resendTimer > 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const validation = validatePhoneNumber(phone);
    try {
      await AuthApi.sendPhoneOtp(validation.formatted || phone);
      setOtp('');
      setSecondsLeft(300);
      setResendTimer(45);
    } catch (error: any) {
      Alert.alert('Erreur', error?.message || 'Impossible de renvoyer le code.');
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (codeValue: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);

    const validation = validatePhoneNumber(phone);
    const formattedPhone = validation.formatted || phone;

    try {
      const result = await AuthApi.verifyPhoneOtp(formattedPhone, codeValue);

      if (result.isRegistered && result.token && result.user) {
        // Numéro déjà inscrit -> connexion directe
        await authenticateWithSession(result.token, result.user);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await goAfterAuth();
      } else {
        // Numéro non inscrit -> formulaire prénom/nom
        setIsLoading(false);
        setStep(3);
      }
    } catch (err: any) {
      setIsLoading(false);
      setOtp('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Code incorrect', err?.message || 'Le code saisi est invalide ou expiré.');
    }
  };

  const handleOtpChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setOtp(cleaned);
    if (cleaned.length === 6) {
      handleVerifyOtp(cleaned);
    }
  };

  // Step 3: Register profile name
  const handleCreateProfile = async () => {
    if (!firstname.trim() || !lastname.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir votre prénom et votre nom');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);

    const validation = validatePhoneNumber(phone);
    const formattedPhone = validation.formatted || phone;

    try {
      const result = await AuthApi.registerPhone(formattedPhone, firstname.trim(), lastname.trim());
      await authenticateWithSession(result.token, result.user);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await goAfterAuth();
    } catch (err: any) {
      setIsLoading(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', err?.message || 'Impossible de créer le profil.');
    }
  };



  if (isAuthLoading) {
    return <InlineLoading message="Vérification..." />;
  }

  if (isLoading) {
    return <InlineLoading message={step === 3 ? "Création du profil..." : "Vérification..."} />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* Step Header */}
        {step > 1 && (
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => setStep(step - 1)} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        )}

        <ScrollView
          contentContainerStyle={[styles.scrollContent, step === 1 && { paddingTop: 20 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          scrollEnabled={step !== 1}
        >
          {/* STEP 1: ENTER PHONE NUMBER */}
          {step === 1 && (
            <View style={{ flex: 1 }}>
              {/* Logo SUE */}
              <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.logoWrapper}>
                <View style={styles.highlightedBrandContainer}>
                  <Text style={styles.brandTitleText}>SUE</Text>
                </View>
              </Animated.View>

              {/* Balls Illustration */}
              <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.illustrationContainer}>
                <View style={styles.illustrationInner}>
                  <View style={[styles.ball, styles.soccerBall]}>
                    <Ionicons name="football" size={48} color="#000" />
                  </View>
                  <View style={[styles.ball, styles.tennisBall]}>
                    <Ionicons name="tennisball" size={22} color="#000" />
                  </View>
                  <View style={[styles.ball, styles.golfBall]}>
                    <Ionicons name="baseball" size={18} color="#000" />
                  </View>
                </View>
              </Animated.View>

              {/* Title & Subtitle */}
              <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.textHeader}>
                <Text style={styles.mainTitle}>Prêt à jouer ?</Text>
                <Text style={styles.subtitle}>
                  Entre ton numéro de téléphone pour rejoindre tes potes sur le terrain.
                </Text>
              </Animated.View>

              {/* Form Input */}
              <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.formContainer}>
                <Text style={styles.inputLabel}>Numéro de téléphone</Text>
                <View style={styles.phoneRow}>
                  <View style={styles.countryCodeSelector}>
                    <Text style={styles.flagEmoji}>🇫🇷</Text>
                    <Text style={styles.countryCodeText}>+33</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="6 12 34 56 78"
                    placeholderTextColor="#CCCCCC"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={handlePhoneChange}
                  />
                </View>

                {phoneError ? (
                  <Text style={styles.errorText}>{phoneError}</Text>
                ) : null}

                {/* Continue button */}
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={handleSendOtp}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionBtnText}>Continuer</Text>
                </TouchableOpacity>

                {/* Footnote */}
                <View style={styles.lockFootnote}>
                  <Ionicons name="lock-closed-outline" size={12} color="#8E8E93" style={{ marginRight: 6 }} />
                  <Text style={styles.lockFootnoteText}>
                    Nous t'enverrons un code par SMS pour vérifier ton numéro.
                  </Text>
                </View>
              </Animated.View>

              {/* Footer links */}
              <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.termsFooter}>
                <Text style={styles.termsText}>
                  En continuant, tu acceptes nos{' '}
                  <Text style={styles.termsLink} onPress={() => router.push('/privacy')}>Conditions d'utilisation</Text>
                  {' et notre '}
                  <Text style={styles.termsLink} onPress={() => router.push('/privacy')}>Politique de confidentialité</Text>.
                </Text>
              </Animated.View>
            </View>
          )}

          {/* STEP 2: VERIFICATION OTP CODE */}
          {step === 2 && (
            <View style={{ flex: 1 }}>
              {/* Title & Subtitle */}
              <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.textHeaderOtp}>
                <Text style={styles.mainTitleOtp}>Code de vérification</Text>
                <Text style={styles.subtitleOtp}>
                  On t'a envoyé un code à 6 chiffres par SMS au{' '}
                  <Text style={{ fontWeight: '800', color: '#000' }}>+33 {phone}</Text>
                </Text>
              </Animated.View>

              {/* OTP Boxes Grid */}
              <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.otpGridWrapper}>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => otpInputRef.current?.focus()}
                  style={styles.otpBoxesRow}
                >
                  {Array(6)
                    .fill('')
                    .map((_, idx) => {
                      const digit = otp[idx] || '';
                      const isFocused = idx === otp.length;
                      return (
                        <View
                          key={idx}
                          style={[
                            styles.otpBox,
                            digit !== '' && styles.otpBoxFilled,
                            isFocused && styles.otpBoxFocused
                          ]}
                        >
                          <Text style={styles.otpText}>{digit}</Text>
                        </View>
                      );
                    })}
                </TouchableOpacity>

                {/* Hidden real TextInput */}
                <TextInput
                  ref={otpInputRef}
                  style={styles.hiddenInput}
                  value={otp}
                  onChangeText={handleOtpChange}
                  keyboardType="number-pad"
                  maxLength={6}
                  textContentType="oneTimeCode"
                  autoComplete="one-time-code"
                  caretHidden={true}
                />
              </Animated.View>

              {/* Expiry Timer */}
              <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.timerContainer}>
                <Text style={styles.timerText}>
                  Le code expire dans <Text style={styles.timerHighlight}>{formatTime(secondsLeft)}</Text>
                </Text>
              </Animated.View>

              {/* Resend Button Card */}
              <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.resendWrapper}>
                <TouchableOpacity
                  style={[styles.resendBtn, resendTimer > 0 && styles.resendBtnDisabled]}
                  disabled={resendTimer > 0}
                  onPress={handleResendCode}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="chatbox-ellipses-outline"
                    size={16}
                    color={resendTimer > 0 ? '#A1A1A9' : '#000'}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={resendTimer > 0 ? styles.resendTextDisabled : styles.resendTextEnabled}>
                    {resendTimer > 0 ? `Renvoyer le code dans ${resendTimer}s` : 'Renvoyer le code'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              {/* Alternative Footer */}
              <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.altFooter}>
                <Text style={styles.altFooterText}>Tu n'as pas reçu le SMS ?</Text>
                <TouchableOpacity onPress={() => { setStep(1); setOtp(''); }}>
                  <Text style={styles.altFooterLink}>Changer de numéro</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          )}

          {/* STEP 3: PROFILE NAME REGISTRATION */}
          {step === 3 && (
            <View style={{ flex: 1 }}>
              {/* Title & Subtitle */}
              <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.textHeaderProfile}>
                <Text style={styles.mainTitle}>Presque terminé !</Text>
                <Text style={styles.subtitle}>
                  Ajoute ton prénom et ton nom pour créer ton profil.
                </Text>
              </Animated.View>

              {/* Inputs Form */}
              <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.formContainerStep3}>
                {/* Firstname */}
                <Text style={styles.step3InputLabel}>Prénom</Text>
                <View style={styles.step3InputCard}>
                  <Ionicons name="person-outline" size={18} color="#D4FC79" style={styles.inputIcon} />
                  <TextInput
                    style={styles.step3Input}
                    placeholder="Ex: Thomas"
                    placeholderTextColor="#CCCCCC"
                    value={firstname}
                    onChangeText={setFirstname}
                  />
                </View>

                {/* Lastname */}
                <Text style={styles.step3InputLabel}>Nom</Text>
                <View style={styles.step3InputCard}>
                  <Ionicons name="person-outline" size={18} color="#D4FC79" style={styles.inputIcon} />
                  <TextInput
                    style={styles.step3Input}
                    placeholder="Ex: Dubois"
                    placeholderTextColor="#CCCCCC"
                    value={lastname}
                    onChangeText={setLastname}
                  />
                </View>

                {/* Create Profile Button */}
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={handleCreateProfile}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionBtnText}>Créer mon profil</Text>
                </TouchableOpacity>

                {/* Info Note */}
                <Text style={styles.infoNoteText}>
                  Tu pourras modifier ces informations à tout moment.
                </Text>
              </Animated.View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 48,
    marginTop: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8E8E93',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  // STEP 1 STYLES
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 10,
  },
  highlightedBrandContainer: {
    backgroundColor: VOLT_COLOR,
    paddingHorizontal: 16,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 10,
    transform: [{ skewX: '-10deg' }],
  },
  brandTitleText: {
    fontSize: 44,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#000',
    letterSpacing: -2,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  illustrationInner: {
    width: 140,
    height: 120,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ball: {
    position: 'absolute',
    borderRadius: 99,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#000',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  soccerBall: {
    width: 68,
    height: 68,
    borderRadius: 34,
    left: 15,
    top: 10,
    zIndex: 2,
  },
  tennisBall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: VOLT_COLOR,
    right: 15,
    bottom: 25,
    zIndex: 3,
  },
  golfBall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF',
    right: 35,
    top: 20,
    zIndex: 1,
  },
  textHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  mainTitle: {
    fontSize: 26,
    fontFamily: 'Outfit-Bold',
    fontWeight: '800',
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 15,
    fontWeight: '600',
  },
  formContainer: {
    width: '100%',
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: '600',
    marginTop: -12,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  countryCodeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    height: 52,
    paddingHorizontal: 16,
    gap: 6,
  },
  flagEmoji: {
    fontSize: 16,
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  actionBtn: {
    backgroundColor: VOLT_COLOR,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
  },
  lockFootnote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  lockFootnoteText: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '600',
  },
  termsFooter: {
    marginTop: 'auto',
    paddingBottom: 10,
  },
  termsText: {
    fontSize: 11,
    color: '#8E8E93',
    lineHeight: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
    fontWeight: '600',
  },
  termsLink: {
    color: '#8CBE29',
    fontWeight: '700',
  },

  // STEP 2 STYLES
  textHeaderOtp: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 36,
  },
  mainTitleOtp: {
    fontSize: 26,
    fontFamily: 'Outfit-Bold',
    fontWeight: '800',
    color: '#000',
    marginBottom: 12,
  },
  subtitleOtp: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 24,
    fontWeight: '600',
  },
  otpGridWrapper: {
    alignItems: 'center',
    marginBottom: 32,
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 8,
  },
  otpBox: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxFilled: {
    borderColor: '#E5E7EB',
  },
  otpBoxFocused: {
    borderColor: VOLT_COLOR,
  },
  otpText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.01,
    color: 'transparent',
    backgroundColor: 'transparent',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  timerText: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600',
  },
  timerHighlight: {
    color: '#8CBE29',
    fontWeight: '800',
  },
  resendWrapper: {
    width: '100%',
    marginBottom: 44,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  resendBtnDisabled: {
    backgroundColor: '#F3F4F6',
  },
  resendTextDisabled: {
    color: '#8E8E93',
    fontWeight: '700',
    fontSize: 13,
  },
  resendTextEnabled: {
    color: '#000',
    fontWeight: '800',
    fontSize: 13,
  },
  altFooter: {
    alignItems: 'center',
    gap: 8,
  },
  altFooterText: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600',
  },
  altFooterLink: {
    fontSize: 13,
    color: '#8CBE29',
    fontWeight: '800',
  },

  // STEP 3 STYLES
  textHeaderProfile: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  formContainerStep3: {
    width: '100%',
  },
  step3InputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  step3InputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    height: 52,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 12,
  },
  step3Input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  infoNoteText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '600',
  },
});