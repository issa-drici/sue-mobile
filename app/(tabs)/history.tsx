import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeInDown,
  FadeInRight,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

import PullToRefresh from '../../components/PullToRefresh';
import { MainScreenLayout } from '../../components/ui/ScreenLayout';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { useGetHistory } from '../../services';
import { SportSession } from '../../types/sport';
import { formatTimeFrance } from '../../utils/dateHelpers';

const { width } = Dimensions.get('window');

// --- Constants ---
const ACCENT_COLOR = '#D4FC79'; // Electric Volt / Lime
const ACCENT_COLOR_2 = '#96E6A1'; // Secondary Green

// --- Components ---

const FilterPill = ({
  label,
  count,
  isActive,
  onPress,
  index,
}: {
  label: string;
  count: number;
  isActive: boolean;
  onPress: () => void;
  index: number;
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    Haptics.selectionAsync();
    scale.value = withTiming(0.9, { duration: 50 }, () => {
      scale.value = withTiming(1, { duration: 100 });
    });
    onPress();
  };

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 30).springify().damping(15)}
      style={animatedStyle}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.9}
        style={[
          styles.filterPill,
          isActive && styles.filterPillActive,
        ]}
      >
        <Text
          style={[
            styles.filterPillText,
            isActive && styles.filterPillTextActive,
          ]}
        >
          {label.toUpperCase()}
          <Text style={{ fontSize: 10, opacity: isActive ? 0.8 : 0.5 }}> {count}</Text>
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const SessionItem = ({
  item,
  index,
  onPress,
}: {
  item: SportSession;
  index: number;
  onPress: () => void;
}) => {
  const scale = useSharedValue(1);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withTiming(0.98, { duration: 50 }, () => {
      scale.value = withTiming(1, { duration: 100 });
    });
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isCancelled = item.status === 'cancelled';
  // Compter uniquement les participants qui ont accepté l'invitation
  const acceptedParticipants = item.participants.filter(p => p.status === 'accepted');

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).duration(400).easing(Easing.out(Easing.cubic))}
      layout={Layout.springify()}
      style={[styles.itemContainer, animatedStyle]}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.9}
        style={[styles.itemContent, isCancelled && styles.itemCancelled]}
      >
        {/* Left: Date Block */}
        <View style={styles.dateBlock}>
          <Text style={styles.dateDay}>{new Date(item.date).getDate()}</Text>
          <Text style={styles.dateMonth}>
            {new Date(item.date).toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase().replace('.', '')}
          </Text>
        </View>

        {/* Center: Info */}
        <View style={styles.infoBlock}>
          <View style={styles.sportRow}>
            <Text style={styles.sportName}>{item.sport.toUpperCase()}</Text>
            {isCancelled && <View style={styles.cancelledDot} />}
          </View>

          <Text style={styles.locationText} numberOfLines={1}>
            {item.location.toUpperCase()}
          </Text>

          <View style={styles.metaRow}>
            <Text style={styles.timeText}>{formatTimeFrance(item.startTime)}</Text>
            <View style={styles.metaDivider} />
            <Text style={styles.participantsText}>
              {acceptedParticipants.length} ATHLÈTES
            </Text>
          </View>
        </View>

        {/* Right: Action / Status */}
        <View style={styles.actionBlock}>
          <View style={styles.arrowCircle}>
            <Ionicons name="arrow-forward" size={20} color="#000" />
          </View>
        </View>
      </TouchableOpacity>
      <View style={styles.separator} />
    </Animated.View>
  );
};


