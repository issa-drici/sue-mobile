import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

import { InlineLoading } from '../../components/OptimizedLoading';
import { MainScreenLayout } from '../../components/ui/ScreenLayout';
import UserProfileModal from '../../components/UserProfileModal';
import { useGetFriendRequests, useGetFriends, useRemoveFriend, useRespondToFriendRequest } from '../../services';
import { Friend } from '../../types/user';

const ACCENT_COLOR = '#D4FC79'; // Electric Volt

export default function FriendsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: friends, isLoading: friendsLoading, refetch: refetchFriends } = useGetFriends();
  const { data: friendRequests, isLoading: requestsLoading, refetch: refetchRequests } = useGetFriendRequests();
  const { respondToFriendRequest, isLoading: isResponding } = useRespondToFriendRequest();
  const { removeFriend, isLoading: isRemoving } = useRemoveFriend();

  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Promise.all([refetchFriends(), refetchRequests()]);
    setRefreshing(false);
  };

  const handleFriendPress = (friend: Friend) => {
    Haptics.selectionAsync();
    setSelectedFriend(friend);
    setIsProfileModalVisible(true);
  };

  const handleFriendLongPress = (friend: Friend) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedFriend(friend);
    setIsMenuVisible(true);
  };

  const handleRespondToRequest = async (requestId: string, response: 'accept' | 'decline') => {
    Haptics.selectionAsync();
    try {
      await respondToFriendRequest(requestId, response);
      await Promise.all([refetchRequests(), refetchFriends()]);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de traiter la demande');
    }
  };

  const handleRemoveFriend = async () => {
    if (!selectedFriend) return;

    Alert.alert(
      'Supprimer l\'athlète',
      `Retirer ${selectedFriend.firstname} de votre squad ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFriend(selectedFriend.id);
              refetchFriends();
              setIsMenuVisible(false);
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer l\'ami');
            }
          }
        }
      ]
    );
  };

  const renderRequestItem = ({ item, index }: { item: any; index: number }) => {
    const user = item.sender || item.fromUser || item;
    return (
      <Animated.View
        entering={FadeInRight.delay(index * 100).springify()}
        style={styles.requestCard}
      >
        <View style={styles.requestInfo}>
          <Image
            source={user.avatar ? { uri: user.avatar } : require('../../assets/images/icon-avatar.png')}
            style={styles.requestAvatar}
          />
          <View>
            <Text style={styles.requestName}>{user.firstname} {user.lastname}</Text>
            <Text style={styles.requestSubtitle}>Veut rejoindre ton squad</Text>
          </View>
        </View>
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleRespondToRequest(item.id, 'accept')}
            disabled={isResponding}
          >
            <Ionicons name="checkmark" size={20} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.declineButton]}
            onPress={() => handleRespondToRequest(item.id, 'decline')}
            disabled={isResponding}
          >
            <Ionicons name="close" size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const renderFriendItem = ({ item, index }: { item: Friend; index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
    >
      <TouchableOpacity
        style={styles.friendItem}
        onPress={() => handleFriendPress(item)}
        onLongPress={() => handleFriendLongPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.friendAvatarContainer}>
          <Image
            source={item.avatar ? { uri: item.avatar } : require('../../assets/images/icon-avatar.png')}
            style={styles.friendAvatar}
          />
          <View style={styles.statusDot} />
        </View>
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{item.firstname.toUpperCase()}</Text>
          <Text style={styles.friendLastName}>{item.lastname.toUpperCase()}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#CCC" />
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <MainScreenLayout title="Friends" showHeader={false} containerStyle={{ backgroundColor: '#FFF' }}>
      {/* Custom Header */}
      <View style={[styles.header, Platform.OS === 'android' && { paddingTop: Math.max(insets.top, 20) }]}>
        <View>
          <Text style={styles.headerTitle}>ATHLÈTES</Text>
          <Text style={styles.headerSubtitle}>TON SQUAD ({friends?.length || 0})</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/add-friend')}
        >
          <Ionicons name="person-add" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={friends}
        renderItem={renderFriendItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          Platform.OS === 'android' && { paddingBottom: Math.max(insets.bottom, 100) + 60 }
        ]}
        ListHeaderComponent={
          friendRequests && friendRequests.length > 0 ? (
            <View style={styles.requestsSection}>
              <Text style={styles.sectionTitle}>DEMANDES ({friendRequests.length})</Text>
              {friendRequests.map((req, index) => (
                <View key={req.id}>{renderRequestItem({ item: req, index })}</View>
              ))}
            </View>
          ) : null
        }
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          !friendsLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>SQUAD VIDE</Text>
              <Text style={styles.emptySubtitle}>INVITE TES POTES POUR COMMENCER</Text>
            </View>
          ) : (
            <InlineLoading message="Chargement..." />
          )
        }
      />

      {/* Menu Modal */}
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
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>
              {selectedFriend?.firstname} {selectedFriend?.lastname}
            </Text>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleRemoveFriend}
            >
              <Text style={styles.menuItemTextDestructive}>Retirer du squad</Text>
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <UserProfileModal
        visible={isProfileModalVisible}
        onClose={() => setIsProfileModalVisible(false)}
        userId={selectedFriend?.id}
        userFirstname={selectedFriend?.firstname}
        userLastname={selectedFriend?.lastname}
      />
    </MainScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ACCENT_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },

  listContent: {
    padding: 24,
    paddingBottom: 100,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#666',
    marginBottom: 16,
    letterSpacing: 0.5,
  },

  // Requests
  requestsSection: {
    marginBottom: 32,
  },
  requestCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    marginBottom: 12,
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  requestAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#EEE',
  },
  requestName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
  },
  requestSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: ACCENT_COLOR,
  },
  declineButton: {
    backgroundColor: '#EEE',
  },

  // Friends List
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  friendAvatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  friendAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F5F5F5',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: ACCENT_COLOR,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#000',
    lineHeight: 20,
  },
  friendLastName: {
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#CCC', // Ghost effect for last name
    lineHeight: 20,
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#CCC',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    width: '80%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FFF0F0',
    width: '100%',
    justifyContent: 'center',
  },
  menuItemTextDestructive: {
    color: '#FF3B30',
    fontWeight: '700',
    fontSize: 14,
  },
});