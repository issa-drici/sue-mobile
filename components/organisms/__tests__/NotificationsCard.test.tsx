import React from 'react';
import { AppState, Linking } from 'react-native';

jest.mock('@expo/vector-icons', () => require('../../__testutils__/vectorIconsMock'));
jest.mock('@react-navigation/native', () => {
  const R = require('react');
  return { useFocusEffect: (cb: () => void) => R.useEffect(cb, [cb]) };
});
const mockService = {
  getAccess: jest.fn(),
  activateFromPrompt: jest.fn(),
  markSoftPromptHandled: jest.fn(),
};
jest.mock('../../../services/notifications/pushNotifications', () => ({
  get pushNotificationService() {
    return mockService;
  },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { NotificationsCard } from '../NotificationsCard';

const KEY = 'notif_home_card_dismissed_at';

const renderAndWait = async () => {
  const utils = render(<NotificationsCard />);
  await act(async () => {});
  return utils;
};

describe('NotificationsCard', () => {
  let appStateHandler: (s: string) => void;
  const remove = jest.fn();

  beforeEach(async () => {
    await AsyncStorage.clear();
    mockService.getAccess.mockReset().mockResolvedValue('provisional');
    mockService.activateFromPrompt.mockReset().mockResolvedValue(true);
    mockService.markSoftPromptHandled.mockReset().mockResolvedValue(undefined);
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_e: any, h: any) => {
      appStateHandler = h;
      return { remove } as any;
    });
    jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined as any);
  });
  afterEach(() => jest.restoreAllMocks());

  it('masquée si accès complet', async () => {
    mockService.getAccess.mockResolvedValue('full');
    const { toJSON } = await renderAndWait();
    expect(toJSON()).toBeNull();
  });

  it('masquée si fermée il y a moins de 5 jours', async () => {
    await AsyncStorage.setItem(KEY, String(Date.now() - 86_400_000));
    const { toJSON } = await renderAndWait();
    expect(toJSON()).toBeNull();
  });

  it('réaffichée après 5 jours', async () => {
    await AsyncStorage.setItem(KEY, String(Date.now() - 6 * 86_400_000));
    await renderAndWait();
    expect(screen.getByText('Ne rate plus aucune session')).toBeOnTheScreen();
  });

  it('erreur de lecture du stockage ignorée', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('x'));
    await renderAndWait();
    expect(screen.getByText('Activer les notifications')).toBeOnTheScreen();
  });

  it('activer : demande la permission, haptique succès, puis rafraîchit', async () => {
    await renderAndWait();
    mockService.getAccess.mockResolvedValue('full');
    await act(async () => {
      fireEvent.press(screen.getByText('Activer les notifications'));
    });
    expect(Haptics.impactAsync).toHaveBeenCalledWith('medium');
    expect(mockService.activateFromPrompt).toHaveBeenCalled();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
    expect(mockService.markSoftPromptHandled).toHaveBeenCalled();
    expect(screen.toJSON()).toBeNull();
  });

  it('activer refusé : haptique avertissement, spinner pendant la demande', async () => {
    let resolve: (v: boolean) => void = () => {};
    mockService.activateFromPrompt.mockReturnValue(new Promise((r) => (resolve = r)));
    await renderAndWait();
    fireEvent.press(screen.getByText('Activer les notifications'));
    expect(screen.queryByText('Activer les notifications')).toBeNull();
    await act(async () => resolve(false));
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('warning');
    expect(screen.getByText('Activer les notifications')).toBeOnTheScreen();
  });

  it('refusées : ouvre les Réglages', async () => {
    mockService.getAccess.mockResolvedValue('denied');
    await renderAndWait();
    expect(screen.getByText('Tu rates tes rappels')).toBeOnTheScreen();
    fireEvent.press(screen.getByText('Ouvrir les Réglages'));
    expect(Linking.openSettings).toHaveBeenCalled();
    expect(mockService.activateFromPrompt).not.toHaveBeenCalled();
  });

  it('masquer : enregistre la date et cache la carte', async () => {
    await renderAndWait();
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Masquer'));
    });
    expect(Haptics.selectionAsync).toHaveBeenCalled();
    expect(screen.toJSON()).toBeNull();
    expect(Number(await AsyncStorage.getItem(KEY))).toBeGreaterThan(0);
  });

  it('masquer : erreur d’écriture ignorée', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('x'));
    await renderAndWait();
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Masquer'));
    });
    expect(screen.toJSON()).toBeNull();
  });

  it('rafraîchit au retour au premier plan et se désabonne', async () => {
    const { unmount } = await renderAndWait();
    expect(mockService.getAccess).toHaveBeenCalledTimes(1);
    await act(async () => appStateHandler('background'));
    expect(mockService.getAccess).toHaveBeenCalledTimes(1);
    await act(async () => appStateHandler('active'));
    expect(mockService.getAccess).toHaveBeenCalledTimes(2);
    unmount();
    expect(remove).toHaveBeenCalled();
  });
});
