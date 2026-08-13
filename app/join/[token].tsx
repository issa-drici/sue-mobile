import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  StatusBar,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { SessionsApi } from '../../services/api/sessionsApi';
import { SessionSharePreview } from '../../services/types/sessions';
import { clearPendingShareToken, setPendingShareToken } from '../../utils/shareLink';
import { useAuth } from '../context/auth';
import { getSportEmoji } from '../../utils';

type ScreenState = 'loading' | 'preview' | 'joining' | 'error';

function formatFrenchDate(isoDate: string): string {
  try {
    const [year, month, day] = isoDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const parts = date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    // Capitaliser le jour et le mois (ex: Lundi 6 Juillet)
    return parts.split(' ').map((word, index) => {
      if (index === 0 || index === 2) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    }).join(' ');
  } catch {
    return isoDate;
  }
}

// Formatage de l'heure en français (ex: "18:00 - 19:00")
function formatSessionTimeRange(start?: string, end?: string) {
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '00:00';
    return timeStr.slice(0, 5);
  };
  return `${formatTime(start)} – ${formatTime(end)}`;
}

export default function JoinSessionScreen() {
  const { token, auto, from } = useLocalSearchParams<{ token: string; auto?: string; from?: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [state, setState] = useState<ScreenState>('loading');
  const [preview, setPreview] = useState<SessionSharePreview | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const autoJoinAttempted = useRef(false);

  // Résoudre l'aperçu public (fonctionne connecté ou non)
  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      if (!token) {
        setState('error');
        return;
      }
      try {
        const data = await SessionsApi.resolveShareToken(token, from);
        if (cancelled) return;

        // Déjà organisateur ou participant accepté : on saute l'aperçu et on
        // ouvre directement la session, sans garder cet écran dans l'historique
        // (retour = écran des sessions, pas l'écran d'invitation).
        if (data.sessionId) {
          router.replace('/(tabs)');
          router.push(`/session/${data.sessionId}`);
          return;
        }

        setPreview(data);
        setState('preview');
      } catch {
        if (!cancelled) setState('error');
      }
    }

    resolve();
    return () => {
      cancelled = true;
    };
  }, [token, from]);

  const handleJoin = useCallback(async () => {
    if (!token) return;

    if (!isAuthenticated) {
      await setPendingShareToken(token);
      router.replace('/(auth)/login');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setState('joining');
      const session = await SessionsApi.joinByShareToken(token, from);
      await clearPendingShareToken();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/session/${session.id}`);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrorMessage(error?.message || 'Impossible de rejoindre la session pour le moment.');
      setState('preview');
    }
  }, [token, isAuthenticated, router, from]);

  // Rejoindre automatiquement juste après connexion/inscription (auto=1)
  useEffect(() => {
    if (
      auto === '1' &&
      isAuthenticated &&
      state === 'preview' &&
      !autoJoinAttempted.current
    ) {
      autoJoinAttempted.current = true;
      handleJoin();
    }
  }, [auto, isAuthenticated, state, handleJoin, from]);

  const getInitials = (name: string): string => {
    if (!name) return "";
    const parts = name.split(' ');
    const initials = parts.map(p => p.charAt(0)).join('').toUpperCase();
    return initials.slice(0, 2);
  };

  // Rendu d'avatar intelligent (photo de profil ou initiales)
  const renderParticipantAvatar = (
    avatarUrl: string | null | undefined, 
    name: string,
    voltBorder: boolean = false
  ) => {
    const initials = getInitials(name);
    const borderStyle = voltBorder ? styles.organizerAvatarBorder : null;
    
    if (avatarUrl) {
      return (
        <View style={[styles.participantAvatar, borderStyle]}>
          <Image 
            source={{ uri: avatarUrl }} 
            style={styles.avatarImg} 
          />
        </View>
      );
    } else {
      return (
        <View style={[styles.participantAvatar, borderStyle]}>
          <Text style={styles.participantInitials}>{initials}</Text>
        </View>
      );
    }
  };

  if (state === 'loading' || state === 'joining') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#D4FC79" />
          {state === 'joining' && (
            <Text style={styles.loadingText}>On te fait entrer…</Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  if (state === 'error' || !preview) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Lien indisponible</Text>
          <Text style={styles.errorText}>
            Ce lien de session n'est plus valide. Il a peut-être expiré ou la session
            n'existe plus.
          </Text>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.secondaryButtonText}>Retour à l'accueil</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // En-tête = la personne qui t'a invité (paramètre ?from) si dispo, sinon l'organisateur.
  const inviterFullName = preview.inviter?.fullName || preview.organizer.fullName;
  const inviterAvatarUrl = preview.inviter?.avatarUrl ?? preview.organizer.avatarUrl;
  const inviterFirstName = inviterFullName.split(' ')[0] || "Quelqu'un";

  const organizerFirstName = preview.organizer.fullName.split(' ')[0] || "L'organisateur";
  const isFemale = organizerFirstName.toLowerCase().endsWith('a') || organizerFirstName.toLowerCase().endsWith('e');
  const organizerRole = isFemale ? 'Organisatrice' : 'Organisateur';

  // Extraction des participants confirmés (en excluant l'organisateur)
  const confirmedParticipants = (preview.participants || [])
    .filter(p => p.id !== preview.organizer.id)
    .filter(p => p.status === 'accepted');

  const otherShown = confirmedParticipants.slice(0, 2);

  // Calcul du nombre de participants supplémentaires dans le badge "+N et toi ?"
  const extraCount = Math.max(0, preview.participantsCount - 1 - otherShown.length);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.springify()} style={styles.mainBlock}>
          
          {/* Header Logo (Adaptive Icon local) */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/images/adaptive-icon.png')} 
              style={styles.logo} 
            />
          </View>

          {/* Organizer Avatar & Volt Decoration Rays */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              {/* Ticks Gauche */}
              <View style={styles.ticksLeft}>
                <View style={[styles.tick, { width: 12, transform: [{ rotate: '-25deg' }] }]} />
                <View style={[styles.tick, { width: 14 }]} />
                <View style={[styles.tick, { width: 12, transform: [{ rotate: '25deg' }] }]} />
              </View>

              {/* Avatar Image ou Initiales (de la personne qui invite) */}
              <View style={styles.avatarInner}>
                {inviterAvatarUrl ? (
                  <Image
                    source={{ uri: inviterAvatarUrl }}
                    style={styles.avatarImgFull}
                  />
                ) : (
                  <View style={styles.avatarInitialsFull}>
                    <Text style={styles.avatarInitialsTextFull}>
                      {getInitials(inviterFullName)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Ticks Droite */}
              <View style={styles.ticksRight}>
                <View style={[styles.tick, { width: 12, transform: [{ rotate: '25deg' }] }]} />
                <View style={[styles.tick, { width: 14 }]} />
                <View style={[styles.tick, { width: 12, transform: [{ rotate: '-25deg' }] }]} />
              </View>
            </View>

            {/* Title Text */}
            <Text style={styles.invitationText}>
              <Text style={styles.organizerNameHighlight}>{inviterFirstName}</Text> t'invite{"\n"}
              à rejoindre cette session
            </Text>

            {/* Sport Name */}
            <Text style={styles.sportTitle}>
              {getSportEmoji(preview.sport)} {preview.sportName}
            </Text>
          </View>

          {/* Session Details List */}
          <View style={styles.infoBlock}>
            {/* Date */}
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="calendar-outline" size={20} color="#8CBF3D" />
              </View>
              <Text style={styles.infoText}>{formatFrenchDate(preview.date)}</Text>
            </View>

            {/* Time */}
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="time-outline" size={20} color="#8CBF3D" />
              </View>
              <Text style={styles.infoText}>
                {formatSessionTimeRange(preview.startTime, preview.endTime)}
              </Text>
            </View>

            {/* Location */}
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="location-outline" size={20} color="#8CBF3D" />
              </View>
              <Text style={styles.infoText} numberOfLines={1}>{preview.location}</Text>
            </View>

            {/* Organizer */}
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="person-outline" size={20} color="#8CBF3D" />
              </View>
              <Text style={styles.infoText}>
                Organisé par {preview.organizer.fullName}
              </Text>
            </View>
          </View>

          {/* Participants Card */}
          <View style={styles.participantsCard}>
            <Text style={styles.participantsTitle}>PARTICIPANTS</Text>
            <View style={styles.participantsList}>
              {/* Organizer */}
              <View style={styles.participantCol}>
                {renderParticipantAvatar(preview.organizer.avatarUrl, preview.organizer.fullName, true)}
                <Text style={styles.participantName} numberOfLines={1}>
                  {organizerFirstName}
                </Text>
                <View style={[styles.badge, styles.organizerBadge]}>
                  <Text style={styles.organizerBadgeText}>{organizerRole}</Text>
                </View>
              </View>

              {/* Other Confirmed Participants */}
              {otherShown.map((p) => (
                <View key={p.id} style={styles.participantCol}>
                  {renderParticipantAvatar(p.avatarUrl, p.fullName)}
                  <Text style={styles.participantName} numberOfLines={1}>
                    {p.fullName.split(' ')[0]}
                  </Text>
                  <View style={[styles.badge, styles.participantBadge]}>
                    <Text style={styles.participantBadgeText}>Participe</Text>
                  </View>
                </View>
              ))}

              {/* Guest Slot "et toi ?" */}
              <View style={styles.participantCol}>
                <View style={styles.guestAvatar}>
                  <Text style={styles.guestAvatarText}>
                    {extraCount > 0 ? `+${extraCount}` : '?'}
                  </Text>
                </View>
                <Text style={styles.participantName} numberOfLines={1}>et toi ?</Text>
                <View style={[styles.badge, styles.guestBadge]}>
                  <Text style={styles.guestBadgeText}>Invité</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Lightning Info Card Banner */}
          <View style={styles.warningCard}>
            <Ionicons name="flash" size={20} color="#8CBF3D" />
            <Text style={styles.warningText}>
              Confirme ta présence et reste informé des changements de la session.
            </Text>
          </View>

          {/* Error Message */}
          {errorMessage && <Text style={styles.inlineError}>{errorMessage}</Text>}

        </Animated.View>

        {/* Buttons Action */}
        <View style={styles.actionsBlock}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleJoin}>
            <Text style={styles.primaryButtonText}>
              {isAuthenticated ? 'Je rejoins la session' : 'Se connecter pour rejoindre'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#000000" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.linkButtonText}>Plus tard</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  mainBlock: {
    gap: 12,
  },
  actionsBlock: {
    marginTop: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
    backgroundColor: '#FAFAFA',
  },
  loadingText: {
    color: '#71717A',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: '#D4FC79',
    padding: 2,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
    overflow: 'hidden',
  },
  avatarImgFull: {
    width: '100%',
    height: '100%',
  },
  avatarInitialsFull: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F2F9EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitialsTextFull: {
    color: '#70A831',
    fontWeight: '900',
    fontSize: 24,
  },
  ticksLeft: {
    position: 'absolute',
    right: '100%',
    marginRight: 16,
    top: '50%',
    marginTop: -14,
    flexDirection: 'column',
    gap: 6,
    alignItems: 'flex-end',
  },
  ticksRight: {
    position: 'absolute',
    left: '100%',
    marginLeft: 16,
    top: '50%',
    marginTop: -14,
    flexDirection: 'column',
    gap: 6,
    alignItems: 'flex-start',
  },
  tick: {
    height: 2.5,
    backgroundColor: '#D4FC79',
    borderRadius: 1.25,
  },
  invitationText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 26,
    marginTop: 12,
  },
  organizerNameHighlight: {
    color: '#BCEE21',
  },
  sportTitle: {
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: '#000000',
    textAlign: 'center',
    marginTop: 6,
  },
  infoBlock: {
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  infoIconWrapper: {
    width: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    color: '#333333',
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  participantsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    padding: 16,
    paddingVertical: 12,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.015,
    shadowRadius: 8,
    elevation: 1,
  },
  participantsTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  participantsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
  },
  participantCol: {
    alignItems: 'center',
    minWidth: 52,
    maxWidth: 64,
  },
  participantAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F9EB',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  organizerAvatarBorder: {
    borderWidth: 2,
    borderColor: '#D4FC79',
    padding: 1.5,
    backgroundColor: '#FFFFFF',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  participantInitials: {
    color: '#70A831',
    fontWeight: '900',
    fontSize: 12,
  },
  participantName: {
    color: '#1E293B',
    fontWeight: '700',
    fontSize: 10,
    marginTop: 6,
    textAlign: 'center',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 6,
    borderWidth: 1,
  },
  organizerBadge: {
    backgroundColor: '#F5FCD2',
    borderColor: '#E5F2A8',
  },
  organizerBadgeText: {
    color: '#8CA825',
    fontWeight: '800',
    fontSize: 8,
    textTransform: 'uppercase',
  },
  participantBadge: {
    backgroundColor: '#EAFCD6',
    borderColor: '#DAF2BB',
  },
  participantBadgeText: {
    color: '#76A831',
    fontWeight: '800',
    fontSize: 8,
    textTransform: 'uppercase',
  },
  guestBadge: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  guestBadgeText: {
    color: '#64748B',
    fontWeight: '800',
    fontSize: 8,
    textTransform: 'uppercase',
  },
  guestAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestAvatarText: {
    color: '#94A3B8',
    fontWeight: '900',
    fontSize: 14,
  },
  warningCard: {
    backgroundColor: '#F8FEDB',
    borderColor: '#D4FC79',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  warningText: {
    flex: 1,
    fontSize: 11,
    color: '#0F172A',
    fontWeight: '700',
    lineHeight: 15,
  },
  primaryButton: {
    backgroundColor: '#D4FC79',
    borderRadius: 16,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 2,
  },
  linkButtonText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inlineError: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  errorTitle: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 8,
  },
  errorText: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  secondaryButton: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  secondaryButtonText: {
    color: '#70A831',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
