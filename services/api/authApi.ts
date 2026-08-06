import {
  AuthResponse,
  LoginCredentials,
  PhoneRegisterResponse,
  RegisterData,
  SendOtpResponse,
  VerifyOtpResponse,
} from '../types/auth';
import { baseApiService } from './baseApi';
import { AUTH_ENDPOINTS } from './endpoints';

const DEVICE_NAME = 'SUE Mobile App';

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

  // Mot de passe oublié
  static async forgotPassword(email: string): Promise<{ status: string }> {
    return baseApiService.post<{ status: string }>(AUTH_ENDPOINTS.FORGOT_PASSWORD, { email });
  }

  // --- Auth par téléphone + OTP ---

  // Envoi du code SMS
  static async sendPhoneOtp(phone: string): Promise<SendOtpResponse> {
    return baseApiService.post<SendOtpResponse>(AUTH_ENDPOINTS.PHONE_SEND_OTP, { phone });
  }

  // Vérification du code : connecte si déjà inscrit, sinon isRegistered=false
  static async verifyPhoneOtp(phone: string, code: string): Promise<VerifyOtpResponse> {
    return baseApiService.post<VerifyOtpResponse>(AUTH_ENDPOINTS.PHONE_VERIFY, {
      phone,
      code,
      device_name: DEVICE_NAME,
    });
  }

  // Création du profil (prénom/nom) après vérification réussie
  static async registerPhone(
    phone: string,
    firstname: string,
    lastname: string
  ): Promise<PhoneRegisterResponse> {
    return baseApiService.post<PhoneRegisterResponse>(AUTH_ENDPOINTS.PHONE_REGISTER, {
      phone,
      firstname,
      lastname,
      device_name: DEVICE_NAME,
    });
  }
} 