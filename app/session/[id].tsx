import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Dimensions,
  Image,
  Linking,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as Contacts from 'expo-contacts';
import ChatComments from '../../components/ChatComments';
import NotificationPermissionSheet from '../../components/NotificationPermissionSheet';
import PullToRefresh from '../../components/PullToRefresh';
import { MainScreenLayout } from '../../components/ui/ScreenLayout';
import UserProfileModal from '../../components/UserProfileModal';
import { ENV } from '../../config/env';
import { BrandColors } from '../../constants/Colors';
import { usePullToRefresh } from '../../hooks';
import { useComments } from '../../hooks/useComments';
import {
  useCancelParticipation,
  useCancelSession,
  useGetFriends,
  useGetSessionById,
  useInviteFriends,
  useRespondToInvitation
} from '../../services';
import { contactsService, NormalizedContact } from '../../services/friends/contactsService';
import { pushNotificationService } from '../../services/notifications/pushNotifications';
import { useGetUserProfile } from '../../services/users/getUserProfile';
import { getSportEmoji } from '../../utils';
import { formatDate } from '../../utils/dateHelpers';
import { isSessionFinished } from '../../utils/timeHelpers';
import { useAuth } from '../context/auth';

const { width } = Dimensions.get('window');

// Config des sports pour les icônes et couleurs correspondantes (identique à l'accueil)
const SPORT_CONFIGS: Record<string, { icon: string; color: string }> = {
  football: { icon: 'football-sharp', color: '#70A831' }, // Vert sport
  tennis: { icon: 'tennisball-sharp', color: '#F59223' }, // Orange tennis
  golf: { icon: 'flag-sharp', color: '#5E40DC' }, // Violet golf
  basketball: { icon: 'basketball-sharp', color: '#E65100' },
  volleyball: { icon: 'football-outline', color: '#0288D1' },
  running: { icon: 'walk-sharp', color: '#00796B' },
};

const getSportConfig = (sportName: string) => {
  const normalized = (sportName || '').toLowerCase();
  return SPORT_CONFIGS[normalized] || { icon: 'trophy-sharp', color: '#616161' };
};

