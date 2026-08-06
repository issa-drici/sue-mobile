import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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
import { UsersApi } from '../services/api/usersApi';
import { useAuth } from './context/auth';

const ACCENT_COLOR = '#70A831'; // Vert SUE / Vert d'action
const VOLT_COLOR = '#D4FC79'; // Electric Volt pour validation

export default function PrivacyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();

  const [loading, setLoading] = useState(false);

  // Email Modal State
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [currentEmail, setCurrentEmail] = useState('');

  // Password Modal State
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Legal Modals State
  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms'>('privacy');

  const handleChangeEmail = async () => {
    if (!newEmail) {
      Alert.alert('Erreur', 'Veuillez entrer une nouvelle adresse email.');
      return;
    }
    setLoading(true);
    try {
      await UsersApi.updateEmail(newEmail, currentEmail);
      Alert.alert('Succès', 'Votre email a été mis à jour.');
      setEmailModalVisible(false);
      setNewEmail('');
      setCurrentEmail('');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de mettre à jour l\'email.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les nouveaux mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    try {
      await UsersApi.updatePassword(currentPassword, newPassword);
      Alert.alert('Succès', 'Votre mot de passe a été mis à jour.');
      setPasswordModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de mettre à jour le mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Cette action est irréversible. Toutes tes sessions créées et participations seront effacées. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await UsersApi.deleteAccount();
              await signOut();
              router.replace('/(auth)/login');
            } catch (error: any) {
              Alert.alert('Erreur', error.message || 'Impossible de supprimer le compte.');
              setLoading(false);
            }
          }
        }
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
            style={styles.rowItem} 
            onPress={() => setEmailModalVisible(true)}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="mail-outline" size={20} color={ACCENT_COLOR} />
              <Text style={styles.rowText}>Changer l'email</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.8}
            style={[styles.rowItem, { borderBottomWidth: 0 }]} 
            onPress={() => setPasswordModalVisible(true)}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="lock-closed-outline" size={20} color={ACCENT_COLOR} />
              <Text style={styles.rowText}>Changer le mot de passe</Text>
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

      {/* Email Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={emailModalVisible}
        onRequestClose={() => setEmailModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Modifier l'email</Text>
              <TouchableOpacity onPress={() => setEmailModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#000" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>EMAIL ACTUEL</Text>
            <TextInput
              style={styles.input}
              placeholder="Ton e-mail actuel"
              placeholderTextColor="#999"
              value={currentEmail}
              onChangeText={setCurrentEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <Text style={styles.inputLabel}>NOUVEL EMAIL</Text>
            <TextInput
              style={styles.input}
              placeholder="Nouvel email"
              placeholderTextColor="#999"
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TouchableOpacity 
              activeOpacity={0.8}
              style={styles.modalSaveBtn} 
              onPress={handleChangeEmail} 
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.modalSaveBtnText}>Enregistrer</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Password Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={passwordModalVisible}
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Changer le mot de passe</Text>
              <TouchableOpacity onPress={() => setPasswordModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#000" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>MOT DE PASSE ACTUEL</Text>
            <TextInput
              style={styles.input}
              placeholder="Mot de passe actuel"
              placeholderTextColor="#999"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />

            <Text style={styles.inputLabel}>NOUVEAU MOT DE PASSE</Text>
            <TextInput
              style={styles.input}
              placeholder="Nouveau mot de passe"
              placeholderTextColor="#999"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />

            <Text style={styles.inputLabel}>CONFIRMATION</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirmer le mot de passe"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <TouchableOpacity 
              activeOpacity={0.8}
              style={styles.modalSaveBtn} 
              onPress={handleChangePassword} 
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.modalSaveBtnText}>Enregistrer</Text>}
            </TouchableOpacity>
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
      {loading && !emailModalVisible && !passwordModalVisible && (
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