import React, { useEffect, useState } from 'react';
import { Image, Modal, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandColors } from '../../../constants/Colors';
import { Badge, fetchBadges, markBadgesSeen } from '../../../services/badges';
import { BADGE_IMAGES } from './badgeImages';

// Célébration plein écran des badges débloqués et pas encore vus, à l'ouverture de l'app.
// Un badge à la fois ; chaque badge n'est célébré qu'une fois.

export function BadgeCelebration({ checkKey }: { checkKey: unknown }) {
  const insets = useSafeAreaInsets();
  const [queue, setQueue] = useState<Badge[]>([]);
  const current = queue[0];

  const scale = useSharedValue(0.3);
  const rotate = useSharedValue(0);
  const medalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  useEffect(() => {
    fetchBadges()
      .then((badges) => setQueue(badges.filter((b) => b.unlocked && b.seen === false)))
      .catch(() => {});
  }, [checkKey]);

  useEffect(() => {
    if (!current) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    scale.value = 0.3;
    rotate.value = -25;
    scale.value = withSequence(withSpring(1.12, { damping: 7 }), withSpring(1));
    rotate.value = withSequence(withTiming(10, { duration: 260 }), withSpring(0, { damping: 5 }));
  }, [current, scale, rotate]);

  if (!current) return null;

  const next = () => {
    markBadgesSeen([current.id]).catch(() => {});
    setQueue((q) => q.slice(1));
  };

  const share = async () => {
    Haptics.selectionAsync();
    try {
      await Share.share({ message: `J'ai débloqué le badge « ${current.name} » sur Sue 🏅 ${current.description}. Rejoins-moi : https://sue-app.fr` });
    } catch {
      // partage annulé
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={next}>
      <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.center}>
          <Text style={styles.kicker}>NOUVEAU BADGE</Text>
          <Animated.View style={medalStyle}>
            <Image source={BADGE_IMAGES[current.id]} style={styles.medal} resizeMode="contain" />
          </Animated.View>
          <Text style={styles.name}>{current.name}</Text>
          <Text style={styles.description}>{current.description}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity activeOpacity={0.85} style={styles.shareButton} onPress={share}>
            <Text style={styles.shareText}>Partager</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} style={styles.nextButton} onPress={next}>
            <Text style={styles.nextText}>{queue.length > 1 ? 'Suivant' : 'Continuer'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(10,10,10,0.94)',
    paddingHorizontal: 28,
    justifyContent: 'space-between',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
    color: BrandColors.primary,
    marginBottom: 28,
  },
  medal: {
    width: 220,
    height: 220,
  },
  name: {
    fontSize: 32,
    fontFamily: 'Outfit-Bold',
    fontWeight: '800',
    color: '#FFF',
    marginTop: 28,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 8,
    textAlign: 'center',
  },
  actions: {
    gap: 6,
  },
  shareButton: {
    height: 56,
    borderRadius: 18,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
  },
  nextButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
  },
});
