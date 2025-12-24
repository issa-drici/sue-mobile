import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import {
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useAuth } from '../app/context/auth';
import { useCancelFriendRequest, useGetUserById, useSendFriendRequest } from '../services';
import { SessionsApi } from '../services/api/sessionsApi';
import { Sport } from '../types/sport';
import { formatSportName, getSportEmoji } from '../utils/sportEmojis';
import { InlineLoading } from './OptimizedLoading';

const ACCENT_COLOR = '#D4FC79'; // Electric Volt

interface UserProfileModalProps {
  visible: boolean;
  onClose: () => void;
  userId?: string;
  userFirstname?: string;
  userLastname?: string;
  userStatus?: string;
  sessionId?: string;
  isSessionOrganizer?: boolean;
  isSessionFinished?: boolean;
  onOrganizerChanged?: () => void;
}

export default function UserProfileModal({
  visible,
  onClose,
  userId,
  userFirstname,
  userLastname,
  userStatus,
  sessionId,
  isSessionOrganizer,
  isSessionFinished,
  onOrganizerChanged,
}: UserProfileModalProps) {
  const { data: userProfile, fetchUserById, isLoading } = useGetUserById();
  const { sendFriendRequest, isLoading: isSendingRequest } = useSendFriendRequest();
  const { cancelFriendRequest, isLoading: isCancellingRequest } = useCancelFriendRequest();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (visible && userId) {
      fetchUserById(userId);
    }
  }, [visible, userId, fetchUserById]);

  const handleAddFriend = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!userId) return;

    if (currentUser && currentUser.id === userId) {
      Alert.alert('Erreur', 'Vous ne pouvez pas vous ajouter vous-même');
      return;
    }

    try {
      await sendFriendRequest(userId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await fetchUserById(userId);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (error.message && error.message.includes('existe déjà')) {
        Alert.alert(
          'Déjà demandé',
          'Patience, l\'athlète n\'a pas encore répondu.',
          [
            { text: 'OK', style: 'default' },
            {
              text: 'Annuler la demande',
              style: 'destructive',
              onPress: () => handleCancelFriend()
            }
          ]
        );
      } else {
        Alert.alert('Erreur', 'Impossible d\'envoyer la demande');
      }
    }
  };

  const handleCancelFriend = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!userId) return;

    try {
      await cancelFriendRequest(userId);
      await fetchUserById(userId);
    } catch (error: any) {
      Alert.alert('Erreur', 'Impossible d\'annuler la demande');
    }
  };

  const handleMakeAdmin = () => {
    if (!sessionId || !userId) return;

    Alert.alert(
      'Nommer administrateur',
      `Voulez-vous vraiment nommer ${userProfile?.firstname} administrateur de la session ? Vous perdrez vos droits d'organisateur.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: async () => {
            try {
              await SessionsApi.changeOrganizer(sessionId, userId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onClose();
              if (onOrganizerChanged) onOrganizerChanged();
            } catch (error) {
              Alert.alert('Erreur', "Impossible de changer l'organisateur");
            }
          }
        }
      ]
    );
  };

  const renderContent = () => {
    if (isLoading || !userProfile) {
      return <InlineLoading message="Chargement du profil..." />;
    }

    const isMe = currentUser?.id === userId;

    return (
      <Animated.View entering={FadeInUp.springify()} style={styles.content}>
        {/* Avatar & Name */}
        <View style={styles.headerSection}>
          <Image
            source={require('../assets/images/icon-avatar.png')}
            style={styles.avatar}
          />
          <Text style={styles.userName}>
            {userProfile.firstname.toUpperCase()}
          </Text>
          <Text style={styles.userLastName}>
            {userProfile.lastname.toUpperCase()}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userProfile.stats?.sessionsCreated || 0}</Text>
            <Text style={styles.statLabel}>CRÉÉES</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userProfile.stats?.sessionsParticipated || 0}</Text>
            <Text style={styles.statLabel}>JOUÉES</Text>
          </View>
        </View>

        {/* Sports */}
        {userProfile.sports_preferences && userProfile.sports_preferences.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TERRAIN DE JEU</Text>
            <View style={styles.sportsContainer}>
              {userProfile.sports_preferences.map((sport, index) => (
                <View key={index} style={styles.sportBadge}>
                  <Text style={styles.sportEmoji}>{getSportEmoji(sport as Sport)}</Text>
                  <Text style={styles.sportName}>{formatSportName(sport).toUpperCase()}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Action Button */}
        {!isMe && (
          <View style={styles.actionContainer}>
            {userProfile.isAlreadyFriend ? (
              <View style={styles.friendStatus}>
                <Ionicons name="checkmark-circle" size={24} color={ACCENT_COLOR} />
                <Text style={styles.friendStatusText}>DANS LE SQUAD</Text>
              </View>
            ) : userProfile.hasPendingRequest ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleCancelFriend}
                disabled={isCancellingRequest}
              >
                <Text style={[styles.actionButtonText, { color: '#FF3B30' }]}>
                  ANNULER LA DEMANDE
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleAddFriend}
                disabled={isSendingRequest}
              >
                <Text style={styles.actionButtonText}>
                  RECRUTER DANS LE SQUAD
                </Text>
                <Ionicons name="add" size={24} color="#000" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Admin Action Button */}
        {isSessionOrganizer && !isMe && sessionId && userStatus !== 'declined' && !isSessionFinished && (
          <View style={[styles.actionContainer, { marginTop: 12 }]}>
            <TouchableOpacity
              style={[styles.actionButton, styles.adminButton]}
              onPress={handleMakeAdmin}
            >
              <Text style={styles.adminButtonText}>
                NOMMER ADMIN
              </Text>
              <Ionicons name="key" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#000" />
          </TouchableOpacity>
        </View>
        {renderContent()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    padding: 16,
    alignItems: 'flex-end',
  },
  closeButton: {
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },

  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F5F5F5',
    marginBottom: 24,
  },
  userName: {
    fontSize: 32,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#000',
    lineHeight: 32,
    textAlign: 'center',
  },
  userLastName: {
    fontSize: 32,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#000',
    lineHeight: 32,
    textAlign: 'center',
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#000',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E0E0',
  },

  section: {
    width: '100%',
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  sportsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  sportEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  sportName: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000',
  },

  actionContainer: {
    width: '100%',
    marginTop: 'auto',
    marginBottom: 40,
  },
  actionButton: {
    backgroundColor: ACCENT_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 30,
    gap: 8,
    shadowColor: "#D4FC79",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cancelButton: {
    backgroundColor: '#FFF0F0',
    shadowOpacity: 0,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#000',
  },
  friendStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 30,
  },
  friendStatusText: {
    fontSize: 14,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#000',
  },
  adminButton: {
    backgroundColor: '#FFD700', // Gold color for admin
    shadowColor: "#FFD700",
  },
  adminButtonText: {
    fontSize: 16,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#000',
  },
});
