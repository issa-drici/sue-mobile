import { Sport } from '../../types/sport';
import { baseApiService } from './baseApi';
import { SPORTS_ENDPOINTS } from './endpoints';
import { LaravelResponse } from './types';

export interface PlayedSport {
  sport: Sport;
  count: number;
}

// Service API des sports
export class SportsApi {
  // Liste complète des sports supportés (source de vérité serveur, pour la modal "+")
  static async getAll(): Promise<Sport[]> {
    const response = await baseApiService.get<LaravelResponse<Sport[]>>(SPORTS_ENDPOINTS.ALL);
    return response.data || [];
  }

  // Sports pratiqués par l'utilisateur, triés du plus au moins joué (pour les accès rapides)
  static async getPlayedByUser(): Promise<PlayedSport[]> {
    const response = await baseApiService.get<LaravelResponse<PlayedSport[]>>(
      SPORTS_ENDPOINTS.PLAYED_BY_USER
    );
    return response.data || [];
  }
}
