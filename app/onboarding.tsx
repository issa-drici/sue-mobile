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
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const ACCENT_COLOR = '#D4FC79'; // Electric Volt

const ONBOARDING_STEPS = [
    {
        id: '1',
        title: 'SUE',
        subtitle: 'DEVENEZ UNE LÉGENDE.',
        description: 'Rejoignez la communauté des athlètes qui repoussent leurs limites.',
        image: require('../assets/images/onboarding-1.jpg'),
    },
    {
        id: '2',
        title: 'SESSIONS',
        subtitle: 'TROUVEZ VOTRE TERRAIN.',
        description: 'Découvrez des matchs et des entraînements près de chez vous.',
        image: require('../assets/images/onboarding-2.jpg'),
    },
    {
        id: '3',
        title: 'SQUAD',
        subtitle: 'CRÉEZ VOTRE ÉQUIPE.',
        description: 'Invitez vos amis et construisez une équipe imbattable.',
        image: require('../assets/images/onboarding-3.jpg'),
    },
];

export default function OnboardingScreen() {
    const router = useRouter();
    const flatListRef = useRef<FlatList>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleNext = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (currentIndex < ONBOARDING_STEPS.length - 1) {
            flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true,
            });
        } else {
            finishOnboarding();
        }
    };

    const finishOnboarding = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(auth)/login');
    };

    const renderItem = ({ item, index }: { item: typeof ONBOARDING_STEPS[0]; index: number }) => {
        return (
            <View style={styles.slide}>
                <ImageBackground
                    source={item.image} // Note: This will fail if images don't exist. Using a fallback color for now.
                    style={styles.imageBackground}
                    imageStyle={{ opacity: 0.6 }}
                >
                    <View style={[styles.imageBackground, { backgroundColor: '#000', position: 'absolute', opacity: 0.5 }]} />

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
            />

            {/* Pagination Dots */}
            <View style={styles.pagination}>
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
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={handleNext}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>
                        {currentIndex === ONBOARDING_STEPS.length - 1 ? 'COMMENCER' : 'SUIVANT'}
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
        width,
        height,
    },
    imageBackground: {
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end',
        padding: 24,
        paddingBottom: 120, // Space for footer
    },
    contentContainer: {
        marginBottom: 40,
    },
    title: {
        fontSize: 64,
        fontWeight: '900',
        fontStyle: 'italic',
        color: '#FFF',
        letterSpacing: -2,
        lineHeight: 64,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 24,
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
        maxWidth: '80%',
    },

    pagination: {
        position: 'absolute',
        bottom: 140,
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
        bottom: 40,
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
