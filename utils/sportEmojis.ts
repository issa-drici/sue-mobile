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


