import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';

// Fond "terrain" des cartes de session : la surface où se pratique le sport (gazon, terre battue...).
// Image à 100 %, assombrie par un dégradé côté texte (à gauche) : le texte passe en blanc,
// les marquages qui font reconnaître le terrain restent nets à droite, et les 10 derniers %
// sont assombris pour que le texte aligné à droite ressorte.
const SURFACES: Record<string, ImageSourcePropType> = {
  grass: require('../../../assets/images/surfaces/grass.webp'),
  clay: require('../../../assets/images/surfaces/clay.webp'),
  'parquet-basket': require('../../../assets/images/surfaces/parquet-basket.webp'),
  'parquet-multisport': require('../../../assets/images/surfaces/parquet-multisport.webp'),
  padel: require('../../../assets/images/surfaces/padel.webp'),
  'ping-pong': require('../../../assets/images/surfaces/ping-pong.webp'),
  tatami: require('../../../assets/images/surfaces/tatami.webp'),
  ring: require('../../../assets/images/surfaces/ring.webp'),
  'athletics-track': require('../../../assets/images/surfaces/athletics-track.webp'),
  trail: require('../../../assets/images/surfaces/trail.webp'),
  'golf-green': require('../../../assets/images/surfaces/golf-green.webp'),
  'rugby-pitch': require('../../../assets/images/surfaces/rugby-pitch.webp'),
  road: require('../../../assets/images/surfaces/road.webp'),
  'gym-floor': require('../../../assets/images/surfaces/gym-floor.webp'),
  studio: require('../../../assets/images/surfaces/studio.webp'),
  pool: require('../../../assets/images/surfaces/pool.webp'),
  lake: require('../../../assets/images/surfaces/lake.webp'),
  waves: require('../../../assets/images/surfaces/waves.webp'),
  snow: require('../../../assets/images/surfaces/snow.webp'),
  ice: require('../../../assets/images/surfaces/ice.webp'),
  'baseball-dirt': require('../../../assets/images/surfaces/baseball-dirt.webp'),
  gravel: require('../../../assets/images/surfaces/gravel.webp'),
  'climbing-wall': require('../../../assets/images/surfaces/climbing-wall.webp'),
  'arena-sand': require('../../../assets/images/surfaces/arena-sand.webp'),
  'bowling-lane': require('../../../assets/images/surfaces/bowling-lane.webp'),
  'archery-target': require('../../../assets/images/surfaces/archery-target.webp'),
};

const SPORT_SURFACES: Record<string, keyof typeof SURFACES> = {
  football: 'grass',
  rugby: 'rugby-pitch',
  golf: 'golf-green',
  tennis: 'clay',
  basketball: 'parquet-basket',
  handball: 'parquet-multisport',
  volleyball: 'parquet-multisport',
  badminton: 'parquet-multisport',
  squash: 'parquet-multisport',
  padel: 'padel',
  'ping-pong': 'ping-pong',
  judo: 'tatami',
  'karaté': 'tatami',
  'aïkido': 'tatami',
  'jiu-jitsu-brésilien': 'tatami',
  boxe: 'ring',
  course: 'athletics-track',
  'athlétisme': 'athletics-track',
  triathlon: 'athletics-track',
  'randonnée': 'trail',
  'marche-nordique': 'trail',
  'marche-sportive': 'trail',
  cyclisme: 'road',
  skateboard: 'road',
  musculation: 'gym-floor',
  danse: 'studio',
  yoga: 'studio',
  pilates: 'studio',
  gymnastique: 'studio',
  natation: 'pool',
  aquafitness: 'pool',
  'sauvetage-sportif': 'pool',
  aviron: 'lake',
  kayak: 'lake',
  'pêche': 'lake',
  'stand-up-paddle': 'lake',
  surf: 'waves',
  bodyboard: 'waves',
  'planche-à-voile': 'waves',
  ski: 'snow',
  snowboard: 'snow',
  hockey: 'ice',
  baseball: 'baseball-dirt',
  'pétanque': 'gravel',
  escalade: 'climbing-wall',
  'équitation': 'arena-sand',
  bowling: 'bowling-lane',
  'tir-à-l-arc': 'archery-target',
};

// Format réel de chaque texture (elles n'ont pas toutes exactement la même hauteur)
const surfaceRatio = (source: ImageSourcePropType) => {
  const { width, height } = Image.resolveAssetSource(source);
  return width / height;
};

export const hasSportSurface = (sport?: string | null) => !!sport && sport.toLowerCase() in SPORT_SURFACES;

interface SportSurfaceProps {
  sport: string;
  // Arrondi de la carte : une carte avec ombre ne peut pas couper son contenu (overflow) sur iOS
  borderRadius?: number;
}

export function SportSurface({ sport, borderRadius = 16 }: SportSurfaceProps) {
  const surface = SPORT_SURFACES[(sport || '').toLowerCase()];
  const [size, setSize] = useState({ width: 0, height: 0 });
  if (!surface) return null;

  // Remplit la carte en calant l'image à droite (là où sont les marquages), centrée en hauteur
  const ratio = surfaceRatio(SURFACES[surface]);
  const imageHeight = Math.max(size.height, size.width / ratio);
  const imageWidth = imageHeight * ratio;

  return (
    <View
      style={[StyleSheet.absoluteFill, { borderRadius, overflow: 'hidden' }]}
      pointerEvents="none"
      onLayout={(e) => setSize(e.nativeEvent.layout)}
    >
      {size.width > 0 && (
        <Image
          source={SURFACES[surface]}
          style={{ position: 'absolute', right: 0, top: (size.height - imageHeight) / 2, width: imageWidth, height: imageHeight }}
        />
      )}
      <LinearGradient
        colors={['rgba(0,0,0,0.62)', 'rgba(0,0,0,0.38)', 'rgba(0,0,0,0.12)', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0.68)']}
        locations={[0, 0.45, 0.72, 0.9, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
