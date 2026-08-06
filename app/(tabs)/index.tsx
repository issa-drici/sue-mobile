import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { InlineLoading } from '../../components/OptimizedLoading';
import { MainScreenLayout } from '../../components/ui/ScreenLayout';
import { useGetSessions } from '../../services';
import { SportSession } from '../../types/sport';
import { useAuth } from '../context/auth';
import { useGlobalNotifications } from '../../context/globalNotifications';
import { useGlobalFriendRequests } from '../../context/globalFriendRequests';
import { BrandColors } from '../../constants/Colors';

// Config des sports pour les icônes et couleurs correspondantes
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

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: sessions, isLoading, refetch, isFirstLoading } = useGetSessions();
  const { user } = useAuth();
  const { unreadCount } = useGlobalNotifications();
  const { friendRequestsCount, refetch: refetchFriendRequests } = useGlobalFriendRequests();
  const [refreshing, setRefreshing] = React.useState(false);

  // Recharge sur focus (quand l'utilisateur revient sur l'accueil)
  useFocusEffect(
    React.useCallback(() => {
      refetch();
      refetchFriendRequests();
    }, [refetch, refetchFriendRequests])
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Promise.all([
        refetch(),
        refetchFriendRequests()
      ]);
    } catch (e) {
      console.error(e);
    }
    setRefreshing(false);
  }, [refetch, refetchFriendRequests]);

  const handleSessionPress = (sessionId: string) => {
    Haptics.selectionAsync();
    router.push(`/session/${sessionId}`);
  };

  // Formateur de date et heure style maquette ("Aujourd'hui • 19:00" ou "Vendredi 17 janv. • 20:00")
  const formatSessionDateTime = (dateStr: string, timeStr: string) => {
    try {
      const sessionDate = new Date(dateStr);
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);

      const isToday = sessionDate.toDateString() === today.toDateString();
      const isTomorrow = sessionDate.toDateString() === tomorrow.toDateString();
      const formattedTime = (timeStr || '00:00').slice(0, 5);

      if (isToday) {
        return `Aujourd'hui • ${formattedTime}`;
      } else if (isTomorrow) {
        return `Demain • ${formattedTime}`;
      } else {
        // Obtenir la date formatée en français
        const options: Intl.DateTimeFormatOptions = {
          weekday: 'long',
          day: 'numeric',
          month: 'short'
        };
        const parts = sessionDate.toLocaleDateString('fr-FR', options);
        // Capitaliser le premier mot (ex: "vendredi 17 janv." -> "Vendredi 17 janv.")
        const formattedDate = parts.charAt(0).toUpperCase() + parts.slice(1);
        return `${formattedDate} • ${formattedTime}`;
      }
    } catch (e) {
      return `${dateStr} • ${(timeStr || '00:00').slice(0, 5)}`;
    }
  };

  // Tri des sessions réelles de l'API
  const displaySessions = React.useMemo(() => {
    if (!sessions) return [];
    
    return [...sessions].sort((a, b) => {
      const dateTimeA = new Date(`${a.date}T${a.startTime || '00:00'}`);
      const dateTimeB = new Date(`${b.date}T${b.startTime || '00:00'}`);
      return dateTimeA.getTime() - dateTimeB.getTime();
    });
  }, [sessions]);

  // Extraire la prochaine session de l'utilisateur
  const nextSession = React.useMemo(() => {
    if (displaySessions.length === 0) return null;

    // Trouver la première session dans le futur où l'utilisateur participe ou organise
    const now = new Date();
    const futureSessions = displaySessions.filter(s => {
      const sessionDateTime = new Date(`${s.date}T${s.startTime || '00:00'}`);
      return sessionDateTime >= now;
    });

    if (futureSessions.length === 0) return displaySessions[0];

    const userInSession = futureSessions.find(s => {
      const isOrganizer = s.organizer?.id === user?.id;
      const isParticipant = s.participants?.some(p => p.id === user?.id && (p.status === 'accepted' || p.status === 'pending'));
      return isOrganizer || isParticipant;
    });

    return userInSession || futureSessions[0];
  }, [displaySessions, user]);

  // Toutes les autres sessions pour la section "À VENIR"
  const upcomingSessions = React.useMemo(() => {
    if (!nextSession) return displaySessions;
    return displaySessions.filter(s => s.id !== nextSession.id);
  }, [displaySessions, nextSession]);

  // Rendu des avatars empilés (Initials fallback en l'absence d'avatar réel du backend)
  const renderOverlappingAvatars = (participants: any[]) => {
    const accepted = participants.filter(p => p.status === 'accepted');
    const visible = accepted.slice(0, 3);
    const remaining = accepted.length - visible.length;

    // Palette de couleurs douces pour les cercles d'initiales
    const avatarBgColors = ['#E3F2FD', '#F3E5F5', '#E8F5E9', '#FFF3E0', '#FFEBEE'];

    return (
      <View style={styles.avatarsRow}>
        {visible.map((player, idx) => {
          if (player.avatar) {
            return (
              <Image
                key={player.id || idx}
                source={{ uri: player.avatar }}
                style={[
                  styles.avatarIcon,
                  idx > 0 && { marginLeft: -8 }
                ]}
              />
            );
          } else {
            // Initiales (ex: Jean Dupont -> JD)
            const initials = `${(player.firstname || '').charAt(0)}${(player.lastname || '').charAt(0)}`.toUpperCase() || '?';
            // Calculer un index déterministe pour la couleur de fond basé sur l'id
            const colorIdx = Math.abs((player.id || '').split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)) % avatarBgColors.length;
            const bgCol = avatarBgColors[colorIdx];

            return (
              <View
                key={player.id || idx}
                style={[
                  styles.avatarIconPlaceholder,
                  { backgroundColor: bgCol },
                  idx > 0 && { marginLeft: -8 }
                ]}
              >
                <Text style={styles.avatarPlaceholderText}>{initials}</Text>
              </View>
            );
          }
        })}
        {remaining > 0 && (
          <View style={[styles.avatarMore, { marginLeft: -8 }]}>
            <Text style={styles.avatarMoreText}>+{remaining}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderUpcomingSessionItem = ({ item, index }: { item: SportSession; index: number }) => {
    const acceptedParticipants = item.participants.filter(p => p.status === 'accepted');
    const maxParticipants = item.maxParticipants;
    const isFull = maxParticipants ? acceptedParticipants.length >= maxParticipants : false;
    const missingCount = maxParticipants ? maxParticipants - acceptedParticipants.length : 0;
    const sportConfig = getSportConfig(item.sport);

    return (
      <View style={styles.upcomingCardContainer}>
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={() => handleSessionPress(item.id)}
          style={styles.upcomingCard}
        >
          <View style={styles.upcomingRow}>
            {/* Icône du sport */}
            <View style={[styles.sportIconCircleSmall, { backgroundColor: sportConfig.color }]}>
              <Ionicons name={sportConfig.icon as any} size={15} color="#FFF" />
            </View>
            
            {/* Détails */}
            <View style={styles.upcomingDetails}>
              <Text style={styles.upcomingSportName}>
                {item.sport.charAt(0).toUpperCase() + item.sport.slice(1)}
              </Text>
              <Text style={styles.upcomingDateText}>
                {formatSessionDateTime(item.date, item.startTime)}
              </Text>
              <View style={styles.upcomingLocationRow}>
                <Ionicons name="location-sharp" size={11} color="#999" />
                <Text style={styles.upcomingLocationText} numberOfLines={1}>
                  {item.location}
                </Text>
              </View>
            </View>
            
            {/* Section droite (Avatars, Statut et Ratio) */}
            <View style={styles.upcomingRightColumn}>
              {/* Ratio et Chevron */}
              <View style={styles.upcomingRatioAndArrow}>
                <Text style={styles.upcomingRatioText}>
                  <Text style={styles.upcomingRatioBold}>{acceptedParticipants.length}</Text>
                  {maxParticipants ? (
                    <Text style={styles.upcomingRatioSmall}> / {maxParticipants}</Text>
                  ) : null}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
              </View>
              
              {/* Avatars et Statuts */}
              <View style={styles.upcomingAvatarsSection}>
                {renderOverlappingAvatars(item.participants)}
                <View style={styles.upcomingStatusContainer}>
                  {maxParticipants ? (
                    isFull ? (
                      <Text style={styles.upcomingStatusFull}>Complet</Text>
                    ) : (
                      <Text style={styles.upcomingStatusMissing}>
                        Il manque {missingCount} joueur{missingCount > 1 ? 's' : ''}
                      </Text>
                    )
                  ) : (
                    <Text style={styles.upcomingStatusOpen}>Session ouverte</Text>
                  )}
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFixedTopSection = () => {
    if (!nextSession) return null;
    const acceptedParticipants = nextSession.participants.filter(p => p.status === 'accepted');
    const maxParticipants = nextSession.maxParticipants;
    const isFull = maxParticipants ? acceptedParticipants.length >= maxParticipants : false;
    const missingCount = maxParticipants ? maxParticipants - acceptedParticipants.length : 0;

    return (
      <View style={styles.fixedTopSection}>
        {/* Label PROCHAINE SESSION */}
        <Text style={styles.sectionHeader}>PROCHAINE SESSION</Text>

        {/* Carte Prochaine Session */}
        <View style={styles.nextSessionCard}>
          <View style={styles.nextSessionTopRow}>
            {/* Cercle Icône sport */}
            <View style={[styles.sportIconCircle, { backgroundColor: getSportConfig(nextSession.sport).color }]}>
              <Ionicons name={getSportConfig(nextSession.sport).icon as any} size={24} color="#FFF" />
            </View>

            {/* Détails textuels */}
            <View style={styles.nextSessionDetails}>
              <Text style={styles.nextSessionSportTitle}>
                {nextSession.sport.charAt(0).toUpperCase() + nextSession.sport.slice(1)}
              </Text>
              
              <View style={styles.nextSessionInfoRow}>
                <Ionicons name="calendar-outline" size={14} color="#666" style={styles.infoIcon} />
                <Text style={styles.nextSessionInfoText}>
                  {formatSessionDateTime(nextSession.date, nextSession.startTime)}
                </Text>
              </View>

              <View style={styles.nextSessionInfoRow}>
                <Ionicons name="location-outline" size={14} color="#666" style={styles.infoIcon} />
                <Text style={styles.nextSessionInfoText} numberOfLines={1}>
                  {nextSession.location}
                </Text>
              </View>
            </View>

            {/* Ratio Joueurs */}
            <View style={styles.nextSessionRatioContainer}>
              <Text style={styles.nextSessionRatioText}>
                <Text style={styles.nextSessionRatioLarge}>{acceptedParticipants.length}</Text>
                {maxParticipants ? (
                  <Text style={styles.nextSessionRatioSmall}> / {maxParticipants}</Text>
                ) : null}
              </Text>
              <Text style={styles.nextSessionRatioLabel}>joueur{acceptedParticipants.length > 1 ? 's' : ''}</Text>
            </View>
          </View>

          {/* Ligne médiane: Avatars et Manque X joueurs */}
          <View style={styles.nextSessionMiddleRow}>
            {renderOverlappingAvatars(nextSession.participants)}
            
            <View style={styles.completenessStatusRow}>
              {maxParticipants ? (
                isFull ? (
                  <>
                    <View style={[styles.statusDot, { backgroundColor: '#70A831' }]} />
                    <Text style={[styles.statusText, { color: '#70A831' }]}>Complet</Text>
                  </>
                ) : (
                  <>
                    <View style={[styles.statusDot, { backgroundColor: '#F59223' }]} />
                    <Text style={styles.statusText}>
                      Il manque {missingCount} joueur{missingCount > 1 ? 's' : ''}
                    </Text>
                  </>
                )
              ) : (
                <>
                  <View style={[styles.statusDot, { backgroundColor: '#70A831' }]} />
                  <Text style={[styles.statusText, { color: '#70A831' }]}>Session ouverte</Text>
                </>
              )}
            </View>
          </View>

          {/* Boutons d'action */}
          <View style={styles.nextSessionButtonsRow}>
            <TouchableOpacity 
              activeOpacity={0.8}
              style={styles.actionButtonSecondary}
              onPress={() => handleSessionPress(nextSession.id)}
            >
              <Text style={styles.actionButtonSecondaryText}>Voir la session</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.8}
              style={styles.actionButtonPrimary}
              onPress={() => {
                Haptics.selectionAsync();
                router.push(`/session/${nextSession.id}?openInvite=true`);
              }}
            >
              <Text style={styles.actionButtonPrimaryText}>Inviter des joueurs</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bouton Créer une session */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.createSessionBtn}
          onPress={() => router.push('/create-session')}
        >
          <View style={styles.createSessionBtnContent}>
            <View style={styles.plusOutlineCircle}>
              <Ionicons name="add" size={16} color="#000" />
            </View>
            <Text style={styles.createSessionBtnText}>Créer une session</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <MainScreenLayout title="Feed" showHeader={false} containerStyle={{ backgroundColor: '#FAFAFA', flex: 1 }}>
      {/* Header personnalisé comme sur la capture d'écran */}
      <View style={[styles.header, Platform.OS === 'android' && { paddingTop: Math.max(insets.top, 20) }]}>
        <View style={styles.headerUserProfile}>
          <Image
            source={user?.avatar ? { uri: user.avatar } : require('../../assets/images/icon-avatar.png')}
            style={styles.userAvatar}
          />
          <Text style={styles.welcomeText}>
            Bonjour {user?.firstname || 'Issa'} 👋
          </Text>
        </View>

        {friendRequestsCount > 0 ? (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.headerPlayersBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/friend-requests');
            }}
          >
            <Ionicons name="people-outline" size={24} color="#000" />
            <View style={styles.playersBadge}>
              <Text style={styles.playersBadgeText}>{friendRequestsCount}</Text>
            </View>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Main Content Area filling remaining space */}
      <View style={styles.mainContentContainer}>
        {/* Fixed Top Items */}
        {renderFixedTopSection()}

        {/* Scrollable "À VENIR" Section */}
        <View style={styles.upcomingContainer}>
          <Text style={styles.sectionHeader}>À VENIR</Text>
          <FlatList
            data={upcomingSessions}
            renderItem={renderUpcomingSessionItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.listContent,
              Platform.OS === 'android' && { paddingBottom: Math.max(insets.bottom, 100) + 20 },
              Platform.OS === 'ios' && { paddingBottom: insets.bottom + 40 }
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#D4FC79"
                title="Chargement..."
                titleColor="#D4FC79"
              />
            }
            ListEmptyComponent={
              !isFirstLoading ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyTitle}>AUCUNE SESSION</Text>
                  <Text style={styles.emptySubtitle}>SOIS LE PREMIER À LANCER LE MOUVEMENT</Text>
                  <TouchableOpacity
                    style={styles.emptyButton}
                    onPress={() => router.push('/create-session')}
                  >
                    <Text style={styles.emptyButtonText}>CRÉER UNE SESSION</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <InlineLoading message="Chargement..." />
              )
            }
          />
        </View>
      </View>
    </MainScreenLayout>
  );
}

