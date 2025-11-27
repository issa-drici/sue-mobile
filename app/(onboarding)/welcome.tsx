import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import OnboardingProgress from '../../components/OnboardingProgress';
import { ScreenLayout } from '../../components/ui/ScreenLayout';
import { DesignTokens } from '../../constants/DesignSystem';

export default function WelcomeScreen() {
    const router = useRouter();

    const handleContinue = () => {
        router.push('/(onboarding)/organize');
    };


    return (
        <ScreenLayout showHeader={false}>
            <View style={styles.content}>
                <OnboardingProgress currentStep={1} totalSteps={3} />

                <View style={styles.textContainer}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>
                            Fini les dizaines de groupes
                        </Text>
                        <View style={styles.wordWithIcon}>
                            <Text style={styles.title}>Snap</Text>
                            <Image
                                source={require('../../assets/images/snapchat-icon.png')}
                                style={styles.icon}
                            />
                        </View>
                        <Text style={styles.title}>
                            ,
                        </Text>
                        <View style={styles.wordWithIcon}>
                            <Text style={styles.title}>WhatsApp</Text>
                            <Image
                                source={require('../../assets/images/whatsapp-icon.png')}
                                style={styles.icon}
                            />
                        </View>
                        <Text style={styles.title}>
                            ou messages
                        </Text>
                        <View style={styles.wordWithIcon}>
                            <Text style={styles.title}>privés</Text>
                            <Text style={styles.emoji}>💬</Text>
                        </View>
                        <Text style={styles.title}>
                            pour organiser un match.
                        </Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.button} onPress={handleContinue}>
                    <Text style={styles.buttonText}>Continuer</Text>
                </TouchableOpacity>
            </View>
        </ScreenLayout>
    );
}

const styles = StyleSheet.create({
      container: {
    flex: 1,
    backgroundColor: '#fff',
  },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 40,
        alignItems: 'flex-start',
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingLeft: 0,
    },
    title: {
        fontSize: 46,
        fontWeight: '900',
        color: '#000000',
        lineHeight: 54,
        textAlign: 'left',
    },
    titleContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        maxWidth: '100%',
        justifyContent: 'flex-start',
    },
    wordWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        width: 36,
        height: 36,
        marginHorizontal: 6,
    },
    emoji: {
        fontSize: 36,
        marginHorizontal: 6,
    },
      button: {
    backgroundColor: DesignTokens.colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
});
