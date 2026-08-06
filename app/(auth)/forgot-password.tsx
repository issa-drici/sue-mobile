import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../context/auth';

const ACCENT_COLOR = '#D4FC79'; // Electric Volt

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const { forgotPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleReset = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (!email) {
            Alert.alert('Erreur', 'Veuillez saisir votre email');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Erreur', 'Veuillez saisir un email valide');
            return;
        }

        try {
            setIsLoading(true);
            await forgotPassword(email);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setIsSuccess(true);
        } catch (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Erreur', error instanceof Error ? error.message : 'Une erreur est survenue');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.successContent}>
                    <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.successIconContainer}>
                        <Ionicons name="mail-open-outline" size={80} color="#000" />
                    </Animated.View>

                    <Animated.View entering={FadeInUp.delay(400).springify()}>
                        <Text style={styles.successTitle}>EMAIL ENVOYÉ</Text>
                        <Text style={styles.successMessage}>
                            Si cet email existe, un lien de réinitialisation vous a été envoyé. Vérifiez votre boîte email (et vos spams).
                        </Text>

                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.back()}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.backButtonText}>RETOUR À LA CONNEXION</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.headerBar}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.header}>
                        <Text style={styles.title}>MOT DE PASSE OUBLIÉ ?</Text>
                        <Text style={styles.subtitle}>
                            Entrez votre email pour recevoir un lien de réinitialisation.
                        </Text>
                    </Animated.View>

                    <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>EMAIL</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="VOTRE EMAIL"
                                placeholderTextColor="#999"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoComplete="email"
                                editable={!isLoading}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.resetButton, isLoading && styles.resetButtonDisabled]}
                            onPress={handleReset}
                            disabled={isLoading}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.resetButtonText}>
                                {isLoading ? 'ENVOI...' : 'ENVOYER LE LIEN'}
                            </Text>
                            {!isLoading && <Ionicons name="arrow-forward" size={24} color="#000" />}
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    safeArea: {
        flex: 1,
    },
    headerBar: {
        paddingHorizontal: 24,
        paddingTop: 12,
    },
    backIcon: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        marginBottom: 40,
    },
    title: {
        fontSize: 40,
        fontWeight: '900',
        fontStyle: 'italic',
        color: '#000',
        letterSpacing: -1,
        lineHeight: 40,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#666',
        lineHeight: 24,
    },
    form: {
        marginBottom: 40,
    },
    inputGroup: {
        marginBottom: 32,
    },
    label: {
        fontSize: 12,
        fontWeight: '900',
        color: '#000',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    input: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
        borderBottomWidth: 2,
        borderBottomColor: '#000',
        paddingVertical: 12,
        flex: 1,
    },
    resetButton: {
        backgroundColor: ACCENT_COLOR,
        height: 64,
        borderRadius: 32,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        shadowColor: "#D4FC79",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    resetButtonDisabled: {
        backgroundColor: '#F5F5F5',
        shadowOpacity: 0,
    },
    resetButtonText: {
        color: '#000',
        fontSize: 18,
        fontWeight: '900',
        fontStyle: 'italic',
    },
    successContent: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
        alignItems: 'center',
    },
    successIconContainer: {
        marginBottom: 32,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: ACCENT_COLOR,
        justifyContent: 'center',
        alignItems: 'center',
    },
    successTitle: {
        fontSize: 32,
        fontWeight: '900',
        fontStyle: 'italic',
        color: '#000',
        textAlign: 'center',
        marginBottom: 16,
    },
    successMessage: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
    },
    backButton: {
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 32,
        borderWidth: 2,
        borderColor: '#000',
        alignSelf: 'center',
    },
    backButtonText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#000',
    }
});
