import { BrandColors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import PullToRefresh from '../../components/PullToRefresh';
import UserProfileModal from '../../components/UserProfileModal';
import { usePullToRefresh } from '../../hooks';
import { useGetFriendRequests, useGetFriends, useRemoveFriend, useRespondToFriendRequest } from '../../services';
import { Friend } from '../../types/user';

const FriendItem = ({ friend, onProfilePress, onMenuPress }: { 
  friend: Friend; 
  onProfilePress: () => void;
  onMenuPress: () => void;
}) => {
  // Vérification de sécurité
  if (!friend) {
    return null;
  }

  return (
    <View style={styles.friendItem}>
      <TouchableOpacity 
        style={styles.friendInfo}
        onPress={onProfilePress}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {friend.firstname?.[0] || ''}{friend.lastname?.[0] || ''}
            </Text>
          </View>

        </View>
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>
            {friend.firstname || ''} {friend.lastname || ''}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={onMenuPress}
      >
        <Ionicons name="ellipsis-horizontal" size={24} color="#666" />
      </TouchableOpacity>
    </View>
  );
};

export default function FriendsScreen() {
  console.log(`🎬 [FriendsScreen] Composant rendu/re-rendu`);
  
  const router = useRouter();

  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);

  console.log(`🎣 [FriendsScreen] Appel de useGetFriends`);
  const { data: friends, isLoading: friendsLoading, error: friendsError, refetch: refetchFriends } = useGetFriends();
  console.log(`📊 [FriendsScreen] Données reçues de useGetFriends:`, {
    friends: friends?.length || 0,
    isLoading: friendsLoading,
    error: friendsError
  });
  const { data: friendRequests, isLoading: requestsLoading, error: requestsError, refetch } = useGetFriendRequests();
  const { respondToFriendRequest, isLoading: isResponding } = useRespondToFriendRequest();
  const { removeFriend, isLoading: isRemoving } = useRemoveFriend();

  // Hooks pour le pull-to-refresh avec délai minimum
  const { refreshing: friendsRefreshing, onRefresh: onFriendsRefresh } = usePullToRefresh({
    onRefresh: refetchFriends,
    minDelay: 1000,
    onError: (error) => {
      console.error('❌ Erreur lors du rafraîchissement des amis:', error);
    }
  });

  const { refreshing: requestsRefreshing, onRefresh: onRequestsRefresh } = usePullToRefresh({
    onRefresh: refetch,
    minDelay: 1000,
    onError: (error) => {
      console.error('❌ Erreur lors du rafraîchissement des demandes:', error);
    }
  });

  const handleFriendProfilePress = (friend: Friend) => {
    setSelectedFriend(friend);
    setIsProfileModalVisible(true);
  };

  const handleFriendMenuPress = (friend: Friend) => {
    setSelectedFriend(friend);
    setIsMenuVisible(true);
  };

  const handleMenuAction = async (action: 'message' | 'invite' | 'remove') => {
    if (!selectedFriend) return;

    switch (action) {
      case 'message':
        // Navigation vers la conversation
        break;
      case 'invite':
        // Ouvrir modal d'invitation à une session
        break;
      case 'remove':
        Alert.alert(
          'Supprimer l\'ami',
          `Êtes-vous sûr de vouloir supprimer ${selectedFriend.firstname} ${selectedFriend.lastname} de vos amis ?`,
          [
            {
              text: 'Annuler',
              style: 'cancel',
            },
            {
              text: 'Supprimer',
              style: 'destructive',
              onPress: async () => {
                try {
                  await removeFriend(selectedFriend.id);

                  // Recharger la liste des amis
                  refetchFriends();

                } catch (error: any) {
                  Alert.alert(
                    'Erreur',
                    error.message || 'Impossible de supprimer l\'ami'
                  );
                }
              },
            },
          ]
        );
        break;
    }
    setIsMenuVisible(false);
  };

  const handleRespondToRequest = async (requestId: string, response: 'accept' | 'decline') => {
    try {
      await respondToFriendRequest(requestId, response);
      refetch(); // Recharger les demandes
      // Si on accepte, recharger aussi la liste des amis avec un petit délai
      if (response === 'accept') {
        setTimeout(() => {
          refetchFriends();
          console.log('✅ [FriendsScreen] Liste des amis rechargée après acceptation');
        }, 500); // Délai de 500ms pour laisser le temps au backend de se mettre à jour
      }
      // Pas d'alerte de succès - l'interface se met à jour automatiquement
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de traiter la demande');
    }
  };

  const renderFriendItem = ({ item }: { item: any }) => {
    // Vérification de sécurité
    if (!item) {
      return null;
    }

    return (
      <FriendItem
        friend={item}
        onProfilePress={() => handleFriendProfilePress(item)}
        onMenuPress={() => handleFriendMenuPress(item)}
      />
    );
  };

  const renderRequestItem = ({ item }: { item: any }) => {
    // Gestion des données selon la structure réelle de l'API
    const hasSenderData = item.sender && (item.sender.firstname || item.sender.lastname);
    const hasFromUserData = item.fromUser && (item.fromUser.firstname || item.fromUser.lastname);
    const hasDirectData = item.firstname || item.lastname;

    if (!hasSenderData && !hasFromUserData && !hasDirectData) {
      return null;
    }

    const displayName = hasSenderData
      ? `${item.sender.firstname || ''} ${item.sender.lastname || ''}`.trim()
      : hasFromUserData
        ? `${item.fromUser.firstname || ''} ${item.fromUser.lastname || ''}`.trim()
        : hasDirectData
          ? `${item.firstname || ''} ${item.lastname || ''}`.trim()
          : 'Utilisateur inconnu';

    const avatarUrl = item.sender?.avatar || item.fromUser?.avatar || item.avatar;
    const mutualFriends = item.mutualFriends || 0;
    
    // Déterminer l'ID de l'utilisateur pour la modal
    const userId = item.sender?.id || item.fromUser?.id || item.id;

    return (
      <View style={styles.requestCard}>
        <TouchableOpacity 
          style={styles.requestInfo}
          onPress={() => {
            // Créer un objet Friend temporaire pour la modal
            const tempFriend = {
              id: userId,
              firstname: hasSenderData ? item.sender.firstname : hasFromUserData ? item.fromUser.firstname : item.firstname,
              lastname: hasSenderData ? item.sender.lastname : hasFromUserData ? item.fromUser.lastname : item.lastname,
              avatar: avatarUrl,
              status: 'offline' as const
            };
            handleFriendProfilePress(tempFriend);
          }}
          activeOpacity={0.7}
        >
          <Image
            source={avatarUrl ? { uri: avatarUrl } : require('../../assets/images/icon-avatar.png')}
            style={[styles.requestAvatar, { borderWidth: 1, borderColor: '#e0e0e0' }]}
          />
          <View style={styles.requestFriendInfo}>
            <Text style={styles.requestFriendName}>
              {displayName}
            </Text>
            {mutualFriends > 0 && (
              <Text style={styles.requestMutualFriends}>
                {mutualFriends} ami{mutualFriends > 1 ? 's' : ''} en commun
              </Text>
            )}
          </View>
        </TouchableOpacity>
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={[styles.requestButton, styles.acceptButton]}
            onPress={() => handleRespondToRequest(item.id, 'accept')}
            disabled={isResponding}
          >
            <Text style={styles.acceptButtonText}>
              {isResponding ? '...' : 'Accepter'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.requestButton, styles.declineButton]}
            onPress={() => handleRespondToRequest(item.id, 'decline')}
            disabled={isResponding}
          >
            <Text style={styles.declineButtonText}>
              {isResponding ? '...' : 'Refuser'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };



  if (friendsError || requestsError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Mes Amis</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={{ color: 'red' }}>
            Erreur: {friendsError || requestsError}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Mes Amis</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/add-friend')}
        >
          <Ionicons name="person-add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Ajouter</Text>
        </TouchableOpacity>
      </View>



      <FlatList
        data={[
          // Section des demandes d'amis
          ...(friendRequests.length > 0 ? [{
            type: 'section',
            title: 'Demandes d\'amis',
            data: friendRequests
          }] : []),
          // Section des amis
          {
            type: 'section',
            title: 'Mes amis',
            data: friends
          }
        ]}
        renderItem={({ item }) => {
          if (item.type === 'section') {
            return (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>{item.title}</Text>
                {item.data.map((friendOrRequest: any, index: number) => (
                  <View key={friendOrRequest.id || index}>
                    {item.title === 'Demandes d\'amis' ? 
                      renderRequestItem({ item: friendOrRequest }) : 
                      renderFriendItem({ item: friendOrRequest })
                    }
                  </View>
                ))}
              </View>
            );
          }
          return null;
        }}
        keyExtractor={(item, index) => `section-${index}`}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#666" />
            <Text style={styles.emptyText}>
              Aucun ami trouvé
            </Text>
          </View>
        }
        refreshControl={
          <PullToRefresh
            refreshing={friendsRefreshing || requestsRefreshing}
            onRefresh={() => {
              onFriendsRefresh();
              onRequestsRefresh();
            }}
          />
        }
      />

      {/* Modal pour les actions sur les amis */}
      <Modal
        visible={isMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsMenuVisible(false)}
        >
          <View style={styles.modalContent}>
            {/* <TouchableOpacity
              style={styles.modalItem}
              onPress={() => handleMenuAction('message')}
            >
              <Ionicons name="chatbubble-outline" size={24} color={BrandColors.primary} />
              <Text style={styles.modalItemText}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => handleMenuAction('invite')}
            >
              <Ionicons name="calendar-outline" size={24} color={BrandColors.primary} />
              <Text style={styles.modalItemText}>Inviter à une session</Text>
            </TouchableOpacity> */}
            <TouchableOpacity
              style={[
                styles.modalItem,
                isRemoving && styles.modalItemDisabled
              ]}
              onPress={() => handleMenuAction('remove')}
              disabled={isRemoving}
            >
              {isRemoving ? (
                <>
                  <Ionicons name="refresh" size={24} color="#FF3B30" style={{ transform: [{ rotate: '360deg' }] }} />
                  <Text style={[styles.modalItemText, { color: '#FF3B30' }]}>Suppression...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="person-remove-outline" size={24} color="#FF3B30" />
                  <Text style={[styles.modalItemText, { color: '#FF3B30' }]}>Supprimer</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de profil utilisateur */}
      <UserProfileModal
        visible={isProfileModalVisible}
        onClose={() => setIsProfileModalVisible(false)}
        userId={selectedFriend?.id}
        userFirstname={selectedFriend?.firstname}
        userLastname={selectedFriend?.lastname}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    color: BrandColors.white,
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: BrandColors.primary,
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: BrandColors.primary,
    fontWeight: '600',
  },
  tabTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badge: {
    backgroundColor: BrandColors.primary,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: BrandColors.white,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },

  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  requestFriendInfo: {
    flex: 1,
  },
  requestFriendName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  requestMutualFriends: {
    fontSize: 14,
    color: '#666',
  },
  requestActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  requestButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: BrandColors.primary,
  },
  declineButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  acceptButtonText: {
    color: BrandColors.white,
    fontWeight: '600',
  },
  declineButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '80%',
    maxWidth: 320,
    overflow: 'hidden',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  modalItemText: {
    fontSize: 16,
    marginLeft: 12,
    color: BrandColors.primary,
  },
  menuButton: {
    padding: 8,
    marginLeft: 8,
  },
  modalItemDisabled: {
    opacity: 0.7,
  },
}); 