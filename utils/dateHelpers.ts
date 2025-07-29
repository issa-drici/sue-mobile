/**
 * Helpers pour le formatage des dates et heures
 */

/**
 * Formate une date au format français
 * @param date - Date au format string (YYYY-MM-DD)
 * @returns Date formatée en français (ex: "mercredi 25 décembre")
 */
export const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
};

/**
 * Formate une heure au format français
 * @param time - Heure au format string (HH:MM)
 * @returns Heure formatée en français (ex: "18:00")
 */
export const formatTime = (time: string) => {
  return new Date(`1970-01-01T${time}`).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Formate une date et heure complète
 * @param date - Date au format string (YYYY-MM-DD)
 * @param time - Heure au format string (HH:MM)
 * @returns Date et heure formatées (ex: "mercredi 25 décembre à 18:00")
 */
export const formatDateTime = (date: string, time: string) => {
  const formattedDate = formatDate(date);
  const formattedTime = formatTime(time);
  return `${formattedDate} à ${formattedTime}`;
};

/**
 * Formate une date courte
 * @param date - Date au format string (YYYY-MM-DD)
 * @returns Date formatée courte (ex: "25/12/2024")
 */
export const formatShortDate = (date: string) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Formate une date de commentaire avec heure
 * @param dateString - Date au format ISO string
 * @returns Date formatée pour les commentaires (ex: "25 déc. 14:30")
 */
export const formatCommentDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Formate une date relative (aujourd'hui, hier, etc.)
 * @param date - Date au format string (YYYY-MM-DD)
 * @returns Date relative en français
 */
export const formatRelativeDate = (date: string) => {
  const today = new Date();
  const targetDate = new Date(date);
  const diffTime = today.getTime() - targetDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Aujourd\'hui';
  } else if (diffDays === 1) {
    return 'Hier';
  } else if (diffDays === -1) {
    return 'Demain';
  } else if (diffDays > 1 && diffDays <= 7) {
    return `Il y a ${diffDays} jours`;
  } else if (diffDays < -1 && diffDays >= -7) {
    return `Dans ${Math.abs(diffDays)} jours`;
  } else {
    return formatDate(date);
  }
}; 