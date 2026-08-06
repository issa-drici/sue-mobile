import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
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

import { InlineLoading } from '../../components/OptimizedLoading';
import { MainScreenLayout } from '../../components/ui/ScreenLayout';
import { UsersApi } from '../../services/api/usersApi';
import { ENV } from '../../config/env';
import { useDevMode } from '../../hooks/useDevMode';
import { useGetUserProfile, useUpdateUser } from '../../services';
import { useAuth } from '../context/auth';

const SUE_GREEN = '#70A831'; // SUE primary icon green
const VOLT_COLOR = '#D4FC79'; // Electric Volt for buttons

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut, refreshUser } = useAuth();
  const { data: userProfile, isLoading, error, refetch } = useGetUserProfile();
  const { updateUser, isLoading: isUpdating } = useUpdateUser();
  const { isDev } = useDevMode();

  // Avatar Upload animation
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const rotation = useRef(new Animated.Value(0)).current;

  // Edit Profile bottom sheet modal state
  const [isEditProfileVisible, setIsEditProfileVisible] = useState(false);
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);

  // Slide animation for edit profile modal
  const modalSlideAnim = useRef(new Animated.Value(400)).current;

  React.useEffect(() => {
    if (isEditProfileVisible) {
      Animated.spring(modalSlideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      modalSlideAnim.setValue(400);
    }
  }, [isEditProfileVisible]);

  React.useEffect(() => {
    let rotationAnimation: Animated.CompositeAnimation | undefined;
    if (isUploading) {
      rotation.setValue(0);
      rotationAnimation = Animated.timing(rotation, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      });
      Animated.loop(rotationAnimation).start();
    }

    return () => {
      if (rotationAnimation) {
        rotationAnimation.stop();
      }
    };
  }, [isUploading]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleSignOut = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment quitter le terrain ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/(auth)/login');
            } catch (error) {
              Alert.alert('Erreur', 'Une erreur est survenue lors de la déconnexion');
            }
          }
        }
      ]
    );
  };

  const openEditProfile = () => {
    Haptics.selectionAsync();
    setFirstname(userProfile?.firstname || user?.firstname || '');
    setLastname(userProfile?.lastname || user?.lastname || '');
    setLocalAvatarUri(userProfile?.avatar || user?.avatar || null);
    setIsEditProfileVisible(true);
  };

  const handleSaveProfile = async () => {
    if (isSaving) return;
    setIsSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      // Upload de la nouvelle photo si l'utilisateur en a choisi une (URI locale file://…)
      if (localAvatarUri && !localAvatarUri.startsWith('http')) {
        setIsUploading(true);
        await UsersApi.updateAvatar(localAvatarUri);
      }
      await updateUser({ firstname, lastname });
      await refetch();
      await refreshUser();
      setIsEditProfileVisible(false);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de mettre à jour ton profil.');
    } finally {
      setIsUploading(false);
      setIsSaving(false);
    }
  };

  const pickImage = async () => {
    Haptics.selectionAsync();
    Alert.alert(
      "Photo de profil",
      undefined,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Prendre une photo",
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission refusée', 'L\'accès à la caméra est nécessaire.');
              return;
            }
            launchCamera();
          }
        },
        {
          text: "Choisir depuis la galerie",
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission refusée', 'L\'accès aux photos est nécessaire.');
              return;
            }
            launchLibrary();
          }
        }
      ]
    );
  };

  const launchCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      handleImageResult(result);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de prendre la photo.');
    }
  };

  const launchLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      handleImageResult(result);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image.');
    }
  };

  const handleImageResult = async (result: ImagePicker.ImagePickerResult) => {
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setLocalAvatarUri(uri);
    }
  };

  if (isLoading && !userProfile) {
    return <InlineLoading message="Chargement du profil..." />;
  }

  // Calcul des initiales pour l'avatar placeholder
  const fn = userProfile?.firstname || user?.firstname || '';
  const ln = userProfile?.lastname || user?.lastname || '';
  const initials = `${fn.charAt(0)}${ln.charAt(0)}`.toUpperCase() || '?';

  return (
    <MainScreenLayout title="Profil" showHeader={false} containerStyle={{ backgroundColor: '#FAFAFA', flex: 1 }}>
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Platform.OS === 'android' ? Math.max(insets.top, 20) : 10, paddingBottom: 120 }
        ]} 
        showsVerticalScrollIndicator={false}
      >
        {/* Carte info utilisateur */}
        <View style={styles.userCard}>
          {userProfile?.avatar || user?.avatar ? (
            <Image
              source={{ uri: userProfile?.avatar || user?.avatar || undefined }}
              style={styles.userAvatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>{initials}</Text>
            </View>
          )}
          <View style={styles.userInfo}>
            <Text style={styles.userNameText}>
              {userProfile?.firstname || user?.firstname} {userProfile?.lastname || user?.lastname}
            </Text>
            <Text style={styles.userEmailText}>
              {userProfile?.email || user?.email}
            </Text>
          </View>
        </View>

        {/* Bouton Modifier mon profil */}
        <TouchableOpacity 
          activeOpacity={0.8}
          style={styles.menuCardBtn}
          onPress={openEditProfile}
        >
          <View style={styles.menuCardLeft}>
            <Ionicons name="person-outline" size={22} color={SUE_GREEN} />
            <Text style={styles.menuCardText}>Modifier mon profil</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
        </TouchableOpacity>

        {/* CONFIDENTIALITÉ */}
        <Text style={styles.sectionHeader}>CONFIDENTIALITÉ</Text>
        
        <TouchableOpacity 
          activeOpacity={0.8}
          style={styles.menuCardBtn}
          onPress={() => router.push('/privacy')}
        >
          <View style={styles.menuCardLeft}>
            <Ionicons name="shield-checkmark-outline" size={22} color={SUE_GREEN} />
            <Text style={styles.menuCardText}>Compte & confidentialité</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
        </TouchableOpacity>

        {/* Se déconnecter */}
        <TouchableOpacity 
          activeOpacity={0.8}
          style={[styles.menuCardBtn, { marginTop: 12 }]}
          onPress={handleSignOut}
        >
          <View style={styles.menuCardLeft}>
            <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
            <Text style={[styles.menuCardText, { color: '#FF3B30' }]}>Se déconnecter</Text>
          </View>
        </TouchableOpacity>

        {/* Menu Dev si activé */}
        {isDev && (
          <>
            <Text style={styles.sectionHeader}>ZONE DÉVELOPPEUR</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.menuCardBtn}
              onPress={() => router.push('/dev-menu')}
            >
              <View style={styles.menuCardLeft}>
                <Ionicons name="code-slash-outline" size={22} color={SUE_GREEN} />
                <Text style={styles.menuCardText}>Menu dev</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
            </TouchableOpacity>
          </>
        )}

        {/* Version */}
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>

      {/* Edit Profile Modal Bottom Sheet */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isEditProfileVisible}
        onRequestClose={() => setIsEditProfileVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContentWrapper}
          >
            <Animated.View 
              style={[
                styles.modalContent,
                { transform: [{ translateY: modalSlideAnim }] }
              ]}
            >
              {/* Handle bar */}
              <View style={styles.modalHandle} />

              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Modifier mon profil</Text>
                <TouchableOpacity 
                  onPress={() => setIsEditProfileVisible(false)}
                  style={styles.modalCloseBtn}
                >
                  <Ionicons name="close" size={20} color="#000" />
                </TouchableOpacity>
              </View>

              {/* Avatar Uploader in Modal */}
              <TouchableOpacity 
                activeOpacity={0.9} 
                style={styles.modalAvatarContainer}
                onPress={pickImage}
              >
                {localAvatarUri ? (
                  <Image source={{ uri: localAvatarUri }} style={styles.modalAvatar} />
                ) : (
                  <View style={styles.modalAvatarPlaceholder}>
                    <Text style={styles.modalAvatarPlaceholderText}>{initials}</Text>
                  </View>
                )}
                <View style={styles.cameraIconContainer}>
                  <Ionicons name="camera" size={16} color="#4B5563" />
                </View>
              </TouchableOpacity>

              {/* Input Fields */}
              <Text style={styles.inputLabel}>PRÉNOM</Text>
              <TextInput
                style={styles.input}
                placeholder="Prénom"
                placeholderTextColor="#999"
                value={firstname}
                onChangeText={setFirstname}
              />

              <Text style={styles.inputLabel}>NOM</Text>
              <TextInput
                style={styles.input}
                placeholder="Nom"
                placeholderTextColor="#999"
                value={lastname}
                onChangeText={setLastname}
              />

              {/* Enregistrer button */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.saveBtn}
                onPress={handleSaveProfile}
                disabled={isSaving || isUpdating || isUploading}
              >
                {isSaving || isUpdating || isUploading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.saveBtnText}>Enregistrer</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </MainScreenLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
  },
  pageTitle: {
    fontSize: 32,
    fontFamily: 'Outfit-Bold',
    fontWeight: '800',
    color: '#000',
    marginTop: 16,
    marginBottom: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 20,
    marginTop: 10,
  },
  userAvatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#F3F4F6',
  },
  avatarPlaceholder: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 22,
    fontFamily: 'Outfit-Bold',
    fontWeight: '700',
    color: '#2E7D32',
  },
  userInfo: {
    marginLeft: 16,
  },
  userNameText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 2,
  },
  userEmailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  menuCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  menuCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuCardText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E8E93',
    marginBottom: 8,
    marginTop: 20,
    letterSpacing: 0.5,
  },
  versionText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 40,
  },

  // Modal styling (Bottom Sheet wrapper)
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContentWrapper: {
    width: '100%',
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
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
  modalAvatarContainer: {
    alignSelf: 'center',
    position: 'relative',
    marginTop: 8,
    marginBottom: 20,
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
  },
  modalAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAvatarPlaceholderText: {
    fontSize: 24,
    fontFamily: 'Outfit-Bold',
    fontWeight: '700',
    color: '#2E7D32',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
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
  saveBtn: {
    backgroundColor: VOLT_COLOR,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  saveBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 16,
  },
  iosPageSheetContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 24,
    paddingTop: 30,
  },
});