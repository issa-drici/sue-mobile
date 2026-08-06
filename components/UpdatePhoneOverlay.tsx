import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useAuth } from '../app/context/auth';

const ACCENT_COLOR = '#D4FC79';

export function UpdatePhoneOverlay() {
    const { user, updateUserProfile } = useAuth();
    const [phone, setPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Check if user has a dummy phone number (starting with +3300)
    const hasDummyPhone = user?.phone?.startsWith('+3300');

    if (!user || !hasDummyPhone) {
        return null;
    }

    const handleUpdate = async () => {
        if (!phone || phone.length < 10) {
            Alert.alert('Erreur', 'Veuillez entrer un numéro valide');
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            setIsLoading(true);

            // Format number to +33 format if needed
            const formattedPhone = phone.startsWith('0')
                ? '+33' + phone.substring(1)
                : phone;

            await updateUserProfile({ phone: formattedPhone });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Succès', 'Votre numéro de téléphone a été mis à jour');
        } catch (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Erreur', 'Impossible de mettre à jour le numéro');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Animated.View entering={FadeIn} style={styles.overlay}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="call" size={48} color="#000" />
                    </View>

                    <Text style={styles.title}>Numéro de téléphone requis</Text>
                    <Text style={styles.description}>
                        Pour continuer à utiliser l'application et permettre à vos amis de vous retrouver, merci d'ajouter votre numéro de téléphone.
                    </Text>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="06 12 34 56 78"
                            placeholderTextColor="#999"
                            value={phone}
                            onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ''))}
                            keyboardType="phone-pad"
                            maxLength={10}
                            editable={!isLoading}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, (!phone || isLoading) && styles.buttonDisabled]}
                        onPress={handleUpdate}
                        disabled={!phone || isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <Text style={styles.buttonText}>METTRE À JOUR</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.95)',
        zIndex: 9999,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    container: {
        width: '100%',
        maxWidth: 400,
    },
    content: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: ACCENT_COLOR,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        fontStyle: 'italic',
        color: '#000',
        marginBottom: 16,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    inputContainer: {
        width: '100%',
        marginBottom: 24,
    },
    input: {
        width: '100%',
        fontSize: 24,
        fontWeight: '700',
        color: '#000',
        borderBottomWidth: 2,
        borderBottomColor: '#000',
        paddingVertical: 12,
        textAlign: 'center',
    },
    button: {
        width: '100%',
        backgroundColor: ACCENT_COLOR,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: ACCENT_COLOR,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonDisabled: {
        backgroundColor: '#F5F5F5',
        shadowOpacity: 0,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '900',
        fontStyle: 'italic',
        color: '#000',
    },
});
