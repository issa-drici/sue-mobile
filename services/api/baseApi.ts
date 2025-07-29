import { ENV, buildApiUrl, isDevelopment, isMockMode } from '../../config/env';

// Types pour les réponses API
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  status: number;
}

// Callback pour la déconnexion automatique
type LogoutCallback = () => void;

// Service API principal
class BaseApiService {
  private baseURL: string;
  private token: string | null = null;
  private useMocks: boolean = isMockMode();
  private logoutCallback: LogoutCallback | null = null;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || ENV.API_BASE_URL;
  }

  // Configuration du callback de déconnexion
  setLogoutCallback(callback: LogoutCallback) {
    this.logoutCallback = callback;
  }

  // Configuration du token d'authentification
  setAuthToken(token: string) {
    this.token = token;
  }

  // Suppression du token
  clearAuthToken() {
    this.token = null;
  }

  // Activer/désactiver les mocks
  setUseMocks(useMocks: boolean) {
    this.useMocks = useMocks;
  }

  // Obtenir la configuration actuelle
  getConfig() {
    return {
      baseURL: this.baseURL,
      useMocks: this.useMocks,
      environment: ENV.ENVIRONMENT,
      isDevelopment: isDevelopment(),
    };
  }

  // Headers par défaut
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      ...ENV.DEFAULT_HEADERS,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Gestion des erreurs d'authentification
  private handleAuthError(status: number, errorMessage: string) {
    // Erreurs d'authentification (401 Unauthorized, 403 Forbidden)
    if (status === 401 || status === 403) {
      console.warn(`🔐 Erreur d'authentification (${status}): ${errorMessage}`);
      
      // Déclencher la déconnexion automatique
      if (this.logoutCallback) {
        console.log('🔄 Déconnexion automatique...');
        this.logoutCallback();
      } else {
        console.error('❌ Callback de déconnexion non configuré');
      }
    }
  }

  // Méthode générique pour les requêtes
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Si les mocks sont activés, simuler une réponse
    if (this.useMocks) {
      return this.mockRequest<T>(endpoint, options);
    }

    const url = buildApiUrl(endpoint);
    
    const config: RequestInit = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
      
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Extraire le message d'erreur de différentes structures possibles
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        } else if (errorData.error) {
          errorMessage = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        }
        
        console.error(`❌ API Error: ${response.status} - ${errorMessage}`);
        console.error('📋 Error data:', errorData);
        
        // Gérer les erreurs d'authentification
        this.handleAuthError(response.status, errorMessage);
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log(`✅ API Response: ${options.method || 'GET'} ${endpoint}`);
      return data;
    } catch (error: any) {
      console.error('API Request Error:', error);
      
      // Si c'est une erreur réseau ou autre, ne pas déclencher la déconnexion
      // Seules les erreurs 401/403 déclenchent la déconnexion
      throw error;
    }
  }

  // Simulation des requêtes avec mocks (gardé pour les tests)
  private async mockRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 500));

    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body as string) : {};

    console.log(`🎭 Mock Request: ${method} ${endpoint}`);

    // Mock pour l'authentification
    if (endpoint === '/register' && method === 'POST') {
      const { firstname, lastname, email, password } = body;
      
      if (!firstname || !lastname || !email || !password) {
        throw new Error('Tous les champs sont requis');
      }

      if (password.length < 6) {
        throw new Error('Le mot de passe doit contenir au moins 6 caractères');
      }

      // Simuler une réponse d'inscription réussie
      return {
        success: true,
        data: {
          token: 'mock-jwt-token-' + Date.now(),
          user: {
            id: '1',
            email: email,
            firstname: firstname,
            lastname: lastname,
            avatar: null
          }
        },
        message: 'Inscription réussie'
      } as T;
    }

    if (endpoint === '/login' && method === 'POST') {
      const { email, password } = body;
      
      if (!email || !password) {
        throw new Error('Email et mot de passe requis');
      }

      // Simuler une réponse de connexion réussie
      return {
        success: true,
        data: {
          token: 'mock-jwt-token-' + Date.now(),
          user: {
            id: '1',
            email: email,
            firstname: 'John',
            lastname: 'Doe',
            avatar: 'https://i.pravatar.cc/150?img=1'
          }
        },
        message: 'Connexion réussie'
      } as T;
    }

    if (endpoint === '/logout' && method === 'POST') {
      return {
        success: true,
        message: 'Déconnexion réussie'
      } as T;
    }

    if (endpoint === '/refresh' && method === 'POST') {
      return {
        success: true,
        data: {
          token: 'mock-jwt-token-refreshed-' + Date.now()
        },
        message: 'Token rafraîchi'
      } as T;
    }

    // Mock pour l'annulation de demande d'ami
    if (endpoint === '/users/friend-requests' && method === 'DELETE') {
      const { target_user_id } = body;
      
      if (!target_user_id) {
        throw new Error('L\'ID de l\'utilisateur cible est requis');
      }

      return {
        success: true,
        data: {
          requestId: 'mock-request-id-' + Date.now(),
          senderId: '1',
          receiverId: target_user_id,
          status: 'cancelled',
          cancelledAt: new Date().toISOString()
        },
        message: 'Demande d\'ami annulée avec succès'
      } as T;
    }

    // Pour les autres endpoints, retourner une erreur
    throw new Error(`Endpoint non implémenté en mode mock: ${endpoint}`);
  }

  // Méthodes HTTP
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string, data?: any): Promise<T> {
    const options: RequestInit = { method: 'DELETE' };
    if (data) {
      options.body = JSON.stringify(data);
    }
    return this.request<T>(endpoint, options);
  }

  async patch<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

// Instance singleton
export const baseApiService = new BaseApiService(); 