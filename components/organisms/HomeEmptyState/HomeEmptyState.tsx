import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BrandColors } from '../../../constants/Colors';

// Accueil sans aucune session : on propose directement les deux façons de lancer une session.

const CHOICES = [
  {
    href: '/create-session',
    icon: 'calendar-outline' as const,
    title: "J'ai une date",
    hint: 'Choisis le jour, invite, c’est parti.',
  },
  {
    href: '/create-session?mode=find-slot',
    icon: 'people-outline' as const,
    title: 'Trouver un créneau',
    hint: 'Tes potes disent quand ils sont dispos.',
  },
];

const STEPS = ['Crée', 'Partage le lien', "C'est parti"];

export function HomeEmptyState() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.hero}>
        <Image
          source={require('../../../assets/images/home-empty-hero.png')}
          style={styles.heroImage}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <Text style={styles.title}>Ta prochaine session{'\n'}commence ici</Text>
        <Text style={styles.subtitle}>Crée une session en 30 secondes, tes potes répondent en un tap.</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.choices}>
        {CHOICES.map((choice, index) => (
          <TouchableOpacity
            key={choice.href}
            activeOpacity={0.85}
            style={[styles.choiceCard, index === 0 && styles.choiceCardPrimary]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(choice.href as any);
            }}
          >
            <View style={[styles.choiceIcon, index === 0 && styles.choiceIconPrimary]}>
              <Ionicons name={choice.icon} size={20} color="#000" />
            </View>
            <View style={styles.choiceTexts}>
              <Text style={styles.choiceTitle}>{choice.title}</Text>
              <Text style={styles.choiceHint}>{choice.hint}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#000" />
          </TouchableOpacity>
        ))}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.steps}>
        {STEPS.map((step, index) => (
          <React.Fragment key={step}>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>{index + 1}</Text>
              <Text style={styles.stepText}>{step}</Text>
            </View>
            {index < STEPS.length - 1 ? <View style={styles.stepLine} /> : null}
          </React.Fragment>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 0,
    paddingBottom: 40,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 8,
  },
  heroImage: {
    width: 210,
    height: 206, // ratio de l'image 840x824
  },
  title: {
    fontSize: 28,
    lineHeight: 32,
    fontFamily: 'Outfit-Bold',
    fontWeight: '800',
    color: '#000',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
    color: '#8E8E93',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  choices: {
    gap: 10,
  },
  choiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  choiceCardPrimary: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  choiceIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceIconPrimary: {
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  choiceTexts: {
    flex: 1,
    gap: 2,
  },
  choiceTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
  },
  choiceHint: {
    fontSize: 13,
    fontWeight: '500',
    color: '#555',
  },
  steps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  step: {
    alignItems: 'center',
    gap: 6,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#000',
    color: BrandColors.primary,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 26,
    overflow: 'hidden',
  },
  stepText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#555',
  },
  stepLine: {
    width: 36,
    height: 1,
    backgroundColor: '#DDD',
    marginHorizontal: 10,
    marginBottom: 20,
  },
});
