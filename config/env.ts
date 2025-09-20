// Configuration des environnements
export const ENV = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || (process.env.NODE_ENV === 'production' ? 'https://api.sue.alliance-tech.fr/api' : 'http://api.sue.alliance-tech.fr/api'),
  WEBSOCKET_URL: process.env.EXPO_PUBLIC_WEBSOCKET_URL || (process.env.NODE_ENV === 'production' ? 'wss://websocket.sue.alliance-tech.fr' : 'ws://localhost:6001'),
  
  // Configuration Soketi/Pusher
  PUSHER_APP_ID: process.env.EXPO_PUBLIC_PUSHER_APP_ID || 'w4U6jzpva3qsixtl',
  PUSHER_APP_KEY: process.env.EXPO_PUBLIC_PUSHER_APP_KEY || 'alarrache_app_key_2025_14f8f659',
  PUSHER_HOST: process.env.EXPO_PUBLIC_PUSHER_HOST || 'websocket.sue.alliance-tech.fr',
  PUSHER_PORT: process.env.EXPO_PUBLIC_PUSHER_PORT || '443',
  PUSHER_SCHEME: process.env.EXPO_PUBLIC_PUSHER_SCHEME || (process.env.NODE_ENV === 'production' ? 'https' : 'http'),
  IS_DEV: process.env.NODE_ENV === 'development',
  USE_MOCKS: false, // Forcer la désactivation des mocks
  SERVER_HOST: process.env.EXPO_PUBLIC_SERVER_HOST || 'localhost',
  SERVER_PORT: process.env.EXPO_PUBLIC_SERVER_PORT || '8000',
  API_VERSION: process.env.EXPO_PUBLIC_API_VERSION || 'v1',
  APP_NAME: process.env.EXPO_PUBLIC_APP_NAME || 'Sue',
  APP_VERSION: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
  REQUEST_TIMEOUT: parseInt(process.env.EXPO_PUBLIC_REQUEST_TIMEOUT || '10000'),
  MAX_RETRIES: parseInt(process.env.EXPO_PUBLIC_MAX_RETRIES || '3'),
  ENVIRONMENT: process.env.NODE_ENV || 'development',
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
} as const;

// Configuration spécifique à l'environnement
export const getApiConfig = () => {
  if (ENV.IS_DEV) {
    return {
      baseURL: ENV.API_BASE_URL,
      timeout: ENV.REQUEST_TIMEOUT,
      retries: ENV.MAX_RETRIES,
      useMocks: ENV.USE_MOCKS,
      environment: ENV.ENVIRONMENT,
    };
  }
  
  // Configuration de production - FORCER HTTPS
  const productionBaseURL = ENV.API_BASE_URL.replace('http://', 'https://');
  return {
    baseURL: productionBaseURL,
    timeout: ENV.REQUEST_TIMEOUT,
    retries: ENV.MAX_RETRIES,
    useMocks: false, // Toujours false en production
    environment: 'production',
  };
};

// Fonction utilitaire pour construire l'URL complète
export const buildApiUrl = (endpoint: string): string => {
  let baseURL = ENV.API_BASE_URL;
  
  // En production, forcer HTTPS
  if (process.env.NODE_ENV === 'production') {
    baseURL = baseURL.replace('http://', 'https://');
  }
  
  return `${baseURL}${endpoint}`;
};

// Fonction utilitaire pour vérifier si on est en mode développement
export const isDevelopment = (): boolean => {
  return ENV.ENVIRONMENT === 'development' || ENV.IS_DEV;
};

// Fonction utilitaire pour vérifier si les mocks sont activés
export const isMockMode = (): boolean => {
  return ENV.USE_MOCKS && isDevelopment();
};
