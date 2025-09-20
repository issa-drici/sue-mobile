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
 * @param time - Heure au format string (HH:MM ou HH:MM:SS)
 * @returns Heure formatée en français (ex: "18:00")
 */
export const formatTime = (time: string) => {
  // Extraire seulement les heures et minutes
  const timeMatch = time.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  
  if (!timeMatch) {
    console.warn(`Format d'heure invalide: ${time}`);
    return time; // Retourner l'heure originale si le format est invalide
  }
  
  const hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  
  // Vérifier que les heures et minutes sont valides
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    console.warn(`Heure invalide: ${hours}:${minutes}`);
    return time;
  }
  
  // Formater avec padding des zéros
  const formattedHours = hours.toString().padStart(2, '0');
  const formattedMinutes = minutes.toString().padStart(2, '0');
  
  return `${formattedHours}:${formattedMinutes}`;
};

/**
 * Formate une heure en utilisant le fuseau horaire local
 * @param time - Heure au format string (HH:MM ou HH:MM:SS)
 * @returns Heure formatée en français (ex: "18:00")
 */
export const formatTimeLocal = (time: string) => {
  try {
    // Créer une date avec l'heure d'aujourd'hui pour éviter les problèmes de fuseau
    const today = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    
    if (isNaN(hours) || isNaN(minutes)) {
      console.warn(`Format d'heure invalide: ${time}`);
      return formatTime(time); // Fallback vers la fonction simple
    }
    
    const dateWithTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
    
    return dateWithTime.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (error: unknown) {
    console.warn(`Erreur lors du formatage local de l'heure: ${error instanceof Error ? error.message : String(error)}`);
    return formatTime(time); // Fallback vers la fonction simple
  }
};

/**
 * Formate une heure en forçant le fuseau horaire français (Europe/Paris)
 * @param time - Heure au format string (HH:MM ou HH:MM:SS)
 * @returns Heure formatée en français (ex: "18:00")
 */
export const formatTimeFrance = (time: string) => {
  try {
    // Extraire les heures et minutes
    const timeMatch = time.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    
    if (!timeMatch) {
      console.warn(`Format d'heure invalide: ${time}`);
      return formatTime(time); // Fallback vers la fonction simple
    }
    
    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    
    // Vérifier que les heures et minutes sont valides
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      console.warn(`Heure invalide: ${hours}:${minutes}`);
      return formatTime(time);
    }
    
    // Créer une date avec l'heure d'aujourd'hui en France
    const today = new Date();
    const dateWithTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
    
    // Forcer le fuseau horaire français
    return dateWithTime.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Europe/Paris'
    });
  } catch (error: unknown) {
    console.warn(`Erreur lors du formatage en heure française: ${error instanceof Error ? error.message : String(error)}`);
    return formatTime(time); // Fallback vers la fonction simple
  }
};

/**
 * Formate une heure en utilisant le fuseau horaire UTC (pour comparaison)
 * @param time - Heure au format string (HH:MM ou HH:MM:SS)
 * @returns Heure formatée en UTC (ex: "18:00")
 */
export const formatTimeUTC = (time: string) => {
  try {
    // Extraire les heures et minutes
    const timeMatch = time.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    
    if (!timeMatch) {
      console.warn(`Format d'heure invalide: ${time}`);
      return formatTime(time); // Fallback vers la fonction simple
    }
    
    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    
    // Vérifier que les heures et minutes sont valides
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      console.warn(`Heure invalide: ${hours}:${minutes}`);
      return formatTime(time);
    }
    
    // Créer une date avec l'heure d'aujourd'hui
    const today = new Date();
    const dateWithTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
    
    // Utiliser le fuseau UTC
    return dateWithTime.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC'
    });
  } catch (error: unknown) {
    console.warn(`Erreur lors du formatage en UTC: ${error instanceof Error ? error.message : String(error)}`);
    return formatTime(time); // Fallback vers la fonction simple
  }
};

/**
 * Débogue les informations de fuseau horaire
 * @param time - Heure à déboguer
 * @returns Informations de débogage
 */
export const debugTimeZone = (time: string) => {
  try {
    const today = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const dateWithTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
    
    return {
      originalTime: time,
      parsedHours: hours,
      parsedMinutes: minutes,
      dateObject: dateWithTime,
      localTime: dateWithTime.toLocaleTimeString('fr-FR'),
      utcTime: dateWithTime.toUTCString(),
      timezoneOffset: dateWithTime.getTimezoneOffset(),
      timezoneOffsetHours: dateWithTime.getTimezoneOffset() / 60
    };
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : String(error),
      originalTime: time
    };
  }
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