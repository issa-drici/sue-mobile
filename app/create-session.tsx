import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MainScreenLayout } from '../components/ui/ScreenLayout';
import { BrandColors } from '../constants/Colors';
import { useCreateSession } from '../services';
import { SportsApi } from '../services/api/sportsApi';
import { getDefaultEndTime, getSportEmoji, isValidEndTime, roundToNextHalfHour, SPORTS_LIST } from '../utils';
import { matchesSearch } from '../utils/search';

// Configuration fixe des sports principaux par défaut (pour correspondre à la maquette)
const SPORT_PRESETS: Record<string, { label: string; emoji: string; color: string }> = {
  football: { label: 'Football', emoji: '⚽', color: '#EAF6DD' },
  tennis: { label: 'Tennis', emoji: '🎾', color: '#FFF3E0' },
  golf: { label: 'Golf', emoji: '⛳', color: '#EDE7F6' },
  padel: { label: 'Padel', emoji: '🎾', color: '#FFF3E0' },
};

export default function CreateSessionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { createSession, isLoading: isCreating } = useCreateSession();
  const formScrollViewRef = React.useRef<ScrollView>(null);

  // State Formulaire
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [date, setDate] = useState(new Date());

  // Sports servis par le backend (plus de liste codée en dur)
  // - allSports : liste complète (modal "+"), avec repli local si l'API échoue
  // - playedSports : sports pratiqués par l'utilisateur, triés du + au - joué (accès rapides)
  const [allSports, setAllSports] = useState<string[]>(SPORTS_LIST as string[]);
  const [playedSports, setPlayedSports] = useState<string[]>([]);

  // Charger les sports depuis le backend au montage (source de vérité serveur)
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
        const playedKeys = played.map((p) => p.sport as string);
        setPlayedSports(playedKeys);
        // Pré-sélectionner le sport le plus pratiqué si aucune sélection encore
        setSelectedSport((prev) => prev || playedKeys[0] || '');
      } catch {
        // Repli silencieux : allSports garde la liste locale, pas d'accès rapide
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Accès rapides = sports pratiqués ; on ajoute le sport sélectionné s'il n'y figure pas
  // (ex. choisi via la liste "+") pour qu'il reste visible/surligné.
  const quickSports = React.useMemo(() => {
    if (selectedSport && !playedSports.includes(selectedSport)) {
      return [selectedSport, ...playedSports];
    }
    return playedSports;
  }, [playedSports, selectedSport]);
  
  const [startTime, setStartTime] = useState(() => roundToNextHalfHour(new Date()));
  const [endTime, setEndTime] = useState(() => getDefaultEndTime(roundToNextHalfHour(new Date())));

  // Par défaut : null = Session ouverte / illimité
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

  // State Succès
  const [createdSession, setCreatedSession] = useState<any>(null);

  // Temporaire pour les pickers dans les modals (iOS)
  const [tempDate, setTempDate] = useState(new Date());
  const [tempStartTime, setTempStartTime] = useState(new Date());
  const [tempEndTime, setTempEndTime] = useState(() => {
    const end = new Date();
    end.setHours(end.getHours() + 1);
    return end;
  });

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

  const getSportDetails = (sportKey: string) => {
    const key = sportKey.toLowerCase().trim();
    if (SPORT_PRESETS[key]) {
      return SPORT_PRESETS[key];
    }
    
    const label = sportKey.charAt(0).toUpperCase() + sportKey.slice(1);
    const emoji = getSportEmoji(sportKey);
    
    // Palette pastel déterministe
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

  // Logique du Stepper Joueurs Max (par défaut null / illimité)
  const incrementMax = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (maxParticipants === null) {
      setMaxParticipants(1); // Démarre à 1 joueur si c'était illimité
    } else {
      setMaxParticipants((prev) => (prev ?? 1) + 1);
    }
  };

  const decrementMax = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (maxParticipants === null) return;
    if (maxParticipants <= 1) {
      setMaxParticipants(null); // Redescend en "Session ouverte (illimité)" si <= 1
    } else {
      setMaxParticipants((prev) => (prev ?? 1) - 1);
    }
  };

  // Trigger Date Picker
  const handleDatePickerPress = () => {
    Haptics.selectionAsync();
    if (Platform.OS === 'ios') {
      setTempDate(date);
      setShowDatePickerModal(true);
    } else {
      setShowAndroidDatePicker(true);
    }
  };

  // Trigger Time Picker
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

  // Validation et envoi
  const handleCreateSession = async () => {
    if (!selectedSport || !location.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires (sport, lieu)');
      return;
    }

    if (!isValidEndTime(startTime, endTime)) {
      Alert.alert('Erreur', "L'heure de fin doit être après l'heure de début");
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

      // Date en composants LOCAUX (cohérent avec les heures ci-dessus, qui sont locales).
      // Ne PAS utiliser toISOString() qui convertit en UTC → décalage d'un jour près de minuit.
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
        maxParticipants: maxParticipants, // Transmet null si illimité
        pricePerPerson: pricePerPerson ? parseFloat(pricePerPerson.replace(',', '.')) : null,
        participants: [],
      };

      const newSession = await createSession(sessionData);
      
      if (newSession && newSession.id) {
        setCreatedSession(newSession);
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

  // Render du formulaire de création
  const renderForm = () => {
    return (
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
          <Text style={styles.headerTitle}>NOUVELLE SESSION</Text>
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
                  {/* Accès rapides : défilent horizontalement si nombreux */}
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

                  {/* Bouton "Plus" fixe à droite (ne défile pas) */}
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

              {/* Section Joueurs Max (Illimité par défaut) */}
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

            {/* Bouton CONTINUER intégré */}
            <View style={styles.formFooterWrapper}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.primaryActionBtn, isCreating && styles.btnDisabled]}
                onPress={handleCreateSession}
                disabled={isCreating}
              >
                <Text style={styles.primaryActionBtnText}>
                  {isCreating ? 'CREATION...' : 'CONTINUER →'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
    );
  };

  // Render du succès de création
  const renderSuccess = () => {
    if (!createdSession) return null;
    const sportDetails = getSportDetails(createdSession.sport);

    return (
      <View style={styles.successContainer}>
        {/* Header */}
        <View style={[styles.header, Platform.OS === 'android' && { paddingTop: Math.max(insets.top, 16) }]}>
          <TouchableOpacity onPress={() => router.replace(`/session/${createdSession.id}`)} style={styles.closeHeaderBtn}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>SESSION CRÉÉE</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.successScrollContent} 
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.successContentInner}>
            <View style={{ alignItems: 'center', width: '100%' }}>
              <Animated.View entering={FadeInUp.delay(50).springify()} style={styles.successIconOuterCircle}>
                <View style={styles.successIconInnerCircle}>
                  <Ionicons name="checkmark" size={36} color="#70A831" />
                </View>
              </Animated.View>

              <Animated.Text entering={FadeInUp.delay(100).springify()} style={styles.successTitleText}>
                Ta session est créée !
              </Animated.Text>
              <Animated.Text entering={FadeInUp.delay(150).springify()} style={styles.successSubtitleText}>
                Il ne te reste plus qu'à inviter des joueurs.
              </Animated.Text>

              {/* Carte Résumé */}
              <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.sessionSummaryCard}>
                <View style={styles.summaryCardHeaderRow}>
                  <View style={[styles.summarySportCircle, { backgroundColor: sportDetails.color }]}>
                    <Text style={{ fontSize: 20 }}>{sportDetails.emoji}</Text>
                  </View>
                  <Text style={styles.summarySportName}>{sportDetails.label}</Text>
                </View>

                <View style={styles.summaryDetailsList}>
                  <View style={styles.summaryDetailRow}>
                    <Ionicons name="calendar-outline" size={14} color="#8E8E93" style={{ marginRight: 8 }} />
                    <Text style={styles.summaryDetailText}>{formatDateLabel(date)}</Text>
                  </View>
                  <View style={styles.summaryDetailRow}>
                    <Ionicons name="time-outline" size={14} color="#8E8E93" style={{ marginRight: 8 }} />
                    <Text style={styles.summaryDetailText}>
                      {formatTimeLabel(startTime)} - {formatTimeLabel(endTime)}
                    </Text>
                  </View>
                  <View style={styles.summaryDetailRow}>
                    <Ionicons name="location-outline" size={14} color="#8E8E93" style={{ marginRight: 8 }} />
                    <Text style={styles.summaryDetailText} numberOfLines={1}>{location}</Text>
                  </View>
                  <View style={styles.summaryDetailRow}>
                    <Ionicons name="people-outline" size={14} color="#8E8E93" style={{ marginRight: 8 }} />
                    <Text style={styles.summaryDetailText}>
                      {maxParticipants === null ? 'Session ouverte (illimité)' : `${maxParticipants} joueur${maxParticipants > 1 ? 's' : ''} max`}
                    </Text>
                  </View>
                  <View style={styles.summaryDetailRow}>
                    <Ionicons name="pricetag-outline" size={14} color="#8E8E93" style={{ marginRight: 8 }} />
                    <Text style={styles.summaryDetailText}>
                      {pricePerPerson ? `${pricePerPerson} €` : 'Gratuit'}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            </View>

            {/* Footer Actions */}
            <View style={styles.successFooterWrapper}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.successPrimaryBtn}
                onPress={() => {
                  router.replace({ pathname: `/session/${createdSession.id}`, params: { openInvite: 'true' } });
                }}
              >
                <Text style={styles.successPrimaryBtnText}>INVITER DES JOUEURS →</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.successSecondaryBtn}
                onPress={() => {
                  router.replace(`/session/${createdSession.id}`);
                }}
              >
                <Text style={styles.successSecondaryBtnText}>PLUS TARD</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <MainScreenLayout title="Créer" showHeader={false} containerStyle={{ backgroundColor: '#FAFAFA', flex: 1 }}>
      
      {createdSession ? renderSuccess() : renderForm()}

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
              
              // Ajuste automatiquement l'heure de fin à +1 heure
              const end = new Date(selectedTime);
              end.setHours(end.getHours() + 1);
              setEndTime(end);

              // Propose directement d'ouvrir l'heure de fin après selection de début
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
              if (selectedTime.getTime() > startTime.getTime()) {
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' },
  errorText: { color: 'red', fontWeight: 'bold' },

  formContainer: {
    flex: 1,
  },
  successContainer: {
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

  // Success view layouts
  successScrollContent: {
    flexGrow: 1,
  },
  successContentInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  successIconOuterCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F2F9EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successIconInnerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E4F5D4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitleText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitleText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },

  // Success Summary Card
  sessionSummaryCard: {
    width: '100%',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 20,
    padding: 16,
  },
  summaryCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F7',
    paddingBottom: 12,
    marginBottom: 12,
  },
  summarySportCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  summarySportName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  summaryDetailsList: {
    gap: 8,
  },
  summaryDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryDetailText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },

  // Success screen footer wrapper
  successFooterWrapper: {
    width: '100%',
    marginTop: 32,
    gap: 12,
  },
  successPrimaryBtn: {
    width: '100%',
    height: 46,
    borderRadius: 12,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successPrimaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  successSecondaryBtn: {
    width: '100%',
    height: 46,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successSecondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
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
  iosPageSheetContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 20,
    paddingTop: 30,
  },
});