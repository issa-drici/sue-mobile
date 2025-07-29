import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Alert, Animated, Easing, Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ENV } from '../../config/env';
import { useGetUserProfile, useUpdateUser } from '../../services';
import { useAuth } from '../context/auth';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { data: userProfile, isLoading, error, refetch } = useGetUserProfile();
  const { updateUser, isLoading: isUpdating } = useUpdateUser();

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
    try {
      await signOut();
      router.replace('/login');
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de la déconnexion');
    }
  };

  const pickImage = async () => {
    Alert.alert(
      "Changer la photo de profil",
      "Choisir la source",
      [
        {
          text: "Annuler",
          style: "cancel"
        },
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
      // Gestion silencieuse des erreurs
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
          // En mode mock, on simule juste la mise à jour
          await new Promise(resolve => setTimeout(resolve, 1000));
          await updateUser({ avatar: result.assets[0].uri });
          refetch(); // Recharger le profil
          Alert.alert('Succès', 'Photo de profil mise à jour !');
        } else {
          // En mode API réel, on upload vers le serveur
          const formData = new FormData();
          formData.append('avatar', {
            uri: result.assets[0].uri,
            type: 'image/jpeg',
            name: 'avatar.jpg'
          } as any);

          // TODO: Implémenter l'upload vers ton API
          // const response = await axios.post('/api/profile/avatar', formData, {
          //   headers: { 'Content-Type': 'multipart/form-data' }
          // });

          Alert.alert('Succès', 'Photo de profil mise à jour !');
        }
      } catch (error) {
        Alert.alert('Erreur', 'Une erreur est survenue lors de l\'upload de l\'image');
      } finally {
        setTimeout(() => {
          setIsUploading(false);
        }, 500);
      }
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Profil</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Profil</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={{ color: 'red' }}>Erreur: {error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Profil</Text>
        </View>

        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            <Image
              source={(userProfile?.avatar || user?.avatar) ? { uri: userProfile?.avatar || user?.avatar } : require('../../assets/images/icon-avatar.png')}
              style={[styles.avatar, { borderWidth: 1, borderColor: '#e0e0e0' }]}
            />
            {/* <TouchableOpacity
              style={styles.editAvatarButton}
              onPress={pickImage}
              disabled={isUploading}
            >
              {isUploading ? (
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                  <Ionicons name="refresh" size={16} color="#fff" />
                </Animated.View>
              ) : (
                <Ionicons name="pencil" size={16} color="#fff" />
              )}
            </TouchableOpacity> */}
          </View>
          <Text style={styles.name}>
            {userProfile?.firstname || user?.firstname || 'Utilisateur'} {userProfile?.lastname || user?.lastname || 'Test'}
          </Text>
          <Text style={styles.email}>{userProfile?.email || user?.email || 'email@example.com'}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{userProfile?.stats?.sessionsCreated || 0}</Text>
            <Text style={styles.statLabel}>Sessions créées</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{userProfile?.stats?.sessionsParticipated || 0}</Text>
            <Text style={styles.statLabel}>Participations</Text>
          </View>
          {/* <View style={styles.statCard}>
            <Text style={styles.statValue}>{userProfile?.stats?.favoriteSport || 'Aucun'}</Text>
            <Text style={styles.statLabel}>Sport favori</Text>
          </View> */}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paramètres</Text>

          {/* <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="person-outline" size={24} color="#666" />
            <Text style={styles.menuItemText}>Modifier le profil</Text>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity> */}

          {/* <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="notifications-outline" size={24} color="#666" />
            <Text style={styles.menuItemText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity> */}

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/privacy')}>
            <Ionicons name="shield-outline" size={24} color="#666" />
            <Text style={styles.menuItemText}>Confidentialité</Text>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>

          {/* <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="help-circle-outline" size={24} color="#666" />
            <Text style={styles.menuItemText}>Aide</Text>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity> */}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  userInfo: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 