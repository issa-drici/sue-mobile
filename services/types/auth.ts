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
  password: string;
  password_confirmation: string;
  device_name: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  role?: string;
  full_name?: string | null;
  avatar?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthData {
  token: string;
  user: AuthUser;
}

export interface AuthResponse {
  success?: boolean;
  data?: AuthData;
  message?: string;
  // Pour Laravel, la réponse peut être directement {token, user}
  token?: string;
  user?: AuthUser;
} 