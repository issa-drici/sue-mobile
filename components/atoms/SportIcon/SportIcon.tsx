import React from 'react';
import { Image, ImageSourcePropType, StyleProp, View, ViewStyle } from 'react-native';

// Icônes 3D des sports (kit Sue). Un sport sans image garde son affichage actuel (children).
const SPORT_IMAGES: Record<string, ImageSourcePropType> = {
  badminton: require('../../../assets/images/sports/badminton.png'),
  baseball: require('../../../assets/images/sports/baseball.png'),
  basketball: require('../../../assets/images/sports/basketball.png'),
  bowling: require('../../../assets/images/sports/bowling.png'),
  boxe: require('../../../assets/images/sports/boxe.png'),
  football: require('../../../assets/images/sports/football.png'),
  golf: require('../../../assets/images/sports/golf.png'),
  handball: require('../../../assets/images/sports/handball.png'),
  hockey: require('../../../assets/images/sports/hockey.png'),
  judo: require('../../../assets/images/sports/judo.png'),
  padel: require('../../../assets/images/sports/padel.png'),
  'ping-pong': require('../../../assets/images/sports/ping-pong.png'),
  'pétanque': require('../../../assets/images/sports/petanque.png'),
  rugby: require('../../../assets/images/sports/rugby.png'),
  squash: require('../../../assets/images/sports/squash.png'),
  tennis: require('../../../assets/images/sports/tennis.png'),
  'tir-à-l-arc': require('../../../assets/images/sports/tir-a-l-arc.png'),
  volleyball: require('../../../assets/images/sports/volleyball.png'),
};

export const hasSportImage = (sport?: string | null) => !!sport && sport.toLowerCase() in SPORT_IMAGES;

interface SportIconProps {
  sport: string;
  size: number;
  // Contenu affiché si le sport n'a pas encore d'image (l'icône actuelle)
  children?: React.ReactNode;
  // Fond neutre derrière l'image (pastilles de choix du sport)
  containerStyle?: StyleProp<ViewStyle>;
}

export function SportIcon({ sport, size, children, containerStyle }: SportIconProps) {
  const source = SPORT_IMAGES[(sport || '').toLowerCase()];
  if (!source) {
    return <>{children}</>;
  }

  const image = <Image source={source} style={{ width: size, height: size }} resizeMode="contain" />;
  return containerStyle ? <View style={containerStyle}>{image}</View> : image;
}
