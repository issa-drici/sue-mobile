import React from 'react';
import { Image, ImageSourcePropType, StyleProp, View, ViewStyle } from 'react-native';

// Icônes 3D des sports (kit Sue). Un sport sans image garde son affichage actuel (children).
const SPORT_IMAGES: Record<string, ImageSourcePropType> = {
  aquafitness: require('../../../assets/images/sports/aquafitness.webp'),
  'athlétisme': require('../../../assets/images/sports/athletisme.webp'),
  aviron: require('../../../assets/images/sports/aviron.webp'),
  'aïkido': require('../../../assets/images/sports/aikido.webp'),
  badminton: require('../../../assets/images/sports/badminton.webp'),
  baseball: require('../../../assets/images/sports/baseball.webp'),
  basketball: require('../../../assets/images/sports/basketball.webp'),
  bodyboard: require('../../../assets/images/sports/bodyboard.webp'),
  bowling: require('../../../assets/images/sports/bowling.webp'),
  boxe: require('../../../assets/images/sports/boxe.webp'),
  course: require('../../../assets/images/sports/course.webp'),
  cyclisme: require('../../../assets/images/sports/cyclisme.webp'),
  danse: require('../../../assets/images/sports/danse.webp'),
  escalade: require('../../../assets/images/sports/escalade.webp'),
  football: require('../../../assets/images/sports/football.webp'),
  golf: require('../../../assets/images/sports/golf.webp'),
  gymnastique: require('../../../assets/images/sports/gymnastique.webp'),
  handball: require('../../../assets/images/sports/handball.webp'),
  hockey: require('../../../assets/images/sports/hockey.webp'),
  'jiu-jitsu-brésilien': require('../../../assets/images/sports/jiu-jitsu-bresilien.webp'),
  judo: require('../../../assets/images/sports/judo.webp'),
  'karaté': require('../../../assets/images/sports/karate.webp'),
  kayak: require('../../../assets/images/sports/kayak.webp'),
  'marche-nordique': require('../../../assets/images/sports/marche-nordique.webp'),
  'marche-sportive': require('../../../assets/images/sports/marche-sportive.webp'),
  musculation: require('../../../assets/images/sports/musculation.webp'),
  natation: require('../../../assets/images/sports/natation.webp'),
  padel: require('../../../assets/images/sports/padel.webp'),
  pilates: require('../../../assets/images/sports/pilates.webp'),
  'ping-pong': require('../../../assets/images/sports/ping-pong.webp'),
  'planche-à-voile': require('../../../assets/images/sports/planche-a-voile.webp'),
  'pétanque': require('../../../assets/images/sports/petanque.webp'),
  'pêche': require('../../../assets/images/sports/peche.webp'),
  'randonnée': require('../../../assets/images/sports/randonnee.webp'),
  rugby: require('../../../assets/images/sports/rugby.webp'),
  'sauvetage-sportif': require('../../../assets/images/sports/sauvetage-sportif.webp'),
  skateboard: require('../../../assets/images/sports/skateboard.webp'),
  ski: require('../../../assets/images/sports/ski.webp'),
  snowboard: require('../../../assets/images/sports/snowboard.webp'),
  squash: require('../../../assets/images/sports/squash.webp'),
  'stand-up-paddle': require('../../../assets/images/sports/stand-up-paddle.webp'),
  surf: require('../../../assets/images/sports/surf.webp'),
  tennis: require('../../../assets/images/sports/tennis.webp'),
  'tir-à-l-arc': require('../../../assets/images/sports/tir-a-l-arc.webp'),
  triathlon: require('../../../assets/images/sports/triathlon.webp'),
  volleyball: require('../../../assets/images/sports/volleyball.webp'),
  yoga: require('../../../assets/images/sports/yoga.webp'),
  'équitation': require('../../../assets/images/sports/equitation.webp'),
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
