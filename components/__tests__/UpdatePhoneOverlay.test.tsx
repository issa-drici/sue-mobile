import React from 'react';
import { Alert, KeyboardAvoidingView, Platform } from 'react-native';

jest.mock('@expo/vector-icons', () => require('../__testutils__/vectorIconsMock'));
const mockUseAuth = jest.fn();
jest.mock('../../app/context/auth', () => ({ useAuth: () => mockUseAuth() }));

import * as Haptics from 'expo-haptics';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { UpdatePhoneOverlay } from '../UpdatePhoneOverlay';

describe('UpdatePhoneOverlay', () => {
  const updateUserProfile = jest.fn();

  beforeEach(() => {
    updateUserProfile.mockReset().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({ user: { phone: '+330012345678' }, updateUserProfile });
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('rien sans utilisateur', () => {
    mockUseAuth.mockReturnValue({ user: null, updateUserProfile });
    expect(render(<UpdatePhoneOverlay />).toJSON()).toBeNull();
  });

  it('rien si le numéro est réel ou absent', () => {
    mockUseAuth.mockReturnValue({ user: { phone: '+33612345678' }, updateUserProfile });
    expect(render(<UpdatePhoneOverlay />).toJSON()).toBeNull();
    mockUseAuth.mockReturnValue({ user: {}, updateUserProfile });
    expect(render(<UpdatePhoneOverlay />).toJSON()).toBeNull();
  });

  it('numéro factice : affiche le formulaire, bouton désactivé tant que vide', () => {
    render(<UpdatePhoneOverlay />);
    expect(screen.getByText('Numéro de téléphone requis')).toBeOnTheScreen();
    fireEvent.press(screen.getByText('METTRE À JOUR'));
    expect(updateUserProfile).not.toHaveBeenCalled();
    expect(screen.UNSAFE_getByType(KeyboardAvoidingView).props.behavior).toBe('padding');
  });

  it('ne garde que les chiffres et refuse un numéro trop court', () => {
    render(<UpdatePhoneOverlay />);
    const input = screen.getByPlaceholderText('06 12 34 56 78');
    fireEvent.changeText(input, '06 12-34');
    expect(input.props.value).toBe('061234');
    fireEvent.press(screen.getByText('METTRE À JOUR'));
    expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Veuillez entrer un numéro valide');
    expect(updateUserProfile).not.toHaveBeenCalled();
  });

  it('convertit 06… en +336… et confirme', async () => {
    render(<UpdatePhoneOverlay />);
    fireEvent.changeText(screen.getByPlaceholderText('06 12 34 56 78'), '0612345678');
    await act(async () => {
      fireEvent.press(screen.getByText('METTRE À JOUR'));
    });
    expect(Haptics.impactAsync).toHaveBeenCalledWith('medium');
    expect(updateUserProfile).toHaveBeenCalledWith({ phone: '+33612345678' });
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
    expect(Alert.alert).toHaveBeenCalledWith('Succès', 'Votre numéro de téléphone a été mis à jour');
  });

  it('numéro sans 0 initial transmis tel quel', async () => {
    render(<UpdatePhoneOverlay />);
    fireEvent.changeText(screen.getByPlaceholderText('06 12 34 56 78'), '3361234567');
    await act(async () => {
      fireEvent.press(screen.getByText('METTRE À JOUR'));
    });
    expect(updateUserProfile).toHaveBeenCalledWith({ phone: '3361234567' });
  });

  it('spinner pendant la mise à jour puis erreur', async () => {
    let reject: (e: Error) => void = () => {};
    updateUserProfile.mockReturnValue(new Promise((_, r) => (reject = r)));
    render(<UpdatePhoneOverlay />);
    fireEvent.changeText(screen.getByPlaceholderText('06 12 34 56 78'), '0612345678');
    fireEvent.press(screen.getByText('METTRE À JOUR'));
    expect(screen.queryByText('METTRE À JOUR')).toBeNull();
    expect(screen.getByPlaceholderText('06 12 34 56 78').props.editable).toBe(false);
    await act(async () => reject(new Error('500')));
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('error');
    expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Impossible de mettre à jour le numéro');
    expect(screen.getByText('METTRE À JOUR')).toBeOnTheScreen();
  });

  it('Android : clavier en mode height', () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    render(<UpdatePhoneOverlay />);
    expect(screen.UNSAFE_getByType(KeyboardAvoidingView).props.behavior).toBe('height');
  });
});
