import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';

import { InlineLoading } from '../../components/OptimizedLoading';
import { MainScreenLayout } from '../../components/ui/ScreenLayout';
import { useGlobalNotifications } from '../../context/globalNotifications';
import {
  useDeleteNotification,
  useGetNotifications,
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead
} from '../../services';
import { Notification } from '../../services/types/notifications';

const ACCENT_COLOR = '#D4FC79'; // Electric Volt

export default function NotificationsScreen() {
  const router = useRouter();
  const { data: notifications, isLoading, refetch } = useGetNotifications();
  const { unreadCount, refetch: refetchGlobal } = useGlobalNotifications();
  const { markAsRead } = useMarkNotificationAsRead();
  const { markAllAsRead } = useMarkAllNotificationsAsRead();
  const { deleteNotification } = useDeleteNotification();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Promise.all([refetch(), refetchGlobal()]);
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: Notification) => {
    Haptics.selectionAsync();
    if (!notification.isRead && !notification.read) {
      await markAsRead(notification.id);
      refetchGlobal();
    }

    // Navigate based on notification type
    if (notification.data?.sessionId || notification.sessionId) {
      router.push(`/session/${notification.data?.sessionId || notification.sessionId}`);
    } else if (notification.data?.userId) {
      router.push('/friends');
    }
  };

  const handleDelete = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await deleteNotification(id);
    refetch();
    refetchGlobal();
  };

  const handleMarkAllRead = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await markAllAsRead();
    refetch();
    refetchGlobal();
  };

  const renderItem = ({ item }: { item: Notification }) => {
    const isUnread = !item.isRead && !item.read;

    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => handleNotificationPress(item)}
        style={[
          styles.rowFront,
          isUnread && styles.unreadRow
        ]}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name={item.type.includes('friend') ? 'person' : 'calendar'}
            size={24}
            color={isUnread ? '#000' : '#999'}
          />
          {isUnread && <View style={styles.unreadDot} />}
        </View>
        <View style={styles.contentContainer}>
          <Text style={[styles.title, isUnread && styles.unreadText]}>
            {item.title || 'Notification'}
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            {item.message || ''}
          </Text>
          <Text style={styles.time}>
            {new Date(item.createdAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
        {isUnread && (
          <View style={styles.indicator} />
        )}
      </TouchableOpacity>
    );
  };

  const renderHiddenItem = (data: { item: Notification }, rowMap: any) => (
    <View style={styles.rowBack}>
      <TouchableOpacity
        style={[styles.backRightBtn, styles.backRightBtnRight]}
        onPress={() => handleDelete(data.item.id)}
      >
        <Ionicons name="trash-outline" size={24} color="#FFF" />
      </TouchableOpacity>
    </View>
  );

  return (
    <MainScreenLayout title="Notifications" showHeader={false} containerStyle={{ backgroundColor: '#FFF' }}>
      {/* Custom Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>ALERTS</Text>
          <Text style={styles.headerSubtitle}>
            {unreadCount > 0 ? `${unreadCount} NON LUES` : 'TOUT EST CALME'}
          </Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={handleMarkAllRead}
          >
            <Ionicons name="checkmark-done" size={24} color="#000" />
          </TouchableOpacity>
        )}
      </View>

      {isLoading && !refreshing ? (
        <InlineLoading message="Chargement..." />
      ) : (
        <SwipeListView
          data={notifications || []}
          renderItem={renderItem}
          renderHiddenItem={renderHiddenItem}
          rightOpenValue={-75}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#000"
              title="Mise à jour..."
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>RIEN À SIGNALER</Text>
              <Text style={styles.emptySubtitle}>REPOSE-TOI, GUERRIER</Text>
            </View>
          }
          disableRightSwipe
          previewRowKey={'0'}
          previewOpenValue={-40}
          previewOpenDelay={3000}
        />
      )}
    </MainScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#000',
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 1,
    marginTop: 4,
  },
  markAllButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  listContent: {
    paddingBottom: 100,
  },

  // List Item
  rowFront: {
    backgroundColor: '#FFF',
    borderBottomColor: '#F5F5F5',
    borderBottomWidth: 1,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  unreadRow: {
    backgroundColor: '#F9F9F9',
  },

  iconContainer: {
    marginRight: 16,
    position: 'relative',
    marginTop: 2,
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ACCENT_COLOR,
  },

  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
    marginBottom: 4,
  },
  unreadText: {
    color: '#000',
    fontWeight: '900',
  },
  message: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  time: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },

  indicator: {
    width: 4,
    height: 40,
    backgroundColor: ACCENT_COLOR,
    borderRadius: 2,
    marginLeft: 12,
    alignSelf: 'center',
  },

  // Hidden Item (Swipe)
  rowBack: {
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingLeft: 15,
  },
  backRightBtn: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    width: 75,
  },
  backRightBtnRight: {
    backgroundColor: '#FF3B30',
    right: 0,
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 180,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#CCC',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
