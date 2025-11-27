/**
 * Export des helpers utilitaires
 */

import { ApiSportSession, SportSession } from '../types/sport';

// Fonction pour convertir les données de l'API en format frontend
export function convertApiSessionToFrontend(apiSession: ApiSportSession): SportSession {
  // Fonction pour extraire firstname et lastname de fullName
  const extractNames = (fullName: string | undefined | null) => {
    if (!fullName || typeof fullName !== 'string') {
      return { firstname: 'Utilisateur', lastname: '' };
    }
    const parts = fullName.split(' ');
    const lastname = parts.pop() || '';
    const firstname = parts.join(' ') || '';
    return { firstname, lastname };
  };

  return {
    ...apiSession,
    organizer: {
      id: apiSession.organizer.id,
      ...extractNames(apiSession.organizer.fullName)
    },
    participants: apiSession.participants.map(participant => ({
      id: participant.id,
      status: participant.status,
      ...extractNames(participant.fullName)
    })),
    comments: apiSession.comments.map(comment => ({
      id: comment.id,
      userId: comment.userId,
      content: comment.content,
      createdAt: comment.createdAt,
      ...extractNames(comment.fullName)
    }))
  };
}

export {
    formatCommentDate, formatDate, formatDateTime, formatRelativeDate, formatShortDate, formatTime
} from './dateHelpers';

export { addOneHour, formatTimeString, getDefaultEndTime, isValidEndTime, roundToNearestHalfHour, roundToNextHalfHour } from './timeHelpers';

export { getSportEmoji, SPORT_EMOJIS } from './sportEmojis';

export { SPORTS_LIST } from './sportsList';

