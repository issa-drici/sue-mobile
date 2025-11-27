import { ENV } from '@/config/env';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../components/ui/Card';
import { BackScreenLayout } from '../components/ui/ScreenLayout';
import { DesignTokens } from '../constants/DesignSystem';
import { useSportsPreferences } from '../hooks/useSportsPreferences';
import { useCreateSession, useGetFriends } from '../services';
import { Friend } from '../services/types/users';
import { CommonStyles, TextStyles } from '../styles/CommonStyles';
import { Sport } from '../types/sport';
import { getDefaultEndTime, getSportEmoji, isValidEndTime, roundToNearestHalfHour, roundToNextHalfHour, SPORTS_LIST } from '../utils';
import { useAuth } from './context/auth';

export default function CreateSessionScreen() {
  const router = useRouter();
  const { getAuthToken } = useAuth();
  const { data: friends, error } = useGetFriends();
  const { createSession, isLoading: isCreating } = useCreateSession();
  const { sportsPreferences } = useSportsPreferences();
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  const [showSportsModal, setShowSportsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [date, setDate] = useState(new Date());
  
  // Initialiser avec l'heure arrondie à la demi-heure suivante pour les valeurs par défaut
  const initialStartTime = roundToNextHalfHour(new Date());
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(getDefaultEndTime(initialStartTime));
  const [location, setLocation] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [pricePerPerson, setPricePerPerson] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  // Logique pour les sports à afficher
  const getSportsToDisplay = () => {
    // Afficher seulement les sports préférés du backend
    return sportsPreferences || [];
  };

  // Obtenir le sport sélectionné s'il n'est pas dans les préférences
  const getSelectedNonPreferredSport = () => {
    console.log('Debug - selectedSport:', selectedSport);
    console.log('Debug - sportsPreferences:', sportsPreferences);
    console.log('Debug - includes check:', selectedSport && !sportsPreferences.includes(selectedSport));
    
    if (selectedSport && !sportsPreferences.includes(selectedSport)) {
      return selectedSport;
    }
    return null;
  };

  const handleSportSelection = (sport: Sport) => {
    setSelectedSport(sport);
    setShowSportsModal(false);
    setSearchQuery('');
  };

  // Filtrer les sports selon la recherche
  const getFilteredSports = () => {
    if (!searchQuery.trim()) {
      return SPORTS_LIST;
    }
    return SPORTS_LIST.filter((sport: Sport) => 
      sport.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const onChangeDatePicker = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const onChangeStartTimePicker = (event: any, selectedTime?: Date) => {
    if (selectedTime) {
      // Arrondir l'heure de début à la demi-heure la plus proche
      const roundedStartTime = roundToNearestHalfHour(selectedTime);
      setStartTime(roundedStartTime);
      
      // Mettre à jour l'heure de fin si elle devient invalide
      if (!isValidEndTime(roundedStartTime, endTime)) {
        setEndTime(getDefaultEndTime(roundedStartTime));
      }
    }
  };

  const onChangeEndTimePicker = (event: any, selectedTime?: Date) => {
    if (selectedTime) {
      // Vérifier que l'heure de fin est valide
      if (isValidEndTime(startTime, selectedTime)) {
        setEndTime(selectedTime);
      } else {
        // Si l'heure de fin n'est pas valide, utiliser l'heure par défaut
        setEndTime(getDefaultEndTime(startTime));
      }
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
    if (!isValidEndTime(startTime, endTime)) {
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
    <BackScreenLayout 
      title="Nouvelle Session"
      scrollable
      horizontalPadding="md"
    >

        {/* Sélection du sport */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Sport*</Text>
          <View style={styles.sportsGrid}>
            {getSportsToDisplay().map((sport) => (
              <TouchableOpacity
                key={sport}
                style={[
                  styles.sportButton,
                  selectedSport === sport && styles.sportButtonSelected
                ]}
                onPress={() => handleSportSelection(sport)}
              >
                <Text style={[
                  styles.sportButtonText,
                  selectedSport === sport && styles.sportButtonTextSelected
                ]}>
                  {sport.charAt(0).toUpperCase() + sport.slice(1)} {getSportEmoji(sport)}
                </Text>
              </TouchableOpacity>
            ))}
            
            {/* Sport sélectionné non préféré */}
            {getSelectedNonPreferredSport() && (
              <TouchableOpacity
                style={[styles.sportButton, styles.sportButtonSelected]}
                onPress={() => setShowSportsModal(true)}
              >
                <Text style={[styles.sportButtonText, styles.sportButtonTextSelected]}>
                  {getSelectedNonPreferredSport()!.charAt(0).toUpperCase() + getSelectedNonPreferredSport()!.slice(1)} {getSportEmoji(getSelectedNonPreferredSport()!)}
                </Text>
              </TouchableOpacity>
            )}
            
            {/* Bouton "Voir tous les sports" à la suite */}
            <TouchableOpacity
              style={styles.sportButton}
              onPress={() => setShowSportsModal(true)}
            >
              <Text style={styles.sportButtonText}>Voir tous les sports</Text>
            </TouchableOpacity>
          </View>
          
        </Card>

        {/* Sélection de la date */}
        <Card style={styles.section}>
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
        </Card>

        {/* Sélection des heures */}
        <View style={CommonStyles.row}>
          {/* Heure de début */}
          <Card style={[styles.section, CommonStyles.flex1]}>
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
          </Card>

          {/* Heure de fin */}
          <Card style={[styles.section, CommonStyles.flex1]}>
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
          </Card>
        </View>

        {/* Lieu */}
        <Card style={styles.section}>
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
        </Card>

        {/* Nombre maximum de participants et Prix par personne */}
        <Card style={styles.section}>
          <View style={styles.rowContainer}>
            <View style={styles.halfWidth}>
              <Text style={styles.sectionTitle}>Participants max</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="people-outline" size={20} color="#666" />
                <TextInput
                  style={styles.input}
                  placeholder="Max participants"
                  placeholderTextColor="#999"
                  value={maxParticipants}
                  onChangeText={setMaxParticipants}
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
            </View>
            
            <View style={styles.halfWidth}>
              <Text style={styles.sectionTitle}>Prix par personne (€)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="card-outline" size={20} color="#666" />
                <TextInput
                  style={styles.input}
                  placeholder="Prix (optionnel)"
                  placeholderTextColor="#999"
                  value={pricePerPerson}
                  onChangeText={setPricePerPerson}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>
        </Card>

        {/* Sélection des participants */}
        <Card style={styles.section}>
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
        </Card>

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

      {/* Modal de sélection des sports */}
      <Modal
        visible={showSportsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setShowSportsModal(false);
                setSearchQuery('');
              }}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Choisir un sport</Text>
            <View style={styles.modalHeaderRight} />
          </View>

          {/* Barre de recherche */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un sport..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Liste des sports */}
          <ScrollView style={styles.sportsList}>
            {getFilteredSports().map((sport: Sport) => (
              <TouchableOpacity
                key={sport}
                style={[
                  styles.sportListItem,
                  selectedSport === sport && styles.sportListItemSelected
                ]}
                onPress={() => handleSportSelection(sport)}
              >
                <Text style={[
                  styles.sportListItemText,
                  selectedSport === sport && styles.sportListItemTextSelected
                ]}>
                  {sport.charAt(0).toUpperCase() + sport.slice(1)} {getSportEmoji(sport)}
                </Text>
                {selectedSport === sport && (
                  <Ionicons name="checkmark" size={20} color={DesignTokens.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
            
            {getFilteredSports().length === 0 && (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>Aucun sport trouvé</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </BackScreenLayout>
  );
}

const styles = StyleSheet.create({
  // Sections
  section: {
    marginBottom: DesignTokens.spacing.lg,
  },
  rowContainer: {
    ...CommonStyles.row,
    gap: DesignTokens.spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  
  // Titres de section
  sectionTitle: {
    ...TextStyles.bodyMedium,
    marginBottom: DesignTokens.spacing.md,
  },
  
  // Grille de sports
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignTokens.spacing.sm,
  },
  sportButton: {
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.sm,
    borderRadius: DesignTokens.borderRadius.xl,
    backgroundColor: DesignTokens.colors.backgroundSecondary,
    marginRight: DesignTokens.spacing.sm,
    marginBottom: DesignTokens.spacing.sm,
  },
  sportButtonSelected: {
    backgroundColor: DesignTokens.colors.primary,
  },
  sportButtonText: {
    ...TextStyles.caption,
    color: DesignTokens.colors.textSecondary,
  },
  sportButtonTextSelected: {
    ...TextStyles.caption,
    color: DesignTokens.colors.textInverse,
  },
  showMoreButton: {
    marginTop: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.sm,
    paddingHorizontal: DesignTokens.spacing.md,
    alignSelf: 'center',
    backgroundColor: DesignTokens.colors.backgroundTertiary,
    borderRadius: DesignTokens.borderRadius.xl,
  },
  showMoreText: {
    ...TextStyles.captionMedium,
    color: DesignTokens.colors.textSecondary,
  },
  
  // Styles de la modal
  modalContainer: {
    ...CommonStyles.container,
  },
  modalHeader: {
    ...CommonStyles.header,
  },
  modalCloseButton: {
    padding: DesignTokens.spacing.sm,
  },
  modalTitle: {
    ...TextStyles.h4,
  },
  modalHeaderRight: {
    width: 40,
  },
  searchContainer: {
    ...CommonStyles.row,
    margin: DesignTokens.spacing.md,
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.sm,
    backgroundColor: DesignTokens.colors.backgroundSecondary,
    borderRadius: DesignTokens.borderRadius.md,
  },
  searchIcon: {
    marginRight: DesignTokens.spacing.sm,
  },
  searchInput: {
    ...CommonStyles.flex1,
    ...TextStyles.body,
    color: DesignTokens.colors.text,
  },
  sportsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sportListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sportListItemSelected: {
    backgroundColor: '#f8f9fa',
  },
  sportListItemText: {
    fontSize: 16,
    color: '#000',
  },
  sportListItemTextSelected: {
    color: DesignTokens.colors.primary,
    fontWeight: '600',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
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
    ...CommonStyles.row,
    padding: DesignTokens.spacing.md,
    backgroundColor: DesignTokens.colors.backgroundSecondary,
    borderRadius: DesignTokens.borderRadius.lg,
    minHeight: 50,
  },
  input: {
    ...CommonStyles.flex1,
    marginLeft: DesignTokens.spacing.sm,
    ...TextStyles.body,
    color: DesignTokens.colors.text,
  },
  createButton: {
    ...CommonStyles.buttonPrimary,
    padding: DesignTokens.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    ...TextStyles.button,
    color: DesignTokens.colors.textInverse,
  },
  selectAllButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 8,
  },
  selectAllText: {
    color: DesignTokens.colors.primary,
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
    borderColor: DesignTokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: DesignTokens.colors.primary,
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
  datePickerIOS: {
    height: 200,
    width: '100%',
  },
}); 