import { useState } from 'react';
import { ENV } from '../../config/env';
import { Sport } from '../../types/sport';
import { baseApiService } from '../api/baseApi';
import { USERS_ENDPOINTS } from '../api/endpoints';
import { LaravelResponse } from '../api/types';

export interface UpdateSportsPreferencesData {
  sports_preferences: Sport[];
}

export interface UpdateSportsPreferencesResponse {
  success: boolean;
  message: string;
  data: {
    sports_preferences: Sport[];
  };
}

export const useUpdateSportsPreferences = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateSportsPreferences = async (sports: Sport[]): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      if (ENV.USE_MOCKS) {
        // Mock pour les tests
        console.log('Mock: Mise à jour des sports préférés:', sports);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulation délai
        return true;
      }

      const response = await baseApiService.put<LaravelResponse<UpdateSportsPreferencesResponse>>(
        USERS_ENDPOINTS.SPORTS_PREFERENCES,
        { sports_preferences: sports }
      );

      if (response.success) {
        console.log('✅ Sports préférés mis à jour avec succès');
        return true;
      } else {
        throw new Error('Erreur lors de la mise à jour');
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Erreur lors de la mise à jour des sports préférés';
      setError(errorMessage);
      console.error('❌ Erreur lors de la mise à jour des sports préférés:', errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updateSportsPreferences,
    isLoading,
    error,
  };
};
