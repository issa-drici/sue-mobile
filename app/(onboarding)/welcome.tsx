import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Dimensions,
    FlatList,
    ImageBackground,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { pushNotificationService } from '../../services/notifications/pushNotifications';
import { useAuth } from '../context/auth';

const ACCENT_COLOR = '#D4FC79'; // Electric Volt

const ONBOARDING_STEPS = [
    {
        id: '1',
        title: 'SUE',
        subtitle: 'DEVENEZ UNE LÉGENDE.',
        description: 'Rejoignez la communauté des athlètes qui repoussent leurs limites.',
        image: require('../../assets/images/onboarding-1.jpg'),
    },
    {
        id: '2',
        title: 'SESSIONS',
        subtitle: 'CRÉEZ VOS MATCHS.',
        description: 'Organisez vos propres sessions sportives et définissez le lieu, la date et l\'heure.',
        image: require('../../assets/images/onboarding-2.jpg'),
    },
    {
        id: '3',
        title: 'SQUAD',
        subtitle: 'INVITEZ VOS AMIS.',
        description: 'Ajoutez vos amis et invitez-les à rejoindre vos sessions sportives.',
        image: require('../../assets/images/onboarding-3.jpg'),
    },
    {
        id: '4',
        title: 'ALERTS',
        subtitle: 'NE MANQUEZ RIEN.',
        description: 'Soyez notifié dès qu\'un ami vous invite à une session ou qu\'une invitation est acceptée.',
        image: require('../../assets/images/onboarding-1.jpg'), // Reusing image for now
        action: 'request_notifications'
    },
    {
        id: '5',
        title: 'GO',
        subtitle: 'C\'EST PARTI.',
        description: 'Votre légende commence maintenant.',
        image: require('../../assets/images/onboarding-3.jpg'), // Reusing image
    },
];

export default function WelcomeScreen() {
    const router = useRouter();
    const flatListRef = useRef<FlatList>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const { completeOnboarding } = useAuth();
    const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);
    const insets = useSafeAreaInsets();
    const { width, height } = Dimensions.get('window');

    const handleNext = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const currentStep = ONBOARDING_STEPS[currentIndex];

        // Handle Notification Permission on specific step
        if (currentStep.action === 'request_notifications') {
            await requestNotifications();
        }

        if (currentIndex < ONBOARDING_STEPS.length - 1) {
            flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true,
            });
        } else {
            finishOnboarding();
        }
    };

    const requestNotifications = async () => {
        if (isRequestingPermissions) return;
        setIsRequestingPermissions(true);
        try {
            const hasPermission = await pushNotificationService.requestPermissions();
            if (hasPermission) {
                await pushNotificationService.initialize();
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
        } catch (error) {
            console.error('Error requesting notifications:', error);
        } finally {
            setIsRequestingPermissions(false);
        }
    };

    const finishOnboarding = async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await completeOnboarding();
        router.replace('/(auth)/login');
    };

    const renderItem = ({ item, index }: { item: typeof ONBOARDING_STEPS[0]; index: number }) => {
        return (
            <View style={[styles.slide, { width, height }]}>
                <ImageBackground
                    source={item.image}
                    style={[styles.imageBackground, { width, height }]}
                    imageStyle={{ opacity: 0.6 }}
                >
                    {/* Overlay sombre */}
                    <View style={[styles.overlay, { width, height }]} />

                    <View style={styles.contentContainer}>
                        <Animated.View entering={FadeInDown.delay(200).springify()}>
                            <Text style={styles.title}>{item.title}</Text>
                            <Text style={styles.subtitle}>{item.subtitle}</Text>
                        </Animated.View>

                        <Animated.View entering={FadeInUp.delay(400).springify()}>
                            <Text style={styles.description}>{item.description}</Text>
                        </Animated.View>
                    </View>
                </ImageBackground>
            </View>
        );
    };

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={ONBOARDING_STEPS}
                renderItem={renderItem}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                getItemLayout={(_, index) => ({
                    length: width,
                    offset: width * index,
                    index,
                })}
            />

            {/* Pagination Dots */}
            <View style={[styles.pagination, { bottom: 100 + insets.bottom }]}>
                {ONBOARDING_STEPS.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            index === currentIndex && styles.activeDot,
                        ]}
                    />
                ))}
            </View>

            {/* Action Button */}
            <View style={[styles.footer, { bottom: 20 + insets.bottom }]}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={handleNext}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>
                        {currentIndex === ONBOARDING_STEPS.length - 1 ? 'COMMENCER' : (ONBOARDING_STEPS[currentIndex].action === 'request_notifications' ? 'ACTIVER & CONTINUER' : 'SUIVANT')}
                    </Text>
                    <Ionicons
                        name={currentIndex === ONBOARDING_STEPS.length - 1 ? "checkmark" : "arrow-forward"}
                        size={24}
                        color="#000"
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    slide: {
        // width et height seront définis dynamiquement
    },
    imageBackground: {
        justifyContent: 'flex-end',
        padding: 24,
        paddingBottom: 160, // Increased to clear footer
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: '#000',
        opacity: 0.5,
    },
    contentContainer: {
        marginBottom: 20,
    },
    title: {
        fontSize: 56, // Slightly reduced to prevent overflow
        fontWeight: '900',
        fontStyle: 'italic',
        color: '#FFF',
        letterSpacing: -2,
        lineHeight: 56,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 20,
        fontWeight: '900',
        fontStyle: 'italic',
        color: ACCENT_COLOR,
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        color: '#FFF',
        lineHeight: 24,
        opacity: 0.9,
        maxWidth: '90%',
    },

    pagination: {
        position: 'absolute',
        left: 24,
        flexDirection: 'row',
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FFF',
        opacity: 0.3,
    },
    activeDot: {
        width: 24,
        backgroundColor: ACCENT_COLOR,
        opacity: 1,
    },

    footer: {
        position: 'absolute',
        left: 24,
        right: 24,
    },
    button: {
        backgroundColor: '#FFF',
        height: 64,
        borderRadius: 32,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '900',
        fontStyle: 'italic',
        color: '#000',
    },
});
