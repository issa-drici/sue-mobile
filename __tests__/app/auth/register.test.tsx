import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

import RegisterScreen from '../../../app/(auth)/register';
import { makeAuth, mockRouter, resetRouter, silenceConsole } from '../../../test-utils/screens';

jest.mock('expo-router', () => require('../../../test-utils/screens').expoRouterMock());

const mockAuth = { current: {} as any };
jest.mock('../../../app/context/auth', () => ({ useAuth: () => mockAuth.current }));

jest.mock('../../../utils/shareLink', () => ({
  getPendingShareToken: jest.fn(() => Promise.resolve(null)),
  clearPendingShareToken: jest.fn(() => Promise.resolve()),
}));
const shareLink = jest.requireMock('../../../utils/shareLink');

describe('RegisterScreen', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    silenceConsole();
    resetRouter();
    mockAuth.current = makeAuth();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    shareLink.getPendingShareToken.mockReset().mockResolvedValue(null);
    shareLink.clearPendingShareToken.mockClear();
  });

  afterEach(() => jest.restoreAllMocks());

  const fillStep1 = () => {
    fireEvent.changeText(screen.getByPlaceholderText('PRÉNOM'), 'Alex');
    fireEvent.changeText(screen.getByPlaceholderText('NOM'), 'Roux');
    fireEvent.press(screen.getByText('CONTINUER'));
  };
  const fillStep2 = (phone = '0612345678') => {
    fireEvent.changeText(screen.getByPlaceholderText('VOTRE EMAIL'), 'a@b.fr');
    fireEvent.changeText(screen.getByPlaceholderText('VOTRE NUMÉRO'), phone);
    fireEvent.press(screen.getByText('CONTINUER'));
  };
  const fillStep3 = (pwd = 'secret', confirm = 'secret') => {
    fireEvent.changeText(screen.getByPlaceholderText('CRÉER UN MOT DE PASSE'), pwd);
    fireEvent.changeText(screen.getByPlaceholderText('CONFIRMER LE MOT DE PASSE'), confirm);
  };

  it("affiche l'étape 1", () => {
    render(<RegisterScreen />);
    expect(screen.getByText('QUI ÊTES-VOUS ?')).toBeTruthy();
    expect(screen.getByText('ÉTAPE 1/3 • VOS INFORMATIONS')).toBeTruthy();
    expect(screen.getByText('DÉJÀ MEMBRE ?')).toBeTruthy();
  });

  it('"SE CONNECTER" et le retour à l\'étape 1 reviennent en arrière', () => {
    render(<RegisterScreen />);
    fireEvent.press(screen.getByText('SE CONNECTER'));
    fireEvent.press(screen.getByTestId('register-back'));
    expect(mockRouter.back).toHaveBeenCalledTimes(2);
  });

  it("refuse l'étape 1 incomplète", () => {
    render(<RegisterScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('PRÉNOM'), 'Alex');
    fireEvent.press(screen.getByText('CONTINUER'));
    expect(alertSpy).toHaveBeenCalledWith('Erreur', 'Veuillez remplir votre prénom et nom');
    expect(screen.getByText('QUI ÊTES-VOUS ?')).toBeTruthy();
  });

  it("refuse l'étape 2 incomplète et filtre les caractères du téléphone", () => {
    render(<RegisterScreen />);
    fillStep1();
    expect(screen.getByText('CONTACT')).toBeTruthy();
    const phone = screen.getByPlaceholderText('VOTRE NUMÉRO');
    fireEvent.changeText(phone, '06 12-ab');
    expect(phone.props.value).toBe('0612');
    fireEvent.press(screen.getByText('CONTINUER'));
    expect(alertSpy).toHaveBeenCalledWith('Erreur', 'Veuillez remplir votre email et téléphone');
  });

  it("le bouton retour revient à l'étape précédente", () => {
    render(<RegisterScreen />);
    fillStep1();
    fireEvent.press(screen.getByTestId('register-back'));
    expect(screen.getByText('QUI ÊTES-VOUS ?')).toBeTruthy();
    expect(mockRouter.back).not.toHaveBeenCalled();
  });

  it("valide l'étape 3 (mot de passe manquant / non identique)", async () => {
    render(<RegisterScreen />);
    fillStep1();
    fillStep2();
    expect(screen.getByText('SÉCURITÉ')).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByText('CRÉER MON COMPTE'));
    });
    expect(alertSpy).toHaveBeenCalledWith('Erreur', 'Veuillez choisir un mot de passe');
    fillStep3('a', 'b');
    await act(async () => {
      fireEvent.press(screen.getByText('CRÉER MON COMPTE'));
    });
    expect(alertSpy).toHaveBeenCalledWith('Erreur', 'Les mots de passe ne correspondent pas');
    expect(mockAuth.current.signUp).not.toHaveBeenCalled();
  });

  it('bascule la visibilité des mots de passe', () => {
    render(<RegisterScreen />);
    fillStep1();
    fillStep2();
    const pwd = screen.getByPlaceholderText('CRÉER UN MOT DE PASSE');
    const conf = screen.getByPlaceholderText('CONFIRMER LE MOT DE PASSE');
    expect(pwd.props.secureTextEntry).toBe(true);
    fireEvent.press(screen.getByTestId('toggle-password'));
    fireEvent.press(screen.getByTestId('toggle-confirm-password'));
    expect(screen.getByPlaceholderText('CRÉER UN MOT DE PASSE').props.secureTextEntry).toBe(false);
    expect(screen.getByPlaceholderText('CONFIRMER LE MOT DE PASSE').props.secureTextEntry).toBe(false);
    expect(conf).toBeTruthy();
  });

  it('crée le compte avec le téléphone au format +33 puis redirige vers les onglets', async () => {
    render(<RegisterScreen />);
    fillStep1();
    fillStep2('0612345678');
    fillStep3();
    await act(async () => {
      fireEvent.press(screen.getByText('CRÉER MON COMPTE'));
    });
    expect(mockAuth.current.signUp).toHaveBeenCalledWith('Alex', 'Roux', 'a@b.fr', '+33612345678', 'secret', 'secret');
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
  });

  it('garde un téléphone qui ne commence pas par 0', async () => {
    render(<RegisterScreen />);
    fillStep1();
    fillStep2('612345678');
    fillStep3();
    await act(async () => {
      fireEvent.press(screen.getByText('CRÉER MON COMPTE'));
    });
    expect(mockAuth.current.signUp).toHaveBeenCalledWith('Alex', 'Roux', 'a@b.fr', '612345678', 'secret', 'secret');
  });

  it.each([
    [{ token: 'tk', from: 'u2' }, '/join/tk?from=u2&auto=1'],
    [{ token: 'tk', from: null }, '/join/tk?auto=1'],
  ])('reconduit vers le lien de partage en attente %j', async (pending, url) => {
    shareLink.getPendingShareToken.mockResolvedValue(pending);
    render(<RegisterScreen />);
    fillStep1();
    fillStep2();
    fillStep3();
    await act(async () => {
      fireEvent.press(screen.getByText('CRÉER MON COMPTE'));
    });
    expect(shareLink.clearPendingShareToken).toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith(url);
  });

  it('affiche le chargement pendant la création', async () => {
    mockAuth.current.signUp.mockImplementation(() => new Promise(() => {}));
    render(<RegisterScreen />);
    fillStep1();
    fillStep2();
    fillStep3();
    await act(async () => {
      fireEvent.press(screen.getByText('CRÉER MON COMPTE'));
    });
    expect(screen.getByText('Création du compte...')).toBeTruthy();
  });

  it.each([
    [new Error('Email pris'), 'Email pris'],
    ['boom', 'Une erreur est survenue'],
  ])("alerte si l'inscription échoue (%p)", async (err, message) => {
    mockAuth.current.signUp.mockRejectedValue(err);
    render(<RegisterScreen />);
    fillStep1();
    fillStep2();
    fillStep3();
    await act(async () => {
      fireEvent.press(screen.getByText('CRÉER MON COMPTE'));
    });
    expect(alertSpy).toHaveBeenCalledWith('Erreur', message);
    expect(screen.getByText('SÉCURITÉ')).toBeTruthy();
  });
});
