import { BrandColors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
import PullToRefresh from '../../components/PullToRefresh';
import { useGlobalNotifications } from '../../context/globalNotifications';
import { useNotificationsContext } from '../../context/notifications';
import { usePullToRefresh } from '../../hooks';
import { useDeleteNotification, useMarkAllNotificationsAsRead, useMarkNotificationAsRead } from '../../services';

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
          return BrandColors.primary;
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
          return BrandColors.primary;
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {allNotifications && allNotifications.length > 0 && allNotifications.some(notification => !notification.read) && (
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
        )}
      </View>

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
              <View style={styles.loadingMore}>
                <Text style={styles.loadingMoreText}>Chargement...</Text>
              </View>
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
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off" size={64} color="#ccc" />
          <Text style={styles.emptyStateTitle}>Aucune notification</Text>
          <Text style={styles.emptyStateMessage}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  markAllButton: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  markAllButtonText: {
    color: BrandColors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  debugButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  notificationsList: {
    padding: 0,
  },
  notificationItem: {
    height: 100,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  notificationTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationContent: {
    flex: 1,
    marginLeft: 12,
  },
  notificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  notificationMessage: {
    fontSize: 13,
    color: '#666',
    lineHeight: 17,
    marginBottom: 3,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  unreadNotification: {
    backgroundColor: '#f8f9ff',
  },
  unreadTitle: {
    fontWeight: '600',
    color: '#333',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BrandColors.primary,
    marginLeft: 8,
  },
  chevronContainer: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeActions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    height: '100%',
    marginRight: 0,
  },
  swipeAction: {
    width: 80,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 0,
  },
  deleteAction: {
    backgroundColor: '#FF3B30',
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingMoreText: {
    fontSize: 14,
    color: '#666',
  },
});
