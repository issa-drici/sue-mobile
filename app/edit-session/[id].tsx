import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Animated as RNAnimated,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { InlineLoading } from '../../components/OptimizedLoading';
import { MainScreenLayout } from '../../components/ui/ScreenLayout';
import { BrandColors } from '../../constants/Colors';
import { useGetSessionById, useUpdateSession } from '../../services';
import { SportsApi } from '../../services/api/sportsApi';
import { getDefaultEndTime, getSportEmoji, isValidEndTime, SPORTS_LIST } from '../../utils';
import { matchesSearch } from '../../utils/search';
import { useAuth } from '../context/auth';

// Configuration fixe des sports principaux par défaut (identique à create-session)
const SPORT_PRESETS: Record<string, { label: string; emoji: string; color: string }> = {
  football: { label: 'Football', emoji: '⚽', color: '#EAF6DD' },
  tennis: { label: 'Tennis', emoji: '🎾', color: '#FFF3E0' },
  golf: { label: 'Golf', emoji: '⛳', color: '#EDE7F6' },
  padel: { label: 'Padel', emoji: '🎾', color: '#FFF3E0' },
};

export default function EditSessionScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const formScrollViewRef = React.useRef<ScrollView>(null);

  const sessionId = typeof id === 'string' ? id : '';

  const { data: session, getSessionById, isLoading: isLoadingSession } = useGetSessionById();
  const { updateSession, isLoading: isUpdating } = useUpdateSession();

  // State Formulaire (pré-rempli depuis la session existante, cf. effet plus bas)
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [date, setDate] = useState(new Date());

  // Sports servis par le backend (mêmes composants/données que create-session)
  const [allSports, setAllSports] = useState<string[]>(SPORTS_LIST as string[]);
  const [playedSports, setPlayedSports] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [all, played] = await Promise.all([
          SportsApi.getAll(),
          SportsApi.getPlayedByUser(),
        ]);
        if (cancelled) return;
        if (all.length) setAllSports(all as string[]);
        setPlayedSports(played.map((p) => p.sport as string));
        // Pas de présélection par défaut ici (contrairement à create-session) :
        // le sport affiché doit toujours être celui de la session, jamais un repli.
      } catch {
        // Repli silencieux : allSports garde la liste locale
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const quickSports = React.useMemo(() => {
    if (selectedSport && !playedSports.includes(selectedSport)) {
      return [selectedSport, ...playedSports];
    }
    return playedSports;
  }, [playedSports, selectedSport]);

  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [maxParticipants, setMaxParticipants] = useState<number | null>(null);
  const [pricePerPerson, setPricePerPerson] = useState<string>('');
  const [location, setLocation] = useState<string>('');

  // Modals et sélecteurs
  const [showSportsModal, setShowSportsModal] = useState(false);
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [showTimePickerModal, setShowTimePickerModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Android Specific Pickers State
  const [showAndroidDatePicker, setShowAndroidDatePicker] = useState(false);
  const [showAndroidStartTimePicker, setShowAndroidStartTimePicker] = useState(false);
  const [showAndroidEndTimePicker, setShowAndroidEndTimePicker] = useState(false);

  // Temporaire pour les pickers dans les modals (iOS)
  const [tempDate, setTempDate] = useState(new Date());
  const [tempStartTime, setTempStartTime] = useState(new Date());
  const [tempEndTime, setTempEndTime] = useState(new Date());

  // Slide animation for date/time picker modals (iOS)
  const datePickerSlideAnim = React.useRef(new RNAnimated.Value(400)).current;
  const timePickerSlideAnim = React.useRef(new RNAnimated.Value(400)).current;

  React.useEffect(() => {
    if (showDatePickerModal) {
      RNAnimated.spring(datePickerSlideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      datePickerSlideAnim.setValue(400);
    }
  }, [showDatePickerModal]);

  React.useEffect(() => {
    if (showTimePickerModal) {
      RNAnimated.spring(timePickerSlideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      timePickerSlideAnim.setValue(400);
    }
  }, [showTimePickerModal]);

  React.useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      if (formScrollViewRef.current) {
        formScrollViewRef.current.scrollToEnd({ animated: true });
      }
    });

    return () => {
      showSubscription.remove();
    };
  }, []);

  // Load session data
  useEffect(() => {
    if (sessionId) {
      getSessionById(sessionId);
    }
  }, [sessionId, getSessionById]);

  // Helper function to parse time string to Date
  const parseTimeString = (timeString: string): Date => {
    const timeOnly = timeString.split(':').slice(0, 2).join(':');
    const [hours, minutes] = timeOnly.split(':').map(Number);
    return new Date(2000, 0, 1, hours, minutes, 0, 0);
  };

  // Initialize form with session data (une seule fois par session : un refetch
  // en arrière-plan pendant l'édition ne doit pas écraser ce que l'utilisateur a choisi)
  const initializedSessionId = useRef<string | null>(null);
  useEffect(() => {
    if (session && initializedSessionId.current !== session.id) {
      initializedSessionId.current = session.id;
      setSelectedSport(session.sport as string);
      setDate(new Date(session.date));

      const sessionStartTime = parseTimeString(session.startTime || '18:00');
      const sessionEndTime = parseTimeString(session.endTime || '20:00');

      setStartTime(sessionStartTime);

      if (isValidEndTime(sessionStartTime, sessionEndTime)) {
        setEndTime(sessionEndTime);
      } else {
        setEndTime(getDefaultEndTime(sessionStartTime));
      }

      setLocation(session.location);
      setMaxParticipants(session.maxParticipants ?? null);
      setPricePerPerson(session.pricePerPerson != null ? String(session.pricePerPerson) : '');
    }
  }, [session]);

  // Verify organizer
  useEffect(() => {
    if (session && user && session.organizer.id !== user.id) {
      Alert.alert(
        'Accès refusé',
        'Seul l\'organisateur peut modifier cette session.',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    }
  }, [session, user, router]);

  const getSportDetails = (sportKey: string) => {
    const key = sportKey.toLowerCase().trim();
    if (SPORT_PRESETS[key]) {
      return SPORT_PRESETS[key];
    }

    const label = sportKey.charAt(0).toUpperCase() + sportKey.slice(1);
    const emoji = getSportEmoji(sportKey);

    const pastelColors = ['#EAF6DD', '#FFF3E0', '#EDE7F6', '#FFE0B2', '#E0F2F1', '#E1F5FE', '#F3E5F5', '#E8F5E9', '#E0F7FA', '#D7CCC8'];
    const hash = key.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const color = pastelColors[hash % pastelColors.length];

    return { label, emoji, color };
  };

  const handleSportSelection = (sport: string) => {
    Haptics.selectionAsync();
    setSelectedSport(sport);
    setShowSportsModal(false);
    setSearchQuery('');
  };

  const getFilteredSports = () => {
    if (!searchQuery.trim()) return allSports;
    return allSports.filter((sport) => matchesSearch(sport, searchQuery));
  };

  const formatDateLabel = (d: Date) => {
    const formatted = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const formatTimeLabel = (d: Date) => {
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  // Logique du Stepper Joueurs Max (identique à create-session)
  const incrementMax = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (maxParticipants === null) {
      setMaxParticipants(1);
    } else {
      setMaxParticipants((prev) => (prev ?? 1) + 1);
    }
  };

  const decrementMax = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (maxParticipants === null) return;
    if (maxParticipants <= 1) {
      setMaxParticipants(null);
    } else {
      setMaxParticipants((prev) => (prev ?? 1) - 1);
    }
  };

  const handleDatePickerPress = () => {
    Haptics.selectionAsync();
    if (Platform.OS === 'ios') {
      setTempDate(date);
      setShowDatePickerModal(true);
    } else {
      setShowAndroidDatePicker(true);
    }
  };

  const handleTimePickerPress = () => {
    Haptics.selectionAsync();
    if (Platform.OS === 'ios') {
      setTempStartTime(startTime);
      setTempEndTime(endTime);
      setShowTimePickerModal(true);
    } else {
      setShowAndroidStartTimePicker(true);
    }
  };

  const handleUpdateSession = async () => {
    if (!selectedSport || !location.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires (sport, lieu)');
      return;
    }

    if (!isValidEndTime(startTime, endTime)) {
      Alert.alert('Erreur', "L'heure de fin doit être strictement après l'heure de début");
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const localStartHours = String(startTime.getHours()).padStart(2, '0');
      const localStartMinutes = String(startTime.getMinutes()).padStart(2, '0');
      const finalStartTime = `${localStartHours}:${localStartMinutes}`;

      const localEndHours = String(endTime.getHours()).padStart(2, '0');
      const localEndMinutes = String(endTime.getMinutes()).padStart(2, '0');
      const finalEndTime = `${localEndHours}:${localEndMinutes}`;

      // Date en composants LOCAUX (cohérent avec les heures locales ci-dessus).
      // Ne PAS utiliser toISOString() (UTC) → décalage d'un jour près de minuit.
      const localYear = date.getFullYear();
      const localMonth = String(date.getMonth() + 1).padStart(2, '0');
      const localDay = String(date.getDate()).padStart(2, '0');
      const finalDate = `${localYear}-${localMonth}-${localDay}`;

      const sessionData = {
        sport: selectedSport,
        date: finalDate,
        startTime: finalStartTime,
        endTime: finalEndTime,
        location: location,
        maxParticipants: maxParticipants,
        pricePerPerson: pricePerPerson ? parseFloat(pricePerPerson.replace(',', '.')) : null,
      };

      await updateSession(sessionId, sessionData);

      router.replace(`/session/${sessionId}`);
    } catch (error) {
      Alert.alert(
        'Erreur',
        error instanceof Error ? error.message : 'Une erreur est survenue'
      );
    }
  };

  if (isLoadingSession || !session) {
    return <InlineLoading message="Chargement de la session..." />;
  }

  return (
    <MainScreenLayout title="Modifier" showHeader={false} containerStyle={{ backgroundColor: '#FAFAFA', flex: 1 }}>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
      >
        <View style={styles.formContainer}>
          {/* Header */}
          <View style={[styles.header, Platform.OS === 'android' && { paddingTop: Math.max(insets.top, 16) }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeHeaderBtn}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>MODIFIER SESSION</Text>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView
            ref={formScrollViewRef}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.formContentInner}>
              <View>
                {/* Section Sport */}
                <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.section}>
                  <Text style={styles.sectionLabel}>SPORT*</Text>
                  <View style={styles.sportsHorizontalRow}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.badgesScroll}
                      contentContainerStyle={styles.badgesScrollContent}
                      keyboardShouldPersistTaps="handled"
                    >
                      {quickSports.length === 0 ? (
                        <Text style={styles.badgesEmptyHint}>Choisis ton sport</Text>
                      ) : (
                        quickSports.map((sportKey) => {
                          const details = getSportDetails(sportKey);
                          const isSelected = selectedSport === sportKey;
                          return (
                            <TouchableOpacity
                              key={sportKey}
                              style={styles.sportBadgeItem}
                              onPress={() => handleSportSelection(sportKey)}
                            >
                              <View style={[
                                styles.sportIconCircle,
                                { backgroundColor: details.color },
                                isSelected && styles.sportIconCircleSelected
                              ]}>
                                <Text style={styles.sportEmojiText}>{details.emoji}</Text>
                              </View>
                              <Text style={[styles.sportLabelText, isSelected && styles.sportLabelTextSelected]}>
                                {details.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })
                      )}
                    </ScrollView>

                    <TouchableOpacity
                      style={[styles.sportBadgeItem, styles.plusBadge]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setShowSportsModal(true);
                      }}
                    >
                      <View style={styles.sportIconCircleAdd}>
                        <Ionicons name="add" size={20} color="#8E8E93" />
                      </View>
                      <Text style={styles.sportLabelText}>Plus</Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>

                {/* Section Date */}
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.section}>
                  <Text style={styles.sectionLabel}>DATE*</Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.inputCardRow}
                    onPress={handleDatePickerPress}
                  >
                    <Ionicons name="calendar-outline" size={18} color="#8E8E93" style={styles.cardIcon} />
                    <Text style={styles.cardValueText}>{formatDateLabel(date)}</Text>
                    <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
                  </TouchableOpacity>
                </Animated.View>

                {/* Section Heure */}
                <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.section}>
                  <Text style={styles.sectionLabel}>HEURE*</Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.inputCardRow}
                    onPress={handleTimePickerPress}
                  >
                    <Ionicons name="time-outline" size={18} color="#8E8E93" style={styles.cardIcon} />
                    <View style={styles.timeDisplayBlock}>
                      <Text style={styles.timeValueText}>{formatTimeLabel(startTime)}</Text>
                      <Ionicons name="arrow-forward-outline" size={14} color="#8E8E93" style={{ marginHorizontal: 12 }} />
                      <Text style={styles.timeValueText}>{formatTimeLabel(endTime)}</Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>

                {/* Section Joueurs Max */}
                <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
                  <Text style={styles.sectionLabel}>JOUEURS MAX</Text>
                  <View style={styles.inputCardRow}>
                    <Ionicons name="people-outline" size={18} color="#8E8E93" style={styles.cardIcon} />
                    <View style={styles.stepperContainer}>
                      <TouchableOpacity
                        onPress={decrementMax}
                        style={[styles.stepperButton, maxParticipants === null && styles.stepperButtonDisabled]}
                        disabled={maxParticipants === null}
                      >
                        <Ionicons name="remove" size={16} color={maxParticipants === null ? '#CCCCCC' : '#000'} />
                      </TouchableOpacity>
                      <Text style={[styles.stepperValueText, maxParticipants === null && styles.stepperValueTextUncapped]}>
                        {maxParticipants === null ? 'Session ouverte (illimité)' : `${maxParticipants} joueur${maxParticipants > 1 ? 's' : ''}`}
                      </Text>
                      <TouchableOpacity
                        onPress={incrementMax}
                        style={styles.stepperButton}
                      >
                        <Ionicons name="add" size={16} color="#000" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </Animated.View>

                {/* Section Prix par joueur */}
                <Animated.View entering={FadeInDown.delay(250).springify()} style={styles.section}>
                  <Text style={styles.sectionLabel}>PRIX PAR JOUEUR</Text>
                  <View style={styles.inputCardRow}>
                    <Ionicons name="pricetag-outline" size={18} color="#8E8E93" style={styles.cardIcon} />
                    <TextInput
                      style={styles.textInputRow}
                      placeholder="Optionnel"
                      placeholderTextColor="#CCCCCC"
                      value={pricePerPerson}
                      onChangeText={setPricePerPerson}
                      keyboardType="numeric"
                      onFocus={() => {
                        setTimeout(() => {
                          formScrollViewRef.current?.scrollToEnd({ animated: true });
                        }, 100);
                      }}
                    />
                    <Text style={styles.currencySuffixText}>€</Text>
                  </View>
                </Animated.View>

                {/* Section Lieu */}
                <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.section}>
                  <Text style={styles.sectionLabel}>LIEU*</Text>
                  <View style={styles.inputCardRow}>
                    <Ionicons name="location-outline" size={18} color="#8E8E93" style={styles.cardIcon} />
                    <TextInput
                      style={styles.textInputRow}
                      placeholder="Entrer le lieu..."
                      placeholderTextColor="#CCCCCC"
                      value={location}
                      onChangeText={setLocation}
                      onFocus={() => {
                        setTimeout(() => {
                          formScrollViewRef.current?.scrollToEnd({ animated: true });
                        }, 100);
                      }}
                    />
                  </View>
                </Animated.View>
              </View>

              {/* Bouton ENREGISTRER */}
              <View style={styles.formFooterWrapper}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.primaryActionBtn, isUpdating && styles.btnDisabled]}
                  onPress={handleUpdateSession}
                  disabled={isUpdating}
                >
                  <Text style={styles.primaryActionBtnText}>
                    {isUpdating ? 'MISE À JOUR...' : 'ENREGISTRER →'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* MODAL TOUS LES SPORTS */}
      <Modal visible={showSportsModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.sportsModalContainer}>
          <View style={styles.sportsModalHeader}>
            <View style={{ width: 24 }} />
            <Text style={styles.sportsModalTitle}>TOUS LES SPORTS</Text>
            <TouchableOpacity onPress={() => setShowSportsModal(false)} style={styles.closeModalButtonX}>
              <Ionicons name="close" size={20} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBarContainer}>
            <Ionicons name="search" size={18} color="#8E8E93" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchBarInput}
              placeholder="Rechercher un sport"
              placeholderTextColor="#CCCCCC"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
          </View>

          <FlatList
            data={getFilteredSports()}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.sportsListContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const details = getSportDetails(item);
              return (
                <TouchableOpacity
                  style={styles.sportListItemRow}
                  onPress={() => handleSportSelection(item)}
                >
                  <View style={styles.sportListLeft}>
                    <View style={[styles.sportListCircleIcon, { backgroundColor: details.color }]}>
                      <Text style={{ fontSize: 18 }}>{details.emoji}</Text>
                    </View>
                    <Text style={styles.sportListNameText}>{details.label}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>

      {/* iOS DATE PICKER MODAL */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showDatePickerModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDatePickerModal(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={() => setShowDatePickerModal(false)}
            />
            <RNAnimated.View
              style={[
                styles.bottomSheetPickerContainer,
                { transform: [{ translateY: datePickerSlideAnim }] }
              ]}
            >
              <View style={styles.pickerModalHeader}>
                <TouchableOpacity onPress={() => setShowDatePickerModal(false)}>
                  <Text style={styles.pickerCancelText}>Annuler</Text>
                </TouchableOpacity>
                <Text style={styles.pickerModalTitleText}>Choisir la date</Text>
                <TouchableOpacity onPress={() => {
                  setDate(tempDate);
                  setShowDatePickerModal(false);
                }}>
                  <Text style={styles.pickerConfirmText}>Confirmer</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.pickerWrapper}>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="inline"
                  onChange={(e, d) => d && setTempDate(d)}
                  minimumDate={new Date()}
                  locale="fr-FR"
                  themeVariant="light"
                />
              </View>
            </RNAnimated.View>
          </View>
        </Modal>
      )}

      {/* iOS TIME PICKER MODAL */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showTimePickerModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowTimePickerModal(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={() => setShowTimePickerModal(false)}
            />
            <RNAnimated.View
              style={[
                styles.bottomSheetPickerContainer,
                { transform: [{ translateY: timePickerSlideAnim }] }
              ]}
            >
              <View style={styles.pickerModalHeader}>
                <TouchableOpacity onPress={() => setShowTimePickerModal(false)}>
                  <Text style={styles.pickerCancelText}>Annuler</Text>
                </TouchableOpacity>
                <Text style={styles.pickerModalTitleText}>Choisir l'horaire</Text>
                <TouchableOpacity onPress={() => {
                  setStartTime(tempStartTime);
                  setEndTime(tempEndTime);
                  setShowTimePickerModal(false);
                }}>
                  <Text style={styles.pickerConfirmText}>Confirmer</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.timePickersLayout}>
                <View style={styles.timePickerCol}>
                  <Text style={styles.timeColHeader}>Début</Text>
                  <DateTimePicker
                    value={tempStartTime}
                    mode="time"
                    display="spinner"
                    onChange={(e, d) => d && setTempStartTime(d)}
                    locale="fr-FR"
                    themeVariant="light"
                    style={styles.timePickerSpinner}
                  />
                </View>

                <View style={styles.timePickerCol}>
                  <Text style={styles.timeColHeader}>Fin</Text>
                  <DateTimePicker
                    value={tempEndTime}
                    mode="time"
                    display="spinner"
                    onChange={(e, d) => d && setTempEndTime(d)}
                    locale="fr-FR"
                    themeVariant="light"
                    style={styles.timePickerSpinner}
                  />
                </View>
              </View>
            </RNAnimated.View>
          </View>
        </Modal>
      )}

      {/* ANDROID NATIVE DATE PICKER */}
      {Platform.OS === 'android' && showAndroidDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowAndroidDatePicker(false);
            if (selectedDate) {
              setDate(selectedDate);
            }
          }}
          themeVariant="light"
        />
      )}

      {/* ANDROID NATIVE TIME PICKERS */}
      {Platform.OS === 'android' && showAndroidStartTimePicker && (
        <DateTimePicker
          value={startTime}
          mode="time"
          display="default"
          onChange={(event, selectedTime) => {
            setShowAndroidStartTimePicker(false);
            if (selectedTime) {
              setStartTime(selectedTime);

              if (!isValidEndTime(selectedTime, endTime)) {
                setEndTime(getDefaultEndTime(selectedTime));
              }

              setTimeout(() => {
                setShowAndroidEndTimePicker(true);
              }, 300);
            }
          }}
          themeVariant="light"
        />
      )}

      {Platform.OS === 'android' && showAndroidEndTimePicker && (
        <DateTimePicker
          value={endTime}
          mode="time"
          display="default"
          onChange={(event, selectedTime) => {
            setShowAndroidEndTimePicker(false);
            if (selectedTime) {
              if (isValidEndTime(startTime, selectedTime)) {
                setEndTime(selectedTime);
              } else {
                Alert.alert('Erreur', "L'heure de fin doit être après l'heure de début");
              }
            }
          }}
          themeVariant="light"
        />
      )}

    </MainScreenLayout>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    flex: 1,
  },

  // Custom Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#FAFAFA',
    position: 'relative',
  },
  closeHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.5,
    zIndex: -1,
  },

  // Scroll Content flexGrow
  scrollContent: {
    flexGrow: 1,
  },
  formContentInner: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingBottom: Platform.OS === 'ios' ? 60 : 32,
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8E8E93',
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  // Sports row
  sportsHorizontalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  badgesScroll: {
    flex: 1,
  },
  badgesScrollContent: {
    alignItems: 'center',
    gap: 20,
    paddingRight: 12,
  },
  badgesEmptyHint: {
    color: '#8E8E93',
    fontSize: 14,
  },
  plusBadge: {
    marginLeft: 12,
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#EFEFEF',
  },
  sportBadgeItem: {
    alignItems: 'center',
  },
  sportIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sportIconCircleSelected: {
    borderColor: '#70A831',
  },
  sportIconCircleAdd: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  sportEmojiText: {
    fontSize: 20,
  },
  sportLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E8E93',
    marginTop: 6,
  },
  sportLabelTextSelected: {
    color: '#000',
  },

  // Forms Input Card Rows
  inputCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 48,
  },
  cardIcon: {
    marginRight: 12,
  },
  cardValueText: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },

  // Hours
  timeDisplayBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeValueText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },

  // Steppers
  stepperContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonDisabled: {
    opacity: 0.3,
  },
  stepperValueText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },
  stepperValueTextUncapped: {
    color: '#8E8E93',
    fontWeight: '600',
  },

  // Form Inputs text
  textInputRow: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
    padding: 0,
  },
  currencySuffixText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
    marginLeft: 6,
  },

  // Form Footer Action
  formFooterWrapper: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  primaryActionBtn: {
    width: '100%',
    height: 46,
    borderRadius: 12,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0.5,
  },
  btnDisabled: {
    opacity: 0.6,
  },

  // Sports Modal styles
  sportsModalContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  sportsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  closeModalButtonX: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportsModalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.5,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 12,
  },
  searchBarInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  sportsListContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sportListItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F7',
  },
  sportListLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sportListCircleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  sportListNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },

  // Custom transparent bottom sheet overlays
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomSheetPickerContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '60%',
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F7',
  },
  pickerCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  pickerModalTitleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000',
  },
  pickerConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#70A831',
  },
  pickerWrapper: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePickersLayout: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
  },
  timePickerCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePickerSpinner: {
    width: 155,
  },
  timeColHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8E8E93',
    marginBottom: 8,
  },
});
