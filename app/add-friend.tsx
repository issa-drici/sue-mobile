import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Platform,
  SectionList,
  Share,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../components/atoms';
import { InlineLoading } from '../components/OptimizedLoading';
import { MainScreenLayout } from '../components/ui/ScreenLayout';
import UserProfileModal from '../components/UserProfileModal';
import { useCancelFriendRequest, useSearchUsers, useSendFriendRequest } from '../services';
import { UsersApi } from '../services/api/usersApi';
import { contactsService, NormalizedContact } from '../services/friends/contactsService';

const ACCENT_COLOR = '#D4FC79'; // Electric Volt

interface SectionData {
  title: string;
  data: any[];
  type: 'sue_users' | 'contacts';
}

export default function AddFriendScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Contacts state
  const [contactsOnSue, setContactsOnSue] = useState<any[]>([]); // Using any for efficiency, ideally should match UsersApi struct
  const [contactsToInvite, setContactsToInvite] = useState<NormalizedContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const searchTimeoutRef = useRef<any>(null);

  // Utiliser une seule instance du hook pour partager l'état
  const { data: hookSearchResults, searchUsers, isLoading: isSearchingUsers } = useSearchUsers();
  const { sendFriendRequest, isLoading: isSendingRequest } = useSendFriendRequest();
  const { cancelFriendRequest, isLoading: isCancellingRequest } = useCancelFriendRequest();

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    // Recherche en arrière-plan sans bloquer l'UI
    try {
      await searchUsers(query);
    } catch (error) {
      // Silent error - on garde les résultats précédents
    }
  };

  // Sync local search results with hook data when searching
  // Mise à jour silencieuse sans démonter la liste
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      // Mettre à jour les résultats seulement si on a de nouveaux résultats
      if (hookSearchResults && hookSearchResults.length >= 0) {
        setSearchResults(hookSearchResults);
      }
    } else {
      setSearchResults([]);
    }
  }, [hookSearchResults, searchQuery]);


  // Recherche automatique avec debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
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

  // Load contacts on mount
  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoadingContacts(true);
      console.log('🔄 [loadContacts] Début du chargement des contacts...');

      const localContacts = await contactsService.getAllContacts();
      console.log('📱 [loadContacts] Contacts locaux récupérés:', localContacts.length);

      const phoneNumbers = localContacts
        .flatMap(c => c.phoneNumbers)
        .filter((p): p is string => !!p);
      console.log('📞 [loadContacts] Numéros de téléphone extraits:', phoneNumbers.length);

      if (phoneNumbers.length === 0) {
        console.log('⚠️ [loadContacts] Aucun numéro de téléphone trouvé, affichage des contacts à inviter uniquement');
        setContactsToInvite(localContacts);
        return;
      }

      console.log('🚀 [loadContacts] Appel API checkContacts avec', phoneNumbers.length, 'numéros');
      const response = await UsersApi.checkContacts(phoneNumbers);
      console.log('📥 [loadContacts] Réponse API brute:', JSON.stringify(response, null, 2));

      // Gérer différentes structures de réponse API
      // La réponse peut être response.found, response.data, ou directement un tableau
      let allResults: any[] = [];
      if (Array.isArray(response)) {
        console.log('✅ [loadContacts] Réponse est un tableau direct');
        allResults = response;
      } else if (response?.found && Array.isArray(response.found)) {
        console.log('✅ [loadContacts] Réponse dans response.found');
        allResults = response.found;
      } else if (response?.data && Array.isArray(response.data)) {
        console.log('✅ [loadContacts] Réponse dans response.data');
        allResults = response.data;
      } else {
        console.warn('⚠️ [loadContacts] Format de réponse inattendu:', response);
      }

      console.log('📊 [loadContacts] Total résultats API:', allResults.length);

      // Filtrer uniquement les utilisateurs enregistrés (avec user ou isRegistered: true)
      // La réponse peut contenir tous les numéros (enregistrés et non enregistrés)
      const foundUsers = allResults.filter((item: any) => {
        // Un utilisateur est enregistré s'il a user OU isRegistered: true
        const isRegistered = (item.isRegistered === true || item.user) && item.user;
        if (!isRegistered) {
          console.log('❌ [loadContacts] Item filtré (non enregistré):', item);
        }
        return isRegistered;
      });
      console.log('👥 [loadContacts] Utilisateurs trouvés sur Sue:', foundUsers.length);

      // Fonction pour normaliser un numéro de téléphone pour la comparaison
      const normalizePhoneForComparison = (phone: string): string => {
        if (!phone) return '';
        // Retirer tous les caractères non numériques sauf +
        let cleaned = phone.replace(/[^0-9+]/g, '');
        // Normaliser les numéros français commençant par 0
        if (cleaned.startsWith('0') && cleaned.length === 10) {
          cleaned = '+33' + cleaned.substring(1);
        }
        // Ajouter + si le numéro commence par 33 et fait 11 caractères
        if (cleaned.startsWith('33') && cleaned.length === 11 && !cleaned.startsWith('+')) {
          cleaned = '+' + cleaned;
        }
        return cleaned.toLowerCase();
      };

      // Créer une map pour associer les numéros normalisés aux contacts locaux
      const phoneToContactMap = new Map<string, NormalizedContact>();
      localContacts.forEach(contact => {
        contact.phoneNumbers?.forEach(phone => {
          const normalized = normalizePhoneForComparison(phone);
          if (normalized && !phoneToContactMap.has(normalized)) {
            phoneToContactMap.set(normalized, contact);
          }
        });
      });

      // Extraire les numéros de téléphone des utilisateurs trouvés sur Sue
      const registeredPhoneNumbers = new Set<string>();
      foundUsers.forEach((item: any) => {
        const phone = item.phoneNumber || item.user?.phoneNumber;
        if (phone) {
          const normalized = normalizePhoneForComparison(phone);
          if (normalized) {
            registeredPhoneNumbers.add(normalized);
          }
        }
      });

      // Enrichir les utilisateurs trouvés avec les informations du contact local
      const enrichedFoundUsers = foundUsers.map((item: any) => {
        const phone = item.phoneNumber || item.user?.phoneNumber;
        const normalized = phone ? normalizePhoneForComparison(phone) : '';
        const localContact = normalized ? phoneToContactMap.get(normalized) : null;

        return {
          ...item,
          localContact: localContact || null, // Ajouter le contact local correspondant
        };
      });

      // Filtrer les contacts locaux pour exclure ceux déjà sur Sue
      const contactsNotOnSue = localContacts.filter(contact => {
        // Si le contact n'a pas de numéros, on le garde
        if (!contact.phoneNumbers || contact.phoneNumbers.length === 0) {
          return true;
        }

        // Vérifier si au moins un numéro du contact correspond à un utilisateur enregistré
        const hasRegisteredNumber = contact.phoneNumbers.some(phone => {
          const normalizedLocal = normalizePhoneForComparison(phone);
          if (!normalizedLocal) {
            return false;
          }
          return registeredPhoneNumbers.has(normalizedLocal);
        });

        return !hasRegisteredNumber;
      });

      console.log('✅ [loadContacts] Contacts sur Sue:', enrichedFoundUsers.length);
      console.log('✅ [loadContacts] Contacts à inviter:', contactsNotOnSue.length);
      
      setContactsOnSue(enrichedFoundUsers);
      setContactsToInvite(contactsNotOnSue);
      
      console.log('✅ [loadContacts] État mis à jour avec succès');
    } catch (error) {
      console.error('❌ [loadContacts] Erreur lors du chargement:', error);
      console.error('❌ [loadContacts] Stack:', error instanceof Error ? error.stack : 'N/A');
      // Afficher les contacts locaux même en cas d'erreur API
      try {
        const localContacts = await contactsService.getAllContacts();
        setContactsToInvite(localContacts);
        console.log('✅ [loadContacts] Contacts locaux affichés malgré l\'erreur API');
      } catch (localError) {
        console.error('❌ [loadContacts] Impossible de charger les contacts locaux:', localError);
      }
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleInvite = async (phone: string) => {
    try {
      const message = encodeURIComponent('Utilisons Sue pour organiser nos sessions de sport. C\'est rapide, simple et ça nous fait gagner du temps. https://sue-app.fr');
      const smsUrl = `sms:${phone}?body=${message}`;
      
      const canOpen = await Linking.canOpenURL(smsUrl);
      if (canOpen) {
        await Linking.openURL(smsUrl);
      } else {
        // Alternative : utiliser Share API si le lien SMS ne fonctionne pas
        await Share.share({
          message: 'Utilisons Sue pour organiser nos sessions de sport. C\'est rapide, simple et ça nous fait gagner du temps. https://sue-app.fr',
        });
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ouvrir l\'application SMS. Vous pouvez copier le message et l\'envoyer manuellement.');
    }
  };

  // Mettre à jour l'état d'un contact dans la liste sans recharger
  const updateContactStatus = (userId: string, updates: { hasPendingRequest?: boolean; isFriend?: boolean }) => {
    // Mettre à jour dans contactsOnSue
    setContactsOnSue(prevContacts =>
      prevContacts.map(item => {
        const user = item.user || item;
        const itemUserId = item.user?.id || user.id || item.id;

        if (itemUserId === userId) {
          return {
            ...item,
            user: {
              ...user,
              relationship: {
                ...user.relationship,
                hasPendingRequest: updates.hasPendingRequest !== undefined
                  ? updates.hasPendingRequest
                  : user.relationship?.hasPendingRequest,
                isFriend: updates.isFriend !== undefined
                  ? updates.isFriend
                  : user.relationship?.isFriend,
              },
              hasPendingRequest: updates.hasPendingRequest !== undefined
                ? updates.hasPendingRequest
                : user.hasPendingRequest,
              isFriend: updates.isFriend !== undefined
                ? updates.isFriend
                : user.isFriend,
            },
          };
        }
        return item;
      })
    );

    // Mettre à jour aussi dans searchResults si l'utilisateur y est présent
    setSearchResults(prevResults =>
      prevResults.map(item => {
        const user = item.user || item;
        const itemUserId = item.user?.id || user.id || item.id;

        if (itemUserId === userId) {
          return {
            ...item,
            user: {
              ...user,
              relationship: {
                ...user.relationship,
                hasPendingRequest: updates.hasPendingRequest !== undefined
                  ? updates.hasPendingRequest
                  : user.relationship?.hasPendingRequest,
                isFriend: updates.isFriend !== undefined
                  ? updates.isFriend
                  : user.relationship?.isFriend,
              },
              hasPendingRequest: updates.hasPendingRequest !== undefined
                ? updates.hasPendingRequest
                : user.hasPendingRequest,
              isFriend: updates.isFriend !== undefined
                ? updates.isFriend
                : user.isFriend,
            },
          };
        }
        return item;
      })
    );
  };

  const handleAddFriend = async (userId: string, userName: string) => {
    if (!userId || userId.trim() === '') {
      Alert.alert('Erreur', 'ID utilisateur invalide');
      return;
    }

    // Mise à jour optimiste
    updateContactStatus(userId, { hasPendingRequest: true });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await sendFriendRequest(userId);
      Alert.alert('Succès', `Demande envoyée à ${userName}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      // Annuler la mise à jour optimiste en cas d'erreur
      updateContactStatus(userId, { hasPendingRequest: false });
      Alert.alert('Erreur', error.message || 'Impossible d\'envoyer la demande');
    }
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'Rejoins-moi sur Sue pour organiser nos sessions de sport ! Télécharge l\'app ici : https://sue-app.fr',
        title: 'Rejoins nous sur SUE',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCancelFriend = async (userId: string, userName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Annuler la demande',
      `Voulez-vous annuler la demande d'ami envoyée à ${userName} ?`,
      [
        {
          text: 'Non',
          style: 'cancel',
        },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            // Mise à jour optimiste
            updateContactStatus(userId, { hasPendingRequest: false });

            try {
              await cancelFriendRequest(userId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Succès', 'Demande d\'ami annulée');
            } catch (error: any) {
              // Annuler la mise à jour optimiste en cas d'erreur
              updateContactStatus(userId, { hasPendingRequest: true });
              Alert.alert('Erreur', error.message || 'Impossible d\'annuler la demande');
            }
          },
        },
      ]
    );
  };



  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  const renderItem = ({ item, section }: { item: any, section: SectionData }) => {
    if (section.type === 'sue_users') {
      // C'est un utilisateur SUE (soit recherche, soit contact inscrit)
      const user = item.user || item; // Gérer structure param
      const isFriend = user.relationship?.isFriend || user.isFriend;
      const hasPending = user.relationship?.hasPendingRequest || user.hasPendingRequest;

      // Pour les contacts trouvés depuis les contacts locaux, utiliser le nom du contact local
      // Sinon, utiliser le nom de l'utilisateur Sue (pour les résultats de recherche)
      const contactName = item.localContact?.name;
      const displayName = contactName || (user.firstname ? `${user.firstname} ${user.lastname}` : (user.name || user.email || 'Athlète'));

      // Afficher le nom/prénom de l'utilisateur Sue à la place de "Utilisateur SUE"
      const userDisplayName = user.firstname && user.lastname
        ? `${user.firstname} ${user.lastname}`.trim()
        : (user.firstname || user.lastname || user.name || 'Utilisateur SUE');

      // Extraire l'ID de l'utilisateur de manière robuste
      // Priorité: item.user.id (structure API) > user.id > item.id
      const userId = item.user?.id || user.id || item.id;

      return (
        <TouchableOpacity
          style={styles.resultCard}
          onPress={() => {
            setSelectedUser(user);
            setIsProfileModalVisible(true);
          }}
        >
          <View style={styles.resultInfo}>
            <Image
              source={user.avatar ? { uri: user.avatar } : require('../assets/images/icon-avatar.png')}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.resultName}>{displayName.toUpperCase()}</Text>
              <Text style={styles.resultEmail}>{userDisplayName}</Text>
            </View>
          </View>

          {isFriend && (
            <Ionicons name="checkmark-circle" size={24} color={ACCENT_COLOR} />
          )}
          {!isFriend && hasPending && userId && (
            <TouchableOpacity
              style={styles.pendingButton}
              onPress={(e) => {
                e.stopPropagation();
                handleCancelFriend(userId, displayName);
              }}
            >
              <Ionicons name="time-outline" size={24} color="#999" />
            </TouchableOpacity>
          )}
          {!isFriend && !hasPending && userId && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={(e) => {
                e.stopPropagation();
                handleAddFriend(userId, displayName);
              }}
            >
              <Ionicons name="add" size={24} color="#FFF" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      );
    } else {
      // Contact à inviter
      const name = item.name || 'Inconnu';
      const phone = item.phoneNumbers?.[0] || '';

      return (
        <View style={styles.resultCard}>
          <View style={styles.resultInfo}>
            <View style={[styles.avatar, styles.contactAvatar]}>
              <Text style={styles.contactInitials}>
                {name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.resultName}>{name.toUpperCase()}</Text>
              <Text style={styles.resultEmail}>{phone}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.inviteButton}
            onPress={() => handleInvite(phone)}
          >
            <Text style={styles.inviteText}>INVITER</Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  // Filtrer les contacts locaux selon la recherche (ceux sur Sue et ceux à inviter)
  const getFilteredContacts = () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      return { onSue: [], toInvite: [] };
    }

    const query = searchQuery.toLowerCase().trim();

    // Filtrer les contacts sur Sue
    const filteredContactsOnSue = contactsOnSue.filter(item => {
      const user = item.user || item;
      const contactName = item.localContact?.name || '';
      const userFirstName = user.firstname || '';
      const userLastName = user.lastname || '';
      const userEmail = user.email || '';
      const userDisplayName = user.firstname && user.lastname
        ? `${user.firstname} ${user.lastname}`.trim()
        : (user.firstname || user.lastname || user.name || '');

      // Rechercher dans le nom du contact local
      if (contactName.toLowerCase().includes(query)) {
        return true;
      }

      // Rechercher dans le prénom/nom de l'utilisateur Sue
      if (userFirstName.toLowerCase().includes(query) ||
        userLastName.toLowerCase().includes(query) ||
        userDisplayName.toLowerCase().includes(query)) {
        return true;
      }

      // Rechercher dans l'email
      if (userEmail.toLowerCase().includes(query)) {
        return true;
      }

      return false;
    }).sort((a, b) => {
      // Trier par nom du contact local, sinon par prénom/nom utilisateur
      const nameA = a.localContact?.name ||
        (a.user?.firstname && a.user?.lastname ? `${a.user.firstname} ${a.user.lastname}`.trim() :
          a.user?.firstname || a.user?.lastname || a.user?.name || '');
      const nameB = b.localContact?.name ||
        (b.user?.firstname && b.user?.lastname ? `${b.user.firstname} ${b.user.lastname}`.trim() :
          b.user?.firstname || b.user?.lastname || b.user?.name || '');
      return nameA.toLowerCase().localeCompare(nameB.toLowerCase(), 'fr', { sensitivity: 'base' });
    });

    // Filtrer les contacts à inviter (pas sur Sue)
    const filteredContactsToInvite = contactsToInvite.filter(contact => {
      const contactName = contact.name || '';
      const phoneNumbers = contact.phoneNumbers || [];

      // Rechercher dans le nom du contact
      if (contactName.toLowerCase().includes(query)) {
        return true;
      }

      // Rechercher dans les numéros de téléphone
      if (phoneNumbers.some(phone => phone.toLowerCase().includes(query))) {
        return true;
      }

      return false;
    }).sort((a, b) => {
      // Trier par nom du contact
      const nameA = (a.name || '').toLowerCase().trim();
      const nameB = (b.name || '').toLowerCase().trim();
      return nameA.localeCompare(nameB, 'fr', { sensitivity: 'base' });
    });

    return { onSue: filteredContactsOnSue, toInvite: filteredContactsToInvite };
  };

  // Préparer les données pour la SectionList
  let sections: SectionData[] = [];

  if (searchQuery.trim().length >= 2) {
    // Mode recherche : afficher d'abord les contacts locaux correspondants, puis les résultats backend
    const { onSue: filteredContactsOnSue, toInvite: filteredContactsToInvite } = getFilteredContacts();

    // Récupérer les IDs des contacts locaux sur Sue pour filtrer les résultats backend
    const contactUserIds = new Set(
      filteredContactsOnSue.map(item => {
        const user = item.user || item;
        return item.user?.id || user.id || item.id;
      }).filter((id): id is string => !!id)
    );

    // Filtrer les résultats backend pour exclure ceux déjà dans les contacts locaux
    const filteredBackendResults = searchResults.filter((item: any) => {
      const user = item.user || item;
      const userId = item.user?.id || user.id || item.id;
      const isInContacts = userId && contactUserIds.has(userId);

      if (isInContacts) {
        console.log('🔍 [sections] Résultat backend filtré (déjà dans contacts):', userId);
      }

      return !isInContacts;
    });

    console.log('📋 [sections] searchQuery:', searchQuery);
    console.log('📋 [sections] filteredContactsOnSue.length:', filteredContactsOnSue.length);
    console.log('📋 [sections] filteredContactsToInvite.length:', filteredContactsToInvite.length);
    console.log('📋 [sections] searchResults.length (brut):', searchResults.length);
    console.log('📋 [sections] filteredBackendResults.length (filtré):', filteredBackendResults.length);

    // Afficher les contacts sur Sue
    if (filteredContactsOnSue.length > 0) {
      console.log('✅ [sections] Ajout section MES CONTACTS (sur Sue) avec', filteredContactsOnSue.length, 'contacts');
      sections.push({ title: 'MES CONTACTS', data: filteredContactsOnSue, type: 'sue_users' });
    }

    // Afficher les contacts à inviter (pas sur Sue)
    if (filteredContactsToInvite.length > 0) {
      console.log('✅ [sections] Ajout section MES CONTACTS (à inviter) avec', filteredContactsToInvite.length, 'contacts');
      sections.push({ title: 'MES CONTACTS', data: filteredContactsToInvite, type: 'contacts' });
    }

    // Afficher les résultats backend
    if (filteredBackendResults.length > 0) {
      console.log('✅ [sections] Ajout section RÉSULTATS DE RECHERCHE avec', filteredBackendResults.length, 'résultats');
      sections.push({ title: 'RÉSULTATS DE RECHERCHE', data: filteredBackendResults, type: 'sue_users' });
    } else {
      console.log('⚠️ [sections] Aucun résultat de recherche backend à afficher (filtré ou vide)');
      if (searchResults.length > 0) {
        console.log('⚠️ [sections] Tous les résultats backend ont été filtrés car présents dans les contacts');
      }
    }
  } else {
    // Mode "suggestions" (contact list)
    if (loadingContacts) {
      // On pourrait afficher un loader via ListEmptyComponent ou autre, 
      // mais ici on laisse vide le temps de charger pour ne pas bloquer l'UI
    } else {
      // Trier les contacts sur Sue par ordre alphabétique
      const sortedContactsOnSue = [...contactsOnSue].sort((a, b) => {
        const nameA = a.localContact?.name ||
          (a.user?.firstname && a.user?.lastname ? `${a.user.firstname} ${a.user.lastname}`.trim() :
            a.user?.firstname || a.user?.lastname || a.user?.name || '');
        const nameB = b.localContact?.name ||
          (b.user?.firstname && b.user?.lastname ? `${b.user.firstname} ${b.user.lastname}`.trim() :
            b.user?.firstname || b.user?.lastname || b.user?.name || '');
        return nameA.toLowerCase().localeCompare(nameB.toLowerCase(), 'fr', { sensitivity: 'base' });
      });

      // Trier les contacts à inviter par ordre alphabétique
      const sortedContactsToInvite = [...contactsToInvite].sort((a, b) => {
        const nameA = (a.name || '').toLowerCase().trim();
        const nameB = (b.name || '').toLowerCase().trim();
        return nameA.localeCompare(nameB, 'fr', { sensitivity: 'base' });
      });

      if (sortedContactsOnSue.length > 0) {
        sections.push({ title: 'SUR SUE', data: sortedContactsOnSue, type: 'sue_users' });
      }
      if (sortedContactsToInvite.length > 0) {
        sections.push({ title: 'INVITEZ VOS CONTACTS', data: sortedContactsToInvite, type: 'contacts' });
      }
    }
  }

  return (
    <MainScreenLayout title="RECRUTER" showHeader={false} containerStyle={{ backgroundColor: '#FFF' }}>

      {/* Header */}
      <View style={[styles.header, Platform.OS === 'android' && { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.mainTitle}>RECRUTER</Text>
          <Text style={styles.subtitle}>AGRANDISSEZ VOTRE SQUAD</Text>
        </View>
        <TouchableOpacity onPress={handleShareApp} style={styles.shareButton}>
          <Ionicons name="share-outline" size={28} color="#000" />
        </TouchableOpacity>
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

      {/* Find Friends Button */}


      {/* Results */}
      <View style={styles.resultsContainer}>
        {loadingContacts ? (
          <InlineLoading message="CHARGEMENT CONTACTS..." />
        ) : sections.length > 0 ? (
          <SectionList
            sections={sections}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            keyExtractor={(item, index) => {
              // Utiliser un key stable pour éviter le démontage/remontage
              if (item.id) return item.id;
              if (item.user?.id) return item.user.id;
              if (item.phoneNumbers?.[0]) {
                return `contact-${item.phoneNumbers[0]}`;
              }
              return `item-${index}`;
            }}
            contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom, 40) }]}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color="#EEE" style={{ marginBottom: 16 }} />
            <Text style={styles.emptyTitle}>CHERCHER UN AMI</Text>
            <Text style={styles.emptySubtitle}>TAPEZ SON NOM OU EMAIL</Text>
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
    </MainScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 4,
    width: 40,
  },
  shareButton: {
    padding: 4,
    width: 40,
    alignItems: 'flex-end',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
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
    margin: 24,
    marginBottom: 12,
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
  sectionHeader: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#FFF',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#999',
    letterSpacing: 1,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingHorizontal: 24,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  resultInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    marginRight: 16,
  },
  contactAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEE',
  },
  contactInitials: {
    fontSize: 18,
    fontWeight: '700',
    color: '#666',
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
  },
  inviteText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
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
  findFriendsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4FC79',
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#D4FC79",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  findFriendsContent: {
    flex: 1,
    marginLeft: 16,
  },
  findFriendsTitle: {
    fontSize: 14,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#000',
  },
  findFriendsSubtitle: {
    fontSize: 12,
    color: '#000',
    opacity: 0.7,
  },
});