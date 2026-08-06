import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGetFriendRequests, useRespondToFriendRequest } from '../services';
import { useGlobalFriendRequests } from '../context/globalFriendRequests';

export default function FriendRequestsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: requests, isLoading, refetch } = useGetFriendRequests();
  const { respondToFriendRequest } = useRespondToFriendRequest();
  const { refetch: refetchGlobalCount } = useGlobalFriendRequests();

  React.useEffect(() => {
    // Auto-dismiss if no requests are left
    if (!isLoading && requests.length === 0) {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [requests, isLoading]);

  const handleResponse = async (requestId: string, action: 'accept' | 'decline') => {
    Haptics.selectionAsync();

    try {
      await respondToFriendRequest(requestId, action);
      await refetch();
      refetchGlobalCount();
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de traiter la demande');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Demandes d’amis</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* List of Requests */}
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        <View style={styles.cardContainer}>
          {requests.map((item, index) => {
            const user = item.sender || item.fromUser || item || {};
            const initials = `${(user.firstname || '').charAt(0)}${(user.lastname || '').charAt(0)}`.toUpperCase() || '?';
            const sessionsCount = item.sessionsTogether || 0;
            
            return (
              <View 
                key={item.id} 
                style={[
                  styles.requestRow,
                  index < requests.length - 1 && styles.borderBottomLight
                ]}
              >
                {/* Left: Avatar */}
                {user.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarPlaceholderText}>{initials}</Text>
                  </View>
                )}

                {/* Middle: Info */}
                <View style={styles.infoContainer}>
                  <Text style={styles.nameText}>
                    {user.firstname} {user.lastname}
                  </Text>
                </View>

                {/* Right: Actions */}
                <View style={styles.actionsContainer}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.declineBtn}
                    onPress={() => handleResponse(item.id, 'decline')}
                  >
                    <Ionicons name="close" size={20} color="#374151" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.acceptBtn}
                    onPress={() => handleResponse(item.id, 'accept')}
                  >
                    <Ionicons name="checkmark" size={20} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    fontWeight: '800',
    color: '#000',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  cardContainer: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  borderBottomLight: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    fontWeight: '700',
    color: '#2E7D32',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  nameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
    marginBottom: 2,
  },
  subtitleText: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  declineBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  acceptBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#70A831',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
