import { ENV } from '../config/env';

export const useDevMode = () => {
  const isDev = __DEV__ && ENV.NODE_ENV === 'development';
  
  return {
    isDev,
    isProduction: !isDev,
  };
};
