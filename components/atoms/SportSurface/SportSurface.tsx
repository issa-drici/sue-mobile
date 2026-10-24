import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';

// Fond "terrain" des cartes de session : la surface où se pratique le sport (gazon, terre battue...).
// L'image couvre toute la carte sous un voile blanc uniforme : on reconnaît le terrain partout,
// sans coupure, et le texte garde un fond clair.
const SURFACES: Record<string, ImageSourcePropType> = {
  grass: require('../../../assets/images/surfaces/grass.webp'),
  clay: require('../../../assets/images/surfaces/clay.webp'),
};

const SPORT_SURFACES: Record<string, keyof typeof SURFACES> = {
  football: 'grass',
  rugby: 'grass',
  golf: 'grass',
  tennis: 'clay',
};

export const hasSportSurface = (sport?: string | null) => !!sport && sport.toLowerCase() in SPORT_SURFACES;

interface SportSurfaceProps {
  sport: string;
  // Opacité du voile blanc (0-1) : plus haut = terrain plus discret, texte plus lisible
  veil?: number;
  // Arrondi de la carte : une carte avec ombre ne peut pas couper son contenu (overflow) sur iOS
  borderRadius?: number;
}

export function SportSurface({ sport, veil = 0.72, borderRadius = 16 }: SportSurfaceProps) {
  const surface = SPORT_SURFACES[(sport || '').toLowerCase()];
  if (!surface) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { borderRadius, overflow: 'hidden' }]} pointerEvents="none">
      <Image source={SURFACES[surface]} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(255,255,255,${veil})` }]} />
    </View>
  );
}
