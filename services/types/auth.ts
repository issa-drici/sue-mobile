// Types pour l'authentification
export interface LoginCredentials {
  email: string;
  password: string;
  device_name: string;
}

export interface RegisterData {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  device_name: string;
}

export interface AuthUser {
  id: string;
  lastname: string;
  email: string;
  phone?: string;
  role?: string;
  full_name?: string | null;
  avatar?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthData {
  token: string;
  user: AuthUser;
  refresh_token?: string;
}

export interface AuthResponse {
  success?: boolean;
  data?: AuthData;
  message?: string;
  // Pour Laravel, la réponse peut être directement {token, user}
  token?: string;
  user?: AuthUser;
  refresh_token?: string;
}

export interface RefreshTokenResponse {
  token: string;
  refresh_token?: string;
}

// --- Auth par téléphone + OTP ---

export interface PhoneAuthUser {
  id: string;
  phone: string;
  firstname: string;
  lastname: string;
  email?: string | null;
  role?: string;
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
}

export interface VerifyOtpResponse {
  isRegistered: boolean;
  message?: string;
  token?: string;
  user?: PhoneAuthUser;
}

export interface PhoneRegisterResponse {
  token: string;
  user: PhoneAuthUser;
} 