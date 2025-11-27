import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
import { InlineLoading } from '../../components/OptimizedLoading';
import PullToRefresh from '../../components/PullToRefresh';
import { MainScreenLayout } from '../../components/ui/ScreenLayout';
import { DesignTokens } from '../../constants/DesignSystem';
import { useGlobalNotifications } from '../../context/globalNotifications';
import { useNotificationsContext } from '../../context/notifications';
import { usePullToRefresh } from '../../hooks';
import { useDeleteNotification, useMarkAllNotificationsAsRead, useMarkNotificationAsRead } from '../../services';
import { CommonStyles, TextStyles } from '../../styles/CommonStyles';

export default function NotificationsScreen() {
  const router = useRouter();
  console.log('🔍 [NotificationsScreen] Rendu de l\'écran');

  // États pour la pagination
  const [currentPage, setCurrentPage] = React.useState(1);
  const [allNotifications, setAllNotifications] = React.useState<any[]>([]);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);

  // Hook pour récupérer les notifications de manière synchronisée
  const { notifications, pagination, isLoading, error, refetch } = useNotificationsContext();

  // Hook pour le unreadCount global
  const { unreadCount: globalUnreadCount, refetch: refetchGlobalUnreadCount } = useGlobalNotifications();

  // Hook pour supprimer les notifications
  const { deleteNotification, isLoading: isDeleting } = useDeleteNotification();

  // Hook pour marquer toutes les notifications comme lues
  const { markAllAsRead, isLoading: isMarkingAllAsRead } = useMarkAllNotificationsAsRead();

  // Hook pour marquer une notification comme lue
  const { markAsRead, isLoading: isMarkingAsRead } = useMarkNotificationAsRead();

  // Hook pour le pull-to-refresh
  const { refreshing, onRefresh } = usePullToRefresh({
    onRefresh: async () => {
      console.log('🔄 [NotificationsScreen] Pull-to-refresh déclenché');
      // Réinitialiser la pagination
      setCurrentPage(1);
      setAllNotifications([]);
      // Synchroniser les deux
      await Promise.all([refetch(), refetchGlobalUnreadCount()]);
    },
    minDelay: 1000,
    onError: (error) => {
      console.error('❌ Erreur lors du rafraîchissement des notifications:', error);
    }
  });

  // Fonction pour naviguer vers l'écran approprié selon le type de notification
  const navigateToNotificationScreen = (notification: any) => {
    console.log('🎯 [NotificationsScreen] Navigation pour notification:', {
      type: notification.type,
      sessionId: notification.sessionId,
      id: notification.id
    });

    switch (notification.type) {
      case 'invitation':
      case 'reminder':
      case 'update':
      case 'session_update':
      case 'session_cancelled':
        if (notification.sessionId) {
          console.log('📱 [NotificationsScreen] Navigation vers session:', notification.sessionId);
          router.push(`/session/${notification.sessionId}`);
        } else {
          console.warn('⚠️ [NotificationsScreen] Notification sans sessionId:', notification);
        }
        break;

      case 'comment':
        if (notification.sessionId) {
          console.log('💬 [NotificationsScreen] Navigation vers session avec commentaires:', notification.sessionId);
          // TODO: Ouvrir directement les commentaires si le backend le supporte
          router.push(`/session/${notification.sessionId}`);
        } else {
          console.warn('⚠️ [NotificationsScreen] Commentaire sans sessionId:', notification);
        }
        break;

      case 'friend_request':
      case 'friend_accepted':
        console.log('👥 [NotificationsScreen] Navigation vers amis');
        router.push('/friends');
        break;

      default:
        console.log('❓ [NotificationsScreen] Type de notification non géré:', notification.type);
        break;
    }
  };

  // Gérer l'accumulation des notifications
  React.useEffect(() => {
    if (notifications && notifications.length > 0) {
      if (currentPage === 1) {
        // Première page : remplacer toutes les notifications
        setAllNotifications(notifications);
        console.log('📄 [NotificationsScreen] Première page chargée:', notifications.length, 'notifications');
      } else {
        // Pages suivantes : ajouter aux notifications existantes en évitant les doublons
        setAllNotifications(prev => {
          // Créer un Set des IDs existants pour éviter les doublons
          const existingIds = new Set(prev.map(n => n.id));
          const newNotifications = notifications.filter(n => !existingIds.has(n.id));

          if (newNotifications.length === 0) {
            console.log('⚠️ [NotificationsScreen] Aucune nouvelle notification à ajouter (doublons détectés)');
            return prev;
          }

          const result = [...prev, ...newNotifications];
          console.log('📄 [NotificationsScreen] Page', currentPage, 'ajoutée:', newNotifications.length, 'nouvelles notifications, total:', result.length);
          return result;
        });
      }
      setIsLoadingMore(false);
    }
  }, [notifications, currentPage]);

  // Fonction pour charger plus de notifications
  const loadMoreNotifications = async () => {
    if (isLoadingMore || !pagination || currentPage >= pagination.totalPages) {
      console.log('⏸️ [NotificationsScreen] Chargement ignoré:', {
        isLoadingMore,
        currentPage,
        totalPages: pagination?.totalPages
      });
      return;
    }

    console.log('📄 [NotificationsScreen] Chargement de la page', currentPage + 1);
    setIsLoadingMore(true);
    setCurrentPage(prev => prev + 1);
  };

  console.log('🔍 [NotificationsScreen] État actuel:', {
    currentPage,
    allNotificationsLength: allNotifications.length,
    pagination,
    isLoading,
    isLoadingMore,
    error
  });

  // Fonction pour rendre une notification (visible)
  const renderNotification = ({ item }: { item: any }) => {
    const getNotificationIcon = (type: string) => {
      switch (type) {
        case 'invitation':
          return 'mail-outline';
        case 'reminder':
          return 'time-outline';
        case 'update':
          return 'refresh-outline';
        case 'comment':
          return 'chatbubble-outline';
        case 'session_update':
          return 'calendar-outline';
        case 'session_cancelled':
          return 'close-circle-outline';
        case 'friend_request':
          return 'person-add-outline';
        case 'friend_accepted':
          return 'checkmark-circle-outline';
        default:
          return 'notifications-outline';
      }
    };

    const getNotificationColor = (type: string) => {
      switch (type) {
        case 'invitation':
          return DesignTokens.colors.primary;
        case 'reminder':
          return '#FF9500';
        case 'update':
          return '#34C759';
        case 'comment':
          return '#5856D6';
        case 'session_update':
          return '#FF3B30';
        case 'session_cancelled':
          return '#FF3B30';
        case 'friend_request':
          return DesignTokens.colors.primary;
        case 'friend_accepted':
          return '#34C759';
        default:
          return '#666';
      }
    };

    return (
      <View style={[styles.notificationItem, !item.read && styles.unreadNotification]}>
        <TouchableOpacity
          style={styles.notificationTouchable}
          onPress={async () => {
            console.log('👆 [NotificationsScreen] Clic sur notification:', item.id);

            // Marquer comme lue si elle ne l'est pas déjà
            if (!item.read) {
              try {
                await markAsRead(item.id);
                // Refetch après marquage - synchroniser les deux
                await Promise.all([refetch(), refetchGlobalUnreadCount()]);
                console.log('✅ [NotificationsScreen] Synchronisation après marquage individuel terminée');
              } catch (error) {
                console.error('❌ Erreur lors du marquage:', error);
              }
            }

            // Navigation vers l'écran approprié
            navigateToNotificationScreen(item);
          }}
          activeOpacity={0.7}
          disabled={isMarkingAsRead}
        >
          <View style={styles.notificationIcon}>
            <Ionicons
              name={getNotificationIcon(item.type)}
              size={20}
              color={getNotificationColor(item.type)}
            />
          </View>
          <View style={styles.notificationContent}>
            <View style={styles.notificationHeader}>
              <Text style={[styles.notificationTitle, !item.read && styles.unreadTitle]} numberOfLines={1}>
                {item.title}
              </Text>
              {!item.read && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.notificationMessage} numberOfLines={2}>
              {item.message}
            </Text>
            <Text style={styles.notificationTime}>
              {new Date(item.createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
          {item.sessionId && (
            <View style={styles.chevronContainer}>
              <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // Fonction pour rendre les actions de swipe (cachées)
  const renderHiddenItem = ({ item }: { item: any }) => (
    <View style={styles.swipeActions}>
      <TouchableOpacity
        style={[styles.swipeAction, styles.deleteAction]}
        onPress={async () => {
          console.log('🗑️ [NotificationsScreen] Suppression de la notification:', item.id);
          try {
            await deleteNotification(item.id);
            // Refetch après suppression - synchroniser les deux
            await Promise.all([refetch(), refetchGlobalUnreadCount()]);
            console.log('✅ [NotificationsScreen] Synchronisation après suppression terminée');
          } catch (error) {
            console.error('❌ Erreur lors de la suppression:', error);
          }
        }}
        disabled={isDeleting}
      >
        <Ionicons name="trash" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  // Bouton "Tout marquer" pour le header
  const MarkAllButton = () => {
    if (!allNotifications || allNotifications.length === 0 || !allNotifications.some(notification => !notification.read)) {
      return null;
    }

    return (
      <TouchableOpacity
        style={styles.markAllButton}
        onPress={async () => {
          console.log('📝 [NotificationsScreen] Marquer toutes comme lues');
          try {
            await markAllAsRead();
            // Refetch après marquage - synchroniser les deux
            await Promise.all([refetch(), refetchGlobalUnreadCount()]);
            console.log('✅ [NotificationsScreen] Synchronisation après marquage terminée');
          } catch (error) {
            console.error('❌ Erreur lors du marquage:', error);
          }
        }}
        disabled={isMarkingAllAsRead}
      >
        <Text style={styles.markAllButtonText}>
          {isMarkingAllAsRead ? '...' : 'Tout marquer'}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <MainScreenLayout
      title="Notifications"
      rightAction={<MarkAllButton />}
    >

      {allNotifications && allNotifications.length > 0 ? (
        <SwipeListView
          data={allNotifications}
          renderItem={renderNotification}
          renderHiddenItem={renderHiddenItem}
          keyExtractor={(item: any, index: number) => `${item.id}-${index}`}
          contentContainerStyle={styles.notificationsList}
          showsVerticalScrollIndicator={false}
          rightOpenValue={-80}
          disableRightSwipe
          onEndReached={loadMoreNotifications}
          onEndReachedThreshold={0.1}
          ListFooterComponent={() =>
            isLoadingMore ? (
              <InlineLoading message="Chargement..." />
            ) : null
          }
          refreshControl={
            <PullToRefresh
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
        />
      ) : (
        <View style={CommonStyles.emptyStateContainer}>
          <Ionicons name="notifications-off" size={DesignTokens.iconSizes.xxl} color={DesignTokens.colors.textTertiary} />
          <Text style={CommonStyles.emptyStateTitle}>Aucune notification</Text>
          <Text style={CommonStyles.emptyStateSubtitle}>
            Vous n&apos;avez pas encore reçu de notifications.
          </Text>
          <TouchableOpacity style={styles.debugButton} onPress={() => {
            console.log('🔍 [NotificationsScreen] Debug - État actuel:', {
              notifications: notifications?.length || 0,
              pagination,
              isLoading,
              error
            });
          }}>
            <Text style={styles.debugButtonText}>Debug Info</Text>
          </TouchableOpacity>
        </View>
      )}
    </MainScreenLayout>
  );
}

const styles = StyleSheet.create({
  // Bouton "Tout marquer"
  markAllButton: {
    backgroundColor: DesignTokens.colors.primary,
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.sm,
    borderRadius: DesignTokens.borderRadius.xl,
  },
  markAllButtonText: {
    ...TextStyles.captionMedium,
    color: DesignTokens.colors.textInverse,
  },
  
  // Debug button
  debugButton: {
    backgroundColor: DesignTokens.colors.warning,
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.sm,
    borderRadius: DesignTokens.borderRadius.md,
  },
  debugButtonText: {
    ...TextStyles.captionMedium,
    color: DesignTokens.colors.textInverse,
  },
  
  // Liste des notifications
  notificationsList: {
    padding: 0,
  },
  notificationItem: {
    height: 100,
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingVertical: DesignTokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.borderLight,
    backgroundColor: DesignTokens.colors.background,
  },
  notificationTouchable: {
    ...CommonStyles.row,
    flex: 1,
  },
  notificationContent: {
    flex: 1,
    marginLeft: DesignTokens.spacing.md,
  },
  notificationIcon: {
    width: 44,
    height: 44,
    borderRadius: DesignTokens.borderRadius.round,
    backgroundColor: DesignTokens.colors.backgroundSecondary,
    ...CommonStyles.centerContent,
  },
  notificationTitle: {
    ...TextStyles.bodyMedium,
    color: DesignTokens.colors.text,
    marginBottom: DesignTokens.spacing.xs,
  },
  notificationMessage: {
    ...TextStyles.caption,
    color: DesignTokens.colors.textSecondary,
    lineHeight: 17,
    marginBottom: DesignTokens.spacing.xs,
  },
  notificationTime: {
    ...TextStyles.small,
    color: DesignTokens.colors.textTertiary,
  },
  unreadNotification: {
    backgroundColor: '#f8f9ff',
  },
  unreadTitle: {
    ...TextStyles.bodySemiBold,
    color: DesignTokens.colors.text,
  },
  notificationHeader: {
    ...CommonStyles.rowBetween,
    marginBottom: DesignTokens.spacing.xs,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: DesignTokens.borderRadius.round,
    backgroundColor: DesignTokens.colors.primary,
    marginLeft: DesignTokens.spacing.sm,
  },
  chevronContainer: {
    marginLeft: DesignTokens.spacing.sm,
    ...CommonStyles.centerContent,
  },
  
  // Actions de swipe
  swipeActions: {
    ...CommonStyles.row,
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    height: '100%',
    marginRight: 0,
  },
  swipeAction: {
    width: 80,
    height: 100,
    ...CommonStyles.centerContent,
    marginRight: 0,
  },
  deleteAction: {
    backgroundColor: DesignTokens.colors.error,
  },
});