export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedSport, setSelectedSport] = useState('Tous');
  const [searchQuery] = useState('');
  const { data: sessions, isLoading, error, refetch } = useGetHistory();

  const { refreshing, onRefresh } = usePullToRefresh({
    onRefresh: refetch,
    minDelay: 800,
  });

  const availableSports = useMemo(() => {
    const sportCounts = new Map<string, number>();
    sessions.forEach((session) => {
      const count = sportCounts.get(session.sport) || 0;
      sportCounts.set(session.sport, count + 1);
    });

    const sortedSports = Array.from(sportCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([sport, count]) => ({ sport, count }));

    return [{ sport: 'Tous', count: sessions.length }, ...sortedSports];
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    return sessions
      .filter((session) => {
        if (selectedSport === 'Tous') return true;
        return session.sport === selectedSport;
      })
      .filter((session) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          session.sport.toLowerCase().includes(query) ||
          session.location.toLowerCase().includes(query) ||
          session.participants.some((p) =>
            `${p.firstname} ${p.lastname}`.toLowerCase().includes(query)
          )
        );
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedSport, searchQuery, sessions]);

  // Calculate stats
  const totalSessions = sessions.length;
  const thisMonthSessions = sessions.filter(s => {
    const d = new Date(s.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <MainScreenLayout title="Historique" showHeader={false} containerStyle={{ backgroundColor: '#FFF' }}>

      {/* Dynamic Header */}
      <View style={[styles.headerContainer, Platform.OS === 'android' && { paddingTop: Math.max(insets.top, 20) }]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>VOTRE</Text>
          <Text style={[styles.headerTitle, styles.headerTitleAccent]}>LÉGENDE</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalSessions}</Text>
            <Text style={styles.statLabel}>TOTAL</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{thisMonthSessions}</Text>
            <Text style={styles.statLabel}>CE MOIS</Text>
          </View>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {availableSports.map((sportData, index) => (
            <FilterPill
              key={sportData.sport}
              label={sportData.sport}
              count={sportData.count}
              isActive={selectedSport === sportData.sport}
              onPress={() => setSelectedSport(sportData.sport)}
              index={index}
            />
          ))}
        </ScrollView>
      </View>

      {/* List */}
      <FlatList
        data={filteredSessions}
        renderItem={({ item, index }) => (
          <SessionItem
            item={item}
            index={index}
            onPress={() => router.push(`/session/${item.id}?source=history`)}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          Platform.OS === 'android' && { paddingBottom: Math.max(insets.bottom, 100) + 60 }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <PullToRefresh refreshing={refreshing} onRefresh={onRefresh} color="#000" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {isLoading ? (
              <Text style={styles.emptyText}>CHARGEMENT...</Text>
            ) : error ? (
              <Text style={[styles.emptyText, { color: 'red' }]}>ERREUR SYSTÈME</Text>
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.emptyTitle}>AUCUNE SESSION</Text>
                <Text style={styles.emptyText}>COMMENCEZ VOTRE AVENTURE.</Text>
              </View>
            )}
          </View>
        }
      />
    </MainScreenLayout>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: '#FFF',
  },
  headerTop: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#000',
    lineHeight: 48,
    letterSpacing: -2,
    fontStyle: 'italic',
  },
  headerTitleAccent: {
    // For "Nike" feel, maybe just keep it black or use the accent color?
    // Let's use outline style text if possible, but React Native text stroke is tricky.
    // Let's stick to solid black but maybe add a highlight.
    color: '#000',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000',
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
  filtersWrapper: {
    paddingBottom: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filtersContent: {
    paddingHorizontal: 24,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4, // Sharper corners
    backgroundColor: '#F5F5F5',
    marginRight: 0,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterPillActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 0.5,
  },
  filterPillTextActive: {
    color: '#FFF',
  },
  listContent: {
    paddingBottom: 100,
  },
  itemContainer: {
    backgroundColor: '#FFF',
  },
  itemContent: {
    flexDirection: 'row',
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  itemCancelled: {
    opacity: 0.5,
  },
  dateBlock: {
    width: 50,
    alignItems: 'center',
    marginRight: 16,
  },
  dateDay: {
    fontSize: 28,
    fontWeight: '900',
    color: '#000',
    letterSpacing: -1,
  },
  dateMonth: {
    fontSize: 12,
    fontWeight: '800',
    color: '#888',
    marginTop: -4,
  },
  infoBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  sportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sportName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000',
    letterSpacing: -0.5,
    fontStyle: 'italic',
  },
  cancelledDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'red',
    marginLeft: 8,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
    fontVariant: ['tabular-nums'],
  },
  metaDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CCC',
    marginHorizontal: 8,
  },
  participantsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },
  actionBlock: {
    marginLeft: 16,
  },
  arrowCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ACCENT_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 1,
  },
});
