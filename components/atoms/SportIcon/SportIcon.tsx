import React from 'react';
import { Image, ImageSourcePropType, StyleProp, View, ViewStyle } from 'react-native';

// Icônes 3D des sports (kit Sue). Un sport sans image garde son affichage actuel (children).
const SPORT_IMAGES: Record<string, ImageSourcePropType> = {
  'athlétisme': require('../../../assets/images/sports/athletisme.png'),
  'aïkido': require('../../../assets/images/sports/aikido.png'),
  badminton: require('../../../assets/images/sports/badminton.png'),
  baseball: require('../../../assets/images/sports/baseball.png'),
  basketball: require('../../../assets/images/sports/basketball.png'),
  bodyboard: require('../../../assets/images/sports/bodyboard.png'),
  bowling: require('../../../assets/images/sports/bowling.png'),
  boxe: require('../../../assets/images/sports/boxe.png'),
  course: require('../../../assets/images/sports/course.png'),
  cyclisme: require('../../../assets/images/sports/cyclisme.png'),
  danse: require('../../../assets/images/sports/danse.png'),
  escalade: require('../../../assets/images/sports/escalade.png'),
  football: require('../../../assets/images/sports/football.png'),
  golf: require('../../../assets/images/sports/golf.png'),
  gymnastique: require('../../../assets/images/sports/gymnastique.png'),
  handball: require('../../../assets/images/sports/handball.png'),
  hockey: require('../../../assets/images/sports/hockey.png'),
  'jiu-jitsu-brésilien': require('../../../assets/images/sports/jiu-jitsu-bresilien.png'),
  judo: require('../../../assets/images/sports/judo.png'),
  'karaté': require('../../../assets/images/sports/karate.png'),
  'marche-nordique': require('../../../assets/images/sports/marche-nordique.png'),
  'marche-sportive': require('../../../assets/images/sports/marche-sportive.png'),
  musculation: require('../../../assets/images/sports/musculation.png'),
  padel: require('../../../assets/images/sports/padel.png'),
  pilates: require('../../../assets/images/sports/pilates.png'),
  'ping-pong': require('../../../assets/images/sports/ping-pong.png'),
  'planche-à-voile': require('../../../assets/images/sports/planche-a-voile.png'),
  'pétanque': require('../../../assets/images/sports/petanque.png'),
  'randonnée': require('../../../assets/images/sports/randonnee.png'),
  rugby: require('../../../assets/images/sports/rugby.png'),
  skateboard: require('../../../assets/images/sports/skateboard.png'),
  ski: require('../../../assets/images/sports/ski.png'),
  snowboard: require('../../../assets/images/sports/snowboard.png'),
  squash: require('../../../assets/images/sports/squash.png'),
  'stand-up-paddle': require('../../../assets/images/sports/stand-up-paddle.png'),
  surf: require('../../../assets/images/sports/surf.png'),
  tennis: require('../../../assets/images/sports/tennis.png'),
  'tir-à-l-arc': require('../../../assets/images/sports/tir-a-l-arc.png'),
  triathlon: require('../../../assets/images/sports/triathlon.png'),
  volleyball: require('../../../assets/images/sports/volleyball.png'),
  yoga: require('../../../assets/images/sports/yoga.png'),
  'équitation': require('../../../assets/images/sports/equitation.png'),
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
