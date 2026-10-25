import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Image, Modal, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../app/context/auth';
import { BrandColors } from '../../../constants/Colors';
import { Badge, fetchBadges, markBadgesSeen } from '../../../services/badges';
import { BADGE_IMAGES } from './badgeImages';

// Célébration plein écran des badges débloqués et pas encore vus, à l'ouverture de l'app.
// Un badge à la fois ; chaque badge n'est célébré qu'une fois.
// "Partager" envoie une image (format story) générée à partir de la carte cachée ShareCard.

const RAYS = require('../../../assets/images/badge-rays.webp');
const LOGO = require('../../../assets/images/icon.png');
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Module natif ajouté en 2.1.2 : absent des versions précédentes (qui reçoivent ce code par OTA)
let captureRef: ((view: unknown, options: object) => Promise<string>) | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  captureRef = require('react-native-view-shot').captureRef;
} catch {
  captureRef = null;
}

const CONFETTI_COLORS = [BrandColors.primary, '#FFFFFF', '#E3B341', '#8CBF3D'];

function ConfettiPiece({ index, burstKey }: { index: number; burstKey: string }) {
  // Position, couleur et trajectoire pseudo-aléatoires mais stables pour une pièce donnée
  const seed = useMemo(() => {
    const r = (n: number) => ((Math.sin(index * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
    return {
      x: r(1) * SCREEN_W,
      drift: (r(2) - 0.5) * 120,
      delay: r(3) * 350,
      duration: 1800 + r(4) * 1200,
      spin: (r(5) - 0.5) * 900,
      size: 6 + r(6) * 6,
      color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    };
  }, [index]);

  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(seed.delay, withTiming(1, { duration: seed.duration, easing: Easing.out(Easing.quad) }));
  }, [burstKey, progress, seed]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value < 0.85 ? 1 : (1 - progress.value) / 0.15,
    transform: [
      { translateY: -40 + progress.value * (SCREEN_H * 0.75) },
      { translateX: progress.value * seed.drift },
      { rotate: `${progress.value * seed.spin}deg` },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.confetti,
        { left: seed.x, width: seed.size, height: seed.size * 1.6, backgroundColor: seed.color },
        style,
      ]}
    />
  );
}

/** Carte au format story (9:16), capturée en image pour le partage */
function ShareCard({ badge, firstName, unlockedCount, total }: { badge: Badge; firstName: string; unlockedCount: number; total: number }) {
  return (
    <View style={styles.card} collapsable={false}>
      <LinearGradient colors={['#141414', '#050505']} style={StyleSheet.absoluteFill} />
      <Image source={RAYS} style={styles.cardRays} />
      <View style={styles.cardTop}>
        <Image source={LOGO} style={styles.cardLogo} />
        <Text style={styles.cardBrand}>SUE</Text>
      </View>
      <View style={styles.cardCenter}>
        <Text style={styles.cardKicker}>{firstName ? `${firstName.toUpperCase()} A DÉBLOQUÉ` : 'BADGE DÉBLOQUÉ'}</Text>
        <Image source={BADGE_IMAGES[badge.id]} style={styles.cardMedal} />
        <Text style={styles.cardName}>{badge.name}</Text>
        <Text style={styles.cardDescription}>{badge.description}</Text>
        <View style={styles.cardPill}>
          <Text style={styles.cardPillText}>{unlockedCount} / {total} badges</Text>
        </View>
      </View>
      <Text style={styles.cardFooter}>Organise tes sessions de sport sur sue-app.fr</Text>
    </View>
  );
}

