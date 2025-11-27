import { useCallback, useEffect, useState } from 'react';
import { useGetUserProfile } from '../services/users/getUserProfile';
import { useUpdateSportsPreferences } from '../services/users/updateSportsPreferences';
import { Sport } from '../types/sport';

export const useSportsPreferences = () => {
  const { data: userProfile, refetch: fetchUserProfile } = useGetUserProfile();
  const { updateSportsPreferences, isLoading: isUpdating, error: updateError } = useUpdateSportsPreferences();
  
  const [sportsPreferences, setSportsPreferences] = useState<Sport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les sports préférés depuis le profil utilisateur
  useEffect(() => {
    if (userProfile?.sports_preferences && userProfile.sports_preferences.length > 0) {
      setSportsPreferences(userProfile.sports_preferences as Sport[]);
      setIsLoading(false);
    } else if (userProfile) {
      // Si pas de préférences définies ou tableau vide, initialiser avec un tableau vide
      setSportsPreferences([]);
      setIsLoading(false);
    }
  }, [userProfile]);

  // Mettre à jour les sports préférés
  const updatePreferences = useCallback(async (sports: Sport[]): Promise<boolean> => {
    const success = await updateSportsPreferences(sports);
    if (success) {
      setSportsPreferences(sports);
      // Rafraîchir le profil pour avoir les données à jour
      await fetchUserProfile();
    }
    return success;
  }, [updateSportsPreferences, fetchUserProfile]);

  // Ajouter un sport aux préférences
  const addSport = useCallback(async (sport: Sport): Promise<boolean> => {
    if (sportsPreferences.includes(sport)) {
      return true; // Déjà présent
    }
    
    const newPreferences = [...sportsPreferences, sport];
    return await updatePreferences(newPreferences);
  }, [sportsPreferences, updatePreferences]);

  // Supprimer un sport des préférences
  const removeSport = useCallback(async (sport: Sport): Promise<boolean> => {
    const newPreferences = sportsPreferences.filter(s => s !== sport);
    return await updatePreferences(newPreferences);
  }, [sportsPreferences, updatePreferences]);

  // Toggle un sport (ajouter s'il n'est pas présent, supprimer s'il l'est)
  const toggleSport = useCallback(async (sport: Sport): Promise<boolean> => {
    if (sportsPreferences.includes(sport)) {
      return await removeSport(sport);
    } else {
      return await addSport(sport);
    }
  }, [sportsPreferences, addSport, removeSport]);

  // Vérifier si un sport est dans les préférences
  const isSportPreferred = useCallback((sport: Sport): boolean => {
    return sportsPreferences.includes(sport);
  }, [sportsPreferences]);

  // Obtenir les sports non préférés
  const getNonPreferredSports = useCallback((allSports: Sport[]): Sport[] => {
    return allSports.filter(sport => !sportsPreferences.includes(sport));
  }, [sportsPreferences]);

  return {
    sportsPreferences,
    isLoading: isLoading || isUpdating,
    error: updateError,
    updatePreferences,
    addSport,
    removeSport,
    toggleSport,
    isSportPreferred,
    getNonPreferredSports,
    refreshPreferences: fetchUserProfile,
  };
};
