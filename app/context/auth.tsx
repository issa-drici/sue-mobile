import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { ENV } from '../../config/env';
import { AuthApi } from '../../services/api/authApi';
import { baseApiService } from '../../services/api/baseApi';
import { pushNotificationService } from '../../services/notifications/pushNotifications';
import { User } from '../../types/user';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOnboardingCompleted: boolean | null;
  isOnboardingLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (firstname: string, lastname: string, email: string, password: string, password_confirmation: string) => Promise<void>;
  signOut: () => Promise<void>;
  forceSignOut: () => Promise<void>;
  checkTokenValidity: () => Promise<boolean>;
  refreshAuth: () => Promise<boolean>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  getAuthToken: () => Promise<string | null>;
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
      console.log('🔄 Déconnexion forcée en cours...');

      // Supprimer le token push de la BDD avant déconnexion
      try {
        await pushNotificationService.unregisterTokenFromDatabase();
        console.log('✅ Token push supprimé de la BDD avant déconnexion');
      } catch (error) {
        console.warn('⚠️ Erreur lors de la suppression du token push:', error);
      }

      // Nettoyer le stockage local
      await AsyncStorage.multiRemove(['user', 'authToken', 'refreshToken']);

      // Nettoyer le token de l'API
      baseApiService.clearAuthToken();

      // Réinitialiser l'état
      setUser(null);

      console.log('✅ Déconnexion forcée terminée');
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion forcée:', error);
    }
  };

  // Rafraîchir l'authentification
  const refreshAuth = async (): Promise<boolean> => {
    if (isRefreshing) return false;

    try {
      setIsRefreshing(true);
      console.log('🔄 Tentative de rafraîchissement de l\'authentification...');

      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) {
        console.log('❌ Pas de refresh token disponible');
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

          console.log('✅ Token rafraîchi avec succès');
          return true;
        }
      }

      console.log('❌ Échec du rafraîchissement du token');
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
        console.log('❌ Aucun token disponible');
        return false;
      }

      console.log('🔍 Vérification de la validité du token...');

      const response = await fetch(`${ENV.API_BASE_URL}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        console.log('✅ Token valide');
        return true;
      } else if (response.status === 401) {
        console.log('⚠️ Token expiré, tentative de rafraîchissement...');

        // Essayer de rafraîchir le token
        const refreshSuccess = await refreshAuth();
        if (refreshSuccess) {
          // Vérifier à nouveau avec le nouveau token
          return await checkTokenValidity();
        }

        // Si le refresh échoue, on ne déconnecte PAS automatiquement
        // L'utilisateur reste connecté avec l'ancien token
        console.log('⚠️ Échec du refresh, mais l\'utilisateur reste connecté');
        return true;
      } else {
        console.log(`❌ Erreur API: ${response.status}`);
        // En cas d'erreur API, on ne déconnecte PAS automatiquement
        // L'utilisateur reste connecté
        return true;
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification du token:', error);

      // En cas d'erreur réseau, on ne déconnecte PAS automatiquement
      // L'utilisateur reste connecté
      console.log('🌐 Erreur réseau détectée, mais l\'utilisateur reste connecté');
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
        console.log('🚀 Chargement de l\'utilisateur depuis le stockage...');

        // Réduire le délai pour une navigation plus fluide
        await new Promise(resolve => setTimeout(resolve, 50));

        // Charger le statut d'onboarding en premier
        await checkOnboardingStatus();

        const userData = await AsyncStorage.getItem('user');
        const token = await AsyncStorage.getItem('authToken');

        if (userData && token) {
          console.log('📱 Utilisateur et token trouvés dans le stockage');

          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          baseApiService.setAuthToken(token);

          // Configurer le callback de déconnexion automatique
          baseApiService.setLogoutCallback(forceSignOut);

          // Vérifier la validité du token en arrière-plan SANS déconnexion automatique
          console.log('🔍 Vérification de la validité du token (sans déconnexion automatique)...');
          const isValid = await checkTokenValidity();

          if (isValid) {
            console.log('✅ Utilisateur connecté avec succès');
          } else {
            console.log('⚠️ Token potentiellement invalide, mais l\'utilisateur reste connecté');
            // L'utilisateur reste connecté même si le token est invalide
          }
        } else {
          console.log('📱 Aucune donnée d\'authentification trouvée');
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement de l\'utilisateur:', error);
        // En cas d'erreur, on ne nettoie PAS automatiquement le stockage
        // L'utilisateur reste connecté
        console.log('⚠️ Erreur lors du chargement, mais l\'utilisateur reste connecté');

        // Essayer de récupérer les données malgré l'erreur
        try {
          const userData = await AsyncStorage.getItem('user');
          const token = await AsyncStorage.getItem('authToken');

          if (userData && token) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            baseApiService.setAuthToken(token);
            console.log('✅ Utilisateur récupéré malgré l\'erreur');
          }
        } catch (recoveryError) {
          console.error('❌ Impossible de récupérer l\'utilisateur:', recoveryError);
          setUser(null);
        }
      } finally {
        setIsLoading(false);
        console.log('🏁 Chargement terminé');
      }
    };

    loadUser();
  }, []);

  // Connexion avec mock
  const signInWithMock = async (email: string, password: string) => {
    try {
      const mockUser: User = {
        id: '1',
        firstname: 'Utilisateur',
        lastname: 'Test',
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
          console.log('✅ Token push enregistré en BDD après connexion (mock)');
        } else {
          console.log('ℹ️ Permissions de notifications non accordées, pas d\'enregistrement de token (mock)');
        }
      } catch (error) {
        console.warn('⚠️ Erreur lors de l\'enregistrement du token push (mock):', error);
      }

      console.log('✅ Connexion mock réussie');
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

      console.log('🔐 Tentative de connexion...');

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

      console.log('✅ Connexion réussie, sauvegarde des données...');

      // Sauvegarder l'utilisateur
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

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
          console.log('✅ Token push enregistré en BDD après connexion');
        } else {
          console.log('ℹ️ Permissions de notifications non accordées, pas d\'enregistrement de token');
        }
      } catch (error) {
        console.warn('⚠️ Erreur lors de l\'enregistrement du token push:', error);
      }

      console.log('✅ Données d\'authentification sauvegardées');
    } catch (error: any) {
      console.error('❌ Erreur lors de la connexion:', error);
      throw new Error(error.message || 'Erreur lors de la connexion');
    }
  };

  // Inscription
  const signUp = async (firstname: string, lastname: string, email: string, password: string, password_confirmation: string) => {
    try {
      if (ENV.USE_MOCKS) {
        await signInWithMock(email, password);
        return;
      }

      console.log('📝 Tentative d\'inscription...');

      // Ajouter le device_name requis par l'API
      const registerData = {
        firstname,
        lastname,
        email,
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

      console.log('✅ Inscription réussie, sauvegarde des données...');

      // Sauvegarder l'utilisateur
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      // Sauvegarder les tokens
      await AsyncStorage.setItem('authToken', token);
      if (refresh_token) {
        await AsyncStorage.setItem('refreshToken', refresh_token);
      }

      // Configurer le token pour les requêtes API
      baseApiService.setAuthToken(token);

      console.log('✅ Données d\'authentification sauvegardées');
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'inscription:', error);
      throw new Error(error.message || 'Erreur lors de l\'inscription');
    }
  };

  // Déconnexion
  const signOut = async () => {
    try {
      console.log('🚪 Déconnexion en cours...');

      // Supprimer le token push de la BDD AVANT de déconnecter l'utilisateur
      try {
        await pushNotificationService.unregisterTokenFromDatabase();
        console.log('✅ Token push supprimé de la BDD avant déconnexion');
      } catch (error) {
        console.warn('⚠️ Erreur lors de la suppression du token push:', error);
      }

      if (!ENV.USE_MOCKS) {
        try {
          await AuthApi.logout();
          console.log('✅ Déconnexion API réussie');
        } catch (error) {
          console.warn('⚠️ Erreur lors de la déconnexion API, continuation...');
        }
      }

      // Nettoyer le stockage local
      await AsyncStorage.multiRemove(['user', 'authToken', 'refreshToken']);
      baseApiService.clearAuthToken();
      setUser(null);

      console.log('✅ Déconnexion terminée');
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
      // Forcer la déconnexion même en cas d'erreur
      await forceSignOut();
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
    signOut,
    forceSignOut,
    checkTokenValidity,
    refreshAuth,
    completeOnboarding,
    resetOnboarding,
    getAuthToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Export par défaut pour corriger le warning
export default AuthProvider; 