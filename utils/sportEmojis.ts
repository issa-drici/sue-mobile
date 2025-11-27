import { Sport } from '../types/sport';

/**
 * Mapping des sports vers leurs emojis correspondants
 */
export const SPORT_EMOJIS: Record<Sport, string> = {
  tennis: '🎾',
  golf: '⛳',
  musculation: '💪',
  football: '⚽',
  basketball: '🏀',
  volleyball: '🏐',
  badminton: '🏸',
  padel: '🎾',
  squash: '🏓',
  natation: '🏊',
  course: '🏃',
  cyclisme: '🚴',
  escalade: '🧗',
  yoga: '🧘',
  pilates: '🤸',
  boxe: '🥊',
  'jiu-jitsu-brésilien': '🥋',
  danse: '💃',
  handball: '🤾',
  rugby: '🏉',
  hockey: '🏒',
  baseball: '⚾',
  'ping-pong': '🏓',
  bowling: '🎳',
  pétanque: '🥎',
  randonnée: '🥾',
  ski: '⛷️',
  snowboard: '🏂',
  surf: '🏄',
  'planche-à-voile': '🏄‍♂️',
  kayak: '🛶',
  aviron: '🚣',
  équitation: '🐎',
  gymnastique: '🤸',
  athlétisme: '🏃‍♂️',
  triathlon: '🏊‍♂️',
  pêche: '🎣',
  aïkido: '🥋',
  judo: '🥋',
  karaté: '🥋',
  'tir-à-l-arc': '🏹',
  skateboard: '🛹',
  'stand-up-paddle': '🏄‍♂️',
  bodyboard: '🏄',
  'marche-nordique': '🥾',
  'marche-sportive': '🚶‍♂️',
  aquafitness: '🏊‍♀️',
  'sauvetage-sportif': '🛟',
};

/**
 * Retourne l'emoji correspondant au sport donné
 * @param sport - Le sport pour lequel récupérer l'emoji
 * @returns L'emoji correspondant au sport, ou un emoji par défaut si le sport n'est pas reconnu
 */
export function getSportEmoji(sport: Sport | string | undefined): string {
  if (!sport || !(sport in SPORT_EMOJIS)) {
    return '🏃'; // Emoji par défaut pour les sports non reconnus
  }
  return SPORT_EMOJIS[sport as Sport];
}

/**
 * Formate le nom d'un sport pour l'affichage
 * @param sport - Le nom du sport à formater
 * @returns Le nom du sport formaté avec majuscules appropriées
 */
export function formatSportName(sport: string): string {
  if (!sport) return '';
  
  // Remplacer les tirets par des espaces et formater chaque mot
  return sport
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}


