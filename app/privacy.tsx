import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OtpCodeInput } from '../components/molecules/OtpCodeInput/OtpCodeInput';
import { UsersApi } from '../services/api/usersApi';
import { formatPhoneDisplay, normalizeFrenchPhone } from '../utils/phone';
import { useAuth } from './context/auth';

const ACCENT_COLOR = '#70A831'; // Vert SUE / Vert d'action
const VOLT_COLOR = '#D4FC79'; // Electric Volt pour validation

type CodeFlow = 'current-code' | 'new-number' | 'new-code' | 'delete-code';

export default function PrivacyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut, refreshUser } = useAuth();

  const [loading, setLoading] = useState(false);

  // Feuille de code SMS : changer de numéro (code sur l'actuel, nouveau numéro, code sur le nouveau) ou supprimer le compte
  const [codeFlow, setCodeFlow] = useState<CodeFlow | null>(null);
  const [code, setCode] = useState('');
  const [newPhoneInput, setNewPhoneInput] = useState('');
  const [flowError, setFlowError] = useState('');
  const [resendIn, setResendIn] = useState(0);

  // Legal Modals State
  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms'>('privacy');

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const currentPhone = formatPhoneDisplay(user?.phone);
  const newPhone = normalizeFrenchPhone(newPhoneInput);

  const closeCodeFlow = () => {
    setCodeFlow(null);
    setCode('');
    setNewPhoneInput('');
    setFlowError('');
  };

  // Envoie un code et ouvre (ou fait avancer) la feuille sur l'étape voulue
  const sendCode = async (next: CodeFlow) => {
    setLoading(true);
    setFlowError('');
    try {
      if (next === 'new-code') {
        await UsersApi.sendNewPhoneCode(newPhone!);
      } else {
        await UsersApi.sendAccountCode();
      }
      setCode('');
      setResendIn(45);
      setCodeFlow(next);
    } catch (error: any) {
      if (codeFlow) setFlowError(error.message || "Impossible d'envoyer le code.");
      else Alert.alert('Erreur', error.message || "Impossible d'envoyer le code.");
    } finally {
      setLoading(false);
    }
  };

  const submitCode = async (value: string) => {
    if (value.length !== 6 || loading) return;
    setLoading(true);
    setFlowError('');
    try {
      if (codeFlow === 'current-code') {
        await UsersApi.verifyCurrentPhone(value);
        setCode('');
        setCodeFlow('new-number');
      } else if (codeFlow === 'new-code') {
        await UsersApi.confirmNewPhone(newPhone!, value);
        await refreshUser();
        closeCodeFlow();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Numéro mis à jour', `Tu te connecteras désormais avec le ${formatPhoneDisplay(newPhone)}.`);
      } else if (codeFlow === 'delete-code') {
        await UsersApi.deleteAccount(value);
        closeCodeFlow();
        await signOut();
        router.replace('/(auth)/login');
      }
    } catch (error: any) {
      setCode('');
      setFlowError(error.message || 'Code invalide ou expiré.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Cette action est irréversible. Toutes tes sessions créées et participations seront effacées. On t\'envoie un code par SMS pour confirmer.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Recevoir le code', style: 'destructive', onPress: () => sendCode('delete-code') },
      ]
    );
  };

  const openLegalModal = (type: 'privacy' | 'terms') => {
    setLegalModalType(type);
    setLegalModalVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Compte & confidentialité</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* COMPTE */}
        <Text style={styles.sectionHeader}>COMPTE</Text>
        <View style={styles.sectionCard}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.rowItem, { borderBottomWidth: 0 }]}
            onPress={() => sendCode('current-code')}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="call-outline" size={20} color={ACCENT_COLOR} />
              <View>
                <Text style={styles.rowText}>Changer de numéro</Text>
                {currentPhone ? <Text style={styles.rowSubText}>{currentPhone}</Text> : null}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
          </TouchableOpacity>
        </View>

        {/* LÉGAL */}
        <Text style={styles.sectionHeader}>LÉGAL</Text>
        <View style={styles.sectionCard}>
          <TouchableOpacity 
            activeOpacity={0.8}
            style={styles.rowItem}
            onPress={() => openLegalModal('privacy')}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="shield-outline" size={20} color={ACCENT_COLOR} />
              <Text style={styles.rowText}>Politique de confidentialité</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.8}
            style={[styles.rowItem, { borderBottomWidth: 0 }]}
            onPress={() => openLegalModal('terms')}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="document-text-outline" size={20} color={ACCENT_COLOR} />
              <Text style={styles.rowText}>Conditions d'utilisation</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
          </TouchableOpacity>
        </View>

        {/* ZONE DANGER */}
        <Text style={styles.sectionHeader}>ZONE DANGER</Text>
        <View style={styles.sectionCard}>
          <TouchableOpacity 
            activeOpacity={0.8}
            style={[styles.rowItem, { borderBottomWidth: 0 }]} 
            onPress={handleDeleteAccount}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              <Text style={[styles.rowText, { color: '#FF3B30' }]}>Supprimer mon compte</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Feuille de code SMS */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={codeFlow !== null}
        onRequestClose={closeCodeFlow}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {codeFlow === 'delete-code' ? 'Supprimer mon compte' : 'Changer de numéro'}
              </Text>
              <TouchableOpacity onPress={closeCodeFlow} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#000" />
              </TouchableOpacity>
            </View>

            {codeFlow === 'new-number' ? (
              <>
                <Text style={styles.modalText}>C'est bien toi. Entre ton nouveau numéro, on t'y envoie un code.</Text>
                <Text style={styles.inputLabel}>NOUVEAU NUMÉRO</Text>
                <TextInput
                  style={styles.input}
                  placeholder="06 12 34 56 78"
                  placeholderTextColor="#999"
                  value={newPhoneInput}
                  onChangeText={(text) => { setNewPhoneInput(text); setFlowError(''); }}
                  keyboardType="phone-pad"
                  textContentType="telephoneNumber"
                  autoComplete="tel"
                  autoFocus
                />
                {flowError ? <Text style={styles.flowError}>{flowError}</Text> : null}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.modalSaveBtn, (!newPhone || loading) && styles.modalBtnDisabled]}
                  onPress={() => sendCode('new-code')}
                  disabled={!newPhone || loading}
                >
                  {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.modalSaveBtnText}>Recevoir le code</Text>}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.modalText}>
                  {codeFlow === 'new-code' ? 'Code envoyé au ' : 'Code envoyé à ton numéro actuel, le '}
                  <Text style={styles.modalTextStrong}>
                    {codeFlow === 'new-code' ? formatPhoneDisplay(newPhone) : currentPhone}
                  </Text>
                  {codeFlow === 'delete-code' ? '. Saisis-le pour supprimer définitivement ton compte.' : '.'}
                </Text>
                <View style={styles.codeWrapper}>
                  <OtpCodeInput
                    value={code}
                    onChange={(value) => { setCode(value); setFlowError(''); }}
                    // Suppression : on attend la confirmation explicite, le reste valide tout seul
                    onComplete={codeFlow === 'delete-code' ? undefined : submitCode}
                  />
                </View>
                {flowError ? <Text style={styles.flowError}>{flowError}</Text> : null}
                <TouchableOpacity
                  onPress={() => codeFlow && sendCode(codeFlow)}
                  disabled={resendIn > 0 || loading}
                  style={styles.resendBtn}
                >
                  <Text style={[styles.resendText, resendIn > 0 && styles.resendTextDisabled]}>
                    {resendIn > 0 ? `Renvoyer le code dans ${resendIn}s` : 'Renvoyer le code'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.modalSaveBtn,
                    codeFlow === 'delete-code' && styles.modalDangerBtn,
                    (code.length !== 6 || loading) && styles.modalBtnDisabled,
                  ]}
                  onPress={() => submitCode(code)}
                  disabled={code.length !== 6 || loading}
                >
                  {loading ? (
                    <ActivityIndicator color={codeFlow === 'delete-code' ? '#FFF' : '#000'} />
                  ) : (
                    <Text style={[styles.modalSaveBtnText, codeFlow === 'delete-code' && { color: '#FFF' }]}>
                      {codeFlow === 'delete-code' ? 'Supprimer définitivement' : 'Valider'}
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Legal Content Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={legalModalVisible}
        onRequestClose={() => setLegalModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {legalModalType === 'privacy' ? 'Politique de confidentialité' : "Conditions d'utilisation"}
              </Text>
              <TouchableOpacity onPress={() => setLegalModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 12 }}>
              {legalModalType === 'privacy' ? (
                <>
                  <Text style={styles.legalSubTitle}>1. COLLECTE DES DONNÉES</Text>
                  <Text style={styles.legalText}>
                    Nous collectons uniquement les données nécessaires pour vous offrir une expérience sportive optimale :
                    {"\n\n"}
                    • Informations de profil (Nom, Prénom, Photo)
                    {"\n"}
                    • Données de localisation pour trouver des sessions de sport à proximité
                    {"\n"}
                    • Historique de vos matchs et performances sportives
                  </Text>
                  <Text style={styles.legalSubTitle}>2. UTILISATION DES DONNÉES</Text>
                  <Text style={styles.legalText}>
                    Vos données servent uniquement à :
                    {"\n\n"}
                    • Organiser et gérer vos sessions de sport
                    {"\n"}
                    • Vous connecter avec d'autres athlètes de votre squad
                    {"\n"}
                    • Améliorer les services SUE
                  </Text>
                  <Text style={styles.legalSubTitle}>3. PROTECTION & PARTAGE</Text>
                  <Text style={styles.legalText}>
                    La sécurité de vos données est notre priorité. Vos informations personnelles ne sont jamais partagées, vendues ou cédées à des tiers.
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.legalSubTitle}>1. ACCEPTATION DES CONDITIONS</Text>
                  <Text style={styles.legalText}>
                    En utilisant l'application SUE, vous acceptez d'être lié par les présentes conditions d'utilisation. Si vous ne les acceptez pas, merci de ne pas utiliser le service.
                  </Text>
                  <Text style={styles.legalSubTitle}>2. RÈGLES DE CONDUITE</Text>
                  <Text style={styles.legalText}>
                    SUE est une communauté d'athlètes fondée sur le respect. Tout comportement inapproprié, injurieux ou frauduleux lors des sessions organisées entraînera la suppression immédiate du compte.
                  </Text>
                  <Text style={styles.legalSubTitle}>3. RESPONSABILITÉ SPORTIVE</Text>
                  <Text style={styles.legalText}>
                    SUE facilite l'organisation de sessions de sport indépendantes. Chaque athlète participe sous sa propre responsabilité et s'assure d'être en bonne condition physique. SUE décline toute responsabilité en cas de blessure physique.
                  </Text>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Global Loading Overlay */}
      {loading && codeFlow === null && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={ACCENT_COLOR} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
    fontFamily: 'Outfit-Bold',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E8E93',
    marginBottom: 8,
    marginTop: 20,
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  rowSubText: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },

  // Modals stylisés comme des Bottom Sheets propres
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    fontFamily: 'Outfit-Bold',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8E8E93',
    marginBottom: 6,
    marginTop: 14,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#F9FAFB',
    color: '#000',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalSaveBtn: {
    backgroundColor: VOLT_COLOR,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  modalSaveBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 16,
  },
  modalBtnDisabled: {
    opacity: 0.5,
  },
  modalDangerBtn: {
    backgroundColor: '#FF3B30',
  },
  modalText: {
    fontSize: 15,
    lineHeight: 21,
    color: '#6B7280',
  },
  modalTextStrong: {
    fontWeight: '800',
    color: '#000',
  },
  codeWrapper: {
    marginTop: 20,
  },
  flowError: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
    color: '#FF3B30',
  },
  resendBtn: {
    alignSelf: 'center',
    marginTop: 18,
    paddingVertical: 6,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  resendTextDisabled: {
    color: '#A1A1A9',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Legal styling
  legalSubTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginTop: 16,
    marginBottom: 4,
  },
  legalText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#6B7280',
    marginBottom: 12,
  }
});