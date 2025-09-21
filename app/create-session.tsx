import { ENV } from '@/config/env';
import { BrandColors } from '@/constants/Colors';
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
import { useAuth } from './context/auth';

const SPORTS: Sport[] = ['tennis', 'golf', 'musculation', 'football', 'basketball'];

export default function CreateSessionScreen() {
  const router = useRouter();
  const { getAuthToken } = useAuth();
  const { data: friends, isLoading, error } = useGetFriends();
  const { createSession, isLoading: isCreating } = useCreateSession();
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  const [date, setDate] = useState(new Date());
  
  // Debug: Afficher la date par défaut
  console.log('Date par défaut du formulaire:', date.toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [location, setLocation] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [pricePerPerson, setPricePerPerson] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  const onChangeDatePicker = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const onChangeStartTimePicker = (event: any, selectedTime?: Date) => {
    if (selectedTime) {
      setStartTime(selectedTime);
    }
  };

  const onChangeEndTimePicker = (event: any, selectedTime?: Date) => {
    if (selectedTime) {
      setEndTime(selectedTime);
    }
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
    if (!selectedSport || !date || !startTime || !endTime || !location) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Vérifier que l'heure de fin est après l'heure de début
    if (endTime <= startTime) {
      Alert.alert('Erreur', 'L\'heure de fin doit être après l\'heure de début');
      return;
    }

    try {

      // Préparer les données de la session
      const selectedFriendsData = (friends || [])
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
        startTime: startTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        endTime: endTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        location: location,
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
        pricePerPerson: pricePerPerson ? parseFloat(pricePerPerson) : null,
        participants: selectedFriendsData,
      };

      // Debug: Afficher les données envoyées
      console.log('Données de session à envoyer:', JSON.stringify(sessionData, null, 2));
      console.log('Date formatée:', date.toISOString().split('T')[0]);
      console.log('StartTime formaté:', startTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
      console.log('EndTime formaté:', endTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));

      // Créer la session via l'API
      const newSession = await createSession(sessionData);

      // Envoyer les notifications d'invitation aux participants
      if (selectedFriends.length > 0) {
        try {
          // Récupérer le token d'authentification de l'utilisateur
          const authToken = await getAuthToken();
          if (!authToken) {
            console.warn('⚠️ Aucun token d\'authentification disponible pour les notifications');
            return;
          }

          for (const friendId of selectedFriends) {
            // Appel à l'API d'envoi de notification
            const response = await fetch(`${ENV.API_BASE_URL}/notifications/send`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              body: JSON.stringify({
                recipientId: friendId,
                title: `Invitation à une session de ${selectedSport}`,
                body: `Vous avez été invité à une session de ${selectedSport} le ${formatDate(date)} de ${formatTime(startTime)} à ${formatTime(endTime)}`,
                data: {
                  type: 'session_invitation',
                  session_id: newSession.id,
                  sport: selectedSport,
                  date: date.toISOString().split('T')[0],
                  startTime: formatTime(startTime),
                  endTime: formatTime(endTime)
                }
              })
            });

            await response.json();
          }
        } catch {
          // Erreur silencieuse pour les notifications
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
    const friendsArray = friends || [];
    if (selectedFriends.length === friendsArray.length) {
      setSelectedFriends([]);
    } else {
      setSelectedFriends(friendsArray.map(friend => friend.id));
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

  // Ne plus afficher d'écran de chargement bloquant
  // L'interface s'affiche directement, les amis se chargent en arrière-plan

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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date*</Text>
          <View style={{ alignItems: 'flex-start' }}>
            <DateTimePicker
              value={date}
              mode="date"
              onChange={onChangeDatePicker}
              minimumDate={new Date()}
              themeVariant='light'
              locale="fr-FR"
            />
          </View>
        </View>

        {/* Sélection des heures */}
        <View style={{ flexDirection: 'row' }}>
          {/* Heure de début */}
          <View style={[styles.section, { flex: 1 }]}>
            <Text style={styles.sectionTitle}>Heure de début*</Text>
            <View style={{ marginLeft: -10, alignItems: 'flex-start' }}>
              <DateTimePicker
                value={startTime}
                mode="time"
                onChange={onChangeStartTimePicker}
                themeVariant='light'
                locale="fr-FR"
              />
            </View>
          </View>

          {/* Heure de fin */}
          <View style={[styles.section, { flex: 1 }]}>
            <Text style={styles.sectionTitle}>Heure de fin*</Text>
            <View style={{ marginLeft: -10, alignItems: 'flex-start' }}>
              <DateTimePicker
                value={endTime}
                mode="time"
                onChange={onChangeEndTimePicker}
                themeVariant='light'
                locale="fr-FR"
              />
            </View>
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
              placeholderTextColor="#999"
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
              placeholderTextColor="#999"
              value={maxParticipants}
              onChangeText={setMaxParticipants}
              keyboardType="numeric"
              maxLength={2}
            />
          </View>
        </View>

        {/* Prix par personne */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prix par personne (€)</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="card-outline" size={20} color="#666" />
            <TextInput
              style={styles.input}
              placeholder="Entrez le prix par personne (optionnel)"
              placeholderTextColor="#999"
              value={pricePerPerson}
              onChangeText={setPricePerPerson}
              keyboardType="decimal-pad"
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
              {selectedFriends.length === (friends?.length || 0)
                ? 'Désélectionner tout'
                : 'Sélectionner tout'}
            </Text>
          </TouchableOpacity>

          {(friends || []).map((friend) => (
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
    backgroundColor: BrandColors.primary,
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
    backgroundColor: BrandColors.primary,
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
    color: BrandColors.primary,
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
    borderColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: BrandColors.primary,
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
    color: BrandColors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  datePickerIOS: {
    height: 200,
    width: '100%',
  },
}); 