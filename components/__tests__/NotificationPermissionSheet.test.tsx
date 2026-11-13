import React from 'react';
import { Animated, Modal, Pressable } from 'react-native';

jest.mock('@expo/vector-icons', () => require('../__testutils__/vectorIconsMock'));
const mockService = { activateFromPrompt: jest.fn(), markSoftPromptHandled: jest.fn() };
jest.mock('../../services/notifications/pushNotifications', () => ({
  get pushNotificationService() {
    return mockService;
  },
}));

import * as Haptics from 'expo-haptics';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import NotificationPermissionSheet from '../NotificationPermissionSheet';

describe('NotificationPermissionSheet', () => {
  let spring: jest.SpyInstance;
  beforeEach(() => {
    mockService.activateFromPrompt.mockReset().mockResolvedValue(true);
    mockService.markSoftPromptHandled.mockReset().mockResolvedValue(undefined);
    spring = jest.spyOn(Animated, 'spring').mockReturnValue({ start: jest.fn(), stop: jest.fn(), reset: jest.fn() } as any);
  });
  afterEach(() => jest.restoreAllMocks());

  it('masquée quand visible=false', () => {
    render(<NotificationPermissionSheet visible={false} onDismiss={jest.fn()} />);
    expect(screen.queryByText('Activer les notifications')).toBeNull();
    expect(spring).not.toHaveBeenCalled();
  });

  it('variante participant par défaut, animation à l’ouverture', () => {
    render(<NotificationPermissionSheet visible onDismiss={jest.fn()} />);
    expect(screen.getByText('Tu participes à cette session.')).toBeOnTheScreen();
    expect(screen.getByText("Changement d'heure")).toBeOnTheScreen();
    expect(screen.getByText('Annulation')).toBeOnTheScreen();
    expect(spring).toHaveBeenCalled();
  });

  it('variante organisateur', () => {
    render(<NotificationPermissionSheet visible variant="organizer" onDismiss={jest.fn()} />);
    expect(screen.getByText('Ta session est créée.')).toBeOnTheScreen();
    expect(screen.getByText('Nouveaux joueurs')).toBeOnTheScreen();
    expect(screen.getByText('Désistements')).toBeOnTheScreen();
    expect(screen.getByText('Nouveaux messages')).toBeOnTheScreen();
  });

  it('variante disponibilités', () => {
    render(<NotificationPermissionSheet visible variant="availability" onDismiss={jest.fn()} />);
    expect(screen.getByText('Tes dispos sont envoyées.')).toBeOnTheScreen();
    expect(screen.getByText('Créneau confirmé')).toBeOnTheScreen();
    expect(screen.getByText('Changement de lieu')).toBeOnTheScreen();
  });

  it('Activer : demande native, marque traité, ferme', async () => {
    const onDismiss = jest.fn();
    render(<NotificationPermissionSheet visible onDismiss={onDismiss} />);
    await act(async () => {
      fireEvent.press(screen.getByText('Activer les notifications'));
    });
    expect(Haptics.impactAsync).toHaveBeenCalledWith('medium');
    expect(mockService.activateFromPrompt).toHaveBeenCalled();
    expect(mockService.markSoftPromptHandled).toHaveBeenCalled();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('Activer : erreur silencieuse, ferme quand même', async () => {
    mockService.activateFromPrompt.mockRejectedValue(new Error('x'));
    const onDismiss = jest.fn();
    render(<NotificationPermissionSheet visible onDismiss={onDismiss} />);
    await act(async () => {
      fireEvent.press(screen.getByText('Activer les notifications'));
    });
    expect(mockService.markSoftPromptHandled).toHaveBeenCalled();
    expect(onDismiss).toHaveBeenCalled();
  });

  it('pendant la demande : spinner, et fermetures ignorées', async () => {
    let resolve: (v: boolean) => void = () => {};
    mockService.activateFromPrompt.mockReturnValue(new Promise((r) => (resolve = r)));
    const onDismiss = jest.fn();
    render(<NotificationPermissionSheet visible onDismiss={onDismiss} />);
    fireEvent.press(screen.getByText('Activer les notifications'));
    expect(screen.queryByText('Activer les notifications')).toBeNull();
    act(() => screen.UNSAFE_getByType(Modal).props.onRequestClose());
    fireEvent.press(screen.UNSAFE_getByType(Pressable));
    // le bouton "continuer" est désactivé : appel direct du handler pour vérifier la garde
    const skip = screen.getByText('Continuer sans notifications');
    fireEvent.press(skip);
    expect(onDismiss).not.toHaveBeenCalled();
    await act(async () => resolve(true));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('Continuer sans notifications : ferme sans marquer', () => {
    const onDismiss = jest.fn();
    render(<NotificationPermissionSheet visible onDismiss={onDismiss} />);
    fireEvent.press(screen.getByText('Continuer sans notifications'));
    expect(Haptics.selectionAsync).toHaveBeenCalled();
    expect(onDismiss).toHaveBeenCalled();
    expect(mockService.markSoftPromptHandled).not.toHaveBeenCalled();
  });

  it('fond et retour physique ferment', () => {
    const onDismiss = jest.fn();
    render(<NotificationPermissionSheet visible onDismiss={onDismiss} />);
    fireEvent.press(screen.UNSAFE_getByType(Pressable));
    act(() => screen.UNSAFE_getByType(Modal).props.onRequestClose());
    expect(onDismiss).toHaveBeenCalledTimes(2);
  });

  it('repasse invisible : réinitialise la position', () => {
    const setValue = jest.spyOn(Animated.Value.prototype, 'setValue');
    const { rerender } = render(<NotificationPermissionSheet visible onDismiss={jest.fn()} />);
    rerender(<NotificationPermissionSheet visible={false} onDismiss={jest.fn()} />);
    expect(setValue).toHaveBeenCalledWith(600);
  });
});
