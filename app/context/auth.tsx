import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { ENV } from '../../config/env';
import { AuthApi } from '../../services/api/authApi';
import { baseApiService } from '../../services/api/baseApi';
import { User } from '../../types/user';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (firstname: string, lastname: string, email: string, password: string, password_confirmation: string) => Promise<void>;
  signOut: () => Promise<void>;
  forceSignOut: () => Promise<void>;
  checkTokenValidity: () => Promise<boolean>;
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

  const isAuthenticated = !!user;

  // Déconnexion forcée (nettoyage complet)
  const forceSignOut = async () => {
    try {
      // Nettoyer le stockage local
      await AsyncStorage.multiRemove(['user', 'authToken']);
      
      // Nettoyer le token de l'API
      baseApiService.setAuthToken(null);
      
      // Réinitialiser l'état
      setUser(null);
    } catch (error) {
      // Gestion silencieuse des erreurs
    }
  };

  // Vérifier la validité du token
  const checkTokenValidity = async (): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:8000/api/profile', {
        headers: {
          'Authorization': `Bearer ${await AsyncStorage.getItem('authToken')}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  };

  // Charger l'utilisateur depuis le stockage au démarrage
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);

          // Vérifier si le token existe
          const token = await AsyncStorage.getItem('authToken');
          if (token) {
            baseApiService.setAuthToken(token);
            
            // Vérifier la validité du token en arrière-plan
            checkTokenValidity().then(isValid => {
              if (!isValid) {
                forceSignOut();
              }
            });
          } else {
            // Pas de token, nettoyer l'utilisateur
            setUser(null);
          }
        }
      } catch (error) {
        // En cas d'erreur, nettoyer le stockage
        await AsyncStorage.multiRemove(['user', 'authToken']);
        setUser(null);
      } finally {
        setIsLoading(false);
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

      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
      await AsyncStorage.setItem('authToken', 'mock-token');
      baseApiService.setAuthToken('mock-token');
      setUser(mockUser);
    } catch (error) {
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

      const response = await AuthApi.login(email, password);
      const userResponse = response.data;

      // Sauvegarder l'utilisateur
      await AsyncStorage.setItem('user', JSON.stringify(userResponse));
      setUser(userResponse);

      // Configurer le token pour les requêtes API
      if (userResponse.token) {
        await AsyncStorage.setItem('authToken', userResponse.token);
        baseApiService.setAuthToken(userResponse.token);
      }
    } catch (error: any) {
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

      const response = await AuthApi.register(firstname, lastname, email, password, password_confirmation);
      const userResponse = response.data;

      // Sauvegarder l'utilisateur
      await AsyncStorage.setItem('user', JSON.stringify(userResponse));
      setUser(userResponse);

      // Configurer le token pour les requêtes API
      if (userResponse.token) {
        await AsyncStorage.setItem('authToken', userResponse.token);
        baseApiService.setAuthToken(userResponse.token);
      }
    } catch (error: any) {
      throw new Error(error.message || 'Erreur lors de l\'inscription');
    }
  };

  // Déconnexion
  const signOut = async () => {
    try {
      if (!ENV.USE_MOCKS) {
        try {
          await AuthApi.logout();
        } catch (error) {
          // Ignorer les erreurs de déconnexion API
        }
      }

      // Nettoyer le stockage local
      await AsyncStorage.multiRemove(['user', 'authToken']);
      baseApiService.setAuthToken(null);
      setUser(null);
    } catch (error) {
      // Gestion silencieuse des erreurs
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
    forceSignOut,
    checkTokenValidity,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 