import { BrandColors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import UserProfileModal from '../components/UserProfileModal';
import { useCancelFriendRequest, useSearchUsers, useSendFriendRequest } from '../services';

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
      Alert.alert('Erreur', 'Impossible de rechercher des utilisateurs');
    } finally {
      setIsSearching(false);
    }
  };

  // Recherche automatique avec debounce
  useEffect(() => {
    // Annuler la recherche précédente si elle existe
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Si la requête est vide ou moins de 2 caractères, vider les résultats immédiatement
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setLocalSearchResults([]);
      return;
    }

    // Programmer une nouvelle recherche avec un délai de 300ms
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    // Cleanup function
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleAddFriend = async (userId: string, userName: string) => {
    try {
      await sendFriendRequest(userId);

      // Mettre à jour localement le statut de l'utilisateur
      updateLocalUser(userId, {
        hasPendingRequest: true,
        relationshipStatus: 'pending'
      });

      // Pas de rechargement de la liste - mise à jour locale uniquement
    } catch (error: any) {

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
              onPress: () => handleCancelFriend(userId, userName)
            }
          ]
        );
      } else {
        Alert.alert('Erreur', error.message || 'Impossible d\'envoyer la demande d\'ami');
      }
    }
  };

  const handleCancelFriend = async (userId: string, userName: string) => {
    try {
      await cancelFriendRequest(userId);

      // Mettre à jour localement le statut de l'utilisateur
      updateLocalUser(userId, {
        hasPendingRequest: false,
        relationshipStatus: 'cancelled'
      });

      // Pas de rechargement de la liste - mise à jour locale uniquement
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible d\'annuler la demande d\'ami');
    }
  };

  const renderSearchResult = ({ item }: { item: any }) => {
    const displayName = `${item.firstname || ''} ${item.lastname || ''}`.trim() || item.email || 'Utilisateur';
    const mutualFriendsText = item.mutualFriends > 0
      ? `${item.mutualFriends} ami${item.mutualFriends > 1 ? 's' : ''} en commun`
      : '';

    // Déterminer le bouton à afficher selon le statut de la relation
    const getButtonContent = () => {
      if (item.isFriend) {
        return { icon: 'checkmark-circle', color: '#34C759', text: 'Ami', action: null };
      } else if (item.hasPendingRequest && item.relationshipStatus !== 'cancelled') {
        return { icon: 'close-circle', color: BrandColors.primary, text: 'Annuler', action: 'cancel' };
      } else {
        return { icon: 'person-add', color: BrandColors.primary, text: 'Ajouter', action: 'add' };
      }
    };

    const buttonContent = getButtonContent();
    const isButtonDisabled = item.isFriend || isSendingRequest || isCancellingRequest;

    return (
      <View style={styles.searchResultItem}>
        <TouchableOpacity
          style={styles.searchResultInfo}
          onPress={() => {
            setSelectedUser(item);
            setIsProfileModalVisible(true);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.nameContainer}>
            <Text style={styles.searchResultName}>
              {displayName}
            </Text>
            {mutualFriendsText ? (
              <Text style={styles.mutualFriendsInline}>
                • {mutualFriendsText}
              </Text>
            ) : null}
          </View>
          <Text style={styles.searchResultEmail}>{item.email}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addFriendButton}
          onPress={() => {
            if (!isButtonDisabled) {
              if (buttonContent.action === 'add') {
                handleAddFriend(item.id, displayName);
              } else if (buttonContent.action === 'cancel') {
                handleCancelFriend(item.id, displayName);
              }
            }
          }}
          disabled={isButtonDisabled}
        >
          <Ionicons
            name={buttonContent.icon as any}
            size={20}
            color={isButtonDisabled ? "#ccc" : buttonContent.color}
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajouter un ami</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        {/* Titre */}
        <View style={styles.titleContainer}>
          <Text style={styles.mainTitle}>Trouver des amis</Text>
          <Text style={styles.subtitle}>
            Recherchez vos amis pour les inviter à rejoindre vos sessions sportives
          </Text>
        </View>

        {/* Recherche */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rechercher</Text>
          <View style={styles.searchContainer}>
            <View style={styles.inputContainer}>
              <Ionicons name="search" size={20} color="#666" />
              <TextInput
                style={styles.input}
                placeholder="Nom ou adresse email..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>

        {/* Résultats de recherche */}
        {searchQuery && searchQuery.trim().length >= 2 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Résultats</Text>
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Erreur: {error}</Text>
              </View>
            ) : searchResults && searchResults.length > 0 ? (
              <FlatList
                data={localSearchResults}
                renderItem={renderSearchResult}
                keyExtractor={(item) => item.id}
                style={styles.searchResultsList}
              />
            ) : searchQuery && !isLoading ? (
              <View style={styles.emptyResultsContainer}>
                <Text style={styles.emptyResultsText}>
                  Aucun utilisateur trouvé
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Instructions */}
        {(!searchQuery || searchQuery.trim().length < 2) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Comment ça marche ?</Text>
            <View style={styles.instructionsContainer}>
              <View style={styles.instructionItem}>
                <View style={styles.instructionIcon}>
                  <Ionicons name="search" size={24} color={BrandColors.primary} />
                </View>
                <View style={styles.instructionContent}>
                  <Text style={styles.instructionTitle}>1. Recherchez</Text>
                  <Text style={styles.instructionText}>
                    Entrez le nom complet ou l&apos;email de votre ami
                  </Text>
                </View>
              </View>

              <View style={styles.instructionItem}>
                <View style={styles.instructionIcon}>
                  <Ionicons name="mail" size={24} color={BrandColors.primary} />
                </View>
                <View style={styles.instructionContent}>
                  <Text style={styles.instructionTitle}>2. Invitez</Text>
                  <Text style={styles.instructionText}>
                    Une invitation sera envoyée à votre ami
                  </Text>
                </View>
              </View>

              <View style={styles.instructionItem}>
                <View style={styles.instructionIcon}>
                  <Ionicons name="people" size={24} color={BrandColors.primary} />
                </View>
                <View style={styles.instructionContent}>
                  <Text style={styles.instructionTitle}>3. Connectez-vous</Text>
                  <Text style={styles.instructionText}>
                    Une fois acceptée, vous pourrez l&apos;inviter à vos sessions
                  </Text>
                </View>
              </View>
            </View>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 47 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  headerRight: {
    width: 40, // Pour équilibrer avec le bouton retour
  },
  content: {
    flex: 1,
    padding: 16,
  },
  titleContainer: {
    marginBottom: 32,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  searchContainer: {
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
  },
  searchResultsList: {
    maxHeight: 300,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  searchResultInfo: {
    flex: 1,
    paddingVertical: 4,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
  },
  mutualFriendsInline: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  searchResultEmail: {
    fontSize: 14,
    color: '#666',
  },
  mutualFriendsText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  addFriendButton: {
    padding: 8,
  },
  emptyResultsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyResultsText: {
    color: '#666',
    fontSize: 16,
  },
  instructionsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  instructionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  instructionContent: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  searchButton: {
    backgroundColor: BrandColors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  searchButtonDisabled: {
    backgroundColor: '#ccc',
  },
  searchButtonText: {
    color: BrandColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
}); 