import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Text } from '../components/atoms';
import { InlineLoading } from '../components/OptimizedLoading';
import { BackScreenLayout } from '../components/ui/ScreenLayout';
import UserProfileModal from '../components/UserProfileModal';
import { useCancelFriendRequest, useSearchUsers, useSendFriendRequest } from '../services';

const ACCENT_COLOR = '#D4FC79'; // Electric Volt

export default function AddFriendScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [localSearchResults, setLocalSearchResults] = useState<any[]>([]);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: searchResults, isLoading, error, searchUsers } = useSearchUsers();
  const { sendFriendRequest, isLoading: isSendingRequest } = useSendFriendRequest();
  const { cancelFriendRequest, isLoading: isCancellingRequest } = useCancelFriendRequest();

  // Mettre à jour les résultats locaux quand les résultats de l'API changent
  React.useEffect(() => {
    if (searchResults) {
      setLocalSearchResults(searchResults);
    }
  }, [searchResults]);

  // Fonction pour mettre à jour localement un utilisateur
  const updateLocalUser = (userId: string, updates: any) => {
    setLocalSearchResults(prev =>
      prev.map(user =>
        user.id === userId ? { ...user, ...updates } : user
      )
    );
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setLocalSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      await searchUsers(query);
    } catch (error) {
      // Silent error
    } finally {
      setIsSearching(false);
    }
  };

  // Recherche automatique avec debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setLocalSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleAddFriend = async (userId: string, userName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await sendFriendRequest(userId);
      updateLocalUser(userId, {
        hasPendingRequest: true,
        relationshipStatus: 'pending'
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      if (error.message && error.message.includes('existe déjà')) {
        Alert.alert(
          'Déjà demandé',
          'Patience, l\'athlète n\'a pas encore répondu.',
          [
            { text: 'OK', style: 'default' },
            {
              text: 'Annuler la demande',
              style: 'destructive',
              onPress: () => handleCancelFriend(userId, userName)
            }
          ]
        );
      } else {
        Alert.alert('Erreur', 'Impossible d\'envoyer la demande');
      }
    }
  };

  const handleCancelFriend = async (userId: string, userName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await cancelFriendRequest(userId);
      updateLocalUser(userId, {
        hasPendingRequest: false,
        relationshipStatus: 'cancelled'
      });
    } catch (error: any) {
      Alert.alert('Erreur', 'Impossible d\'annuler la demande');
    }
  };

  const renderSearchResult = ({ item, index }: { item: any; index: number }) => {
    const displayName = `${item.firstname || ''} ${item.lastname || ''}`.trim() || item.email || 'Athlète';

    // Déterminer le bouton à afficher selon le statut de la relation
    const getButtonContent = () => {
      if (item.isFriend) {
        return { icon: 'checkmark', color: '#000', bgColor: ACCENT_COLOR, disabled: true };
      } else if (item.hasPendingRequest && item.relationshipStatus !== 'cancelled') {
        return { icon: 'close', color: '#FF3B30', bgColor: '#FFF0F0', action: 'cancel', disabled: false };
      } else {
        return { icon: 'add', color: '#FFF', bgColor: '#000', action: 'add', disabled: false };
      }
    };

    const buttonContent = getButtonContent();
    const isButtonDisabled = buttonContent.disabled || isSendingRequest || isCancellingRequest;

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 50).springify()}
        style={styles.resultCard}
      >
        <TouchableOpacity
          style={styles.resultInfo}
          onPress={() => {
            Haptics.selectionAsync();
            setSelectedUser(item);
            setIsProfileModalVisible(true);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.avatarContainer}>
            <Image
              source={item.avatar ? { uri: item.avatar } : require('../assets/images/icon-avatar.png')}
              style={styles.avatar}
            />
          </View>
          <View>
            <Text style={styles.resultName}>{displayName.toUpperCase()}</Text>
            <Text style={styles.resultEmail}>{item.email}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: buttonContent.bgColor }]}
          onPress={() => {
            if (!isButtonDisabled && buttonContent.action) {
              if (buttonContent.action === 'add') {
                handleAddFriend(item.id, displayName);
              } else if (buttonContent.action === 'cancel') {
                handleCancelFriend(item.id, displayName);
              }
            }
          }}
          disabled={isButtonDisabled && !buttonContent.action}
        >
          <Ionicons
            name={buttonContent.icon as any}
            size={24}
            color={buttonContent.color}
          />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <BackScreenLayout title="RECRUTER" scrollable={false} horizontalPadding="md" containerStyle={{ backgroundColor: '#FFF' }}>

      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.mainTitle}>RECRUTER</Text>
        <Text style={styles.subtitle}>AGRANDISSEZ VOTRE SQUAD</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#000" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="NOM OU EMAIL..."
          placeholderTextColor="#999"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#CCC" />
          </TouchableOpacity>
        )}
      </View>

      {/* Results */}
      <View style={styles.resultsContainer}>
        {isSearching ? (
          <InlineLoading message="RECHERCHE..." />
        ) : searchQuery && searchQuery.trim().length >= 2 ? (
          <FlatList
            data={localSearchResults}
            renderItem={renderSearchResult}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>AUCUN RÉSULTAT</Text>
                <Text style={styles.emptySubtitle}>ESSAYEZ UN AUTRE NOM</Text>
              </View>
            }
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#EEE" style={{ marginBottom: 16 }} />
            <Text style={styles.emptyTitle}>CONSTRUISEZ VOTRE ÉQUIPE</Text>
            <Text style={styles.emptySubtitle}>CHERCHEZ VOS FUTURS COÉQUIPIERS</Text>
          </View>
        )}
      </View>

      {/* Modal de profil utilisateur */}
      <UserProfileModal
        visible={isProfileModalVisible}
        onClose={() => setIsProfileModalVisible(false)}
        userId={selectedUser?.id}
        userFirstname={selectedUser?.firstname}
        userLastname={selectedUser?.lastname}
      />
    </BackScreenLayout>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    marginBottom: 24,
    marginTop: 16,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#000',
    letterSpacing: -1,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
    marginTop: 8,
    letterSpacing: 0.5,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 24,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    height: '100%',
  },

  resultsContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 40,
  },

  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  resultInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
  },
  resultName: {
    fontSize: 16,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#000',
  },
  resultEmail: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },

  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#CCC',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});