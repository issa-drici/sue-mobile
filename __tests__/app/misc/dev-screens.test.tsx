import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Alert, TextInput } from 'react-native';

import AtomsDemoScreen from '../../../app/atoms-demo';
import DebugScreen from '../../../app/debug';
import DevMenuScreen from '../../../app/dev-menu';
import { makeAuth, mockRouter, pressAlertButton, resetRouter, silenceConsole } from '../../../test-utils/screens';

jest.mock('expo-router', () => require('../../../test-utils/screens').expoRouterMock());
jest.mock('../../../components/DevOnly', () => ({ DevOnly: ({ children }: any) => children }));
jest.mock('../../../components/DebugConfig', () => {
  const { Text } = require('react-native');
  return { __esModule: true, default: () => <Text>debug-config</Text> };
});

const mockAuth = { current: {} as any };
jest.mock('../../../app/context/auth', () => ({ useAuth: () => mockAuth.current }));

const mockDev = { screens: [] as any[], push: {} as any };
jest.mock('../../../config/devScreens', () => ({ getDevScreens: () => mockDev.screens }));
jest.mock('../../../hooks/usePushNotifications', () => ({ usePushNotifications: () => mockDev.push }));

describe('Écrans de développement', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    silenceConsole();
    resetRouter();
    mockAuth.current = makeAuth();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockDev.screens = [{ name: 'atoms-demo', title: 'Atoms Demo', description: 'Showcase', route: '/atoms-demo' }];
    mockDev.push = {
      sendLocalNotification: jest.fn(() => Promise.resolve()),
      sendTestNotification: jest.fn(() => Promise.resolve(true)),
      isInitialized: true,
      token: 'ExponentPushToken[x]',
    };
  });
  afterEach(() => jest.restoreAllMocks());

  describe('DebugScreen', () => {
    it('affiche la configuration de debug', () => {
      render(<DebugScreen />);
      expect(screen.getByText('debug-config')).toBeTruthy();
    });
  });

  describe('DevMenuScreen', () => {
    it('liste les écrans de dev et ouvre une route', () => {
      render(<DevMenuScreen />);
      expect(screen.getByText('Atoms Demo')).toBeTruthy();
      expect(screen.getByText('Statut actuel: Terminé')).toBeTruthy();
      expect(screen.getByText('Push: ✅ Prêt | Token: ✅')).toBeTruthy();
      fireEvent.press(screen.getByText('Ouvrir'));
      expect(mockRouter.push).toHaveBeenCalledWith('/atoms-demo');
    });

    it("affiche l'état vide et les statuts négatifs", () => {
      mockDev.screens = [];
      mockAuth.current = makeAuth({ isOnboardingCompleted: false });
      mockDev.push = { ...mockDev.push, isInitialized: false, token: null };
      render(<DevMenuScreen />);
      expect(screen.getByText('Aucun écran de développement disponible')).toBeTruthy();
      expect(screen.getByText('Statut actuel: Non terminé')).toBeTruthy();
      expect(screen.getByText('Push: ❌ Non prêt | Token: ❌')).toBeTruthy();
    });

    it("réinitialise l'onboarding après confirmation", async () => {
      render(<DevMenuScreen />);
      // Le titre de la carte et le bouton portent le même libellé : le bouton est le dernier
      const matches = screen.getAllByText("Réinitialiser l'onboarding");
      fireEvent.press(matches[matches.length - 1]);
      await pressAlertButton(alertSpy, 'Réinitialiser');
      expect(mockAuth.current.resetOnboarding).toHaveBeenCalled();
      expect(mockRouter.replace).toHaveBeenCalledWith('/(onboarding)/welcome');
    });

    it('envoie une notification locale (succès puis échec)', async () => {
      render(<DevMenuScreen />);
      await act(async () => {
        fireEvent.press(screen.getByText('📱 Test Notification Locale (Simulateur)'));
      });
      expect(mockDev.push.sendLocalNotification).toHaveBeenCalledWith(expect.objectContaining({ title: '🔔 Test Notification Locale' }));
      expect(alertSpy).toHaveBeenLastCalledWith('Succès', 'Notification locale envoyée !');

      mockDev.push.sendLocalNotification.mockRejectedValueOnce(new Error('x'));
      await act(async () => {
        fireEvent.press(screen.getByText('📱 Test Notification Locale (Simulateur)'));
      });
      expect(alertSpy).toHaveBeenLastCalledWith('Erreur', "Impossible d'envoyer la notification locale");
    });

    it('envoie une notification push : succès, échec, erreur', async () => {
      render(<DevMenuScreen />);
      const press = async () =>
        act(async () => {
          fireEvent.press(screen.getByText('🚀 Test Notification Push (Backend)'));
        });
      await press();
      expect(mockDev.push.sendTestNotification).toHaveBeenCalledWith('u1');
      expect(alertSpy).toHaveBeenLastCalledWith('Succès', 'Notification push envoyée !');
      mockDev.push.sendTestNotification.mockResolvedValueOnce(false);
      await press();
      expect(alertSpy).toHaveBeenLastCalledWith('Échec', "Impossible d'envoyer la notification push");
      mockDev.push.sendTestNotification.mockRejectedValueOnce(new Error('x'));
      await press();
      expect(alertSpy).toHaveBeenLastCalledWith('Erreur', "Erreur lors de l'envoi de la notification push");
    });

    it("refuse le push quand il n'est pas initialisé", async () => {
      mockDev.push.isInitialized = false;
      render(<DevMenuScreen />);
      const { Button } = require('../../../components/atoms');
      const btn = screen.UNSAFE_getAllByType(Button).find((b: any) => b.props.title === '🚀 Test Notification Push (Backend)');
      await act(async () => {
        await btn.props.onPress();
      });
      expect(alertSpy).toHaveBeenCalledWith('Erreur', 'Notifications push non initialisées');
      expect(mockDev.push.sendTestNotification).not.toHaveBeenCalled();
    });

    it('réinitialise le flag contacts (succès puis échec)', async () => {
      const remove = jest.spyOn(AsyncStorage, 'removeItem');
      render(<DevMenuScreen />);
      await act(async () => {
        fireEvent.press(screen.getByText('Réinitialiser Flag Contacts'));
      });
      expect(remove).toHaveBeenCalledWith('contacts_permission_requested');
      expect(alertSpy).toHaveBeenLastCalledWith('Succès', expect.stringContaining('Flag réinitialisé'));

      remove.mockRejectedValueOnce(new Error('x'));
      await act(async () => {
        fireEvent.press(screen.getByText('Réinitialiser Flag Contacts'));
      });
      expect(alertSpy).toHaveBeenLastCalledWith('Erreur', 'Impossible de réinitialiser le flag');
    });
  });

  describe('AtomsDemoScreen', () => {
    it('affiche toutes les sections de démonstration', () => {
      render(<AtomsDemoScreen />);
      ['Buttons', 'Typography', 'Icons', 'Inputs', 'Avatars', 'Spinners'].forEach((t) => expect(screen.getByText(t)).toBeTruthy());
    });

    it('déclenche chaque bouton et met à jour les champs', () => {
      render(<AtomsDemoScreen />);
      const { Button } = require('../../../components/atoms');
      screen.UNSAFE_getAllByType(Button).forEach((b: any) => b.props.onPress?.());
      const inputs = screen.UNSAFE_getAllByType(TextInput);
      act(() => {
        inputs.forEach((i: any) => i.props.onChangeText?.('abc'));
      });
      expect(screen.getByPlaceholderText('Default input').props.value).toBe('abc');
      expect(screen.getByPlaceholderText('Password').props.value).toBe('abc');
    });

    it('bascule la visibilité du mot de passe', () => {
      render(<AtomsDemoScreen />);
      expect(screen.getByPlaceholderText('Password').props.secureTextEntry).toBe(true);
      const pwd = screen.UNSAFE_getAllByProps({ placeholder: 'Password' }).find((n: any) => n.props.onRightIconPress);
      act(() => pwd!.props.onRightIconPress());
      expect(screen.getByPlaceholderText('Password').props.secureTextEntry).toBe(false);
    });
  });
});
