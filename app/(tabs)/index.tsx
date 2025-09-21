import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import PullToRefresh from '../../components/PullToRefresh';
import { usePullToRefresh } from '../../hooks';
import { useGetSessions } from '../../services';
import { SportSession } from '../../types/sport';

import { BrandColors } from '@/constants/Colors';
import { formatDate, formatTime } from '../../utils/dateHelpers';

const SessionCard = ({ session }: { session: SportSession }) => {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        session.status === 'cancelled' && styles.cancelledCard
      ]}
      onPress={() => router.push(`/session/${session.id}`)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.sportTitle}>
          {(session.sport || 'Sport').toUpperCase()}
        </Text>
        <Text style={styles.date}>
          {formatDate(session.date)} de {formatTime(session.startTime)} à {formatTime(session.endTime)}
        </Text>
      </View>

      <View style={styles.locationContainer}>
        <Ionicons name="location-outline" size={16} color="#666" />
        <Text style={styles.location}>{session.location}</Text>
      </View>

      <View style={styles.participantsContainer}>
        <Text style={styles.participantsTitle}>
          Participants ({(session.participants || []).filter(p => p.status === 'accepted').length}) :
        </Text>
        <View style={styles.participantsList}>
          {(session.participants || []).slice(0, 5).map((participant, index) => (
            <View key={participant.id || `participant-${index}`} style={styles.participant}>
              <Text style={styles.participantName}>
                {participant.firstname} {participant.lastname}
              </Text>
              <View style={[
                styles.statusBadge,
                {
                  backgroundColor: participant.status === 'accepted' ? '#4CAF50' :
                    participant.status === 'declined' ? '#F44336' : '#FFC107'
                }
              ]}>
                <Text style={styles.statusText}>
                  {participant.status === 'accepted' ? '✓' :
                    participant.status === 'declined' ? '✕' : '?'}
                </Text>
              </View>
            </View>
          ))}
          {(session.participants || []).length > 5 && (
            <View style={styles.participant}>
              <Text style={styles.participantName}>
                +{(session.participants || []).length - 5} autre{(session.participants || []).length - 5 > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>
        {(!session.participants || session.participants.length === 0) && (
          <Text style={styles.noParticipantsText}>Aucun participant</Text>
        )}
      </View>

      {/* Indicateur de session annulée */}
      {session.status === 'cancelled' && (
        <View style={styles.cancelledBanner}>
          <Ionicons name="close-circle" size={16} color="#fff" />
          <Text style={styles.cancelledText}>ANNULÉE</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const { data: sessions, isLoading, error, refetch } = useGetSessions();



  // Utilisation du nouveau hook avec délai minimum
  const { refreshing, onRefresh } = usePullToRefresh({
    onRefresh: refetch,
    minDelay: 1000, // Délai minimum de 1 seconde
    onError: (error) => {
    }
  });

  // Debug: Afficher les informations des sessions
  React.useEffect(() => {
    if (sessions && sessions.length > 0) {
      sessions.forEach((session, index) => {
      });
    }
  }, [sessions]);



  // Ne pas afficher d'écran de chargement séparé, toujours afficher l'interface
  // Le loading sera géré par le pull-to-refresh et les états vides

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Mes Sessions</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/create-session')}
        >
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={styles.createButtonText}>Nouvelle Session</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={sessions}
        renderItem={({ item }) => <SessionCard session={item} />}
        keyExtractor={(item) => item.id || `session-${Math.random()}`}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {isLoading ? (
              <>
                <Ionicons name="refresh-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>Chargement des sessions...</Text>
              </>
            ) : error ? (
              <>
                <Ionicons name="alert-circle-outline" size={64} color="#ff6b6b" />
                <Text style={[styles.emptyText, { color: '#ff6b6b' }]}>Erreur de chargement</Text>
                <Text style={styles.emptySubtext}>{error}</Text>
              </>
            ) : (
              <>
                <Ionicons name="calendar-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>Aucune session trouvée</Text>
                <Text style={styles.emptySubtext}>Créez votre première session !</Text>
              </>
            )}
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
  createButton: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  createButtonText: {
    color: BrandColors.white,
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelledCard: {
    backgroundColor: '#ffebee', // Light red background for cancelled sessions
    borderColor: '#ef9a9a',
    borderWidth: 1,
  },
  cancelledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F44336', // Red color for cancelled banner
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  cancelledText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cardHeader: {
    marginBottom: 12,
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
    color: '#333',
  },
  statusBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  noParticipantsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    minHeight: 300,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
});
