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

const ACCENT_COLOR = '#D4FC79'; // Electric Volt

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
      'Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.',
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PRIVACY</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PARAMÈTRES DU COMPTE</Text>

          <TouchableOpacity style={styles.actionButton} onPress={() => setEmailModalVisible(true)}>
            <Text style={styles.actionButtonText}>CHANGER L'EMAIL</Text>
            <Ionicons name="chevron-forward" size={20} color="#000" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => setPasswordModalVisible(true)}>
            <Text style={styles.actionButtonText}>CHANGER LE MOT DE PASSE</Text>
            <Ionicons name="chevron-forward" size={20} color="#000" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDeleteAccount}>
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>SUPPRIMER LE COMPTE</Text>
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <Text style={styles.title}>POLITIQUE DE CONFIDENTIALITÉ</Text>
        <Text style={styles.lastUpdated}>Dernière mise à jour : 28 Nov. 2025</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. COLLECTE DES DONNÉES</Text>
          <Text style={styles.text}>
            Nous collectons uniquement les données nécessaires pour vous offrir une expérience sportive optimale :
          </Text>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>Informations de profil (Nom, Prénom, Photo)</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>Données de localisation pour trouver des sessions</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>Historique de vos matchs et performances</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. UTILISATION</Text>
          <Text style={styles.text}>
            Vos données servent à :
          </Text>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>Organiser et gérer vos sessions sportives</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>Vous connecter avec d'autres athlètes</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.text}>Améliorer nos services et fonctionnalités</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. SÉCURITÉ</Text>
          <Text style={styles.text}>
            La sécurité de vos données est notre priorité absolue. Nous utilisons des protocoles de chiffrement avancés pour protéger vos informations personnelles contre tout accès non autorisé.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. VOS DROITS</Text>
          <Text style={styles.text}>
            Vous avez le contrôle total. Vous pouvez à tout moment demander l'accès, la modification ou la suppression de vos données personnelles via les paramètres de l'application ou en nous contactant directement.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>SUE © 2025</Text>
          <Text style={styles.footerText}>Fait avec passion pour les athlètes.</Text>
        </View>
      </ScrollView>

      {/* Email Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={emailModalVisible}
        onRequestClose={() => setEmailModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>CHANGER L'EMAIL</Text>
            <TextInput
              style={styles.input}
              placeholder="Ton e-mail actuel"
              placeholderTextColor="#999"
              value={currentEmail}
              onChangeText={setCurrentEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Nouvel email"
              placeholderTextColor="#999"
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButtonCancel} onPress={() => setEmailModalVisible(false)}>
                <Text style={styles.modalButtonTextCancel}>ANNULER</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonConfirm} onPress={handleChangeEmail} disabled={loading}>
                {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.modalButtonTextConfirm}>VALIDER</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Password Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={passwordModalVisible}
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>CHANGER LE MOT DE PASSE</Text>
            <TextInput
              style={styles.input}
              placeholder="Mot de passe actuel"
              placeholderTextColor="#999"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              placeholder="Nouveau mot de passe"
              placeholderTextColor="#999"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              placeholder="Confirmer le mot de passe"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButtonCancel} onPress={() => setPasswordModalVisible(false)}>
                <Text style={styles.modalButtonTextCancel}>ANNULER</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonConfirm} onPress={handleChangePassword} disabled={loading}>
                {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.modalButtonTextConfirm}>VALIDER</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    fontStyle: 'italic',
    marginBottom: 8,
    lineHeight: 32,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#666',
    marginBottom: 32,
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
    marginBottom: 12,
    color: '#000',
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    fontWeight: '500',
  },
  bulletPoint: {
    flexDirection: 'row',
    marginTop: 8,
    paddingRight: 16,
  },
  bullet: {
    fontSize: 16,
    lineHeight: 24,
    color: ACCENT_COLOR,
    marginRight: 8,
    fontWeight: '900',
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
    opacity: 0.5,
  },
  footerText: {
    fontSize: 12,
    color: '#000',
    fontWeight: '600',
  },

  // Action Buttons
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    fontStyle: 'italic',
  },
  deleteButton: {
    marginTop: 16,
    borderBottomWidth: 0,
  },
  deleteButtonText: {
    color: '#FF3B30',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 32,
  },

  // Modals
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#FFF',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#222',
    color: '#FFF',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButtonCancel: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#333',
    alignItems: 'center',
  },
  modalButtonConfirm: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: ACCENT_COLOR,
    alignItems: 'center',
  },
  modalButtonTextCancel: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
  modalButtonTextConfirm: {
    color: '#000',
    fontWeight: '900',
    fontSize: 16,
    fontStyle: 'italic',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  }
});