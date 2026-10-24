import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';

// Fond "terrain" des cartes de session : la surface où se pratique le sport (gazon, terre battue...).
// L'image est calée à droite (les marquages qui font reconnaître le terrain y sont regroupés)
// et un dégradé blanc garde le côté gauche, celui du texte, toujours clair.
const SURFACES: Record<string, ImageSourcePropType> = {
  grass: require('../../../assets/images/surfaces/grass.webp'),
  clay: require('../../../assets/images/surfaces/clay.webp'),
};

const SURFACE_RATIO = 1000 / 483;

const SPORT_SURFACES: Record<string, keyof typeof SURFACES> = {
  football: 'grass',
  rugby: 'grass',
  golf: 'grass',
  tennis: 'clay',
};

export const hasSportSurface = (sport?: string | null) => !!sport && sport.toLowerCase() in SPORT_SURFACES;

interface SportSurfaceProps {
  sport: string;
  // Part de la largeur (0-1) gardée blanche à gauche pour le texte
  textWidth?: number;
  // Arrondi de la carte : une carte avec ombre ne peut pas couper son contenu (overflow) sur iOS
  borderRadius?: number;
}

export function SportSurface({ sport, textWidth = 0.45, borderRadius = 16 }: SportSurfaceProps) {
  const surface = SPORT_SURFACES[(sport || '').toLowerCase()];
  if (!surface) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { borderRadius, overflow: 'hidden' }]} pointerEvents="none">
      <Image source={SURFACES[surface]} style={styles.image} resizeMode="cover" />
      <LinearGradient
        colors={['#FFFFFF', '#FFFFFF', 'rgba(255,255,255,0.7)', 'rgba(255,255,255,0)']}
        locations={[0, textWidth, textWidth + 0.15, Math.min(1, textWidth + 0.4)]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    aspectRatio: SURFACE_RATIO,
    minWidth: '55%',
  },
});
