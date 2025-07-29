import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import PullToRefresh from '../../components/PullToRefresh';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { useGetHistory } from '../../services';
import { SportSession } from '../../types/sport';
import { formatDate } from '../../utils/dateHelpers';

// Sports statiques (toujours présents)
const STATIC_SPORTS = ['Tous'];

export default function HistoryScreen() {
  const router = useRouter();
  const [selectedSport, setSelectedSport] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const { data: sessions, isLoading, error, refetch } = useGetHistory();

  // Configuration du pull-to-refresh
  const { refreshing, onRefresh } = usePullToRefresh({
    onRefresh: refetch,
    onError: (error) => {
    },
    minDelay: 1000 // Délai minimum de 1 seconde
  });

  // Calculer les sports disponibles dynamiquement avec leurs compteurs
  const availableSports = useMemo(() => {
    const sportCounts = new Map<string, number>();
    
    // Compter les sessions par sport
    sessions.forEach(session => {
      const count = sportCounts.get(session.sport) || 0;
      sportCounts.set(session.sport, count + 1);
    });
    
    // Trier par nombre de sessions décroissant
    const sortedSports = Array.from(sportCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([sport, count]) => ({ sport, count }));
    
    // Combiner sports statiques + sports dynamiques
    return [
      { sport: 'Tous', count: sessions.length },
      ...sortedSports
    ];
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    return sessions
      .filter(session => {
        if (selectedSport === 'Tous') return true;
        return session.sport === selectedSport;
      })
      .filter(session => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          session.sport.toLowerCase().includes(query) ||
          session.location.toLowerCase().includes(query) ||
          session.participants.some(p => 
            `${p.firstname} ${p.lastname}`.toLowerCase().includes(query)
          )
        );
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedSport, searchQuery, sessions]);

  const renderSessionItem = ({ item }: { item: SportSession }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push(`/session/${item.id}`)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.sportTitle}>{item.sport.toUpperCase()}</Text>
        <Text style={styles.date}>{formatDate(item.date)} à {item.time}</Text>
      </View>
      
      <View style={styles.locationContainer}>
        <Ionicons name="location-outline" size={16} color="#666" />
        <Text style={styles.location}>{item.location}</Text>
      </View>

      <View style={styles.participantsContainer}>
        <Text style={styles.participantsTitle}>Participants :</Text>
        <View style={styles.participantsList}>
          {item.participants.map((participant) => (
            <View key={participant.id} style={styles.participant}>
              <Text style={styles.participantName}>
                {participant.firstname} {participant.lastname}
              </Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: participant.status === 'accepted' ? '#4CAF50' : 
                                 participant.status === 'declined' ? '#F44336' : '#FFC107' }
              ]}>
                <Text style={styles.statusText}>
                  {participant.status === 'accepted' ? '✓' : 
                   participant.status === 'declined' ? '✕' : '?'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.commentsContainer}>
        <Ionicons name="chatbubble-outline" size={16} color="#666" />
        <Text style={styles.commentsCount}>
          {item.comments.length} commentaire{item.comments.length !== 1 ? 's' : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Ne pas afficher d'écran de chargement séparé, toujours afficher l'interface
  // Le loading sera géré par le pull-to-refresh et les états vides

  // Les erreurs sont gérées dans le ListEmptyComponent

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Historique</Text>
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {availableSports.map((sportData) => (
            <TouchableOpacity
              key={sportData.sport}
              style={[
                styles.filterButton,
                selectedSport === sportData.sport && styles.filterButtonActive
              ]}
              onPress={() => setSelectedSport(sportData.sport)}
            >
              <Text style={[
                styles.filterButtonText,
                selectedSport === sportData.sport && styles.filterButtonTextActive
              ]}>
                {sportData.sport.charAt(0).toUpperCase() + sportData.sport.slice(1)} ({sportData.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.listContainer}>
        <FlatList
          data={filteredSessions}
          renderItem={renderSessionItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <PullToRefresh
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              {isLoading ? (
                <>
                  <Ionicons name="refresh-outline" size={48} color="#666" />
                  <Text style={styles.emptyText}>Chargement de l&apos;historique...</Text>
                </>
              ) : error ? (
                <>
                  <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
                  <Text style={[styles.emptyText, { color: '#ff6b6b' }]}>Erreur de chargement</Text>
                  <Text style={styles.emptyText}>{error}</Text>
                </>
              ) : (
                <>
                  <Ionicons name="time-outline" size={48} color="#666" />
                  <Text style={styles.emptyText}>
                    Aucune session passée trouvée
                  </Text>
                </>
              )}
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  filtersContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
    height: 70,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  filtersContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    marginRight: 10,
    minWidth: 90,
    alignItems: 'center',
    height: 38,
    flexShrink: 0,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  filterButtonText: {
    color: '#495057',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 12,
  },
  sportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  location: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  participantsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
    marginBottom: 12,
  },
  participantsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  participantsList: {
    gap: 8,
  },
  participant: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantName: {
    fontSize: 14,
  },
  statusBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  commentsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
  },
  commentsCount: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: '50%',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
}); 