import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { ENV } from '../../config/env';
import { AuthApi } from '../../services/api/authApi';
import { baseApiService } from '../../services/api/baseApi';
import { UsersApi } from '../../services/api/usersApi';
import { pushNotificationService } from '../../services/notifications/pushNotifications';
import { UpdateProfileData } from '../../services/types/users';
import { User } from '../../types/user';
import { formatAvatarUrl } from '../../utils';

function normalizeUser(userData: any): User {
  if (!userData) return {} as User;
  const rawAvatar = userData.avatar || userData.avatar_url || userData.avatarUrl || undefined;
  return {
    id: userData.id || '',
    firstname: userData.firstname || userData.first_name || '',
    lastname: userData.lastname || userData.last_name || '',
    email: userData.email,
    phone: userData.phone,
    avatar: formatAvatarUrl(rawAvatar) || undefined,
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOnboardingCompleted: boolean | null;
  isOnboardingLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (firstname: string, lastname: string, email: string, phone: string, password: string, password_confirmation: string) => Promise<void>;
  authenticateWithSession: (token: string, userData: User, refreshToken?: string) => Promise<void>;
  signOut: () => Promise<void>;
  forceSignOut: () => Promise<void>;
  checkTokenValidity: () => Promise<boolean>;
  refreshAuth: () => Promise<boolean>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  getAuthToken: () => Promise<string | null>;
  forgotPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: UpdateProfileData) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean | null>(null);
  const [isOnboardingLoading, setIsOnboardingLoading] = useState(true);

  const isAuthenticated = !!user;

  // Déconnexion forcée (nettoyage complet)
  const forceSignOut = async () => {
    try {
      // Supprimer le token push de la BDD avant déconnexion
      try {
        await pushNotificationService.unregisterTokenFromDatabase();
      } catch (error) {
        console.warn('⚠️ Erreur lors de la suppression du token push:', error);
      }

      // Nettoyer le stockage local
      await AsyncStorage.multiRemove(['user', 'authToken', 'refreshToken']);

      // Nettoyer le token de l'API
      baseApiService.clearAuthToken();

      // Réinitialiser l'état
      setUser(null);
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion forcée:', error);
    }
  };

  // Rafraîchir l'authentification
  const refreshAuth = async (): Promise<boolean> => {
    if (isRefreshing) return false;

    try {
      setIsRefreshing(true);

      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) {
        return false;
      }

      // Appeler l'API pour rafraîchir le token
      const response = await fetch(`${ENV.API_BASE_URL}/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${refreshToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const newToken = data.token || data.access_token;

        if (newToken) {
          // Sauvegarder le nouveau token
          await AsyncStorage.setItem('authToken', newToken);
          baseApiService.setAuthToken(newToken);

          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('❌ Erreur lors du rafraîchissement:', error);
      return false;
    } finally {
      setIsRefreshing(false);
    }
  };

  // Vérifier la validité du token
  const checkTokenValidity = async (): Promise<boolean> => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return false;
      }

      const response = await fetch(`${ENV.API_BASE_URL}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        return true;
      } else if (response.status === 401) {
        // Essayer de rafraîchir le token
        const refreshSuccess = await refreshAuth();
        if (refreshSuccess) {
          // Vérifier à nouveau avec le nouveau token
          return await checkTokenValidity();
        }

        // Si le refresh échoue, on ne déconnecte PAS automatiquement
        // L'utilisateur reste connecté avec l'ancien token
        return true;
      } else {
        // En cas d'erreur API, on ne déconnecte PAS automatiquement
        // L'utilisateur reste connecté
        return true;
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification du token:', error);

      // En cas d'erreur réseau, on ne déconnecte PAS automatiquement
      // L'utilisateur reste connecté
      return true;
    }
  };

  // Récupérer le token d'authentification
  const getAuthToken = async (): Promise<string | null> => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return token;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du token:', error);
      return null;
    }
  };

  // Fonctions d'onboarding
  const checkOnboardingStatus = async () => {
    try {
      const completed = await AsyncStorage.getItem('onboarding_completed');
      const isCompleted = completed === 'true';
      setIsOnboardingCompleted(isCompleted);
    } catch (error) {
      console.error('Erreur lors de la vérification du statut onboarding:', error);
      setIsOnboardingCompleted(false);
    } finally {
      setIsOnboardingLoading(false);
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('onboarding_completed', 'true');
      setIsOnboardingCompleted(true);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du statut onboarding:', error);
    }
  };

  const resetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem('onboarding_completed');
      setIsOnboardingCompleted(false);
    } catch (error) {
      console.error('Erreur lors de la réinitialisation de l\'onboarding:', error);
    }
  };

  // Charger l'utilisateur depuis le stockage au démarrage
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Réduire le délai pour une navigation plus fluide
        await new Promise(resolve => setTimeout(resolve, 50));

        // Charger le statut d'onboarding en premier
        await checkOnboardingStatus();

        const userData = await AsyncStorage.getItem('user');
        const token = await AsyncStorage.getItem('authToken');

        if (userData && token) {
          const parsedUser = JSON.parse(userData);
          const normalized = normalizeUser(parsedUser);
          setUser(normalized);
          baseApiService.setAuthToken(token);

          // Configurer le callback de déconnexion automatique
          baseApiService.setLogoutCallback(forceSignOut);

          // Synchroniser le profil utilisateur en arrière-plan
          refreshUser().catch(() => {});

          // Vérifier la validité du token en arrière-plan SANS déconnexion automatique
          await checkTokenValidity();
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement de l\'utilisateur:', error);
        // En cas d'erreur, on ne nettoie PAS automatiquement le stockage
        // L'utilisateur reste connecté

        // Essayer de récupérer les données malgré l'erreur
        try {
          const userData = await AsyncStorage.getItem('user');
          const token = await AsyncStorage.getItem('authToken');

          if (userData && token) {
            const parsedUser = JSON.parse(userData);
            const normalized = normalizeUser(parsedUser);
            setUser(normalized);
            baseApiService.setAuthToken(token);
          }
        } catch (recoveryError) {
          console.error('❌ Impossible de récupérer l\'utilisateur:', recoveryError);
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Connexion avec mock
  const signInWithMock = async (email: string, password: string, firstname?: string, lastname?: string) => {
    try {
      const mockUser: User = {
        id: '1',
        firstname: firstname || 'Utilisateur',
        lastname: lastname || 'Test',
        email: email,
      };

      const mockToken = 'mock-token-' + Date.now();
      const mockRefreshToken = 'mock-refresh-' + Date.now();

      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
      await AsyncStorage.setItem('authToken', mockToken);
      await AsyncStorage.setItem('refreshToken', mockRefreshToken);

      baseApiService.setAuthToken(mockToken);
      setUser(mockUser);

      // Vérifier et réinitialiser les permissions de notifications si nécessaire (mode mock)
      try {
        const permissionsGranted = await pushNotificationService.checkAndReinitializePermissions();
        if (permissionsGranted) {
          // Enregistrer le token push en BDD après connexion
          await pushNotificationService.registerTokenInDatabase();
        }
      } catch (error) {
        console.warn('⚠️ Erreur lors de l\'enregistrement du token push (mock):', error);
      }
    } catch {
      throw new Error('Erreur lors de la connexion mock');
    }
  };

  // Connexion
  const signIn = async (email: string, password: string) => {
    try {
      if (ENV.USE_MOCKS) {
        await signInWithMock(email, password);
        return;
      }

      // Ajouter le device_name requis par l'API
      const loginData = {
        email,
        password,
        device_name: 'Alarrache Mobile App'
      };

      const response = await AuthApi.login(loginData);

      // L'API retourne directement {token, user}
      const { token, user: userData, refresh_token } = response;

      if (!token || !userData) {
        throw new Error('Format de réponse invalide du serveur');
      }

      // Sauvegarder l'utilisateur
      const normalized = normalizeUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(normalized));
      setUser(normalized);

      // Sauvegarder les tokens
      await AsyncStorage.setItem('authToken', token);
      if (refresh_token) {
        await AsyncStorage.setItem('refreshToken', refresh_token);
      }

      // Configurer le token pour les requêtes API
      baseApiService.setAuthToken(token);

      // Vérifier et réinitialiser les permissions de notifications si nécessaire
      try {
        const permissionsGranted = await pushNotificationService.checkAndReinitializePermissions();
        if (permissionsGranted) {
          // Enregistrer le token push en BDD après connexion
          await pushNotificationService.registerTokenInDatabase();
        }
      } catch (error) {
        console.warn('⚠️ Erreur lors de l\'enregistrement du token push:', error);
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de la connexion:', error);
      throw new Error(error.message || 'Erreur lors de la connexion');
    }
  };

  // Inscription
  const signUp = async (firstname: string, lastname: string, email: string, phone: string, password: string, password_confirmation: string) => {
    try {
      if (ENV.USE_MOCKS) {
        await signInWithMock(email, password, firstname, lastname);
        return;
      }

      // Ajouter le device_name requis par l'API
      const registerData = {
        firstname,
        lastname,
        email,
        phone,
        password,
        password_confirmation,
        device_name: 'Alarrache Mobile App'
      };

      const response = await AuthApi.register(registerData);

      // L'API retourne directement {token, user}
      const { token, user: userData, refresh_token } = response;

      if (!token || !userData) {
        throw new Error('Format de réponse invalide du serveur');
      }

      // Sauvegarder l'utilisateur
      const normalized = normalizeUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(normalized));
      setUser(normalized);

      // Sauvegarder les tokens
      await AsyncStorage.setItem('authToken', token);
      if (refresh_token) {
        await AsyncStorage.setItem('refreshToken', refresh_token);
      }

      // Configurer le token pour les requêtes API
      baseApiService.setAuthToken(token);
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'inscription:', error);
      throw new Error(error.message || 'Erreur lors de l\'inscription');
    }
  };

  // Persister une session à partir d'un token + user déjà obtenus
  // (utilisé par l'auth par téléphone : verify / register renvoient directement {token, user})
  const authenticateWithSession = async (token: string, userData: User, refreshToken?: string) => {
    try {
      const normalized = normalizeUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(normalized));
      setUser(normalized);

      await AsyncStorage.setItem('authToken', token);
      if (refreshToken) {
        await AsyncStorage.setItem('refreshToken', refreshToken);
      }

      baseApiService.setAuthToken(token);

      // Enregistrer le token push (comme après une connexion classique)
      try {
        const permissionsGranted = await pushNotificationService.checkAndReinitializePermissions();
        if (permissionsGranted) {
          await pushNotificationService.registerTokenInDatabase();
        }
      } catch (error) {
        console.warn('⚠️ Erreur lors de l\'enregistrement du token push:', error);
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'ouverture de session:', error);
      throw new Error(error.message || 'Erreur lors de la connexion');
    }
  };

  // Déconnexion
  const signOut = async () => {
    try {
      // Supprimer le token push de la BDD AVANT de déconnecter l'utilisateur
      try {
        await pushNotificationService.unregisterTokenFromDatabase();
      } catch (error) {
        console.warn('⚠️ Erreur lors de la suppression du token push:', error);
      }

      if (!ENV.USE_MOCKS) {
        try {
          await AuthApi.logout();
        } catch (error) {
          console.warn('⚠️ Erreur lors de la déconnexion API, continuation...');
        }
      }

      // Nettoyer le stockage local
      await AsyncStorage.multiRemove(['user', 'authToken', 'refreshToken']);
      baseApiService.clearAuthToken();
      setUser(null);
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
      // Forcer la déconnexion même en cas d'erreur
      await forceSignOut();
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      if (ENV.USE_MOCKS) {
        // Mock success
        return;
      }
      await AuthApi.forgotPassword(email);
    } catch (error: any) {
      console.error('❌ Erreur forgot password:', error);
      throw new Error(error.message || 'Erreur lors de la demande de réinitialisation');
    }
  };

  // Mettre à jour le profil utilisateur
  const updateUserProfile = async (data: UpdateProfileData) => {
    try {
      setIsLoading(true);
      const updatedUser = await UsersApi.updateProfile(data);
      const normalized = normalizeUser(updatedUser);

      // Mettre à jour l'état local et le stockage
      setUser(normalized);
      await AsyncStorage.setItem('user', JSON.stringify(normalized));
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du profil:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Synchronise le profil depuis l'API
  const refreshUser = async () => {
    try {
      const profile = await UsersApi.getProfile();
      const normalized = normalizeUser(profile);
      setUser(normalized);
      await AsyncStorage.setItem('user', JSON.stringify(normalized));
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation de l\'utilisateur:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    isOnboardingCompleted,
    isOnboardingLoading,
    signIn,
    signUp,
    authenticateWithSession,
    signOut,
    forceSignOut,
    checkTokenValidity,
    refreshAuth,
    completeOnboarding,
    resetOnboarding,
    getAuthToken,
    forgotPassword,
    updateUserProfile,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Export par défaut pour corriger le warning
export default AuthProvider; 