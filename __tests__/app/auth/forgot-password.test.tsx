import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

import ForgotPasswordScreen from '../../../app/(auth)/forgot-password';
import { makeAuth, mockRouter, resetRouter, silenceConsole } from '../../../test-utils/screens';

jest.mock('expo-router', () => require('../../../test-utils/screens').expoRouterMock());

const mockAuth = { current: {} as any };
jest.mock('../../../app/context/auth', () => ({ useAuth: () => mockAuth.current }));

describe('ForgotPasswordScreen', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    silenceConsole();
    resetRouter();
    mockAuth.current = makeAuth();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  const submit = async (email?: string) => {
    if (email !== undefined) fireEvent.changeText(screen.getByPlaceholderText('VOTRE EMAIL'), email);
    await act(async () => {
      fireEvent.press(screen.getByText('ENVOYER LE LIEN'));
    });
  };

  it('affiche le formulaire', () => {
    render(<ForgotPasswordScreen />);
    expect(screen.getByText('MOT DE PASSE OUBLIÉ ?')).toBeTruthy();
  });

  it('revient en arrière via la flèche', () => {
    render(<ForgotPasswordScreen />);
    fireEvent.press(screen.getByTestId('forgot-password-back'));
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('exige un email', async () => {
    render(<ForgotPasswordScreen />);
    await submit();
    expect(alertSpy).toHaveBeenCalledWith('Erreur', 'Veuillez saisir votre email');
    expect(mockAuth.current.forgotPassword).not.toHaveBeenCalled();
  });

  it('refuse un email invalide', async () => {
    render(<ForgotPasswordScreen />);
    await submit('pas-un-email');
    expect(alertSpy).toHaveBeenCalledWith('Erreur', 'Veuillez saisir un email valide');
  });

  it("affiche l'écran de succès puis revient à la connexion", async () => {
    render(<ForgotPasswordScreen />);
    await submit('a@b.fr');
    expect(mockAuth.current.forgotPassword).toHaveBeenCalledWith('a@b.fr');
    expect(screen.getByText('EMAIL ENVOYÉ')).toBeTruthy();
    fireEvent.press(screen.getByText('RETOUR À LA CONNEXION'));
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it("affiche l'état d'envoi pendant la requête", async () => {
    mockAuth.current.forgotPassword.mockImplementation(() => new Promise(() => {}));
    render(<ForgotPasswordScreen />);
    await submit('a@b.fr');
    expect(screen.getByText('ENVOI...')).toBeTruthy();
    expect(screen.getByPlaceholderText('VOTRE EMAIL').props.editable).toBe(false);
  });

  it.each([
    [new Error('Serveur KO'), 'Serveur KO'],
    [42, 'Une erreur est survenue'],
  ])("alerte en cas d'erreur (%p)", async (err, message) => {
    mockAuth.current.forgotPassword.mockRejectedValue(err);
    render(<ForgotPasswordScreen />);
    await submit('a@b.fr');
    expect(alertSpy).toHaveBeenCalledWith('Erreur', message);
    expect(screen.getByText('ENVOYER LE LIEN')).toBeTruthy();
  });
});
