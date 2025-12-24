import { ENV } from '@/config/env';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { MainScreenLayout } from '../components/ui/ScreenLayout';
import { useSportsPreferences } from '../hooks/useSportsPreferences';
import { useCreateSession, useGetFriends } from '../services';
import { Sport } from '../types/sport';
import { getDefaultEndTime, getSportEmoji, isValidEndTime, roundToNextHalfHour, SPORTS_LIST } from '../utils';
import { useAuth } from './context/auth';

const ACCENT_COLOR = '#D4FC79'; // Electric Volt

export default function CreateSessionScreen() {
  const router = useRouter();
  const { getAuthToken } = useAuth();
  const { data: friends, error } = useGetFriends();
  const { createSession, isLoading: isCreating } = useCreateSession();
  const { sportsPreferences } = useSportsPreferences();

  // State
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  const [showSportsModal, setShowSportsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [date, setDate] = useState(new Date());

  const initialStartTime = roundToNextHalfHour(new Date());
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(getDefaultEndTime(initialStartTime));
  const [location, setLocation] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [pricePerPerson, setPricePerPerson] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  // Helpers
  const getSportsToDisplay = () => sportsPreferences || [];

  const getSelectedNonPreferredSport = () => {
    if (selectedSport && !sportsPreferences.includes(selectedSport)) {
      return selectedSport;
    }
    return null;
  };

  const handleSportSelection = (sport: Sport) => {
    Haptics.selectionAsync();
    setSelectedSport(sport);
    setShowSportsModal(false);
    setSearchQuery('');
  };

  const getFilteredSports = () => {
    if (!searchQuery.trim()) return SPORTS_LIST;
    return SPORTS_LIST.filter((sport: Sport) =>
      sport.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const onChangeDatePicker = (event: any, selectedDate?: Date) => {
    if (selectedDate) setDate(selectedDate);
  };

  const onChangeStartTimePicker = (event: any, selectedTime?: Date) => {
    if (selectedTime) {
      console.log('🕐 [TIME-PICKER] Heure sélectionnée par l\'utilisateur (SANS arrondi):');
      console.log('  - selectedTime (ISO):', selectedTime.toISOString());
      console.log('  - selectedTime.getHours() (local):', selectedTime.getHours());
      console.log('  - selectedTime.getMinutes() (local):', selectedTime.getMinutes());
      console.log('  - selectedTime (locale string):', selectedTime.toLocaleString('fr-FR'));
      
      // Ne pas arrondir : garder exactement ce que l'utilisateur a choisi
      setStartTime(selectedTime);
      if (!isValidEndTime(selectedTime, endTime)) {
        setEndTime(getDefaultEndTime(selectedTime));
      }
    }
  };

  const onChangeEndTimePicker = (event: any, selectedTime?: Date) => {
    if (selectedTime) {
      if (isValidEndTime(startTime, selectedTime)) {
        setEndTime(selectedTime);
      } else {
        setEndTime(getDefaultEndTime(startTime));
      }
    }
  };

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
  };

  const formatTime = (d: Date) => {
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const handleCreateSession = async () => {
    if (!selectedSport || !date || !startTime || !endTime || !location) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!isValidEndTime(startTime, endTime)) {
      Alert.alert('Erreur', "L'heure de fin doit être après l'heure de début");
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const selectedFriendsData = (friends || [])
        .filter(friend => selectedFriends.includes(friend.id))
        .map(friend => ({
          id: friend.id,
          firstname: friend.firstname,
          lastname: friend.lastname,
          status: 'pending' as const,
        }));

      // Logs pour tracer l'heure de début
      console.log('🕐 [CREATE-SESSION] État initial des heures:');
      console.log('  - startTime (Date object):', startTime);
      console.log('  - startTime (ISO):', startTime.toISOString());
      console.log('  - startTime (locale string):', startTime.toLocaleString('fr-FR'));
      console.log('  - startTime (timezone):', Intl.DateTimeFormat().resolvedOptions().timeZone);
      console.log('  - startTime.getHours() (local):', startTime.getHours());
      console.log('  - startTime.getMinutes() (local):', startTime.getMinutes());
      console.log('  - startTime.getUTCHours() (UTC):', startTime.getUTCHours());
      console.log('  - startTime.getUTCMinutes() (UTC):', startTime.getUTCMinutes());
      
      const formattedStartTime = startTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      const formattedEndTime = endTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      
      // Alternative: extraire directement les heures locales
      const localStartHours = String(startTime.getHours()).padStart(2, '0');
      const localStartMinutes = String(startTime.getMinutes()).padStart(2, '0');
      const manualFormattedStartTime = `${localStartHours}:${localStartMinutes}`;
      
      const localEndHours = String(endTime.getHours()).padStart(2, '0');
      const localEndMinutes = String(endTime.getMinutes()).padStart(2, '0');
      const manualFormattedEndTime = `${localEndHours}:${localEndMinutes}`;
      
      console.log('🕐 [CREATE-SESSION] Heures formatées:');
      console.log('  - formattedStartTime (toLocaleTimeString):', formattedStartTime);
      console.log('  - manualFormattedStartTime (getHours/getMinutes):', manualFormattedStartTime);
      console.log('  - formattedEndTime (toLocaleTimeString):', formattedEndTime);
      console.log('  - manualFormattedEndTime (getHours/getMinutes):', manualFormattedEndTime);
      
      // Utiliser la version manuelle pour être sûr d'utiliser l'heure locale
      const finalStartTime = manualFormattedStartTime;
      const finalEndTime = manualFormattedEndTime;

      const sessionData = {
        sport: selectedSport,
        date: date.toISOString().split('T')[0],
        startTime: finalStartTime,
        endTime: finalEndTime,
        location: location,
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
        pricePerPerson: pricePerPerson ? parseFloat(pricePerPerson) : null,
        participants: selectedFriendsData,
      };

      console.log('🕐 [CREATE-SESSION] sessionData avant envoi à createSession:');
      console.log('  - sessionData.startTime:', sessionData.startTime);
      console.log('  - sessionData.endTime:', sessionData.endTime);
      console.log('  - sessionData.date:', sessionData.date);
      console.log('  - sessionData complet:', JSON.stringify(sessionData, null, 2));

      const newSession = await createSession(sessionData);

      if (selectedFriends.length > 0) {
        try {
          const authToken = await getAuthToken();
          if (authToken) {
            for (const friendId of selectedFriends) {
              await fetch(`${ENV.API_BASE_URL}/notifications/send`, {
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
            }
          }
        } catch {
          // Silent fail for notifications
        }
      }

      if (newSession && newSession.id) {
        router.replace(`/session/${newSession.id}`);
      } else {
        router.replace('/');
      }
    } catch (error) {
      Alert.alert(
        'Erreur',
        error instanceof Error ? error.message : 'Une erreur est survenue'
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
    Haptics.selectionAsync();
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter(id => id !== friendId));
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };

  if (error) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorText}>Erreur: {error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <MainScreenLayout title="Créer" showHeader={false} containerStyle={{ backgroundColor: '#FFF' }}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NOUVELLE SESSION</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Sport Selection */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.section}>
          <Text style={styles.sectionLabel}>SPORT*</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sportsScroll}>
            {getSportsToDisplay().map((sport) => (
              <TouchableOpacity
                key={sport}
                style={[styles.sportBadge, selectedSport === sport && styles.sportBadgeSelected]}
                onPress={() => handleSportSelection(sport)}
              >
                <Text style={[styles.sportText, selectedSport === sport && styles.sportTextSelected]}>
                  {sport.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}

            {getSelectedNonPreferredSport() && (
              <TouchableOpacity
                style={[styles.sportBadge, styles.sportBadgeSelected]}
                onPress={() => setShowSportsModal(true)}
              >
                <Text style={[styles.sportText, styles.sportTextSelected]}>
                  {getSelectedNonPreferredSport()!.toUpperCase()}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.sportBadgeOutline} onPress={() => setShowSportsModal(true)}>
              <Ionicons name="add" size={24} color="#000" />
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>

        {/* Date & Time */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
          <Text style={styles.sectionLabel}>QUAND ?*</Text>

          <View style={styles.dateTimeRow}>
            <View style={styles.dateContainer}>
              <DateTimePicker
                value={date}
                mode="date"
                onChange={onChangeDatePicker}
                minimumDate={new Date()}
                themeVariant='light'
                locale="fr-FR"
                style={styles.datePicker}
              />
            </View>
          </View>

          <View style={styles.timeRow}>
            <View style={styles.timeContainer}>
              <Text style={styles.timeLabel}>DÉBUT</Text>
              <DateTimePicker
                value={startTime}
                mode="time"
                onChange={onChangeStartTimePicker}
                themeVariant='light'
                locale="fr-FR"
                style={styles.timePicker}
              />
            </View>
            <View style={styles.timeDivider} />
            <View style={styles.timeContainer}>
              <Text style={styles.timeLabel}>FIN</Text>
              <DateTimePicker
                value={endTime}
                mode="time"
                onChange={onChangeEndTimePicker}
                themeVariant='light'
                locale="fr-FR"
                style={styles.timePicker}
              />
            </View>
          </View>
        </Animated.View>

        {/* Location */}
        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.section}>
          <Text style={styles.sectionLabel}>OÙ ?*</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="location-sharp" size={20} color="#000" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="LIEU DE LA SESSION"
              placeholderTextColor="#999"
              value={location}
              onChangeText={setLocation}
            />
          </View>
        </Animated.View>

        {/* Details */}
        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.section}>
          <Text style={styles.sectionLabel}>DÉTAILS</Text>
          <View style={styles.detailsRow}>
            <View style={[styles.inputWrapper, { flex: 1 }]}>
              <Ionicons name="people" size={20} color="#000" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="MAX JOUEURS"
                placeholderTextColor="#999"
                value={maxParticipants}
                onChangeText={setMaxParticipants}
                keyboardType="numeric"
                maxLength={2}
              />
            </View>
            <View style={{ width: 16 }} />
            <View style={[styles.inputWrapper, { flex: 1 }]}>
              <Ionicons name="cash" size={20} color="#000" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="PRIX (€)"
                placeholderTextColor="#999"
                value={pricePerPerson}
                onChangeText={setPricePerPerson}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </Animated.View>

        {/* Squad */}
        <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.section}>
          <View style={styles.squadHeader}>
            <Text style={styles.sectionLabel}>CONVOQUER LE SQUAD</Text>
            <TouchableOpacity onPress={handleSelectAllFriends}>
              <Text style={styles.selectAllText}>
                {selectedFriends.length === (friends?.length || 0) ? 'TOUT DÉSÉLECTIONNER' : 'TOUT SÉLECTIONNER'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.friendsList}>
            {(friends || []).map((friend) => {
              const isSelected = selectedFriends.includes(friend.id);
              return (
                <TouchableOpacity
                  key={friend.id}
                  style={[styles.friendItem, isSelected && styles.friendItemSelected]}
                  onPress={() => handleToggleFriend(friend.id)}
                >
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Ionicons name="checkmark" size={14} color="#000" />}
                  </View>
                  <Text style={[styles.friendName, isSelected && styles.friendNameSelected]}>
                    {friend.firstname} {friend.lastname}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        <View style={styles.footerSpacer} />
      </ScrollView>

      {/* Submit Button */}
      <Animated.View entering={FadeInUp.delay(600).springify()} style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, isCreating && styles.submitButtonDisabled]}
          onPress={handleCreateSession}
          disabled={isCreating}
        >
          <Text style={styles.submitButtonText}>
            {isCreating ? 'CRÉATION...' : 'LANCER LA SESSION'}
          </Text>
          {!isCreating && <Ionicons name="arrow-forward" size={20} color="#000" />}
        </TouchableOpacity>
      </Animated.View>

      {/* Sports Modal */}
      <Modal visible={showSportsModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>CHOISIR UN SPORT</Text>
            <TouchableOpacity onPress={() => setShowSportsModal(false)}>
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
          </View>

          <FlatList
            data={getFilteredSports()}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.sportListItem, selectedSport === item && styles.sportListItemSelected]}
                onPress={() => handleSportSelection(item)}
              >
                <Text style={[styles.sportListItemText, selectedSport === item && styles.sportListItemTextSelected]}>
                  {item.toUpperCase()} {getSportEmoji(item)}
                </Text>
                {selectedSport === item && <Ionicons name="checkmark" size={24} color="#000" />}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

    </MainScreenLayout>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: 'red', fontWeight: 'bold' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: { padding: 4 },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
    fontStyle: 'italic',
  },

  scrollContent: {
    paddingTop: 24,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000',
    marginBottom: 16,
    letterSpacing: 0.5,
  },

  // Sports
  sportsScroll: {
    paddingRight: 24,
    gap: 12,
  },
  sportBadge: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
  },
  sportBadgeSelected: {
    backgroundColor: '#000',
  },
  sportBadgeOutline: {
    width: 48,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
  },
  sportText: {
    fontWeight: '800',
    fontSize: 14,
    color: '#000',
  },
  sportTextSelected: {
    color: '#FFF',
  },

  // Date Time
  dateTimeRow: {
    marginBottom: 16,
  },
  dateContainer: {
    alignItems: 'flex-start',
  },
  datePicker: {
    marginLeft: -10, // Align left visually
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  timeContainer: {
    alignItems: 'flex-start',
  },
  timeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#666',
    marginBottom: 4,
  },
  timePicker: {
    marginLeft: -10,
  },
  timeDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E0E0',
  },

  // Inputs
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
    opacity: 0.5,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  detailsRow: {
    flexDirection: 'row',
  },

  // Squad
  squadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectAllText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#000',
    textDecorationLine: 'underline',
  },
  friendsList: {
    gap: 8,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 4,
  },
  friendItemSelected: {
    borderColor: '#000',
    backgroundColor: '#F9F9F9',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: '#000',
    backgroundColor: ACCENT_COLOR,
  },
  friendName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  friendNameSelected: {
    color: '#000',
    fontWeight: '800',
  },

  footerSpacer: { height: 100 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  submitButton: {
    backgroundColor: ACCENT_COLOR,
    height: 56,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#E0E0E0',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000',
    fontStyle: 'italic',
  },

  // Modal
  modalContent: { flex: 1, backgroundColor: '#FFF', paddingTop: 20 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: { fontSize: 20, fontWeight: '900', fontStyle: 'italic' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    margin: 24,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 4,
    gap: 12,
  },
  searchInput: { flex: 1, fontSize: 16, fontWeight: '600' },
  sportListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  sportListItemSelected: { backgroundColor: '#F0FFF0' },
  sportListItemText: { fontSize: 16, fontWeight: '600' },
  sportListItemTextSelected: { fontWeight: '800' },
});