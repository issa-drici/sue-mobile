import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ChatComments from '../../components/ChatComments';
import InfoMessage from '../../components/InfoMessage';
import PullToRefresh from '../../components/PullToRefresh';
import { usePullToRefresh } from '../../hooks';
import { useComments } from '../../hooks/useComments';
import { useGetFriends, useGetSessionById, useInviteFriends, useRespondToInvitation } from '../../services';
import { formatCommentDate, formatDate } from '../../utils/dateHelpers';
import { useAuth } from '../context/auth';
import { height } from '../utils/dimensions';

export default function SessionDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth(); // Récupérer l'utilisateur actuel
  // COMMENTÉ - Variable newComment retirée (maintenant gérée dans la modal)
  // const [newComment, setNewComment] = useState('');
  const [invitationStatus, setInvitationStatus] = useState<'pending' | 'accepted' | 'declined'>('pending');
  const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [showComments, setShowComments] = useState(false);

  const sessionId = typeof id === 'string' ? id : '';

  const { data: session, isLoading, error, getSessionById } = useGetSessionById();
  const { data: friends, isLoading: friendsLoading } = useGetFriends();
  const { inviteFriends, isLoading: isInviting } = useInviteFriends();
  const { respondToInvitation, isLoading: isResponding } = useRespondToInvitation();

  // Hook pour le pull-to-refresh
  const { refreshing, onRefresh } = usePullToRefresh({
    onRefresh: async () => {
      await getSessionById(sessionId);
      await reloadComments();
    },
    onError: (error: any) => {
    },
    minDelay: 1000
  });

  // Nouveau système de commentaires
  const {
    comments,
    isConnected,
    isLoadingComments,
    isCreatingComment,
    sendComment,
    getOnlineUsersCount,
    reloadComments
  } = useComments(sessionId);

  // Déterminer le statut de l'utilisateur dans cette session
  const getUserStatus = () => {
    if (!session || !user) return null;

    // Vérifier si l'utilisateur est l'organisateur
    if (session.organizer.id === user.id) {
      return 'organizer';
    }

    // Vérifier si l'utilisateur est un participant
    const participant = session.participants.find(p => p.id === user.id);
    if (participant) {
      return participant.status; // 'accepted', 'declined', 'pending'
    }

    // L'utilisateur n'est ni organisateur ni participant
    return 'not_invited';
  };

  const userStatus = getUserStatus();
  const isOrganizer = userStatus === 'organizer';
  const isParticipant = userStatus === 'accepted' || userStatus === 'declined' || userStatus === 'pending';
  const canRespondToInvitation = userStatus === 'pending';

  // Vérifier si la limite de participants est atteinte
  const acceptedParticipantsCount = session?.participants?.filter(p => p.status === 'accepted').length || 0;
  const maxParticipants = session?.maxParticipants || 0;
  const isLimitReached = maxParticipants > 0 && acceptedParticipantsCount >= maxParticipants;

  // Ne peut répondre à l'invitation que si la limite n'est pas atteinte
  const canActuallyRespondToInvitation = canRespondToInvitation && !isLimitReached;

  // Charger la session quand l'écran devient actif
  useFocusEffect(
    React.useCallback(() => {
      if (sessionId) {
        getSessionById(sessionId);
      }
    }, [sessionId, getSessionById])
  );

  // Fonction pour forcer le rechargement des commentaires
  const handleCommentsReload = () => {
    // Utiliser la fonction de rechargement du hook useComments
    reloadComments();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Chargement de la session...</Text>
      </SafeAreaView>
    );
  }

  if (error || !session) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: 'red' }}>Erreur: {error || 'Session non trouvée'}</Text>
      </SafeAreaView>
    );
  }

  // COMMENTÉ - Fonction d'ajout de commentaire retirée (maintenant gérée dans la modal)
  /*
  const handleAddComment = () => {
    if (newComment.trim()) {
      // Ici, vous ajouterez la logique pour ajouter un commentaire
      setNewComment('');
    }
  };
  */

  const handleAcceptInvitation = async () => {
    // Ici, vous ajouterez la logique pour accepter l'invitation

    // Mettre à jour l'état local
    setInvitationStatus('accepted');

    try {
      const result = await respondToInvitation(sessionId, 'accept');

      // Recharger les données de la session pour voir le nouveau statut
      getSessionById(sessionId);
      router.back();
    } catch (error: any) {
      Alert.alert(
        'Erreur',
        error.message || 'Impossible d\'envoyer la réponse d\'acceptation'
      );
    }
  };

  const handleDeclineInvitation = async () => {
    Alert.alert(
      'Refuser l\'invitation',
      'Êtes-vous sûr de vouloir refuser cette invitation ?',
      [
        {
          text: 'Annuler',
          style: 'cancel'
        },
        {
          text: 'Refuser',
          style: 'destructive',
          onPress: async () => {
            // Ici, vous ajouterez la logique pour refuser l'invitation

            // Mettre à jour l'état local
            setInvitationStatus('declined');

            try {
              const result = await respondToInvitation(sessionId, 'decline');

              // Recharger les données de la session pour voir le nouveau statut
              getSessionById(sessionId);
              router.back();
            } catch (error: any) {
              Alert.alert(
                'Erreur',
                error.message || 'Impossible d\'envoyer la réponse de refus'
              );
            }
          }
        }
      ]
    );
  };

  const handleInviteFriends = () => {
    // Ici, vous ajouterez la logique pour envoyer les invitations

    Alert.alert(
      'Invitations envoyées',
      `${selectedFriends.length} invitation${selectedFriends.length > 1 ? 's' : ''} envoyée${selectedFriends.length > 1 ? 's' : ''}`,
      [
        {
          text: 'OK',
          onPress: () => {
            setIsInviteModalVisible(false);
            setSelectedFriends([]);
            setSearchQuery('');
          }
        }
      ]
    );
  };

  const handleInviteFriend = (friendId: string) => {
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter(id => id !== friendId));
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };

  const handleSendInvitations = async () => {
    if (selectedFriends.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins un ami');
      return;
    }

    try {

      const result = await inviteFriends(sessionId, selectedFriends);


      Alert.alert(
        'Succès',
        `Invitations envoyées à ${selectedFriends.length} ami(s)`,
        [
          {
            text: 'OK',
            onPress: () => {
              setIsInviteModalVisible(false);
              setSelectedFriends([]);
              setSearchQuery('');
              // Recharger les données de la session pour voir les nouveaux participants
              getSessionById(sessionId);
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Erreur',
        error.message || 'Impossible d\'envoyer les invitations'
      );
    }
  };

  const filteredFriends = friends.filter(friend =>
    !session.participants.some(p => p.id === friend.id)
  );

  const renderFriendItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.friendItem,
        selectedFriends.includes(item.id) && styles.selectedFriend
      ]}
      onPress={() => handleInviteFriend(item.id)}
    >
      <Text style={styles.friendName}>
        {item.firstname} {item.lastname}
      </Text>
      {selectedFriends.includes(item.id) && (
        <Text style={styles.checkmark}>✓</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails de la Session</Text>
        {/* Bouton d'invitation - Afficher pour tous les utilisateurs */}
        <TouchableOpacity
          style={styles.headerInviteButton}
          onPress={() => setIsInviteModalVisible(true)}
        >
          <Ionicons name="person-add-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? height.tabBar + height.safeAreaBottom : 0}
      >
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <PullToRefresh
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
        >
          {/* En-tête de la session */}
          <View style={styles.sessionHeader}>
            <View style={styles.sessionHeaderLeft}>
              <Text style={styles.sportTitle}>{session.sport.toUpperCase()}</Text>
              <Text style={styles.dateTime}>
                {formatDate(session.date)} à {session.time}
              </Text>
              <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={16} color="#666" />
                <Text style={styles.location}>{session.location}</Text>
              </View>
            </View>
          </View>

          {/* Boutons d'action pour les invitations - Afficher seulement si l'utilisateur peut répondre ET que la limite n'est pas atteinte */}
          {canActuallyRespondToInvitation && (
            <View style={styles.invitationActions}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.acceptButton,
                  isResponding && styles.actionButtonDisabled
                ]}
                onPress={handleAcceptInvitation}
                disabled={isResponding}
              >
                {isResponding ? (
                  <>
                    <Ionicons name="refresh" size={20} color="#fff" style={{ transform: [{ rotate: '360deg' }] }} />
                    <Text style={styles.actionButtonText}>Envoi en cours...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Accepter l&apos;invitation</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.declineButton,
                  isResponding && styles.actionButtonDisabled
                ]}
                onPress={handleDeclineInvitation}
                disabled={isResponding}
              >
                {isResponding ? (
                  <>
                    <Ionicons name="refresh" size={20} color="#fff" style={{ transform: [{ rotate: '360deg' }] }} />
                    <Text style={styles.actionButtonText}>Envoi en cours...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="close" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Refuser l&apos;invitation</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Message quand la limite est atteinte */}
          {canRespondToInvitation && isLimitReached && (
            <InfoMessage
              message="La limite de participants a été atteinte. Vous ne pouvez plus accepter cette invitation."
              type="warning"
              icon="warning"
            />
          )}

          {/* Statut de l'utilisateur dans cette session */}
          {!canRespondToInvitation && userStatus && (
            <InfoMessage
              type={
                userStatus === 'accepted' ? 'success' :
                  userStatus === 'declined' ? 'error' :
                    userStatus === 'organizer' ? 'info' : 'warning'
              }
              message={
                userStatus === 'accepted' ? 'Vous participez à cette session' :
                  userStatus === 'declined' ? 'Vous avez refusé cette invitation' :
                    userStatus === 'organizer' ? "Vous êtes l'organisateur de cette session" :
                      "Vous n'êtes pas invité à cette session"
              }
              icon={
                userStatus === 'accepted' ? 'checkmark-circle' :
                  userStatus === 'declined' ? 'close-circle' :
                    userStatus === 'organizer' ? 'person-circle' : 'information-circle'
              }
            />
          )}

          {/* Section Participants */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Participants
                {session.maxParticipants && (
                  <Text style={styles.participantsMaxText}>
                    {' '}({session.participants?.filter(p => p.status === 'accepted').length || 0}/{session.maxParticipants} max)
                  </Text>
                )}
              </Text>
            </View>
            <View style={styles.participantsList}>
              {session.participants.map((participant) => (
                <View key={participant.id} style={styles.participant}>
                  <View style={styles.participantInfo}>
                    <Text style={styles.participantName}>
                      {`${participant.firstname || ''} ${participant.lastname || ''}`.trim()}
                    </Text>
                    {participant.id === session.organizer.id && (
                      <Text style={styles.organizerBadge}>Organisateur</Text>
                    )}
                  </View>
                  <View style={[
                    styles.statusBadge,
                    {
                      backgroundColor: participant.status === 'accepted' ? '#4CAF50' :
                        participant.status === 'declined' ? '#F44336' : '#FFC107'
                    }
                  ]}>
                    <Text style={styles.statusText}>
                      {participant.status === 'accepted' ? '✓' :
                        participant.status === 'declined' ? '✕' : '?'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Section Commentaires */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Commentaires</Text>
              <TouchableOpacity onPress={() => setShowComments(true)}>
                <Text style={styles.seeAllText}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.commentsList}>
              {comments.length > 0 ? (
                comments.slice(0, 3).map((comment, index) => {
                  return (
                    <View key={`${comment.id}-${index}`} style={styles.comment}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentAuthor}>
                          {comment.fullName || `${comment.user?.firstname || ''} ${comment.user?.lastname || ''}`}
                        </Text>
                        <Text style={styles.commentDate}>
                          {formatCommentDate(comment.createdAt || comment.created_at || '')}
                        </Text>
                      </View>
                      <Text style={styles.commentContent}>{comment.content}</Text>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyComment}>
                  <Text style={styles.emptyCommentText}>
                    Aucun commentaire
                  </Text>
                </View>
              )}
              {comments.length > 3 && (
                <TouchableOpacity onPress={() => setShowComments(true)}>
                  <Text style={styles.seeMoreText}>
                    Voir {comments.length - 3} commentaire(s) de plus
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>

        {/* COMMENTÉ - Zone de saisie des commentaires retirée */}
        {/*
        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Ajouter un commentaire..."
            value={newComment}
            onChangeText={setNewComment}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !newComment.trim() && styles.sendButtonDisabled
            ]}
            onPress={handleAddComment}
            disabled={!newComment.trim()}
          >
            <Ionicons name="send" size={24} color={newComment.trim() ? '#007AFF' : '#ccc'} />
          </TouchableOpacity>
        </View>
        */}
      </KeyboardAvoidingView>

      {/* Modal d'invitation */}
      <Modal
        visible={isInviteModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsInviteModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setIsInviteModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Inviter des amis</Text>
            <View style={styles.modalHeaderRight} />
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher des amis..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <FlatList
            data={filteredFriends}
            renderItem={renderFriendItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.friendsList}
          />

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[
                styles.inviteButton,
                (selectedFriends.length === 0 || isInviting) && styles.inviteButtonDisabled
              ]}
              onPress={handleSendInvitations}
              disabled={selectedFriends.length === 0 || isInviting}
            >
              {isInviting ? (
                <>
                  <Ionicons
                    name="refresh"
                    size={20}
                    color="#fff"
                    style={[styles.inviteButtonIcon, { transform: [{ rotate: '360deg' }] }]}
                  />
                  <Text style={styles.inviteButtonText}>
                    Envoi en cours...
                  </Text>
                </>
              ) : selectedFriends.length > 0 ? (
                <>
                  <Ionicons
                    name="paper-plane"
                    size={20}
                    color="#fff"
                    style={styles.inviteButtonIcon}
                  />
                  <Text style={styles.inviteButtonText}>
                    Inviter {selectedFriends.length} ami{selectedFriends.length > 1 ? 's' : ''}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name="person-add-outline"
                    size={20}
                    color="#8E8E93"
                    style={styles.inviteButtonIcon}
                  />
                  <Text style={[styles.inviteButtonText, styles.inviteButtonTextDisabled]}>
                    Sélectionner des amis
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Modal des commentaires complets */}
      <Modal
        visible={showComments}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowComments(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowComments(false)}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Commentaires</Text>
            <View style={styles.modalHeaderRight} />
          </View>

          <ChatComments sessionId={sessionId} onCommentsReload={handleCommentsReload} />
        </SafeAreaView>
      </Modal>
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
  headerInviteButton: {
    padding: 8,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  sessionHeader: {
    backgroundColor: '#fff',
    padding: 16,
  },
  sessionHeaderLeft: {
    flex: 1,
  },
  sportTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  dateTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    marginLeft: 4,
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
    marginBottom: 12,
  },
  participantsList: {
    gap: 12,
  },
  participant: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
  },
  organizerBadge: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 2,
  },
  statusBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  commentsList: {
    gap: 16,
  },
  comment: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentAuthor: {
    fontWeight: '600',
    fontSize: 14,
  },
  commentDate: {
    fontSize: 12,
    color: '#666',
  },
  commentContent: {
    fontSize: 14,
    color: '#333',
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
    paddingBottom: Platform.OS === 'ios' ? height.safeAreaBottom + 12 : 12,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    padding: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  invitationActions: {
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#34C759',
  },
  declineButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalCloseButton: {
    padding: 8,
    marginLeft: -8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  modalHeaderRight: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 8,
  },
  friendsList: {
    padding: 16,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedFriend: {
    backgroundColor: '#f0f8ff',
  },
  friendName: {
    fontSize: 16,
  },
  checkmark: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
    paddingBottom: Platform.OS === 'ios' ? height.safeAreaBottom + 16 : 16,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inviteButtonDisabled: {
    backgroundColor: '#E5E5EA',
    shadowOpacity: 0,
    elevation: 0,
  },
  inviteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  inviteButtonTextDisabled: {
    color: '#8E8E93',
  },
  inviteButtonIcon: {
    marginRight: 4,
  },
  emptyComment: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    gap: 8,
  },
  emptyCommentText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  participantsMaxText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  participantsLimit: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  seeAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  seeMoreText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
  },
}); 