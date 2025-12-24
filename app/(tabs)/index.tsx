import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { InlineLoading } from '../../components/OptimizedLoading';
import { MainScreenLayout } from '../../components/ui/ScreenLayout';
import { useGetSessions } from '../../services';
import { SportSession } from '../../types/sport';

const ACCENT_COLOR = '#D4FC79'; // Electric Volt

export default function HomeScreen() {
  const router = useRouter();
  const { data: sessions, isLoading, refetch } = useGetSessions();
  const [refreshing, setRefreshing] = React.useState(false);

  // Logs de débogage pour les données
  React.useEffect(() => {
    console.log('🔍 [HomeScreen] État du chargement:', isLoading);
    console.log('🔍 [HomeScreen] Type de sessions:', typeof sessions);
    console.log('🔍 [HomeScreen] Sessions est un array?', Array.isArray(sessions));
    console.log('🔍 [HomeScreen] Nombre de sessions:', sessions?.length ?? 'undefined');
    console.log('🔍 [HomeScreen] Données brutes sessions:', JSON.stringify(sessions, null, 2));
    if (sessions && sessions.length > 0) {
      console.log('🔍 [HomeScreen] Première session:', JSON.stringify(sessions[0], null, 2));
    }
  }, [sessions, isLoading]);

  const onRefresh = React.useCallback(async () => {
    console.log('🔄 [HomeScreen] Refresh déclenché');
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await refetch();
    console.log('🔄 [HomeScreen] Résultat du refetch:', result);
    console.log('🔄 [HomeScreen] Données après refetch:', JSON.stringify(result, null, 2));
    setRefreshing(false);
  }, [refetch]);

  const handleSessionPress = (sessionId: string) => {
    Haptics.selectionAsync();
    router.push(`/session/${sessionId}`);
  };

  const renderSessionItem = ({ item, index }: { item: SportSession; index: number }) => {
    console.log(`🎨 [HomeScreen] Rendu session ${index}:`, item.id, item.sport);
    // Compter uniquement les participants qui ont accepté l'invitation
    const acceptedParticipants = item.participants.filter(p => p.status === 'accepted');
    const isFull = item.maxParticipants && acceptedParticipants.length >= item.maxParticipants;

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 100).springify()}
        style={styles.cardContainer}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => handleSessionPress(item.id)}
          style={styles.card}
        >
          {/* Header Card: Sport & Status */}
          <View style={styles.cardHeader}>
            <Text style={styles.sportName}>{item.sport.toUpperCase()}</Text>
            <View style={styles.statusContainer}>
              {isFull ? (
                <View style={styles.fullBadge}>
                  <Text style={styles.fullText}>COMPLET</Text>
                </View>
              ) : (
                <View style={styles.openBadge}>
                  <Text style={styles.openText}>OUVERT</Text>
                </View>
              )}
            </View>
          </View>

          {/* Main Info: Date & Time */}
          <View style={styles.mainInfo}>
            <Text style={styles.dateText}>
              {new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }).toUpperCase()}
            </Text>
            <Text style={styles.timeText}>
              {(item.startTime || '00:00').slice(0, 5)}
            </Text>
          </View>

          {/* Footer: Location & Participants */}
          <View style={styles.cardFooter}>
            <View style={styles.locationContainer}>
              <Ionicons name="location-sharp" size={16} color="#666" />
              <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
            </View>

            <View style={styles.participantsContainer}>
              <Text style={styles.participantsText}>
                {acceptedParticipants.length} / {item.maxParticipants || '∞'}
              </Text>
              <Ionicons name="people" size={16} color="#000" style={{ marginLeft: 4 }} />
            </View>
          </View>

          {/* Action Button */}
          <View style={styles.actionRow}>
            <Text style={styles.actionText}>REJOINDRE LE SQUAD</Text>
            <Ionicons name="arrow-forward" size={20} color="#000" />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <MainScreenLayout title="Feed" showHeader={false} containerStyle={{ backgroundColor: '#F5F5F5' }}>
      {/* Custom Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>SUE</Text>
          <Text style={styles.headerSubtitle}>SESSIONS DU JOUR</Text>
        </View>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/create-session')}
        >
          <Ionicons name="add" size={28} color="#000" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={sessions}
        renderItem={renderSessionItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onLayout={() => {
          console.log('📐 [HomeScreen] FlatList layout - sessions:', sessions?.length ?? 0);
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#000"
            title="Chargement..."
          />
        }
        ListEmptyComponent={
          !isLoading ? (
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
    </MainScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#F5F5F5',
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
  createButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ACCENT_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },

  listContent: {
    padding: 20,
    paddingBottom: 100,
  },

  cardContainer: {
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    padding: 20,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  sportName: {
    fontSize: 24,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#000',
    letterSpacing: -0.5,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  openBadge: {
    backgroundColor: ACCENT_COLOR,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  openText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#000',
  },
  fullBadge: {
    backgroundColor: '#000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  fullText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFF',
  },

  mainInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
    gap: 12,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 16,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginLeft: 4,
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  participantsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#000',
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
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 30,
  },
  emptyButtonText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