const styles = StyleSheet.create({
  // Header Style
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#FAFAFA',
  },
  headerUserProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EAEAEA',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginLeft: 12,
  },
  notificationBellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: BrandColors.primary, // Volt Électrique (unifié)
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FAFAFA',
  },
  headerPlayersBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  playersBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#D4FC79', // Volt Électrique
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FAFAFA',
  },
  playersBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#000',
  },
  notificationBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#000',
  },

  // Main Layout Area
  mainContentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  fixedTopSection: {
    width: '100%',
  },
  upcomingContainer: {
    flex: 1,
    marginTop: 8,
  },
  listContent: {
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8E8E93',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 8,
  },

  // Carte Prochaine Session
  nextSessionCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  nextSessionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sportIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextSessionDetails: {
    flex: 1,
    marginLeft: 12,
  },
  nextSessionSportTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  nextSessionInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  infoIcon: {
    marginRight: 6,
  },
  nextSessionInfoText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '400',
  },
  nextSessionRatioContainer: {
    alignItems: 'flex-end',
  },
  nextSessionRatioText: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  nextSessionRatioLarge: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000',
  },
  nextSessionRatioSmall: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  nextSessionRatioLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '400',
    marginTop: 2,
  },
  nextSessionMiddleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  completenessStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  nextSessionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButtonSecondary: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
  actionButtonPrimary: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: BrandColors.primary, // Volt Électrique (unifié)
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },

  // Bouton "Créer une session"
  createSessionBtn: {
    width: '100%',
    height: 46,
    borderRadius: 12,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  createSessionBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plusOutlineCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  createSessionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },

  // Cartes "À VENIR"
  upcomingCardContainer: {
    marginBottom: 10,
  },
  upcomingCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sportIconCircleSmall: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingDetails: {
    flex: 1,
    marginLeft: 10,
  },
  upcomingSportName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginBottom: 2,
  },
  upcomingDateText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    marginBottom: 2,
  },
  upcomingLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upcomingLocationText: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '400',
    marginLeft: 2,
    maxWidth: '90%',
  },
  upcomingRightColumn: {
    alignItems: 'flex-end',
  },
  upcomingRatioAndArrow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upcomingRatioText: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  upcomingRatioBold: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
  },
  upcomingRatioSmall: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '500',
  },
  upcomingAvatarsSection: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  upcomingStatusContainer: {
    marginTop: 2,
  },
  upcomingStatusFull: {
    fontSize: 10,
    fontWeight: '700',
    color: '#70A831',
  },
  upcomingStatusMissing: {
    fontSize: 10,
    fontWeight: '600',
    color: '#F59223',
  },
  upcomingStatusOpen: {
    fontSize: 10,
    fontWeight: '700',
    color: '#70A831',
  },

  // Avatars empilés
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  avatarIconPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#333',
  },
  avatarMore: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EAEAEA',
    borderWidth: 1.5,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMoreText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#000',
  },

  // Empty List State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#CCC',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 12,
  },
});
