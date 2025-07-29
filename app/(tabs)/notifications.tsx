import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Alert,
    FlatList,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import PullToRefresh from '../../components/PullToRefresh';
import { usePullToRefresh } from '../../hooks';
import { useGetNotifications, useMarkAllNotificationsAsRead, useMarkNotificationAsRead } from '../../services';
import { Notification } from '../../services/types/notifications';
import { formatShortDate } from '../../utils/dateHelpers';

const formatNotificationDate = (dateString: string) => {
  const now = new Date();
  const notificationDate = new Date(dateString);
  const diffInHours = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 1) {
    return 'À l\'instant';
  } else if (diffInHours < 24) {
    return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
  } else {
    return formatShortDate(dateString);
  }
};

const NotificationItem = ({ notification, onPress }: {
  notification: Notification;
  onPress: () => void;
}) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'invitation':
        return 'mail';
      case 'reminder':
        return 'alarm';
      case 'update':
        return 'information-circle';
      default:
        return 'notifications';
    }
  };

  const getIconColor = () => {
    switch (notification.type) {
      case 'invitation':
        return '#007AFF';
      case 'reminder':
        return '#FF9500';
      case 'update':
        return '#34C759';
      default:
        return '#666';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.notificationItem, !notification.read && styles.unreadNotification]}
      onPress={onPress}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <View style={styles.notificationIconContainer}>
            <Ionicons name={getIcon()} size={24} color={getIconColor()} />
          </View>
          <View style={styles.notificationInfo}>
            <Text style={styles.notificationTitle}>{notification.title}</Text>
            <Text style={styles.notificationDate}>{formatNotificationDate(notification.createdAt)}</Text>
          </View>
        </View>
        <Text style={styles.notificationMessage}>{notification.message}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { data: notifications, isLoading, error, refetch } = useGetNotifications();
  const { markAsRead, isLoading: isMarking } = useMarkNotificationAsRead();
  const { markAllAsRead, isLoading: isMarkingAll } = useMarkAllNotificationsAsRead();

  // Hook pour le pull-to-refresh avec délai minimum
  const { refreshing, onRefresh } = usePullToRefresh({
    onRefresh: refetch,
    minDelay: 1000, // Délai minimum de 1 seconde
    onError: (error) => {
      // Gestion silencieuse des erreurs
    }
  });

  const handleNotificationPress = async (notification: Notification) => {
    try {
      await markAsRead(notification.id);
      refetch(); // Recharger la liste
      router.push(`/session/${notification.sessionId}`);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de marquer comme lue');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      refetch(); // Recharger la liste
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de marquer toutes comme lues');
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <NotificationItem
      notification={item}
      onPress={() => !item.read && handleNotificationPress(item)}
    />
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Chargement des notifications...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={{ color: 'red' }}>Erreur: {error}</Text>
      </View>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity 
            style={styles.markAllButton}
            onPress={handleMarkAllAsRead}
            disabled={isMarkingAll}
          >
            <Text style={styles.markAllButtonText}>
              {isMarkingAll ? 'Marquage...' : 'Tout marquer comme lu'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>
              Aucune notification
            </Text>
          </View>
        }
        refreshControl={
          <PullToRefresh 
            refreshing={refreshing} 
            onRefresh={onRefresh}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  markAllButton: {
    padding: 8,
  },
  markAllButtonText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  notificationItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  unreadNotification: {
    backgroundColor: '#f8f9fa',
    borderColor: '#007AFF',
  },
  notificationContent: {
    gap: 12,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  notificationDate: {
    fontSize: 12,
    color: '#666',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
}); 