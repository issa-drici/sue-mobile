import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { InlineLoading } from '../../components/OptimizedLoading';
import { MainScreenLayout } from '../../components/ui/ScreenLayout';
import { ENV } from '../../config/env';
import { useDevMode } from '../../hooks/useDevMode';
import { useGetUserProfile, useUpdateUser } from '../../services';
import { useAuth } from '../context/auth';

const ACCENT_COLOR = '#D4FC79'; // Electric Volt

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { data: userProfile, isLoading, error, refetch } = useGetUserProfile();
  const { updateUser, isLoading: isUpdating } = useUpdateUser();
  const { isDev } = useDevMode();

  const [isUploading, setIsUploading] = useState(false);
  const rotation = useRef(new Animated.Value(0)).current;

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
              router.replace('/login');
            } catch (error) {
              Alert.alert('Erreur', 'Une erreur est survenue lors de la déconnexion');
            }
          }
        }
      ]
    );
  };

  const pickImage = async () => {
    Haptics.selectionAsync();
    Alert.alert(
      "Photo de profil",
      "Mettez votre visage de guerrier",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Prendre une photo",
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission refusée', 'Nous avons besoin de l\'accès à votre caméra !');
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
              Alert.alert('Permission refusée', 'Nous avons besoin de l\'accès à vos photos !');
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
      Alert.alert('Erreur', 'Une erreur est survenue lors de la prise de photo');
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
      Alert.alert('Erreur', 'Une erreur est survenue lors de la sélection d\'image');
    }
  };

  const handleImageResult = async (result: ImagePicker.ImagePickerResult) => {
    if (!result.canceled && result.assets[0]) {
      try {
        setIsUploading(true);
        if (ENV.USE_MOCKS) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          await updateUser({ avatar: result.assets[0].uri });
          refetch();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          // Implement real upload here
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (error) {
        Alert.alert('Erreur', 'Une erreur est survenue lors de l\'upload de l\'image');
      } finally {
        setIsUploading(false);
      }
    }
  };

  if (isLoading && !userProfile) {
    return <InlineLoading message="Chargement du profil..." />;
  }

  return (
    <MainScreenLayout title="Profile" showHeader={false} containerStyle={{ backgroundColor: '#FFF' }}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>ATHLÈTE</Text>
          <Text style={styles.headerSubtitle}>VOTRE LÉGENDE</Text>
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={(userProfile?.avatar || user?.avatar) ? { uri: userProfile?.avatar || user?.avatar } : require('../../assets/images/icon-avatar.png')}
              style={styles.avatar}
            />
            {/* <TouchableOpacity
              style={styles.editAvatarButton}
              onPress={pickImage}
              disabled={isUploading}
            >
              {isUploading ? (
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                  <Ionicons name="refresh" size={20} color="#000" />
                </Animated.View>
              ) : (
                <Ionicons name="camera" size={20} color="#000" />
              )}
            </TouchableOpacity> */}
          </View>

          <Text style={styles.userName}>
            {(userProfile?.firstname || user?.firstname || 'UTILISATEUR').toUpperCase()}
          </Text>
          <Text style={styles.userLastName}>
            {(userProfile?.lastname || user?.lastname || '').toUpperCase()}
          </Text>
          <Text style={styles.userEmail}>
            {userProfile?.email || user?.email || 'email@example.com'}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userProfile?.stats?.sessionsCreated || 0}</Text>
            <Text style={styles.statLabel}>SESSIONS</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userProfile?.stats?.sessionsParticipated || 0}</Text>
            <Text style={styles.statLabel}>MATCHS</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>PARAMÈTRES</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/privacy')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#000" />
              <Text style={styles.menuItemText}>CONFIDENTIALITÉ</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#CCC" />
          </TouchableOpacity>

          {/* Dev Menu */}
          {isDev && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 32 }]}>ZONE DÉVELOPPEUR</Text>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/dev-menu')}
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons name="code-slash-outline" size={24} color="#000" />
                  <Text style={styles.menuItemText}>MENU DEV</Text>
                </View>
                <Ionicons name="arrow-forward" size={20} color="#CCC" />
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={[styles.menuItem, styles.logoutButton]}
            onPress={handleSignOut}
          >
            <Text style={styles.logoutText}>SE DÉCONNECTER</Text>
            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.versionText}>VERSION 1.0.0 • SUE APP</Text>
        </View>

      </ScrollView>
    </MainScreenLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#FFF',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#000',
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 1,
    marginTop: 4,
  },

  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFF',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F5F5F5',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ACCENT_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#000',
    marginBottom: 4,
  },
  userLastName: {
    fontSize: 24,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#CCC', // Ghost effect
    marginBottom: 8,
    marginTop: -8,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },

  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#000',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },

  menuSection: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#999',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '800',
    fontStyle: 'italic',
    color: '#000',
  },

  logoutButton: {
    marginTop: 32,
    borderBottomWidth: 0,
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '800',
    fontStyle: 'italic',
    color: '#FF3B30',
  },

  footer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  versionText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#CCC',
  },
});