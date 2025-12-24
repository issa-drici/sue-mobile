import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp
} from 'react-native-reanimated';

import ChatComments from '../../components/ChatComments';
import PullToRefresh from '../../components/PullToRefresh';
import { MainScreenLayout } from '../../components/ui/ScreenLayout';
import UserProfileModal from '../../components/UserProfileModal';
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
import { formatDate, formatTimeFrance } from '../../utils/dateHelpers';
import { isSessionFinished } from '../../utils/timeHelpers';
import { useAuth } from '../context/auth';

const { width } = Dimensions.get('window');
const ACCENT_COLOR = '#D4FC79'; // Electric Volt

export default function SessionDetailsScreen() {
  const { id, source, openComments } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const sessionId = typeof id === 'string' ? id : '';
  const scrollViewRef = useRef<ScrollView>(null);

  // State
  const [showComments, setShowComments] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUserFirstname, setSelectedUserFirstname] = useState<string>('');
  const [selectedUserLastname, setSelectedUserLastname] = useState<string>('');
  const [selectedUserStatus, setSelectedUserStatus] = useState<string>('');
  const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  // Hooks
  const { data: session, error, getSessionById } = useGetSessionById();
  const { data: friends } = useGetFriends();
  const { inviteFriends } = useInviteFriends();
  const { respondToInvitation, isLoading: isResponding } = useRespondToInvitation();
  const { cancelParticipation, isLoading: isCancelling } = useCancelParticipation();
  const { cancelSession } = useCancelSession();

  // Comments
  const {
    comments,
    reloadComments
  } = useComments(sessionId);

  // Effects
  useFocusEffect(
    React.useCallback(() => {
      if (sessionId) getSessionById(sessionId);
    }, [sessionId, getSessionById])
  );

  React.useEffect(() => {
    if (openComments === 'true') setShowComments(true);
  }, [openComments]);

  // Pull to Refresh
  const { refreshing, onRefresh } = usePullToRefresh({
    onRefresh: async () => {
      await getSessionById(sessionId);
      await reloadComments();
    },
    minDelay: 800
  });

  // Logic
  const handleUserPress = (userId: string, firstname?: string, lastname?: string, status?: string) => {
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

  const acceptedCount = session?.participants?.filter(p => p.status === 'accepted').length || 0;
  const maxParticipants = session?.maxParticipants || 0;
  const isLimitReached = maxParticipants > 0 && acceptedCount >= maxParticipants;
  const canActuallyRespond = canRespond && !isLimitReached;

  // Handlers
  const handleAccept = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await respondToInvitation(sessionId, 'accept');
      getSessionById(sessionId);
      router.back();
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
            router.back();
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
            router.back();
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
            router.back();
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
      Alert.alert('Succès', 'Invitations envoyées');
    } catch { Alert.alert('Erreur', "Echec de l'envoi"); }
  };

  const toggleFriend = (id: string) => {
    Haptics.selectionAsync();
    setSelectedFriends(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  if (error || !session) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error || 'Session introuvable'}</Text>
      </SafeAreaView>
    );
  }

  const filteredFriends = friends?.filter(f => !session.participants.some(p => p.id === f.id && p.status !== 'declined')) || [];

  // Vérifier si la session est terminée
  const isFinished = session?.date && session?.endTime
    ? isSessionFinished(session.date, session.endTime)
    : false;
  const canEdit = isOrganizer && !isFinished;

  return (
    <MainScreenLayout title="Détails" showHeader={false} containerStyle={{ backgroundColor: '#FFF' }}>

      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SESSION</Text>
        <View style={styles.headerRight}>
          {canEdit && (
            <TouchableOpacity onPress={() => router.push(`/edit-session/${sessionId}`)}>
              <Ionicons name="settings-outline" size={24} color="#000" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        refreshControl={<PullToRefresh refreshing={refreshing} onRefresh={onRefresh} color="#000" />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.heroSection}>
          <View style={styles.sportBadge}>
            <Text style={styles.sportText}>{session.sport.toUpperCase()}</Text>
          </View>

          <Text style={styles.dateText}>
            {formatDate(session.date).toUpperCase()}
          </Text>
          <Text style={styles.timeText}>
            {formatTimeFrance(session.startTime)} - {formatTimeFrance(session.endTime)}
          </Text>

          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={16} color={ACCENT_COLOR} />
            <Text style={styles.locationText}>{session.location.toUpperCase()}</Text>
          </View>

          {session.status === 'cancelled' && (
            <View style={styles.cancelledBadge}>
              <Text style={styles.cancelledText}>SESSION ANNULÉE</Text>
            </View>
          )}
        </Animated.View>

        {/* Actions Section */}
        {!isFromHistory && session.status !== 'cancelled' && (
          <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.actionsSection}>
            {canActuallyRespond && (
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.acceptButton]}
                  onPress={handleAccept}
                  disabled={isResponding}
                >
                  <Text style={styles.acceptButtonText}>REJOINDRE LE SQUAD</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.declineButton]}
                  onPress={handleDecline}
                  disabled={isResponding}
                >
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
            )}

            {canCancel && (
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleCancelPart}
                disabled={isCancelling}
              >
                <Text style={styles.cancelButtonText}>QUITTER LE SQUAD</Text>
              </TouchableOpacity>
            )}

            {isOrganizer && (
              <View style={styles.organizerActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.inviteButton]}
                  onPress={() => setIsInviteModalVisible(true)}
                >
                  <Text style={styles.inviteButtonText}>INVITER DES ATHLÈTES</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.textButton]}
                  onPress={handleCancelSess}
                >
                  <Text style={styles.textButtonLabel}>ANNULER LA SESSION</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Invite button for non-organizers too if allowed? Usually organizers invite. 
                Original code allowed everyone to invite. Let's keep it. */}
            {!isOrganizer && isParticipant && (
              <TouchableOpacity
                style={[styles.actionButton, styles.inviteButton]}
                onPress={() => setIsInviteModalVisible(true)}
              >
                <Text style={styles.inviteButtonText}>INVITER DES AMIS</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        )}

        {/* Squad Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>SQUAD</Text>
            <Text style={styles.sectionCount}>
              {acceptedCount} / {session.maxParticipants || '∞'}
            </Text>
          </View>

          <View style={styles.squadGrid}>
            {session.participants.map((p, i) => (
              <TouchableOpacity
                key={p.id}
                style={styles.squadMember}
                onPress={() => handleUserPress(p.id, p.firstname, p.lastname, p.status)}
              >
                <View style={[
                  styles.avatar,
                  p.status === 'accepted' ? styles.avatarAccepted :
                    p.status === 'declined' ? styles.avatarDeclined : styles.avatarPending
                ]}>
                  <Text style={styles.avatarText}>
                    {p.firstname?.[0]}{p.lastname?.[0]}
                  </Text>
                  {p.id === session.organizer.id && (
                    <View style={styles.crownBadge}>
                      <Ionicons name="star" size={8} color="#000" />
                    </View>
                  )}
                </View>
                <Text style={styles.memberName} numberOfLines={1}>
                  {p.firstname}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Comments Section */}
        <TouchableOpacity
          style={styles.commentsSection}
          onPress={() => setShowComments(true)}
          activeOpacity={0.8}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>VESTIAIRE</Text>
            <View style={styles.commentCountBadge}>
              <Text style={styles.commentCountText}>{comments.length}</Text>
            </View>
          </View>

          {comments.length > 0 ? (
            <View style={styles.lastComment}>
              <Text style={styles.lastCommentUser}>
                {comments[0].user?.firstname}:
              </Text>
              <Text style={styles.lastCommentText} numberOfLines={1}>
                {comments[0].content}
              </Text>
            </View>
          ) : (
            <Text style={styles.noCommentsText}>Aucun message pour le moment.</Text>
          )}

          <View style={styles.openCommentsButton}>
            <Text style={styles.openCommentsText}>OUVRIR LE CHAT</Text>
            <Ionicons name="arrow-forward" size={16} color="#000" />
          </View>
        </TouchableOpacity>

      </ScrollView>

      {/* Modals */}
      <Modal visible={isInviteModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>INVITER</Text>
            <TouchableOpacity onPress={() => setIsInviteModalVisible(false)}>
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={filteredFriends}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.friendItem, selectedFriends.includes(item.id) && styles.friendItemSelected]}
                onPress={() => toggleFriend(item.id)}
              >
                <Text style={[styles.friendName, selectedFriends.includes(item.id) && styles.friendNameSelected]}>
                  {item.firstname} {item.lastname}
                </Text>
                {selectedFriends.includes(item.id) && <Ionicons name="checkmark" size={20} color="#000" />}
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>Aucun ami à inviter.</Text>}
          />
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, selectedFriends.length === 0 && styles.modalButtonDisabled]}
              onPress={handleInvite}
              disabled={selectedFriends.length === 0}
            >
              <Text style={styles.modalButtonText}>ENVOYER ({selectedFriends.length})</Text>
            </TouchableOpacity>
          </View>
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
        sessionId={sessionId}
        isSessionOrganizer={isOrganizer}
        isSessionFinished={isFinished}
        onOrganizerChanged={() => {
          getSessionById(sessionId);
          router.back();
        }}
      />

    </MainScreenLayout>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: 'red', fontWeight: 'bold' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFF',
  },
  backButton: { padding: 4 },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  headerRight: { width: 32, alignItems: 'flex-end' },
  scrollContent: { paddingBottom: 100 },

  heroSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    alignItems: 'flex-start',
  },
  sportBadge: {
    backgroundColor: '#000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginBottom: 16,
  },
  sportText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 32,
    letterSpacing: -1,
    fontStyle: 'italic',
  },
  dateText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 16,
    fontVariant: ['tabular-nums'],
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  cancelledBadge: {
    marginTop: 16,
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  cancelledText: {
    color: '#D32F2F',
    fontWeight: '800',
    fontSize: 12,
  },

  actionsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
    gap: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    height: 56,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#000',
  },
  acceptButtonText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 16,
    fontStyle: 'italic',
  },
  declineButton: {
    width: 56,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButton: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#000',
  },
  cancelButtonText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 14,
  },
  inviteButton: {
    backgroundColor: ACCENT_COLOR,
    marginTop: 12,
  },
  inviteButtonText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 14,
  },
  organizerActions: {
    gap: 12,
  },
  textButton: {
    alignItems: 'center',
    padding: 12,
  },
  textButtonLabel: {
    color: '#FF3B30',
    fontWeight: '700',
    fontSize: 12,
  },

  sectionContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
  },
  squadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  squadMember: {
    alignItems: 'center',
    width: (width - 48 - 48) / 4, // 4 columns roughly
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarAccepted: { borderColor: ACCENT_COLOR, backgroundColor: '#FFF' },
  avatarDeclined: { opacity: 0.5 },
  avatarPending: { borderStyle: 'dashed', borderColor: '#CCC' },
  avatarText: {
    fontWeight: '700',
    fontSize: 18,
  },
  crownBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: ACCENT_COLOR,
    borderRadius: 8,
    padding: 4,
  },
  memberName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  commentsSection: {
    marginHorizontal: 24,
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 8,
  },
  commentCountBadge: {
    backgroundColor: '#000',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  commentCountText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  lastComment: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  lastCommentUser: { fontWeight: '700', marginRight: 4 },
  lastCommentText: { flex: 1, color: '#666' },
  noCommentsText: { color: '#999', fontStyle: 'italic', marginBottom: 12 },
  openCommentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  openCommentsText: { fontSize: 12, fontWeight: '800' },

  // Modal Styles
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
});