export function BadgeCelebration({ checkKey }: { checkKey: unknown }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [queue, setQueue] = useState<Badge[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const cardRef = useRef<View>(null);
  // iOS ne superpose pas deux fenêtres : restée ouverte sous un autre écran, la célébration
  // empêchait sa fenêtre (ex. l'invitation) de s'afficher tout en bloquant les taps.
  const isFocused = useIsFocused();
  const current = isFocused ? queue[0] : undefined;

  const medalScale = useSharedValue(0.2);
  const medalRotate = useSharedValue(0);
  const raysRotate = useSharedValue(0);
  const glow = useSharedValue(0);

  const medalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: medalScale.value }, { rotate: `${medalRotate.value}deg` }],
  }));
  const raysStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ rotate: `${raysRotate.value}deg` }, { scale: 0.8 + glow.value * 0.2 }],
  }));

  useEffect(() => {
    fetchBadges()
      .then((badges) => {
        setAllBadges(badges);
        setQueue(badges.filter((b) => b.unlocked && b.seen === false));
      })
      .catch(() => {});
  }, [checkKey]);

  useEffect(() => {
    if (!current) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    medalScale.value = 0.2;
    medalRotate.value = -30;
    glow.value = 0;
    medalScale.value = withDelay(150, withSequence(withSpring(1.15, { damping: 6, stiffness: 140 }), withSpring(1, { damping: 9 })));
    medalRotate.value = withDelay(150, withSequence(withTiming(12, { duration: 300 }), withSpring(0, { damping: 5 })));
    glow.value = withDelay(250, withTiming(1, { duration: 700 }));
    raysRotate.value = withRepeat(withTiming(360, { duration: 24000, easing: Easing.linear }), -1, false);
  }, [current, medalScale, medalRotate, glow, raysRotate]);

  if (!current) return null;

  const unlockedCount = allBadges.filter((b) => b.unlocked).length;

  const next = () => {
    markBadgesSeen([current.id]).catch(() => {});
    setQueue((q) => q.slice(1));
  };

  const share = async () => {
    Haptics.selectionAsync();
    const message = `J'ai débloqué le badge « ${current.name} » sur Sue 🏅 Rejoins-moi : https://sue-app.fr`;
    setIsSharing(true);
    try {
      if (captureRef && cardRef.current) {
        const uri = await captureRef(cardRef.current, { format: 'png', quality: 1, result: 'tmpfile', width: 1080, height: 1920 });
        await Share.share({ url: uri, message });
      } else {
        await Share.share({ message });
      }
    } catch {
      // partage annulé
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={next}>
      <View style={styles.container}>
        {/* Carte de partage, rendue hors écran pour être capturée */}
        <View style={styles.offscreen} pointerEvents="none">
          <View ref={cardRef} collapsable={false}>
            <ShareCard badge={current} firstName={user?.firstname ?? ''} unlockedCount={unlockedCount} total={allBadges.length} />
          </View>
        </View>

        <LinearGradient colors={['#1A1F0E', '#0A0A0A', '#050505']} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />

        {Array.from({ length: 28 }, (_, i) => <ConfettiPiece key={i} index={i} burstKey={current.id} />)}

        <View style={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.center}>
            <Animated.Text entering={FadeInDown.delay(100)} style={styles.kicker}>BADGE DÉBLOQUÉ</Animated.Text>

            <View style={styles.medalStage}>
              <Animated.Image source={RAYS} style={[styles.rays, raysStyle]} />
              <Animated.View style={medalStyle}>
                <Image source={BADGE_IMAGES[current.id]} style={styles.medal} resizeMode="contain" />
              </Animated.View>
            </View>

            <Animated.Text entering={FadeInDown.delay(450)} style={styles.name}>{current.name}</Animated.Text>
            <Animated.Text entering={FadeInDown.delay(550)} style={styles.description}>{current.description}</Animated.Text>
            <Animated.View entering={FadeIn.delay(700)} style={styles.pill}>
              <Text style={styles.pillText}>{unlockedCount} / {allBadges.length} badges</Text>
            </Animated.View>
          </View>

          <Animated.View entering={FadeInDown.delay(800)} style={styles.actions}>
            <TouchableOpacity activeOpacity={0.85} style={[styles.shareButton, isSharing && { opacity: 0.6 }]} onPress={share} disabled={isSharing}>
              <Text style={styles.shareText}>{isSharing ? 'Préparation…' : 'Partager mon badge'}</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} style={styles.nextButton} onPress={next}>
              <Text style={styles.nextText}>{queue.length > 1 ? 'Badge suivant' : 'Continuer'}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const CARD_W = 360;
const CARD_H = 640;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  offscreen: {
    position: 'absolute',
    left: -10000,
    top: 0,
  },
  content: {
    flex: 1,
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
    letterSpacing: 3,
    color: BrandColors.primary,
  },
  medalStage: {
    width: 320,
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  rays: {
    position: 'absolute',
    width: 560,
    height: 560,
  },
  medal: {
    width: 200,
    height: 200,
  },
  name: {
    fontSize: 36,
    fontFamily: 'Outfit-Bold',
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
    textAlign: 'center',
  },
  pill: {
    marginTop: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(212,252,121,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212,252,121,0.35)',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.primary,
  },
  confetti: {
    position: 'absolute',
    top: 0,
    borderRadius: 2,
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
    color: 'rgba(255,255,255,0.75)',
  },

  // Carte de partage (story 9:16)
  card: {
    width: CARD_W,
    height: CARD_H,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 36,
  },
  cardRays: {
    position: 'absolute',
    width: 700,
    height: 700,
    top: CARD_H / 2 - 350 - 30,
    left: CARD_W / 2 - 350,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardLogo: {
    width: 30,
    height: 30,
    borderRadius: 8,
  },
  cardBrand: {
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  cardCenter: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  cardKicker: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2.5,
    color: BrandColors.primary,
    marginBottom: 18,
  },
  cardMedal: {
    width: 190,
    height: 190,
  },
  cardName: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFF',
    marginTop: 20,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 6,
    textAlign: 'center',
  },
  cardPill: {
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(212,252,121,0.15)',
  },
  cardPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  cardFooter: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
  },
});
