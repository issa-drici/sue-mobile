import { BrandColors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    FlatList,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useGetHistory } from '../services';
import { Sport, SportSession } from '../types/sport';

const SPORTS: Sport[] = ['tennis', 'golf', 'musculation', 'football', 'basketball'];

export default function HistoryScreen() {
  const router = useRouter();
  const { data: sessions, isLoading, error } = useGetHistory();
  const [selectedSport, setSelectedSport] = useState<string>('Tous');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrer les sessions passées
  const pastSessions = useMemo(() => {
    const now = new Date();
    return sessions
      .filter(session => {
        const sessionDate = new Date(session.date);
        return sessionDate < now;
      })
      .filter(session => {
        if (selectedSport === 'Tous') return true;
        return session.sport.toLowerCase() === selectedSport.toLowerCase();
      })
      .filter(session => {
        if (!searchQuery) return true;
        return session.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
               session.sport.toLowerCase().includes(searchQuery.toLowerCase());
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedSport, searchQuery, sessions]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const renderSessionItem = ({ item }: { item: SportSession }) => (
    <TouchableOpacity
      style={styles.sessionCard}
      onPress={() => router.push(`/session/${item.id}`)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.sportContainer}>
          <Text style={styles.sportTitle}>{item.sport.toUpperCase()}</Text>
          <Text style={styles.date}>{formatDate(item.date)}</Text>
        </View>
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.location}>{item.location}</Text>
        </View>
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

      {item.comments.length > 0 && (
        <View style={styles.commentsPreview}>
          <Ionicons name="chatbubble-outline" size={16} color="#666" />
          <Text style={styles.commentsCount}>
            {item.comments.length} commentaire{item.comments.length > 1 ? 's' : ''}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // Ne plus afficher d'écran de chargement bloquant
  // L'interface s'affiche directement, les données se chargent en arrière-plan

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Historique</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={{ color: 'red' }}>Erreur: {error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Historique</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.filters}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['Tous', 'Tennis', 'Football', 'Basketball', 'Natation'].map(sport => (
              <TouchableOpacity
                key={sport}
                style={[
                  styles.filterButton,
                  selectedSport === sport && styles.filterButtonActive
                ]}
                onPress={() => setSelectedSport(sport as string)}
              >
                <Text style={[
                  styles.filterButtonText,
                  selectedSport === sport && styles.filterButtonTextActive
                ]}>
                  {sport}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <FlatList
          data={pastSessions}
          renderItem={renderSessionItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          scrollEnabled={false}
        />
      </ScrollView>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: BrandColors.primary,
  },
  content: {
    flex: 1,
  },
  filters: {
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  filterButtonText: {
    color: '#333',
    fontSize: 14,
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  list: {
    padding: 16,
  },
  sessionCard: {
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
  sportContainer: {
    marginBottom: 8,
  },
  sportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: BrandColors.primary,
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  commentsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  commentsCount: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 