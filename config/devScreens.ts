import { ENV } from './env';

export const DEV_SCREENS = {
  ATOMS_DEMO: 'atoms-demo',
  STORYBOOK: 'storybook',
  DEBUG_CONFIG: 'debug-config',
} as const;

export const isDevScreenAllowed = (screenName: string): boolean => {
  const isDev = __DEV__ && ENV.NODE_ENV === 'development';
  const allowedScreens = Object.values(DEV_SCREENS);
  
  return isDev && allowedScreens.includes(screenName as any);
};

export const getDevScreens = () => {
  const isDev = __DEV__ && ENV.NODE_ENV === 'development';
  
  if (!isDev) return [];
  
  return [
    {
      name: DEV_SCREENS.ATOMS_DEMO,
      title: 'Atoms Demo',
      description: 'Showcase de tous les composants atoms',
      route: '/atoms-demo',
    },
  ];
};
