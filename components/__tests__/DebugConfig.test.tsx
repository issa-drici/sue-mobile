import React from 'react';
import { Alert } from 'react-native';

const mockEnv: any = { IS_DEV: true, API_BASE_URL: 'http://api.test', ENVIRONMENT: 'test', USE_MOCKS: false };
jest.mock('../../config/env', () => ({
  get ENV() {
    return mockEnv;
  },
}));
const mockAuth = {
  user: { id: 'u1', firstname: 'Issa', lastname: 'D', email: 'i@d.fr' } as any,
  isAuthenticated: true,
  signOut: jest.fn(),
  checkTokenValidity: jest.fn(),
  refreshAuth: jest.fn(),
};
jest.mock('../../app/context/auth', () => ({ useAuth: () => mockAuth }));
const mockPush = {
  token: null as string | null,
  initialize: jest.fn(),
  isInitializing: false,
  isInitialized: false,
  sendTestNotification: jest.fn(),
  sendLocalNotification: jest.fn(),
};
jest.mock('../../hooks/usePushNotifications', () => ({ usePushNotifications: () => mockPush }));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import DebugConfig from '../DebugConfig';

const renderAndWait = async () => {
  const u = render(<DebugConfig />);
  await act(async () => {});
  return u;
};

describe('DebugConfig', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    mockEnv.IS_DEV = true;
    mockEnv.USE_MOCKS = false;
    mockAuth.user = { id: 'u1', firstname: 'Issa', lastname: 'D', email: 'i@d.fr' };
    mockAuth.isAuthenticated = true;
    mockAuth.checkTokenValidity.mockReset();
    mockAuth.refreshAuth.mockReset();
    mockAuth.signOut.mockReset();
    Object.assign(mockPush, { token: null, isInitializing: false, isInitialized: false });
    mockPush.sendTestNotification.mockReset();
    mockPush.sendLocalNotification.mockReset().mockResolvedValue(undefined);
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('ne rend rien hors développement', async () => {
    mockEnv.IS_DEV = false;
    const { toJSON } = await renderAndWait();
    expect(toJSON()).toBeNull();
  });

  it('affiche l’état d’authentification et un stockage vide', async () => {
    await renderAndWait();
    expect(screen.getByText('Connecté: ✅ Oui')).toBeOnTheScreen();
    expect(screen.getByText('ID: u1')).toBeOnTheScreen();
    expect(screen.getByText('Nom: Issa D')).toBeOnTheScreen();
    expect(screen.getByText('Email: i@d.fr')).toBeOnTheScreen();
    expect(screen.getByText('Utilisateur: ❌ Absent')).toBeOnTheScreen();
    expect(screen.getByText('Token: ❌ Absent')).toBeOnTheScreen();
    expect(screen.getByText('Refresh Token: ❌ Absent')).toBeOnTheScreen();
    expect(screen.getByText('API URL: http://api.test')).toBeOnTheScreen();
    expect(screen.getByText('Mocks activés: ❌ Non')).toBeOnTheScreen();
    expect(screen.getByText('Push prêt: ❌ Non')).toBeOnTheScreen();
    expect(screen.getByText('Expo Push Token: ❌ Indisponible')).toBeOnTheScreen();
  });

  it('déconnecté, push prêt, mocks activés', async () => {
    mockAuth.user = null;
    mockAuth.isAuthenticated = false;
    mockEnv.USE_MOCKS = true;
    Object.assign(mockPush, { token: 'ExponentPushToken[abc]', isInitializing: true, isInitialized: true });
    await renderAndWait();
    expect(screen.getByText('Connecté: ❌ Non')).toBeOnTheScreen();
    expect(screen.queryByText(/^ID:/)).toBeNull();
    expect(screen.getByText('Mocks activés: ✅ Oui')).toBeOnTheScreen();
    expect(screen.getByText('Initialisation push…')).toBeOnTheScreen();
    expect(screen.getByText('Expo Push Token: ExponentPushToken[abc]')).toBeOnTheScreen();
    fireEvent.press(screen.getByText('Envoyer notification push (backend)'));
    expect(mockPush.sendTestNotification).toHaveBeenCalledWith(undefined);
  });

  it('données de stockage tronquées', async () => {
    await AsyncStorage.setItem('user', JSON.stringify({ id: 1 }));
    await AsyncStorage.setItem('authToken', 'a'.repeat(30));
    await AsyncStorage.setItem('refreshToken', 'b'.repeat(30));
    await renderAndWait();
    expect(screen.getByText('Utilisateur: ✅ Présent')).toBeOnTheScreen();
    expect(screen.getByText(`Token: ${'a'.repeat(20)}...`)).toBeOnTheScreen();
    expect(screen.getByText(`Refresh Token: ${'b'.repeat(20)}...`)).toBeOnTheScreen();
  });

  it('erreur de lecture du stockage journalisée', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('x'));
    await renderAndWait();
    expect(console.error).toHaveBeenCalled();
  });

  it('test de validité du token : valide, invalide, erreur', async () => {
    await renderAndWait();
    expect(screen.getByText('État: Non vérifié')).toBeOnTheScreen();
    mockAuth.checkTokenValidity.mockResolvedValueOnce(true).mockResolvedValueOnce(false).mockRejectedValueOnce(new Error('x'));
    const btn = () => screen.getByText('Tester la validité du token');
    await act(async () => fireEvent.press(btn()));
    expect(screen.getByText('État: ✅ Valide')).toBeOnTheScreen();
    await act(async () => fireEvent.press(btn()));
    expect(screen.getByText('État: ❌ Invalide')).toBeOnTheScreen();
    await act(async () => fireEvent.press(btn()));
    expect(screen.getByText('État: ❌ Erreur')).toBeOnTheScreen();
  });

  it('rafraîchir le token : succès, échec, erreur', async () => {
    await renderAndWait();
    mockAuth.refreshAuth.mockResolvedValueOnce(true).mockResolvedValueOnce(false).mockRejectedValueOnce(new Error('x'));
    const btn = () => screen.getByText('Rafraîchir le token');
    await act(async () => fireEvent.press(btn()));
    expect(Alert.alert).toHaveBeenLastCalledWith('Succès', 'Token rafraîchi avec succès !');
    await act(async () => fireEvent.press(btn()));
    expect(Alert.alert).toHaveBeenLastCalledWith('Échec', 'Impossible de rafraîchir le token');
    await act(async () => fireEvent.press(btn()));
    expect(Alert.alert).toHaveBeenLastCalledWith('Erreur', 'Erreur lors du rafraîchissement du token');
  });

  it('notification locale : succès et erreur', async () => {
    await renderAndWait();
    const btn = () => screen.getByText('📱 Test Notification Locale (Simulateur)');
    await act(async () => fireEvent.press(btn()));
    expect(mockPush.sendLocalNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: '🔔 Test Notification Locale', data: expect.objectContaining({ type: 'test' }) })
    );
    expect(Alert.alert).toHaveBeenLastCalledWith('Succès', 'Notification locale envoyée !');
    mockPush.sendLocalNotification.mockRejectedValueOnce(new Error('x'));
    await act(async () => fireEvent.press(btn()));
    expect(Alert.alert).toHaveBeenLastCalledWith('Erreur', "Impossible d'envoyer la notification locale");
  });

  it('nettoyer le stockage : succès et erreur ; recharger ; push ; déconnexion', async () => {
    await AsyncStorage.setItem('authToken', 'tok');
    await renderAndWait();
    await act(async () => fireEvent.press(screen.getByText('Nettoyer le stockage')));
    expect(Alert.alert).toHaveBeenLastCalledWith('Succès', 'Stockage nettoyé !');
    expect(await AsyncStorage.getItem('authToken')).toBeNull();
    jest.spyOn(AsyncStorage, 'multiRemove').mockRejectedValueOnce(new Error('x'));
    await act(async () => fireEvent.press(screen.getByText('Nettoyer le stockage')));
    expect(Alert.alert).toHaveBeenLastCalledWith('Erreur', 'Impossible de nettoyer le stockage');
    await act(async () => fireEvent.press(screen.getByText('Recharger les données')));
    fireEvent.press(screen.getByText('Initialiser notifications push'));
    expect(mockPush.initialize).toHaveBeenCalled();
    fireEvent.press(screen.getByText('Se déconnecter'));
    expect(mockAuth.signOut).toHaveBeenCalled();
  });

  it('bouton push backend désactivé tant que non prêt', async () => {
    await renderAndWait();
    fireEvent.press(screen.getByText('Envoyer notification push (backend)'));
    expect(mockPush.sendTestNotification).not.toHaveBeenCalled();
  });
});