export default function SessionDetailsScreen() {
  const { id, source, openComments, openInvite } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const sessionId = typeof id === 'string' ? id : '';
  const scrollViewRef = useRef<ScrollView>(null);
  const inviteScrollRef = useRef<ScrollView>(null);

  // State
  const [showComments, setShowComments] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUserFirstname, setSelectedUserFirstname] = useState<string>('');
  const [selectedUserLastname, setSelectedUserLastname] = useState<string>('');
  const [selectedUserStatus, setSelectedUserStatus] = useState<string>('');
  const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  
  // Contacts states
  const [localContacts, setLocalContacts] = useState<NormalizedContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [inviteSearchQuery, setInviteSearchQuery] = useState('');
  const [showPermissionIntro, setShowPermissionIntro] = useState(false);
  const [contactsPermissionStatus, setContactsPermissionStatus] = useState<string>('checking');
  const [isFriendsExpanded, setIsFriendsExpanded] = useState(false);

  // Hooks
  const { data: profile, isLoading: isLoadingProfile } = useGetUserProfile();
  const { data: session, error, isLoading, getSessionById } = useGetSessionById();
  const { data: friends, isLoading: isLoadingFriends } = useGetFriends();
  const { inviteFriends } = useInviteFriends();
  const { respondToInvitation, isLoading: isResponding } = useRespondToInvitation();
  const { cancelParticipation, isLoading: isCancelling } = useCancelParticipation();
  const { cancelSession } = useCancelSession();

  // Demande "soft" de notifications : affichée une fois, après que l'utilisateur
  // participe à une session (typiquement juste après le flow de join).
  const [showNotifSheet, setShowNotifSheet] = useState(false);
  const notifPromptCheckedRef = useRef(false);

  useEffect(() => {
    if (notifPromptCheckedRef.current) return;
    if (!session || !user) return;

    // L'utilisateur doit participer (statut accepté) à cette session
    const isAcceptedParticipant = session.participants?.some(
      (p: any) => p.id === user.id && p.status === 'accepted'
    );
    if (!isAcceptedParticipant) return;

    // On ne vérifie qu'une fois par montage
    notifPromptCheckedRef.current = true;

    // Gating (déjà accepté/refusé, token existant, déjà traité) délégué au service
    pushNotificationService.shouldShowSoftPrompt().then((should) => {
      if (should) setShowNotifSheet(true);
    });
  }, [session, user]);

  // Comments
  const {
    comments,
    reloadComments
  } = useComments(sessionId);

  const loadLocalContacts = async () => {
    try {
      setLoadingContacts(true);
      const { status } = await Contacts.getPermissionsAsync();
      if (status === 'granted') {
        const contacts = await contactsService.getAllContacts();
        const sorted = [...contacts].sort((a, b) => a.name.localeCompare(b.name));
        setLocalContacts(sorted);
      } else {
        setLocalContacts([]);
      }
    } catch (err) {
      console.log('Error loading contacts:', err);
      setLocalContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  };

  const getSportDetails = (sportKey: string) => {
    const key = (sportKey || '').toLowerCase().trim();
    const SPORT_PRESETS: Record<string, { label: string; emoji: string; color: string }> = {
      football: { label: 'Football', emoji: '⚽', color: '#EAF6DD' },
      tennis: { label: 'Tennis', emoji: '🎾', color: '#FFF3E0' },
      golf: { label: 'Golf', emoji: '⛳', color: '#EDE7F6' },
      padel: { label: 'Padel', emoji: '🎾', color: '#FFF3E0' },
    };
    if (SPORT_PRESETS[key]) {
      return SPORT_PRESETS[key];
    }
    const label = (sportKey || '').charAt(0).toUpperCase() + (sportKey || '').slice(1);
    const emoji = getSportEmoji(sportKey || '');
    const pastelColors = ['#EAF6DD', '#FFF3E0', '#EDE7F6', '#FFE0B2', '#E0F2F1', '#E1F5FE', '#F3E5F5', '#E8F5E9', '#E0F7FA', '#D7CCC8'];
    const hash = key.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const color = pastelColors[hash % pastelColors.length];
    return { label, emoji, color };
  };

  const formatSessionDate = (dStr: string) => {
    try {
      const d = new Date(dStr);
      const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'short' };
      const parts = d.toLocaleDateString('fr-FR', options);
      return parts.charAt(0).toUpperCase() + parts.slice(1);
    } catch {
      return dStr;
    }
  };



  // Effects
  useFocusEffect(
    React.useCallback(() => {
      if (sessionId) getSessionById(sessionId);
    }, [sessionId, getSessionById])
  );

  React.useEffect(() => {
    if (openComments === 'true') setShowComments(true);
  }, [openComments]);

  React.useEffect(() => {
    if (openInvite === 'true') setIsInviteModalVisible(true);
  }, [openInvite]);

  React.useEffect(() => {
    if (inviteScrollRef.current) {
      inviteScrollRef.current.scrollTo({ y: 0, animated: true });
    }
  }, [inviteSearchQuery]);

  React.useEffect(() => {
    const checkContactsPermission = async () => {
      if (isInviteModalVisible) {
        try {
          const { status } = await Contacts.getPermissionsAsync();
          setContactsPermissionStatus(status);
          if (status === 'undetermined') {
            setShowPermissionIntro(true);
          } else {
            setShowPermissionIntro(false);
            loadLocalContacts();
          }
        } catch {
          setContactsPermissionStatus('denied');
          setShowPermissionIntro(false);
          loadLocalContacts();
        }
      } else {
        setInviteSearchQuery('');
        setShowPermissionIntro(false);
      }
    };
    checkContactsPermission();
  }, [isInviteModalVisible]);

  const handleRequestContactsPermission = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const { status: currentStatus } = await Contacts.getPermissionsAsync();
      if (currentStatus === 'denied') {
        if (Platform.OS === 'ios') {
          await Linking.openURL('app-settings:');
        } else {
          await Linking.openSettings();
        }
        return;
      }
      const { status } = await Contacts.requestPermissionsAsync();
      setContactsPermissionStatus(status);
    } catch (e) {
      console.log('Error requesting contacts permission:', e);
      setContactsPermissionStatus('denied');
    } finally {
      setShowPermissionIntro(false);
      loadLocalContacts();
    }
  };

  const handleSkipContactsPermission = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowPermissionIntro(false);
    loadLocalContacts();
  };

  // Pull to Refresh
  const { refreshing, onRefresh } = usePullToRefresh({
    onRefresh: async () => {
      await getSessionById(sessionId, false);
      await reloadComments();
    },
    minDelay: 800
  });

  // Logic
  const handleUserPress = (userId: string, firstname?: string, lastname?: string, status?: string) => {
    Haptics.selectionAsync();
    setSelectedUserId(userId);
    setSelectedUserFirstname(firstname || '');
    setSelectedUserLastname(lastname || '');
    setSelectedUserStatus(status || '');
    setShowUserProfile(true);
  };

  const getUserStatus = () => {
    if (!session || !user) return null;
    if (session.organizer.id === user.id) return 'organizer';
    const participant = session.participants.find(p => p.id === user.id);
    return participant ? participant.status : 'not_invited';
  };

  const userStatus = getUserStatus();
  const isOrganizer = userStatus === 'organizer';
  const isParticipant = ['accepted', 'declined', 'pending'].includes(userStatus || '');
  const canRespond = userStatus === 'pending';
  const canCancel = userStatus === 'accepted';
  const isFromHistory = source === 'history';

  const acceptedParticipants = session?.participants?.filter(p => p.status === 'accepted') || [];
  const pendingParticipants = session?.participants?.filter(p => p.status === 'pending' || !p.status) || [];
  const declinedParticipants = session?.participants?.filter(p => p.status === 'declined') || [];

  const maxParticipants = session?.maxParticipants;
  const isLimitReached = maxParticipants ? acceptedParticipants.length >= maxParticipants : false;
  const canActuallyRespond = canRespond && !isLimitReached;
  const missingCount = maxParticipants ? maxParticipants - acceptedParticipants.length : 0;

  // Formatage de l'heure en français (ex: "18:00 - 19:00")
  const formatSessionTimeRange = (start?: string, end?: string) => {
    const formatTime = (timeStr?: string) => {
      if (!timeStr) return '00:00';
      return timeStr.slice(0, 5);
    };
    return `${formatTime(start)} - ${formatTime(end)}`;
  };

  // Handlers
  const handleAccept = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await respondToInvitation(sessionId, 'accept');
      getSessionById(sessionId);
    } catch { Alert.alert('Erreur', "Impossible d'accepter"); }
  };

  const handleDecline = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Refuser', 'Sûr de vouloir refuser ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Refuser', style: 'destructive', onPress: async () => {
          try {
            await respondToInvitation(sessionId, 'decline');
            getSessionById(sessionId);
          } catch { Alert.alert('Erreur', "Impossible de refuser"); }
        }
      }
    ]);
  };

  const handleCancelPart = async () => {
    Alert.alert('Annuler', 'Annuler votre participation ?', [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Oui, annuler', style: 'destructive', onPress: async () => {
          try {
            await cancelParticipation(sessionId);
            getSessionById(sessionId);
          } catch { Alert.alert('Erreur', "Impossible d'annuler"); }
        }
      }
    ]);
  };

  const handleCancelSess = async () => {
    Alert.alert('Annuler Session', 'Action irréversible. Annuler la session ?', [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Oui, supprimer', style: 'destructive', onPress: async () => {
          try {
            await cancelSession(sessionId);
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)');
            }
          } catch { Alert.alert('Erreur', "Impossible d'annuler la session"); }
        }
      }
    ]);
  };

  const handleInvite = async () => {
    if (selectedFriends.length === 0) return;
    try {
      await inviteFriends(sessionId, selectedFriends);
      setIsInviteModalVisible(false);
      setSelectedFriends([]);
      getSessionById(sessionId);
    } catch { Alert.alert('Erreur', "Echec de l'envoi"); }
  };

  const toggleFriend = (id: string) => {
    Haptics.selectionAsync();
    setSelectedFriends(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  // Menu des options supplémentaires (Trois points ...)
  const handleMoreOptions = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const options: { text: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive' }[] = [];
    
    // Si l'organisateur veut modifier ou supprimer la session
    const isFinished = session?.date && session?.endTime ? isSessionFinished(session.date, session.endTime) : false;
    if (isOrganizer && !isFinished) {
      options.push({ text: 'Modifier la session', onPress: () => router.push(`/edit-session/${sessionId}`) });
      options.push({ text: 'Annuler la session', onPress: handleCancelSess, style: 'destructive' });
    }
    
    // Si simple participant veut quitter
    if (canCancel) {
      options.push({ text: 'Quitter le Squad', onPress: handleCancelPart, style: 'destructive' });
    }

    if (options.length === 0) {
      Alert.alert('Information', 'Aucune action disponible pour cette session.');
      return;
    }

    Alert.alert(
      '',
      undefined,
      [
        ...options.map(opt => ({ text: opt.text, onPress: opt.onPress, style: opt.style })),
        { text: 'Annuler', style: 'cancel' }
      ]
    );
  };

  const filteredFriends = React.useMemo(() => {
    if (!session || !friends) return [];
    return friends.filter(f => !session.participants.some(p => p.id === f.id && p.status !== 'declined'));
  }, [friends, session]);

  const searchFilteredFriends = React.useMemo(() => {
    return filteredFriends.filter(f => 
      `${f.firstname} ${f.lastname}`.toLowerCase().includes(inviteSearchQuery.toLowerCase())
    );
  }, [filteredFriends, inviteSearchQuery]);

  const searchFilteredLocalContacts = React.useMemo(() => {
    const friendNames = new Set(filteredFriends.map(f => `${f.firstname} ${f.lastname}`.toLowerCase().trim()));
    return localContacts.filter(c => {
      const nameMatch = c.name.toLowerCase().includes(inviteSearchQuery.toLowerCase());
      const isAlreadyFriend = friendNames.has(c.name.toLowerCase().trim());
      return nameMatch && !isAlreadyFriend;
    });
  }, [localContacts, inviteSearchQuery, filteredFriends]);

  const userPhase = React.useMemo(() => {
    const sessions = profile?.stats?.sessionsCreated || 0;
    const friendsCount = friends?.length || 0;

    // Phase 3: > 20 sessions OR > 30 friends on SUE
    if (sessions > 20 || friendsCount > 30) {
      return 3;
    }
    // Phase 2: 5 to 20 sessions OR 10 to 30 friends on SUE
    if ((sessions >= 5 && sessions <= 20) || (friendsCount >= 10 && friendsCount <= 30)) {
      return 2;
    }
    // Phase 1: 0 to 5 sessions OR < 10 friends on SUE
    return 1;
  }, [profile, friends]);

  const displayedFriends = React.useMemo(() => {
    return searchFilteredFriends;
  }, [searchFilteredFriends]);

  // Lien de partage (Universal Link). On privilégie le token opaque /join/{token} ;
  // repli sur l'ancien format si le token n'est pas encore disponible.
  // On ajoute ?from={monId} : celui qui rejoint via mon lien devient mon ami et je
  // suis affiché comme « la personne qui invite » sur l'aperçu.
  const sessionUrl = session?.shareToken
    ? `${ENV.WEB_BASE_URL}/join/${session.shareToken}${user?.id ? `?from=${user.id}` : ''}`
    : `${ENV.WEB_BASE_URL}/session/${sessionId}`;

  const formatButtonDate = (dStr: string) => {
    try {
      const d = new Date(dStr);
      const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
      return d.toLocaleDateString('fr-FR', options);
    } catch {
      return dStr;
    }
  };

  const renderFriendsSkeleton = () => {
    return (
      <View style={styles.inviteListSection}>
        <View style={styles.inviteListSectionHeader}>
          <Text style={styles.inviteListSectionTitle}>AMIS SUE</Text>
        </View>

        <View style={styles.inviteListCard}>
          {[1, 2, 3].map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.invitePlayerRow,
                idx < 2 && styles.borderBottomLight,
                { opacity: 0.6 }
              ]}
            >
              <View style={styles.invitePlayerLeft}>
                {/* Avatar Circle Skeleton */}
                <View style={[styles.invitePlayerAvatarPlaceholder, { backgroundColor: '#E0E0E0' }]} />
                <View style={styles.invitePlayerInfo}>
                  {/* Name text skeleton */}
                  <View style={{ width: 120, height: 16, backgroundColor: '#E0E0E0', borderRadius: 4 }} />
                </View>
              </View>
              {/* Checkbox circle skeleton */}
              <View style={[styles.inviteCheckbox, { backgroundColor: '#E0E0E0', borderColor: '#E0E0E0' }]} />
            </View>
          ))}
        </View>
      </View>
    );
  };

  const getInviteButtonText = () => {
    const count = selectedFriends.length;
    const sportName = session?.sport || 'sport';
    const dateStr = session?.date ? formatButtonDate(session.date) : '';
    
    const countText = `Inviter ${count} joueur${count > 1 ? 's' : ''}`;
    
    const key = sportName.toLowerCase().trim();
    const details = getSportDetails(key);
    const label = details.label;
    let sportPart = '';
    
    if (/^[aeiouyâêîôûäëïöüéèà]/i.test(label)) {
      sportPart = `à l'${label.toLowerCase()}`;
    } else {
      const feminineSports = [
        'course', 'randonnée', 'natation', 'danse', 'pétanque', 
        'gymnastique', 'boxe', 'marche-nordique', 'marche-sportive', 
        'musculation', 'pilates', 'planche-à-voile', 'ski', 'skateboard', 
        'snowboard', 'surf'
      ];
      if (feminineSports.includes(key)) {
        sportPart = `à la ${label.toLowerCase()}`;
      } else {
        sportPart = `au ${label.toLowerCase()}`;
      }
    }
    
    return `${countText} ${sportPart} du ${dateStr}`;
  };

  const shareWhatsApp = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const message = `Rejoins ma session de ${session?.sport || 'sport'} sur SUE ! ⚽️\n${sessionUrl}`;
    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Share.share({ message });
      }
    } catch {
      await Share.share({ message });
    }
  };

  const copyLink = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Clipboard.setString(sessionUrl);
    Alert.alert('Lien copié !', 'Le lien de la session a été copié dans ton presse-papiers.');
  };

  const shareGeneral = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const message = `Rejoins ma session de ${session?.sport || 'sport'} sur SUE ! ⚽\n${sessionUrl}`;
    await Share.share({ message });
  };

  const inviteContact = async (contactName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const message = `Salut ${contactName}, rejoins ma session de ${session?.sport || 'sport'} sur SUE ! ⚽\n${sessionUrl}`;
    await Share.share({ message });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    );
  }

  if (error || !session) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error || 'Session introuvable'}</Text>
      </SafeAreaView>
    );
  }



  // Rendu de chaque joueur dans la grille (Initials fallback déterministe)
  const renderPlayerItem = (player: any, status: 'accepted' | 'pending' | 'declined', index: number) => {
    const isUserOrganizer = player.id === session.organizer.id;
    const initials = `${(player.firstname || '').charAt(0)}${(player.lastname || '').charAt(0)}`.toUpperCase() || '?';
    const avatarBgColors = ['#E3F2FD', '#F3E5F5', '#E8F5E9', '#FFF3E0', '#FFEBEE'];
    const colorIdx = Math.abs((player.id || '').split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)) % avatarBgColors.length;
    const bgCol = avatarBgColors[colorIdx];

    return (
      <TouchableOpacity
        key={player.id || index}
        style={styles.playerCard}
        onPress={() => handleUserPress(player.id, player.firstname, player.lastname, player.status)}
      >
        <View style={styles.playerAvatarContainer}>
          {player.avatar ? (
            <Image source={{ uri: player.avatar }} style={styles.playerAvatarImage} />
          ) : (
            <View style={[styles.playerAvatarPlaceholder, { backgroundColor: bgCol }]}>
              <Text style={styles.playerAvatarPlaceholderText}>{initials}</Text>
            </View>
          )}

          {/* Badge Organisateur (Étoile) */}
          {isUserOrganizer ? (
            <View style={styles.organizerBadge}>
              <Ionicons name="star" size={7} color="#000" />
            </View>
          ) : null}

          {/* Badge Statut */}
          {status === 'accepted' ? (
            <View style={[styles.statusBadge, { backgroundColor: '#70A831' }]}>
              <Ionicons name="checkmark" size={8} color="#FFF" />
            </View>
          ) : null}
          {status === 'pending' ? (
            <View style={[styles.statusBadge, { backgroundColor: '#F59223' }]}>
              <Ionicons name="time" size={8} color="#FFF" />
            </View>
          ) : null}
          {status === 'declined' ? (
            <View style={[styles.statusBadge, { backgroundColor: '#D32F2F' }]}>
              <Ionicons name="close" size={8} color="#FFF" />
            </View>
          ) : null}
        </View>
        <Text style={styles.playerGridName} numberOfLines={1}>
          {player.firstname}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <MainScreenLayout title="Détails" showHeader={false} containerStyle={{ backgroundColor: '#FAFAFA', flex: 1 }}>

      {/* Header Premium avec alignement et centrage parfait sur la largeur de l'écran */}
      <View style={[styles.header, Platform.OS === 'android' && { paddingTop: Math.max(insets.top, 16) }]}>
        {/* Titre centré sur TOUTE la largeur de l'écran */}
        <Text style={styles.headerTitleAbsolute}>SESSION</Text>

        <TouchableOpacity 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)');
            }
          }} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        
        <View style={styles.headerRightContainer}>
          {/* Icône Discussion Vestiaire */}
          <TouchableOpacity 
            disabled={true} 
            onPress={() => setShowComments(true)} 
            style={[styles.headerChatButton, { opacity: 0.3 }]}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={24} color="#000" />
            {comments.length > 0 ? (
              <View style={styles.headerChatBadge}>
                <Text style={styles.headerChatBadgeText}>
                  {comments.length > 9 ? '9+' : comments.length}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>

          {/* Bouton Plus Options */}
          <TouchableOpacity onPress={handleMoreOptions} style={styles.headerMoreButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        refreshControl={<PullToRefresh refreshing={refreshing} onRefresh={onRefresh} color="#D4FC79" />}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainContainer}>
          
          {/* Titre Sport et Icône */}
          <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.sportTitleSection}>
            <View style={[styles.sportIconCircleLarge, { backgroundColor: getSportConfig(session.sport).color }]}>
              <Ionicons name={getSportConfig(session.sport).icon as any} size={30} color="#FFF" />
            </View>
            <Text style={styles.sportTitleText}>
              {session.sport.charAt(0).toUpperCase() + session.sport.slice(1)}
            </Text>
          </Animated.View>

          {/* Ligne des Détails de Session */}
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.detailsListBlock}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={16} color="#8E8E93" style={styles.detailIcon} />
              <Text style={styles.detailText}>
                {formatDate(session.date)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={16} color="#8E8E93" style={styles.detailIcon} />
              <Text style={styles.detailText}>
                {formatSessionTimeRange(session.startTime, session.endTime)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={16} color="#8E8E93" style={styles.detailIcon} />
              <Text style={styles.detailText} numberOfLines={1}>
                {session.location}
              </Text>
            </View>
          </Animated.View>

          {/* Section d'inscription en attente/invitation (si concerné) */}
          {!isFromHistory && session.status !== 'cancelled' && canActuallyRespond ? (
            <Animated.View entering={FadeInUp.delay(150).springify()} style={styles.respondContainer}>
              <Text style={styles.respondTitle}>Tu participes ?</Text>
              <Text style={styles.respondSubtitle}>Ta réponse sera visible par les autres joueurs.</Text>
              <View style={styles.respondButtonsRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.respondAcceptBtn}
                  onPress={handleAccept}
                  disabled={isResponding}
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color="#000" />
                  <Text style={styles.respondAcceptBtnText}>Je participe</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.respondDeclineBtn}
                  onPress={handleDecline}
                  disabled={isResponding}
                >
                  <Ionicons name="close-circle-outline" size={20} color="#E64A19" />
                  <Text style={styles.respondDeclineBtnText}>Je ne peux pas</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          ) : null}

          {/* Carte Résumé Joueurs */}
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.summaryCard}>
            <View style={styles.summaryCardLeft}>
              <Ionicons name="people-outline" size={28} color="#70A831" />
            </View>
            <View style={styles.summaryCardRight}>
              <Text style={styles.summaryRatioText}>
                <Text style={styles.summaryRatioLarge}>{acceptedParticipants.length}</Text>
                {maxParticipants ? (
                  <Text style={styles.summaryRatioSmall}> / {maxParticipants} joueurs</Text>
                ) : (
                  <Text style={styles.summaryRatioSmall}> joueurs</Text>
                )}
              </Text>
              <Text style={styles.summaryBreakdownText}>
                {acceptedParticipants.length} confirmé{acceptedParticipants.length > 1 ? 's' : ''}
                {pendingParticipants.length > 0 ? ` • ${pendingParticipants.length} en attente` : ''}
              </Text>
              {maxParticipants ? (
                isLimitReached ? (
                  <Text style={styles.statusTextFull}>Complet</Text>
                ) : (
                  <Text style={styles.statusTextMissing}>
                    Il manque {missingCount} joueur{missingCount > 1 ? 's' : ''}
                  </Text>
                )
              ) : (
                <Text style={styles.statusTextOpen}>Session ouverte</Text>
              )}
            </View>
          </Animated.View>

          {/* Bouton Inviter des joueurs */}
          {session.status !== 'cancelled' ? (
            <Animated.View entering={FadeInDown.delay(250).springify()}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.inviteActionButton}
                onPress={() => setIsInviteModalVisible(true)}
              >
                <Ionicons name="person-add" size={16} color="#000" style={{ marginRight: 8 }} />
                <Text style={styles.inviteActionButtonText}>Inviter des joueurs</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : null}

          {/* Section Joueurs Titre */}
          <View style={styles.playersSectionHeader}>
            <Text style={styles.sectionHeaderTitleText}>JOUEURS</Text>
          </View>

          {/* Grille des confirmés */}
          {acceptedParticipants.length > 0 ? (
            <View style={styles.playersCategorySection}>
              <View style={styles.categoryHeader}>
                <Ionicons name="checkmark-circle" size={16} color="#70A831" style={{ marginRight: 6 }} />
                <Text style={[styles.categoryTitleText, { color: '#70A831' }]}>
                  Confirmés ({acceptedParticipants.length})
                </Text>
              </View>
              <View style={styles.playersGrid}>
                {acceptedParticipants.map((p, idx) => renderPlayerItem(p, 'accepted', idx))}
              </View>
            </View>
          ) : null}

          {/* Grille des en attente */}
          {pendingParticipants.length > 0 ? (
            <View style={styles.playersCategorySection}>
              <View style={styles.categoryHeader}>
                <Ionicons name="time" size={16} color="#F59223" style={{ marginRight: 6 }} />
                <Text style={[styles.categoryTitleText, { color: '#F59223' }]}>
                  En attente ({pendingParticipants.length})
                </Text>
              </View>
              <View style={styles.playersGrid}>
                {pendingParticipants.map((p, idx) => renderPlayerItem(p, 'pending', idx))}
              </View>
            </View>
          ) : null}

          {/* Grille des désinscrits (ne vient pas) */}
          {declinedParticipants.length > 0 ? (
            <View style={styles.playersCategorySection}>
              <View style={styles.categoryHeader}>
                <Ionicons name="close-circle" size={16} color="#D32F2F" style={{ marginRight: 6 }} />
                <Text style={[styles.categoryTitleText, { color: '#D32F2F' }]}>
                  Ne vient pas ({declinedParticipants.length})
                </Text>
              </View>
              <View style={styles.playersGrid}>
                {declinedParticipants.map((p, idx) => renderPlayerItem(p, 'declined', idx))}
              </View>
            </View>
          ) : null}

        </View>
      </ScrollView>

      {/* Modals */}
      <Modal visible={isInviteModalVisible} animationType="slide" presentationStyle="fullScreen">
        <View style={[styles.inviteModalContainer, { paddingTop: Math.max(insets.top, 16) }]}>
          {showPermissionIntro ? (
            <View style={{ flex: 1 }}>
              {/* Header with X close button */}
              <View style={styles.inviteModalHeader}>
                <TouchableOpacity onPress={() => setIsInviteModalVisible(false)} style={styles.backButton}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
                <View style={styles.inviteHeaderCenter}>
                  <Text style={[styles.inviteHeaderTitle, { fontFamily: 'Outfit-Bold', fontStyle: 'italic', textTransform: 'uppercase' }]}>
                    INVITER DES JOUEURS
                  </Text>
                </View>
                <View style={{ width: 36 }} />
              </View>

              {/* Scrollable body with illustration and description */}
              <ScrollView 
                style={{ flex: 1 }}
                contentContainerStyle={styles.permScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Contact Book Illustration */}
                <View style={styles.permIllustrationContainer}>
                  <View style={styles.permCircle}>
                    <View style={styles.permBook}>
                      <View style={styles.permSpirals}>
                        <View style={styles.permSpiralRing} />
                        <View style={styles.permSpiralRing} />
                        <View style={styles.permSpiralRing} />
                      </View>
                      <Ionicons name="person" size={40} color="#70A831" style={{ alignSelf: 'center', marginTop: 15 }} />
                    </View>
                    <View style={styles.permLockBadge}>
                      <Ionicons name="lock-closed" size={13} color="#FFF" />
                    </View>
                  </View>
                </View>

                {/* Title */}
                <Text style={styles.permTitleText}>Retrouve tes contacts{"\n"}et invite tes amis</Text>
                <Text style={styles.permSubtitleText}>
                  Autorise l’accès à tes contacts pour retrouver facilement les personnes que tu connais déjà sur SUE.
                </Text>

                {/* Features rows */}
                <View style={styles.permFeaturesList}>
                  {/* Feature 1 */}
                  <View style={styles.permFeatureRow}>
                    <View style={styles.permFeatureIconCircle}>
                      <Ionicons name="people" size={18} color="#70A831" />
                    </View>
                    <View style={styles.permFeatureTextContainer}>
                      <Text style={styles.permFeatureTitle}>Invite en 1 clic</Text>
                      <Text style={styles.permFeatureDesc}>
                        Tes contacts déjà sur SUE apparaîtront automatiquement.
                      </Text>
                    </View>
                  </View>

                  {/* Feature 2 */}
                  <View style={styles.permFeatureRow}>
                    <View style={styles.permFeatureIconCircle}>
                      <Ionicons name="shield-checkmark" size={18} color="#70A831" />
                    </View>
                    <View style={styles.permFeatureTextContainer}>
                      <Text style={styles.permFeatureTitle}>100% privé</Text>
                      <Text style={styles.permFeatureDesc}>
                        Tes contacts restent privés et ne sont jamais partagés.
                      </Text>
                    </View>
                  </View>
                </View>
              </ScrollView>

              {/* Bottom Buttons pinned */}
              <View style={[styles.permBottomContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                <TouchableOpacity 
                  activeOpacity={0.8} 
                  style={styles.permBtnAccept} 
                  onPress={handleRequestContactsPermission}
                >
                  <Ionicons name="people-outline" size={18} color="#000" style={{ marginRight: 8 }} />
                  <Text style={styles.permBtnAcceptText}>AUTORISER L’ACCÈS</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  activeOpacity={0.8} 
                  style={styles.permBtnLater} 
                  onPress={handleSkipContactsPermission}
                >
                  <Text style={styles.permBtnLaterText}>PLUS TARD</Text>
                </TouchableOpacity>


              </View>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              {/* Header */}
              <View style={styles.inviteModalHeader}>
                <TouchableOpacity onPress={() => setIsInviteModalVisible(false)} style={styles.backButton}>
                  <Ionicons name="chevron-back" size={24} color="#000" />
                </TouchableOpacity>
                <View style={styles.inviteHeaderCenter}>
                  <Text style={styles.inviteHeaderTitle}>Inviter des joueurs</Text>
                  <Text style={styles.inviteHeaderSubtitle}>
                    {getSportDetails(session.sport).emoji} {getSportDetails(session.sport).label}  •  {formatSessionDate(session.date)}  •  {session.startTime.slice(0, 5)}
                  </Text>
                </View>
                <View style={{ width: 36 }} />
              </View>

              {/* Top Share Area based on Phase */}
              {(isLoadingProfile || isLoadingFriends) ? (
                <View style={[styles.bigShareCard, { backgroundColor: '#FAFAFC', opacity: 0.6, height: 120 }]} />
              ) : userPhase === 1 ? (
                /* Phase 1: Big share card */
                <LinearGradient
                  colors={['#EBF7E3', '#DDF3CF']}
                  style={styles.bigShareCard}
                >
                  {/* Header Row: icon and texts */}
                  <View style={styles.bigShareHeader}>
                    <View style={styles.bigShareIconCircle}>
                      <Ionicons name="people-sharp" size={22} color="#1E3A1E" />
                    </View>
                    <View style={styles.bigShareTextContainer}>
                      <Text style={styles.bigShareTitle}>Partagez cette session ✨</Text>
                      <Text style={styles.bigShareSubtitle}>
                        Invite des joueurs qui ne sont pas encore sur SUE.
                      </Text>
                    </View>
                  </View>

                  {/* Middle Row: Share button (no floating circle in Phase 1) */}
                  <View style={styles.bigShareMiddleRow}>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      style={[styles.bigShareBtn, { marginRight: 0 }]}
                      onPress={shareGeneral}
                    >
                      <Ionicons name="share-outline" size={18} color="#D4FC79" style={{ marginRight: 8 }} />
                      <Text style={styles.bigShareBtnText}>Partager la session</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Bottom link: Copier le lien */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[styles.bigShareBottomLink, { marginTop: 12 }]}
                    onPress={copyLink}
                  >
                    <Ionicons name="link-outline" size={16} color="#000" style={{ marginRight: 6 }} />
                    <Text style={styles.bigShareBottomText}>Copier le lien</Text>
                  </TouchableOpacity>
                </LinearGradient>
              ) : userPhase === 2 ? (
                /* Phase 2: Simple top row link */
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.phase2ShareBtn}
                  onPress={shareGeneral}
                >
                  <Ionicons name="link-outline" size={20} color="#000" style={{ marginRight: 12 }} />
                  <Text style={styles.phase2ShareText}>Partager la session</Text>
                  <Ionicons name="chevron-forward" size={18} color="#8E8E93" style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
              ) : null}

              {/* Search Bar (Fixed) */}
              <View style={styles.inviteSearchContainer}>
                <Ionicons name="search-outline" size={18} color="#8E8E93" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.inviteSearchInput}
                  placeholder="Rechercher un contact"
                  placeholderTextColor="#CCCCCC"
                  value={inviteSearchQuery}
                  onChangeText={setInviteSearchQuery}
                  autoCapitalize="none"
                />
              </View>

              {/* Scrollable Player Lists */}
              <ScrollView 
                ref={inviteScrollRef}
                contentContainerStyle={styles.inviteScrollContent} 
                showsVerticalScrollIndicator={false}
              >
                {/* List 1: AMIS SUE */}
                {isLoadingFriends ? (
                  renderFriendsSkeleton()
                ) : searchFilteredFriends.length > 0 ? (
                  <View style={styles.inviteListSection}>
                    <View style={styles.inviteListSectionHeader}>
                      <Text style={styles.inviteListSectionTitle}>AMIS SUE ({searchFilteredFriends.length})</Text>
                    </View>

                    <View style={styles.inviteListCard}>
                      {displayedFriends.map((item, idx) => {
                        const isSelected = selectedFriends.includes(item.id);
                        const initials = `${(item.firstname || '').charAt(0)}${(item.lastname || '').charAt(0)}`.toUpperCase() || '?';
                        return (
                          <TouchableOpacity
                            key={item.id}
                            activeOpacity={0.8}
                            style={[
                              styles.invitePlayerRow,
                              idx < displayedFriends.length - 1 && styles.borderBottomLight
                            ]}
                            onPress={() => toggleFriend(item.id)}
                          >
                            <View style={styles.invitePlayerLeft}>
                              {item.avatar ? (
                                <Image source={{ uri: item.avatar }} style={styles.invitePlayerAvatar} />
                              ) : (
                                <View style={[styles.invitePlayerAvatarPlaceholder, { backgroundColor: '#E8F5E9' }]}>
                                  <Text style={styles.invitePlayerAvatarPlaceholderText}>{initials}</Text>
                                </View>
                              )}
                              <View style={styles.invitePlayerInfo}>
                                <Text style={styles.invitePlayerName}>{item.firstname} {item.lastname}</Text>
                              </View>
                            </View>

                            <View style={[
                              styles.inviteCheckbox,
                              isSelected && styles.inviteCheckboxChecked
                            ]}>
                              {isSelected && <Ionicons name="checkmark" size={12} color="#FFF" />}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                  </View>
                ) : null}

                {/* Phase 3: Share option between SUE friends and Phone contacts */}
                {userPhase === 3 ? (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.phase3ShareCard}
                    onPress={shareGeneral}
                  >
                    <View style={styles.phase3ShareIconCircle}>
                      <Ionicons name="link-outline" size={20} color="#000" />
                    </View>
                    <View style={styles.phase3ShareTextContainer}>
                      <Text style={styles.phase3ShareTitle}>Partager la session</Text>
                      <Text style={styles.phase3ShareSubtitle}>
                        Invitez des personnes qui ne sont pas encore sur SUE.
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#8E8E93" style={{ marginLeft: 'auto' }} />
                  </TouchableOpacity>
                ) : null}

                {/* List 2: CONTACTS (Pas encore sur SUE) */}
                <View style={styles.inviteListSection}>
                  <View style={styles.inviteListSectionHeader}>
                    <Text style={styles.inviteListSectionTitle}>INVITER D'AUTRES PERSONNES</Text>
                  </View>

                  {contactsPermissionStatus === 'granted' ? (
                    searchFilteredLocalContacts.length > 0 ? (
                      <View style={styles.inviteListCard}>
                        {searchFilteredLocalContacts.map((item, idx) => {
                          const initials = item.name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2) || '?';
                          return (
                            <View
                              key={item.id}
                              style={[
                                styles.invitePlayerRow,
                                idx < searchFilteredLocalContacts.length - 1 && styles.borderBottomLight
                              ]}
                            >
                              <View style={styles.invitePlayerLeft}>
                                <View style={[styles.invitePlayerAvatarPlaceholder, { backgroundColor: '#ECEFF1' }]}>
                                  <Text style={styles.invitePlayerAvatarPlaceholderText}>{initials}</Text>
                                </View>
                                <View style={styles.invitePlayerInfo}>
                                  <Text style={styles.invitePlayerName}>{item.name}</Text>
                                  <View style={styles.invitePlayerRowSubtitleLine}>
                                    <View style={styles.inviteBadgePasSurSue}>
                                      <Text style={styles.inviteBadgePasSurSueText}>Pas encore sur SUE</Text>
                                    </View>
                                    <Text style={styles.invitePlayerSubtitleText}> • Contact</Text>
                                  </View>
                                </View>
                              </View>

                              <TouchableOpacity
                                activeOpacity={0.7}
                                style={styles.inviteContactBtn}
                                onPress={() => inviteContact(item.name)}
                              >
                                <Text style={styles.inviteContactBtnText}>Inviter</Text>
                              </TouchableOpacity>
                            </View>
                          );
                        })}
                      </View>
                    ) : (
                      <Text style={styles.inviteEmptyText}>Aucun contact local trouvé.</Text>
                    )
                  ) : (
                    /* Banner to request access inside the second list */
                    <View style={styles.permBanner}>
                      <View style={styles.permBannerRow}>
                        <View style={styles.permBannerCircle}>
                          <Ionicons name="book-sharp" size={20} color="#70A831" />
                        </View>
                        <View style={styles.permBannerTextContainer}>
                          <Text style={styles.permBannerTitle}>Accède à tes contacts</Text>
                          <Text style={styles.permBannerDesc}>
                            Autorise l’accès à tes contacts pour retrouver tes amis plus vite et les inviter en 1 clic.
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.permBannerBtn}
                        onPress={handleRequestContactsPermission}
                      >
                        <Ionicons name="people" size={16} color="#000" style={{ marginRight: 6 }} />
                        <Text style={styles.permBannerBtnText}>AUTORISER L’ACCÈS</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </ScrollView>

              {/* Bottom Send Button (invitation dans l'application) */}
              <View style={[styles.inviteBottomBtnContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.inviteSendBtn,
                    selectedFriends.length === 0 && styles.inviteSendBtnDisabled
                  ]}
                  onPress={handleInvite}
                  disabled={selectedFriends.length === 0}
                >
                  <View style={styles.inviteSendBtnLeftContent}>
                    <Text style={styles.inviteSendBtnMainText}>
                      Inviter {selectedFriends.length} joueur{selectedFriends.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Ionicons name="paper-plane" size={18} color="#000" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      <Modal visible={showComments} animationType="slide" presentationStyle="fullScreen">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowComments(false)}>
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>VESTIAIRE</Text>
            <View style={{ width: 28 }} />
          </View>
          <ChatComments
            sessionId={sessionId}
            onCommentsReload={reloadComments}
            onUserPress={handleUserPress}
            onCloseComments={() => setShowComments(false)}
          />
        </SafeAreaView>
      </Modal>

      <UserProfileModal
        visible={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        userId={selectedUserId}
        userFirstname={selectedUserFirstname}
        userLastname={selectedUserLastname}
        userStatus={selectedUserStatus}
        isPlayerOrganizer={selectedUserId === session.organizer.id}
        sessionId={sessionId}
        isSessionOrganizer={isOrganizer}
        isSessionFinished={session?.date && session?.endTime ? isSessionFinished(session.date, session.endTime) : false}
        onOrganizerChanged={() => {
          getSessionById(sessionId);
        }}
      />

      <NotificationPermissionSheet
        visible={showNotifSheet}
        onDismiss={() => setShowNotifSheet(false)}
      />

    </MainScreenLayout>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' },
  errorText: { color: 'red', fontWeight: 'bold' },
  
  // Custom Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#FAFAFA',
    position: 'relative',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  headerTitleAbsolute: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.5,
    zIndex: -1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.5,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerChatButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerChatBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#70A831',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FAFAFA',
  },
  headerChatBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFF',
  },
  headerMoreButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Scroll Containers
  scrollContent: {
    paddingBottom: 60,
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Titre Sport Section
  sportTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  sportIconCircleLarge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportTitleText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#000',
    marginLeft: 16,
  },

  // Détails Session List
  detailsListBlock: {
    backgroundColor: 'transparent',
    gap: 8,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: 10,
  },
  detailText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },

  // Section Invitation/Repondre
  respondContainer: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F0F0F2',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  respondTitle: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
    textAlign: 'center',
  },
  respondSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 20,
    textAlign: 'center',
  },
  respondButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  respondAcceptBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: BrandColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  respondAcceptBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  respondDeclineBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  respondDeclineBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E64A19',
  },

  // Carte Résumé Joueurs
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  summaryCardLeft: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F2F9EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  summaryCardRight: {
    flex: 1,
  },
  summaryRatioText: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  summaryRatioLarge: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
  },
  summaryRatioSmall: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  summaryBreakdownText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: 2,
  },
  statusTextFull: {
    fontSize: 12,
    fontWeight: '700',
    color: '#70A831',
    marginTop: 4,
  },
  statusTextMissing: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59223',
    marginTop: 4,
  },
  statusTextOpen: {
    fontSize: 12,
    fontWeight: '700',
    color: '#70A831',
    marginTop: 4,
  },

  // Bouton Invitation Action
  inviteActionButton: {
    width: '100%',
    height: 46,
    borderRadius: 12,
    backgroundColor: BrandColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  inviteActionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },

  // Catégories de Joueurs
  playersSectionHeader: {
    marginBottom: 12,
    marginTop: 8,
  },
  sectionHeaderTitleText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8E8E93',
    letterSpacing: 0.5,
  },
  playersCategorySection: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  playersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  playerCard: {
    alignItems: 'center',
    width: (width - 40 - 40 - 48) / 4, // 4 columns with gap
  },
  playerAvatarContainer: {
    width: 50,
    height: 50,
    position: 'relative',
    marginBottom: 6,
  },
  playerAvatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  playerAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerAvatarPlaceholderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  organizerBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FFC107',
    width: 15,
    height: 15,
    borderRadius: 7.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FAFAFA',
  },
  statusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FAFAFA',
  },
  playerGridName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },

  // Modal Styles standard
  modalContent: { flex: 1, backgroundColor: '#FFF', paddingTop: 20 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: { fontSize: 20, fontWeight: '900', fontStyle: 'italic' },
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  friendItemSelected: { backgroundColor: '#F0FFF0' },
  friendName: { fontSize: 16, fontWeight: '600' },
  friendNameSelected: { fontWeight: '800' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#999' },
  modalFooter: { padding: 24, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  modalButton: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 4,
    alignItems: 'center',
  },
  modalButtonDisabled: { opacity: 0.5 },
  modalButtonText: { color: '#FFF', fontWeight: '900' },

  // Redesigned Premium Invite Modal styles
  inviteModalContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  inviteModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F7',
    backgroundColor: '#FAFAFA',
  },
  inviteHeaderCenter: {
    alignItems: 'center',
    flex: 1,
  },
  inviteHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
  },
  inviteHeaderSubtitle: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '600',
    marginTop: 2,
  },
  inviteScrollContent: {
    paddingBottom: 120,
  },
  bigShareCard: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 14,
    padding: 20,
    overflow: 'hidden',
  },
  bigShareHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bigShareIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#9BE928',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigShareTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  bigShareTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
  },
  bigShareSubtitle: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 4,
    lineHeight: 16,
  },
  bigShareMiddleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  bigShareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1E1E',
    height: 48,
    borderRadius: 14,
    paddingRight: 10,
  },
  bigShareBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#D4FC79',
  },
  bigShareFloatingCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  bigShareDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    marginVertical: 16,
  },
  bigShareBottomLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigShareBottomText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000',
  },
  inviteSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 14,
  },
  inviteSearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#000',
    fontWeight: '500',
  },
  inviteListSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  inviteListSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  inviteListSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8E8E93',
    letterSpacing: 0.5,
  },
  inviteListCard: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 20,
    overflow: 'hidden',
  },
  invitePlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  borderBottomLight: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F7',
  },
  invitePlayerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  invitePlayerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  invitePlayerAvatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  invitePlayerAvatarPlaceholderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
  },
  invitePlayerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  invitePlayerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  inviteBadgeSurSue: {
    backgroundColor: '#EAF6DD',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  inviteBadgeSurSueText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#70A831',
  },
  invitePlayerRowSubtitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  inviteBadgePasSurSue: {
    backgroundColor: '#FFF3E0',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  inviteBadgePasSurSueText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#F59223',
  },
  invitePlayerSubtitleText: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '500',
  },
  inviteCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#EAEAEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteCheckboxChecked: {
    backgroundColor: '#70A831',
    borderColor: '#70A831',
  },
  inviteContactBtn: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  inviteContactBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },
  inviteMoreContactsFooterText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#8E8E93',
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
    fontWeight: '600',
  },
  inviteEmptyText: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  inviteBottomBtnContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(250, 250, 250, 0.9)',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F7',
  },
  inviteSendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BrandColors.primary,
    height: 50,
    borderRadius: 14,
    paddingHorizontal: 20,
  },
  inviteSendBtnDisabled: {
    opacity: 0.5,
  },
  inviteSendBtnLeftContent: {
    flex: 1,
  },
  inviteSendBtnMainText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000',
  },
  inviteSendBtnSubText: {
    fontSize: 10,
    color: '#000',
    opacity: 0.6,
    marginTop: 2,
    fontWeight: '600',
  },
  // Contact Permission Screen Styles
  permScrollContent: {
    paddingHorizontal: 24,
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 40,
  },
  permIllustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  permCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#F0F9EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permBook: {
    width: 70,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  permSpirals: {
    position: 'absolute',
    left: -6,
    top: 15,
    height: 60,
    justifyContent: 'space-between',
  },
  permSpiralRing: {
    width: 12,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#70A831',
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
  },
  permLockBadge: {
    position: 'absolute',
    right: 18,
    bottom: 12,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#2F3C4B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F0F9EB',
  },
  permTitleText: {
    fontSize: 22,
    fontFamily: 'Outfit-Bold',
    fontWeight: '800',
    textAlign: 'center',
    color: '#000',
    lineHeight: 28,
    marginBottom: 12,
  },
  permSubtitleText: {
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
    textAlign: 'center',
    color: '#4B5563',
    lineHeight: 18,
    paddingHorizontal: 12,
    marginBottom: 32,
  },
  permFeaturesList: {
    width: '100%',
    paddingHorizontal: 12,
  },
  permFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  permFeatureIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F9EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  permFeatureTextContainer: {
    flex: 1,
  },
  permFeatureTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
    marginBottom: 2,
  },
  permFeatureDesc: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 15,
  },
  permBottomContainer: {
    backgroundColor: '#FFF',
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  permBtnAccept: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.primary,
    height: 48,
    borderRadius: 12,
    marginBottom: 10,
  },
  permBtnAcceptText: {
    fontSize: 13,
    fontFamily: 'Outfit-Bold',
    fontStyle: 'italic',
    fontWeight: '800',
    color: '#000',
  },
  permBtnLater: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 48,
    borderRadius: 12,
    marginBottom: 14,
  },
  permBtnLaterText: {
    fontSize: 13,
    fontFamily: 'Outfit-Bold',
    fontStyle: 'italic',
    fontWeight: '800',
    color: '#000',
  },
  permBtnSkipLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  permBtnSkipLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  // Contact Permission Banner Styles
  permBanner: {
    backgroundColor: '#F0F9EB',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E1F3D8',
    marginTop: 10,
  },
  permBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  permBannerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  permBannerTextContainer: {
    flex: 1,
  },
  permBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
    marginBottom: 4,
  },
  permBannerDesc: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 15,
  },
  permBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.primary,
    height: 42,
    borderRadius: 12,
  },
  permBannerBtnText: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    fontStyle: 'italic',
    fontWeight: '800',
    color: '#000',
  },
  // Phase 2 & 3 Sharing Layout Styles
  phase2ShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginHorizontal: 20,
    paddingHorizontal: 16,
    height: 52,
    marginTop: 16,
  },
  phase2ShareText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
  },
  phase3ShareCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginHorizontal: 20,
    padding: 16,
    marginTop: 16,
    marginBottom: 20,
  },
  phase3ShareIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  phase3ShareTextContainer: {
    flex: 1,
  },
  phase3ShareTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
  },
  phase3ShareSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  expandListBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  expandListBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000',
  },
});