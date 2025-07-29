import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useCreateSession, useGetFriends } from '../services';
import { Friend } from '../services/types/users';
import { Sport } from '../types/sport';

const SPORTS: Sport[] = ['tennis', 'golf', 'musculation', 'football', 'basketball'];

export default function CreateSessionScreen() {
  const router = useRouter();
  const { data: friends, isLoading, error } = useGetFriends();
  const { createSession, isLoading: isCreating } = useCreateSession();
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [location, setLocation] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  const onChangeDatePicker = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setDate(selectedDate);
    }
    setShowDatePicker(false);
  };

  const onChangeTimePicker = (event: any, selectedTime?: Date) => {
    if (selectedTime) {
      setTime(selectedTime);
    }
    setShowTimePicker(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).toLowerCase();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCreateSession = async () => {
    if (!selectedSport || !date || !time || !location) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {

      // Préparer les données de la session
      const selectedFriendsData = friends
        .filter(friend => selectedFriends.includes(friend.id))
        .map(friend => ({
          id: friend.id,
          firstname: friend.firstname,
          lastname: friend.lastname,
          status: 'pending' as const,
        }));

      const sessionData = {
        sport: selectedSport,
        date: date.toISOString().split('T')[0], // Format YYYY-MM-DD
        time: time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        location: location,
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
        participants: selectedFriendsData,
      };

      // Créer la session via l'API
      const newSession = await createSession(sessionData);

      // Envoyer les notifications d'invitation aux participants
      if (selectedFriends.length > 0) {
        try {
          for (const friendId of selectedFriends) {
            // Appel à l'API d'envoi de notification
            const response = await fetch('http://localhost:8000/api/notifications/send', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer 172|XIxo3WMAxfIq2LlnBYBKdcnV33w4NkbkTjsvEbmH424d7021`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              body: JSON.stringify({
                recipientId: friendId,
                title: `Invitation à une session de ${selectedSport}`,
                body: `Vous avez été invité à une session de ${selectedSport} le ${formatDate(date)} à ${formatTime(time)}`,
                data: {
                  type: 'session_invitation',
                  session_id: newSession.id,
                  sport: selectedSport,
                  date: date.toISOString().split('T')[0],
                  time: formatTime(time)
                }
              })
            });

            const result = await response.json();
          }
        } catch (error) {
        }
      }

      // Rediriger automatiquement vers le détail de la session créée
      if (newSession && newSession.id) {
        router.replace(`/session/${newSession.id}`);
      } else {
        router.replace('/');
      }
    } catch (error) {
      Alert.alert(
        'Erreur',
        error instanceof Error ? error.message : 'Une erreur est survenue lors de la création de la session'
      );
    }
  };

  const handleSelectAllFriends = () => {
    if (selectedFriends.length === friends.length) {
      setSelectedFriends([]);
    } else {
      setSelectedFriends(friends.map(friend => friend.id));
    }
  };

  const handleToggleFriend = (friendId: string) => {
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter(id => id !== friendId));
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };

  const FriendItem = ({ friend }: { friend: Friend }) => {
    const isSelected = selectedFriends.includes(friend.id);

    return (
      <TouchableOpacity
        style={[styles.friendItem, isSelected && styles.friendItemSelected]}
        onPress={() => handleToggleFriend(friend.id)}
      >
        <View style={styles.friendInfo}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={24} color="#666" />
          </View>
          <Text style={styles.friendName}>
            {friend.firstname} {friend.lastname}
          </Text>
        </View>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Ionicons name="checkmark" size={20} color="#fff" />}
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Chargement des amis...</Text>
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouvelle Session</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        {/* Titre */}
        <View style={styles.titleContainer}>
          <Text style={styles.mainTitle}>Créer une nouvelle session</Text>
          <Text style={styles.subtitle}>Remplissez les informations ci-dessous</Text>
        </View>

        {/* Sélection du sport */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sport*</Text>
          <View style={styles.sportsGrid}>
            {SPORTS.map((sport) => (
              <TouchableOpacity
                key={sport}
                style={[
                  styles.sportButton,
                  selectedSport === sport && styles.sportButtonSelected
                ]}
                onPress={() => setSelectedSport(sport)}
              >
                <Text style={[
                  styles.sportButtonText,
                  selectedSport === sport && styles.sportButtonTextSelected
                ]}>
                  {sport.charAt(0).toUpperCase() + sport.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sélection de la date */}
        <View style={{ flexDirection: 'row' }}>
          <View style={[styles.section, { flex: 1 }]}>
            <Text style={styles.sectionTitle}>Date*</Text>

            {/* <View style={[styles.inputContainer, { padding: 0 }]}> */}
            <View style={{ marginLeft: -10 }}>

              <DateTimePicker
                value={date}
                mode="date"
                onChange={onChangeDatePicker}
                minimumDate={new Date()}
                themeVariant='light'
                locale="fr-FR"
              />
            </View>
            {/* </View> */}
          </View>

          {/* Sélection de l'heure */}
          <View style={[styles.section, { flex: 1 }]}>
            <Text style={styles.sectionTitle}>Heure*</Text>
            {/* <View style={[styles.inputContainer, { padding: 0, backgroundColor: '#e5e5e7' }]}> */}
            <View style={{ marginLeft: -10 }}>

              <DateTimePicker
                value={time}
                mode="time"
                onChange={onChangeTimePicker}
                themeVariant='light'
                locale="fr-FR"
              />
            </View>
            {/* </View> */}
          </View>
        </View>

        {/* Lieu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lieu*</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <TextInput
              style={styles.input}
              placeholder="Entrez le lieu de la session"
              value={location}
              onChangeText={setLocation}
            />
          </View>
        </View>

        {/* Nombre maximum de participants */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nombre maximum de participants</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="people-outline" size={20} color="#666" />
            <TextInput
              style={styles.input}
              placeholder="Entrez le nombre maximum de participants"
              value={maxParticipants}
              onChangeText={setMaxParticipants}
              keyboardType="numeric"
              maxLength={2}
            />
          </View>
        </View>

        {/* Sélection des participants */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Participants</Text>
          <TouchableOpacity
            style={styles.selectAllButton}
            onPress={handleSelectAllFriends}
          >
            <Text style={styles.selectAllText}>
              {selectedFriends.length === friends.length
                ? 'Désélectionner tout'
                : 'Sélectionner tout'}
            </Text>
          </TouchableOpacity>

          {friends.map((friend) => (
            <FriendItem key={friend.id} friend={friend} />
          ))}
        </View>

        {/* Bouton de création */}
        <TouchableOpacity
          style={[styles.createButton, isCreating && styles.createButtonDisabled]}
          onPress={handleCreateSession}
          disabled={isCreating}
        >
          <Text style={styles.createButtonText}>
            {isCreating ? 'Création en cours...' : 'Créer la session'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 47 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  headerRight: {
    width: 40, // Pour équilibrer avec le bouton retour
  },
  content: {
    flex: 1,
    padding: 16,
  },
  titleContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sportButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    marginBottom: 8,
  },
  sportButtonSelected: {
    backgroundColor: '#007AFF',
  },
  sportButtonText: {
    color: '#666',
  },
  sportButtonTextSelected: {
    color: '#fff',
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    minHeight: 50,
  },
  dateTimeText: {
    marginLeft: 8,
    fontSize: 17,
    color: '#000',
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    minHeight: 50,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 17,
    color: '#000',
  },
  createButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  selectAllButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 8,
  },
  selectAllText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  friendsList: {
    padding: 8,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  friendItemSelected: {
    backgroundColor: '#f0f8ff',
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '500',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalCancelButton: {
    color: '#666',
    fontSize: 16,
  },
  modalDoneButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  datePickerIOS: {
    height: 200,
    width: '100%',
  },
}); 