/**
 * Utilitaires pour la gestion des heures dans les sessions
 */

/**
 * Arrondit une heure à la demi-heure la plus proche
 * @param date - La date/heure à arrondir
 * @returns La date arrondie à la demi-heure la plus proche
 */
export function roundToNearestHalfHour(date: Date): Date {
  const roundedDate = new Date(date);
  const minutes = roundedDate.getMinutes();
  
  if (minutes <= 15) {
    // Arrondir à l'heure pleine (00)
    roundedDate.setMinutes(0, 0, 0);
  } else if (minutes <= 45) {
    // Arrondir à la demi-heure (30)
    roundedDate.setMinutes(30, 0, 0);
  } else {
    // Arrondir à l'heure suivante (00)
    roundedDate.setHours(roundedDate.getHours() + 1, 0, 0, 0);
  }
  
  return roundedDate;
}

/**
 * Arrondit une heure à la demi-heure suivante pour les valeurs par défaut
 * @param date - La date/heure à arrondir
 * @returns La date arrondie à la demi-heure suivante
 */
export function roundToNextHalfHour(date: Date): Date {
  const roundedDate = new Date(date);
  const minutes = roundedDate.getMinutes();
  
  if (minutes < 30) {
    // Arrondir à la demi-heure suivante (30)
    roundedDate.setMinutes(30, 0, 0);
  } else {
    // Arrondir à l'heure suivante (00)
    roundedDate.setHours(roundedDate.getHours() + 1, 0, 0, 0);
  }
  
  return roundedDate;
}

/**
 * Ajoute une heure à une date
 * @param date - La date de base
 * @returns La date avec une heure ajoutée
 */
export function addOneHour(date: Date): Date {
  const newDate = new Date(date);
  newDate.setHours(newDate.getHours() + 1);
  return newDate;
}

/**
 * Vérifie si une heure de fin est valide par rapport à l'heure de début
 * @param startTime - L'heure de début
 * @param endTime - L'heure de fin
 * @returns true si l'heure de fin est valide
 */
export function isValidEndTime(startTime: Date, endTime: Date): boolean {
  return endTime > startTime;
}

/**
 * Obtient l'heure de fin par défaut (début + 1 heure)
 * @param startTime - L'heure de début
 * @returns L'heure de fin par défaut
 */
export function getDefaultEndTime(startTime: Date): Date {
  return addOneHour(startTime);
}

/**
 * Formate une heure en chaîne HH:MM
 * @param date - La date à formater
 * @returns La chaîne formatée HH:MM
 */
export function formatTimeString(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}
