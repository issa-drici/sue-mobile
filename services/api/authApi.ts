import { AuthResponse, LoginCredentials, RegisterData } from '../types/auth';
import { baseApiService } from './baseApi';
import { AUTH_ENDPOINTS } from './endpoints';

// Service API d'authentification
export class AuthApi {
  // Connexion
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return baseApiService.post<AuthResponse>(AUTH_ENDPOINTS.LOGIN, credentials);
  }

  // Inscription
  static async register(userData: RegisterData): Promise<AuthResponse> {
    return baseApiService.post<AuthResponse>(AUTH_ENDPOINTS.REGISTER, userData);
  }

  // Déconnexion
  static async logout(): Promise<void> {
    return baseApiService.post<void>(AUTH_ENDPOINTS.LOGOUT, {});
  }

  // Rafraîchir le token
  static async refreshToken(): Promise<{ token: string }> {
    return baseApiService.post<{ token: string }>(AUTH_ENDPOINTS.REFRESH_TOKEN, {});
  }
} 