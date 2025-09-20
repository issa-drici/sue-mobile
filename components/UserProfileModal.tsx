import { BrandColors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import {
    Alert,
    Image,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../app/context/auth';
import { useCancelFriendRequest, useGetUserById, useSendFriendRequest } from '../services';

interface UserProfileModalProps {
  visible: boolean;
  onClose: () => void;
  userId?: string;
  userFirstname?: string;
  userLastname?: string;
}

export default function UserProfileModal({
  visible,
  onClose,
  userId,
  userFirstname,
  userLastname,
}: UserProfileModalProps) {
  const { data: userProfile, fetchUserById, isLoading } = useGetUserById();
  const { sendFriendRequest, isLoading: isSendingRequest } = useSendFriendRequest();
  const { cancelFriendRequest, isLoading: isCancellingRequest } = useCancelFriendRequest();
  const { user: currentUser } = useAuth(); // Récupérer l'utilisateur connecté
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);

  // Charger les données de l'utilisateur quand le modal devient visible
  useEffect(() => {
    console.log('🔍 [UserProfileModal] useEffect - visible:', visible, 'userId:', userId);
    if (visible && userId) {
      console.log('📡 [UserProfileModal] Appel fetchUserById avec userId:', userId);
      setIsInitialLoad(true);
      fetchUserById(userId);
    }
  }, [visible, userId, fetchUserById]);

  // Log pour debug
  useEffect(() => {
    console.log('🔍 [UserProfileModal] userProfile changé:', userProfile);
    // Marquer que le chargement initial est terminé
    if (userProfile && isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [userProfile, isInitialLoad]);

  const handleAddFriend = async () => {
    if (!userId) {
      console.error('❌ [UserProfileModal] userId manquant pour l\'envoi de demande d\'ami');
      Alert.alert('Erreur', 'ID utilisateur manquant');
      return;
    }

    // Vérifier que l'utilisateur ne s'ajoute pas lui-même
    if (currentUser && currentUser.id === userId) {
      console.error('❌ [UserProfileModal] Tentative d\'ajout de soi-même comme ami');
      Alert.alert('Erreur', 'Vous ne pouvez pas vous ajouter vous-même comme ami');
      return;
    }

    console.log('📡 [UserProfileModal] Tentative d\'envoi de demande d\'ami pour userId:', userId);

    try {
      await sendFriendRequest(userId);
      // Rafraîchir les données du profil pour mettre à jour le bouton
      console.log('🔄 [UserProfileModal] Rafraîchissement du profil après ajout d\'ami');
      await fetchUserById(userId);
    } catch (error: any) {
      console.error('❌ [UserProfileModal] Erreur lors de l\'envoi de demande d\'ami:', error);
      
      // Gestion spécifique de l'erreur 409 (demande déjà existante)
      if (error.message && error.message.includes('existe déjà')) {
        Alert.alert(
          'Demande existante',
          'Une demande d\'ami existe déjà pour cet utilisateur. Veuillez attendre une réponse ou annuler la demande existante.',
          [
            { text: 'OK', style: 'default' },
            {
              text: 'Annuler la demande existante',
              style: 'destructive',
              onPress: () => handleCancelFriend()
            }
          ]
        );
      } else {
        // Extraire le message d'erreur de manière plus robuste
        let errorMessage = 'Impossible d\'envoyer la demande d\'ami';
        
        if (error.message) {
          errorMessage = error.message;
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.data?.error?.message) {
          errorMessage = error.response.data.error.message;
        }
        
        Alert.alert('Erreur', errorMessage);
      }
    }
  };

  const handleCancelFriend = async () => {
    if (!userId) {
      console.error('❌ [UserProfileModal] userId manquant pour l\'annulation de demande d\'ami');
      Alert.alert('Erreur', 'ID utilisateur manquant');
      return;
    }

    console.log('📡 [UserProfileModal] Tentative d\'annulation de demande d\'ami pour userId:', userId);

    try {
      await cancelFriendRequest(userId);
      // Rafraîchir les données du profil pour mettre à jour le bouton
      console.log('🔄 [UserProfileModal] Rafraîchissement du profil après annulation d\'ami');
      await fetchUserById(userId);
    } catch (error: any) {
      console.error('❌ [UserProfileModal] Erreur lors de l\'annulation de demande d\'ami:', error);
      
      // Extraire le message d'erreur de manière plus robuste
      let errorMessage = 'Impossible d\'annuler la demande d\'ami';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      }
      
      Alert.alert('Erreur', errorMessage);
    }
  };

  const handleNavigateToSession = (sessionId: string) => {
    // Navigation vers la session (à implémenter si nécessaire)
    console.log('Navigation vers la session:', sessionId);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profil utilisateur</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {isLoading && isInitialLoad ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Chargement...</Text>
            </View>
          ) : userProfile ? (
            <>
                             {/* Avatar et informations principales */}
               <View style={styles.profileHeader}>
                 <Image
                   source={require('../assets/images/icon-avatar.png')}
                   style={styles.avatar}
                 />
                                   <View style={styles.profileInfo}>
                    <Text style={styles.userName}>
                      {userProfile.firstname} {userProfile.lastname}
                    </Text>
                  </View>
               </View>

               {/* Statistiques */}
               <View style={styles.statsContainer}>
                 <View style={styles.statItem}>
                   <Text style={styles.statNumber}>{userProfile.stats?.sessionsCreated || 0}</Text>
                   <Text style={styles.statLabel}>Sessions créées</Text>
                 </View>
                 <View style={styles.statItem}>
                   <Text style={styles.statNumber}>{userProfile.stats?.sessionsParticipated || 0}</Text>
                   <Text style={styles.statLabel}>Participations</Text>
                 </View>
               </View>

              {/* Bouton Ajouter/Annuler ami */}
              {userProfile.isAlreadyFriend ? (
                <View style={styles.alreadyFriendContainer}>
                  <Ionicons name="checkmark-circle" size={24} color="#34C759" />
                  <Text style={styles.alreadyFriendText}>Déjà dans vos amis</Text>
                </View>
              ) : userProfile.hasPendingRequest ? (
                <TouchableOpacity
                  style={[styles.addFriendButton, styles.cancelButton]}
                  onPress={handleCancelFriend}
                  disabled={isCancellingRequest}
                >
                  <Ionicons name="close-circle" size={20} color="#fff" />
                  <Text style={styles.addFriendButtonText}>
                    Annuler la demande
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.addFriendButton}
                  onPress={handleAddFriend}
                  disabled={isSendingRequest}
                >
                  <Ionicons name="person-add" size={20} color="#fff" />
                  <Text style={styles.addFriendButtonText}>
                    Ajouter comme ami
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
              <Text style={styles.errorTitle}>Erreur de chargement</Text>
              <Text style={styles.errorMessage}>
                Impossible de charger le profil de {userFirstname} {userLastname}
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },

  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: BrandColors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  sportsList: {
    gap: 8,
  },
  sportItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  sportName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  sportLevel: {
    fontSize: 14,
    color: '#666',
  },
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  sessionDate: {
    fontSize: 14,
    color: '#666',
  },
  alreadyFriendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  alreadyFriendText: {
    fontSize: 16,
    color: '#34C759',
    fontWeight: '500',
    marginLeft: 8,
  },
  addFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.primary,
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  addFriendButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});
