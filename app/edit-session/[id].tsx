import { BrandColors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useGetSessionById, useUpdateSession } from '../../services';
import { Sport, SportSession } from '../../types/sport';
import { useAuth } from '../context/auth';

const SPORTS: Sport[] = ['tennis', 'golf', 'musculation', 'football', 'basketball'];

export default function EditSessionScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();

    const sessionId = typeof id === 'string' ? id : '';

    const { data: session, isLoading, getSessionById } = useGetSessionById();
    const { updateSession, isLoading: isUpdating } = useUpdateSession();

    // États pour les champs de formulaire
    const [date, setDate] = useState(new Date());
    const [time, setTime] = useState(new Date());
    const [location, setLocation] = useState('');

    // Charger les données de la session
    useEffect(() => {
        if (sessionId) {
            getSessionById(sessionId);
        }
    }, [sessionId, getSessionById]);

    // Initialiser les champs avec les données de la session
    useEffect(() => {
        if (session) {
            setDate(new Date(session.date));
            setTime(new Date(`2000-01-01T${session.time}`));
            setLocation(session.location);
        }
    }, [session]);

    // Vérifier que l'utilisateur est l'organisateur
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

    const onChangeDatePicker = (event: any, selectedDate?: Date) => {
        if (selectedDate) {
            setDate(selectedDate);
        }
    };

    const onChangeTimePicker = (event: any, selectedTime?: Date) => {
        if (selectedTime) {
            setTime(selectedTime);
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

    const handleUpdateSession = async () => {
        if (!location.trim()) {
            Alert.alert('Erreur', 'Veuillez remplir le lieu de la session');
            return;
        }

        try {
            const sessionData: Partial<SportSession> = {
                date: date.toISOString().split('T')[0],
                time: time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                location: location.trim(),
            };

            await updateSession(sessionId, sessionData);

            // Rediriger directement sans alerte de succès
            router.back();
        } catch (error: any) {
            Alert.alert(
                'Erreur',
                error.message || 'Une erreur est survenue lors de la mise à jour de la session'
            );
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <Text>Chargement de la session...</Text>
            </SafeAreaView>
        );
    }

    if (!session) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={{ color: 'red' }}>Session non trouvée</Text>
            </SafeAreaView>
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
                <Text style={styles.headerTitle}>Modifier la Session</Text>
                <View style={styles.headerRight} />
            </View>

            <ScrollView style={styles.content}>
                {/* Titre */}
                <View style={styles.titleContainer}>
                    <Text style={styles.mainTitle}>Modifier la session</Text>
                    <Text style={styles.subtitle}>Modifiez les informations ci-dessous</Text>
                </View>

                {/* Sélection de la date */}
                <View style={{ flexDirection: 'row' }}>
                    <View style={[styles.section, { flex: 1 }]}>
                        <Text style={styles.sectionTitle}>Date*</Text>
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
                    </View>

                    {/* Sélection de l'heure */}
                    <View style={[styles.section, { flex: 1 }]}>
                        <Text style={styles.sectionTitle}>Heure*</Text>
                        <View style={{ marginLeft: -10 }}>
                            <DateTimePicker
                                value={time}
                                mode="time"
                                onChange={onChangeTimePicker}
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

                {/* Bouton de mise à jour */}
                <TouchableOpacity
                    style={[styles.createButton, isUpdating && styles.createButtonDisabled]}
                    onPress={handleUpdateSession}
                    disabled={isUpdating}
                >
                    <Text style={styles.createButtonText}>
                        {isUpdating ? 'Mise à jour en cours...' : 'Mettre à jour la session'}
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
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    headerRight: {
        width: 40,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    titleContainer: {
        marginBottom: 32,
    },
    mainTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        backgroundColor: '#fff',
        gap: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    createButton: {
        backgroundColor: BrandColors.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 32,
        marginBottom: 32,
    },
    createButtonDisabled: {
        backgroundColor: '#ccc',
    },
    createButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
});
