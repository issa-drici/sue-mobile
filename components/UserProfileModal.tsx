import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useAuth } from '../app/context/auth';
import { useCancelFriendRequest, useGetUserById, useSendFriendRequest } from '../services';
import { SessionsApi } from '../services/api/sessionsApi';
import { InlineLoading } from './OptimizedLoading';
import { BrandColors } from '../constants/Colors';

interface UserProfileModalProps {
  visible: boolean;
  onClose: () => void;
  userId?: string;
  userFirstname?: string;
  userLastname?: string;
  userStatus?: string; // 'accepted', 'pending', 'declined'
  isPlayerOrganizer?: boolean; // S'il s'agit de l'organisateur de la session
  sessionId?: string;
  isSessionOrganizer?: boolean; // Si l'utilisateur connecté est organisateur
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
  isPlayerOrganizer,
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
      return (
        <View style={styles.loadingWrapper}>
          <InlineLoading message="Chargement du profil..." />
        </View>
      );
    }

    const isMe = currentUser?.id === userId;
    const initials = `${(userProfile.firstname || '').charAt(0)}${(userProfile.lastname || '').charAt(0)}`.toUpperCase() || '?';
    
    // Palette de couleurs pour l'initiale
    const avatarBgColors = ['#E3F2FD', '#F3E5F5', '#E8F5E9', '#FFF3E0', '#FFEBEE'];
    const colorIdx = Math.abs((userProfile.id || '').split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)) % avatarBgColors.length;
    const avatarBg = avatarBgColors[colorIdx];

    return (
      <Animated.View entering={FadeInUp.springify()} style={styles.content}>
        
        {/* Avatar avec badges uniformes */}
        <View style={styles.avatarSection}>
          {userProfile.avatar ? (
            <Image
              source={{ uri: userProfile.avatar }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: avatarBg }]}>
              <Text style={styles.avatarPlaceholderText}>{initials}</Text>
            </View>
          )}

          {/* Badge Organisateur (Étoile) */}
          {isPlayerOrganizer ? (
            <View style={styles.organizerBadgeLarge}>
              <Ionicons name="star" size={10} color="#000" />
            </View>
          ) : null}

          {/* Badge Statut de Participation */}
          {userStatus === 'accepted' ? (
            <View style={[styles.statusBadgeLarge, { backgroundColor: '#70A831' }]}>
              <Ionicons name="checkmark" size={10} color="#FFF" />
            </View>
          ) : null}
          {userStatus === 'pending' ? (
            <View style={[styles.statusBadgeLarge, { backgroundColor: '#F59223' }]}>
              <Ionicons name="time" size={10} color="#FFF" />
            </View>
          ) : null}
          {userStatus === 'declined' ? (
            <View style={[styles.statusBadgeLarge, { backgroundColor: '#D32F2F' }]}>
              <Ionicons name="close" size={10} color="#FFF" />
            </View>
          ) : null}
        </View>

        {/* Nom Complet */}
        <Text style={styles.userNameText}>
          {userProfile.firstname} {userProfile.lastname}
        </Text>

        {/* Lignes d'informations */}
        {!isMe ? (
          <View style={styles.infoBlock}>
            {/* Statut Squad */}
            <View style={styles.infoRow}>
              <Ionicons 
                name={userProfile.isAlreadyFriend ? "checkmark-circle" : "time"} 
                size={16} 
                color={userProfile.isAlreadyFriend ? "#70A831" : "#F59223"} 
                style={styles.infoIcon} 
              />
              <Text style={styles.infoText}>
                {userProfile.isAlreadyFriend ? 'Dans ton Squad' : 'Pas encore dans ton Squad'}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Actions de répertoire */}
        <View style={styles.actionContainer}>
          {!isMe ? (
            <>
              {userProfile.isAlreadyFriend ? null : userProfile.hasPendingRequest ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.primaryActionBtn, styles.cancelBtn]}
                  onPress={handleCancelFriend}
                  disabled={isCancellingRequest}
                >
                  <Text style={styles.cancelBtnText}>Annuler la demande</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.primaryActionBtn}
                  onPress={handleAddFriend}
                  disabled={isSendingRequest}
                >
                  <Ionicons name="person-add" size={16} color="#000" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryActionBtnText}>Ajouter au répertoire</Text>
                </TouchableOpacity>
              )}
            </>
          ) : null}

          {/* Nommer administrateur */}
          {!!isSessionOrganizer && !isMe && !!sessionId && userStatus !== 'declined' && !isSessionFinished ? (
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.adminActionBtn}
              onPress={handleMakeAdmin}
            >
              <Ionicons name="key" size={16} color="#000" style={{ marginRight: 8 }} />
              <Text style={styles.adminActionBtnText}>Nommer administrateur</Text>
            </TouchableOpacity>
          ) : null}

          {/* Fermer */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.secondaryActionBtn}
            onPress={onClose}
          >
            <Text style={styles.secondaryActionBtnText}>Fermer</Text>
          </TouchableOpacity>
        </View>

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
        {/* Barre supérieure avec indicateur et bouton X */}
        <View style={styles.sheetHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButtonX}>
            <Ionicons name="close" size={20} color="#000" />
          </TouchableOpacity>
          <View style={styles.dragIndicator} />
          <View style={{ width: 36 }} />
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
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  closeButtonX: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragIndicator: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E5E5EA',
    alignSelf: 'center',
  },
  loadingWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
    paddingTop: 16,
  },
  avatarSection: {
    position: 'relative',
    width: 90,
    height: 90,
    marginBottom: 16,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F5F5F7',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
  },
  organizerBadgeLarge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FFC107',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  statusBadgeLarge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  userNameText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 16,
  },
  infoBlock: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
  actionContainer: {
    width: '100%',
    gap: 12,
    marginTop: 'auto',
    marginBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  primaryActionBtn: {
    width: '100%',
    height: 46,
    borderRadius: 12,
    backgroundColor: BrandColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  cancelBtn: {
    backgroundColor: '#FFEBEE',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D32F2F',
  },
  friendStatusContainer: {
    width: '100%',
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F2F9EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendStatusLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#70A831',
  },
  adminActionBtn: {
    width: '100%',
    height: 46,
    borderRadius: 12,
    backgroundColor: '#FFF9C4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  secondaryActionBtn: {
    width: '100%',
    height: 46,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
});
