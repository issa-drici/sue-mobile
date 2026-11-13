import React from 'react';
import { View } from 'react-native';

jest.mock('@expo/vector-icons', () => require('../../__testutils__/vectorIconsMock'));
const mockPush = jest.fn();
jest.mock('../../../services/notifications/pushNotifications', () => ({ pushNotificationService: {} }));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
const mockReduceMotion = jest.fn(() => false);
jest.mock('react-native-reanimated', () => ({
  ...require('react-native-reanimated/mock'),
  useReducedMotion: () => mockReduceMotion(),
}));

import * as Haptics from 'expo-haptics';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { HomeEmptyState, QuickCreateRow, NextSessionPrompt } from '../HomeEmptyState';
import * as Organisms from '../index';

const sheenLayers = () =>
  screen.UNSAFE_getAllByType(View).filter((v) => v.props.pointerEvents === 'none' && v.props.onLayout);

describe('HomeEmptyState', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockReduceMotion.mockReturnValue(false);
  });

  it('le barrel organisms exporte les composants', () => {
    expect(Organisms.HomeEmptyState).toBe(HomeEmptyState);
    expect(Organisms.SlotPicker).toBeDefined();
    expect(Organisms.NotificationsCard).toBeDefined();
    expect(Organisms.Header).toBeDefined();
  });

  it('affiche les deux choix, les étapes, et navigue', () => {
    render(<HomeEmptyState />);
    expect(screen.getByText(/Ta prochaine session/)).toBeOnTheScreen();
    expect(screen.getByText('Crée')).toBeOnTheScreen();
    expect(screen.getByText('Partage le lien')).toBeOnTheScreen();
    expect(screen.getByText("C'est parti")).toBeOnTheScreen();
    expect(screen.getByText('3')).toBeOnTheScreen();
    fireEvent.press(screen.getByText("J'ai une date"));
    expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
    expect(mockPush).toHaveBeenCalledWith('/create-session');
    fireEvent.press(screen.getByText('Tes potes votent pour le meilleur créneau.'));
    expect(mockPush).toHaveBeenCalledWith('/create-session?mode=find-slot');
  });

  it('reflet : le layout met à jour la largeur, mouvement réduit respecté', () => {
    mockReduceMotion.mockReturnValue(true);
    render(<HomeEmptyState />);
    const layers = sheenLayers();
    expect(layers).toHaveLength(2);
    act(() => layers[0].props.onLayout({ nativeEvent: { layout: { width: 300, height: 80 } } }));
  });

  it('QuickCreateRow navigue vers les deux modes', () => {
    render(<QuickCreateRow />);
    fireEvent.press(screen.getByText("J'ai une date"));
    fireEvent.press(screen.getByText('Trouver un créneau'));
    expect(mockPush.mock.calls).toEqual([['/create-session'], ['/create-session?mode=find-slot']]);
  });

  it('NextSessionPrompt affiche titre / indice et navigue', () => {
    render(<NextSessionPrompt title="Rien à venir" hint="Lance la prochaine" />);
    expect(screen.getByText('Rien à venir')).toBeOnTheScreen();
    expect(screen.getByText('Lance la prochaine')).toBeOnTheScreen();
    fireEvent.press(screen.getByText('Trouver un créneau'));
    expect(mockPush).toHaveBeenCalledWith('/create-session?mode=find-slot');
    fireEvent.press(screen.getByText("J'ai une date"));
    expect(mockPush).toHaveBeenCalledWith('/create-session');
  });
});
