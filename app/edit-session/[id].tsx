import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    Platform,
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
import { useSportsPreferences } from '../../hooks/useSportsPreferences';
import { useGetSessionById, useUpdateSession } from '../../services';
import { Sport } from '../../types/sport';
import { getDefaultEndTime, getSportEmoji, isValidEndTime, SPORTS_LIST } from '../../utils';
import { useAuth } from '../context/auth';

const ACCENT_COLOR = '#D4FC79'; // Electric Volt

export default function EditSessionScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    const sessionId = typeof id === 'string' ? id : '';

    const { data: session, getSessionById, isLoading: isLoadingSession } = useGetSessionById();
    const { updateSession, isLoading: isUpdating } = useUpdateSession();
    const { sportsPreferences } = useSportsPreferences();

    // State
    const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
    const [showSportsModal, setShowSportsModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [date, setDate] = useState(new Date());

    const [startTime, setStartTime] = useState(new Date());
    const [endTime, setEndTime] = useState(new Date());
    const [location, setLocation] = useState('');
    const [maxParticipants, setMaxParticipants] = useState('');
    const [pricePerPerson, setPricePerPerson] = useState('');

    // États pour contrôler la visibilité des pickers sur Android
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);

    // Load session data
    useEffect(() => {
        if (sessionId) {
            getSessionById(sessionId);
        }
    }, [sessionId, getSessionById]);

    // Helper function to parse time string to Date
    const parseTimeString = (timeString: string): Date => {
        // Supprimer les secondes si présentes (format HH:MM:SS -> HH:MM)
        const timeOnly = timeString.split(':').slice(0, 2).join(':');
        const [hours, minutes] = timeOnly.split(':').map(Number);
        
        // Créer une date avec l'heure locale
        const date = new Date(2000, 0, 1, hours, minutes, 0, 0);
        return date;
    };

    // Initialize form with session data (une seule fois par session : un refetch
    // en arrière-plan pendant l'édition ne doit pas écraser ce que l'utilisateur a choisi)
    const initializedSessionId = useRef<string | null>(null);
    useEffect(() => {
        if (session && initializedSessionId.current !== session.id) {
            initializedSessionId.current = session.id;
            setSelectedSport(session.sport as Sport);
            setDate(new Date(session.date));

            // Parser les heures correctement depuis le format HH:MM ou HH:MM:SS
            const sessionStartTime = parseTimeString(session.startTime || '18:00');
            const sessionEndTime = parseTimeString(session.endTime || '20:00');

            setStartTime(sessionStartTime);

            if (isValidEndTime(sessionStartTime, sessionEndTime)) {
                setEndTime(sessionEndTime);
            } else {
                console.warn('⚠️ [EDIT-SESSION] Heure de fin invalide, utilisation de la valeur par défaut');
                setEndTime(getDefaultEndTime(sessionStartTime));
            }

            setLocation(session.location);
            setMaxParticipants(session.maxParticipants?.toString() || '');
            setPricePerPerson(session.pricePerPerson?.toString() || '');
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
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (selectedDate) setDate(selectedDate);
    };

    const onChangeStartTimePicker = (event: any, selectedTime?: Date) => {
        if (Platform.OS === 'android') {
            setShowStartTimePicker(false);
        }
        if (selectedTime) {
            // Ne pas arrondir : garder exactement ce que l'utilisateur a choisi
            setStartTime(selectedTime);
            if (!isValidEndTime(selectedTime, endTime)) {
                setEndTime(getDefaultEndTime(selectedTime));
            }
        }
    };

    const onChangeEndTimePicker = (event: any, selectedTime?: Date) => {
        if (Platform.OS === 'android') {
            setShowEndTimePicker(false);
        }
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

    const handleUpdateSession = async () => {
        if (!selectedSport || !date || !startTime || !endTime || !location) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
            return;
        }

        // Extraire directement les heures locales comme dans create-session
        const localStartHours = String(startTime.getHours()).padStart(2, '0');
        const localStartMinutes = String(startTime.getMinutes()).padStart(2, '0');
        const finalStartTime = `${localStartHours}:${localStartMinutes}`;
        
        const localEndHours = String(endTime.getHours()).padStart(2, '0');
        const localEndMinutes = String(endTime.getMinutes()).padStart(2, '0');
        const finalEndTime = `${localEndHours}:${localEndMinutes}`;

        // Validation stricte : l'heure de fin doit être strictement supérieure à l'heure de début
        // Comparer les heures formatées (HH:MM) pour éviter les problèmes de timezone
        const startTimeMinutes = startTime.getHours() * 60 + startTime.getMinutes();
        const endTimeMinutes = endTime.getHours() * 60 + endTime.getMinutes();
        
        if (endTimeMinutes <= startTimeMinutes) {
            Alert.alert('Erreur', "L'heure de fin doit être strictement après l'heure de début");
            return;
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        try {
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
                maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
                pricePerPerson: pricePerPerson ? parseFloat(pricePerPerson) : null,
            };

            await updateSession(sessionId, sessionData);

            router.replace(`/session/${sessionId}`);
        } catch (error) {
            console.error('❌ [EDIT-SESSION] Erreur lors de la mise à jour:', error);
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
        <MainScreenLayout title="MODIFIER" showHeader={false} containerStyle={{ backgroundColor: '#FFF' }}>

            {/* Header */}
            <View style={[styles.header, Platform.OS === 'android' && { paddingTop: Math.max(insets.top, 16) }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="close" size={28} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>MODIFIER SESSION</Text>
                <View style={{ width: 32 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Sport Selection */}
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.section}>
                    <Text style={styles.sectionLabel}>SPORT</Text>
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
                    <Text style={styles.sectionLabel}>QUAND ?</Text>

                    <View style={styles.dateTimeRow}>
                        {Platform.OS === 'android' ? (
                            <TouchableOpacity
                                style={styles.dateButton}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Text style={styles.dateButtonText}>{formatDate(date)}</Text>
                                <Ionicons name="calendar-outline" size={20} color="#000" />
                            </TouchableOpacity>
                        ) : (
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
                        )}
                    </View>

                    {Platform.OS === 'android' && showDatePicker && (
                        <DateTimePicker
                            value={date}
                            mode="date"
                            onChange={onChangeDatePicker}
                            minimumDate={new Date()}
                            themeVariant='light'
                            locale="fr-FR"
                        />
                    )}

                    <View style={styles.timeRow}>
                        {Platform.OS === 'android' ? (
                            <>
                                <TouchableOpacity
                                    style={styles.timeButton}
                                    onPress={() => setShowStartTimePicker(true)}
                                >
                                    <Text style={styles.timeLabel}>DÉBUT</Text>
                                    <Text style={styles.timeButtonText}>{formatTime(startTime)}</Text>
                                </TouchableOpacity>
                                <View style={styles.timeDivider} />
                                <TouchableOpacity
                                    style={styles.timeButton}
                                    onPress={() => setShowEndTimePicker(true)}
                                >
                                    <Text style={styles.timeLabel}>FIN</Text>
                                    <Text style={styles.timeButtonText}>{formatTime(endTime)}</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
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
                            </>
                        )}
                    </View>

                    {Platform.OS === 'android' && showStartTimePicker && (
                        <DateTimePicker
                            value={startTime}
                            mode="time"
                            onChange={onChangeStartTimePicker}
                            themeVariant='light'
                            locale="fr-FR"
                        />
                    )}

                    {Platform.OS === 'android' && showEndTimePicker && (
                        <DateTimePicker
                            value={endTime}
                            mode="time"
                            onChange={onChangeEndTimePicker}
                            themeVariant='light'
                            locale="fr-FR"
                        />
                    )}
                </Animated.View>

                {/* Location */}
                <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.section}>
                    <Text style={styles.sectionLabel}>OÙ ?</Text>
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
                                maxLength={3}
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

                <View style={styles.footerSpacer} />
            </ScrollView>

            {/* Submit Button */}
            <Animated.View
                // entering={FadeInUp.delay(600).springify()} 
                style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}
            >
                <TouchableOpacity
                    style={[styles.submitButton, isUpdating && styles.submitButtonDisabled]}
                    onPress={handleUpdateSession}
                    disabled={isUpdating}
                >
                    <Text style={styles.submitButtonText}>
                        {isUpdating ? 'MISE À JOUR...' : 'VALIDER LES CHANGEMENTS'}
                    </Text>
                    {!isUpdating && <Ionicons name="checkmark-circle" size={20} color="#000" />}
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
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F9F9F9',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 4,
        paddingHorizontal: 16,
        paddingVertical: 12,
        minHeight: 48,
    },
    dateButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 24,
    },
    timeContainer: {
        alignItems: 'flex-start',
    },
    timeButton: {
        alignItems: 'flex-start',
        backgroundColor: '#F9F9F9',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 4,
        paddingHorizontal: 16,
        paddingVertical: 12,
        minHeight: 56,
        flex: 1,
    },
    timeLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#666',
        marginBottom: 4,
    },
    timeButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
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
        height: '100%',
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    detailsRow: {
        flexDirection: 'row',
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
    searchInput: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        fontWeight: '600',
    },
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
