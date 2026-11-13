import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

import LoginScreen from '../../../app/(auth)/login';
import { makeAuth, mockRouter, resetRouter, silenceConsole } from '../../../test-utils/screens';

jest.mock('expo-router', () => require('../../../test-utils/screens').expoRouterMock());

const mockAuth = { current: {} as any };
jest.mock('../../../app/context/auth', () => ({ useAuth: () => mockAuth.current }));

const mockAuthScreen = { isLoading: false };
jest.mock('../../../hooks/useAuthRedirect', () => ({ useAuthScreen: () => mockAuthScreen }));

jest.mock('../../../services/api/authApi', () => ({
  AuthApi: {
    sendPhoneOtp: jest.fn(),
    verifyPhoneOtp: jest.fn(),
    registerPhone: jest.fn(),
  },
}));

jest.mock('../../../utils/shareLink', () => ({
  getPendingShareToken: jest.fn(() => Promise.resolve(null)),
  clearPendingShareToken: jest.fn(() => Promise.resolve()),
}));

const { AuthApi } = jest.requireMock('../../../services/api/authApi');
const shareLink = jest.requireMock('../../../utils/shareLink');

const PHONE_PLACEHOLDER = '6 12 34 56 78';

describe('LoginScreen', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    silenceConsole();
    resetRouter();
    mockAuth.current = makeAuth();
    mockAuthScreen.isLoading = false;
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    AuthApi.sendPhoneOtp.mockReset().mockResolvedValue({ success: true, message: 'ok' });
    AuthApi.verifyPhoneOtp.mockReset();
    AuthApi.registerPhone.mockReset();
    shareLink.getPendingShareToken.mockReset().mockResolvedValue(null);
    shareLink.clearPendingShareToken.mockClear();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const goToStep2 = async (phone = '0612345678') => {
    fireEvent.changeText(screen.getByPlaceholderText(PHONE_PLACEHOLDER), phone);
    await act(async () => {
      fireEvent.press(screen.getByText('Continuer'));
    });
  };

  const getOtpInput = () => screen.UNSAFE_getByProps({ textContentType: 'oneTimeCode' });

  it("affiche le chargement pendant la vérification de l'auth", () => {
    mockAuthScreen.isLoading = true;
    render(<LoginScreen />);
    expect(screen.getByText('Vérification...')).toBeTruthy();
  });

  it("affiche l'étape 1 (téléphone) par défaut", () => {
    render(<LoginScreen />);
    expect(screen.getByText('Prêt à jouer ?')).toBeTruthy();
    expect(screen.getByText('SUE')).toBeTruthy();
    expect(screen.getByPlaceholderText(PHONE_PLACEHOLDER)).toBeTruthy();
  });

  it('ouvre la politique de confidentialité depuis les liens du pied de page', () => {
    render(<LoginScreen />);
    fireEvent.press(screen.getByText("Conditions d'utilisation"));
    fireEvent.press(screen.getByText('Politique de confidentialité'));
    expect(mockRouter.push).toHaveBeenCalledTimes(2);
    expect(mockRouter.push).toHaveBeenCalledWith('/privacy');
  });

  describe('formatage du numéro', () => {
    it.each([
      ['+33 6 12 34 56 78', '612345678'],
      ['33612345678', '612345678'],
      ['06.12.34.56.78', '612345678'],
      ['0', '0'],
      ['6a1b2', '612'],
    ])('nettoie "%s" en "%s"', (input, expected) => {
      render(<LoginScreen />);
      const field = screen.getByPlaceholderText(PHONE_PLACEHOLDER);
      fireEvent.changeText(field, input);
      expect(field.props.value).toBe(expected);
    });
  });

  describe('validation du numéro', () => {
    it.each([
      ['', 'Veuillez saisir votre numéro de téléphone'],
      ['61234', 'Le numéro doit comporter 9 chiffres (ex: 612345678)'],
      ['0', 'Le numéro doit comporter 10 chiffres (ex: 0612345678)'],
      ['512345678', 'Format invalide (ex: 0612345678 ou +33612345678)'],
      ['+', 'Le numéro doit contenir uniquement des chiffres et le symbole +'],
      ['6+1', 'Le numéro doit comporter 9 chiffres (ex: 612345678)'],
    ])('refuse "%s" avec un message', async (input, message) => {
      render(<LoginScreen />);
      await goToStep2(input);
      expect(screen.getByText(message)).toBeTruthy();
      expect(AuthApi.sendPhoneOtp).not.toHaveBeenCalled();
    });

    it("efface l'erreur dès que l'utilisateur retape", async () => {
      render(<LoginScreen />);
      await goToStep2('');
      expect(screen.getByText('Veuillez saisir votre numéro de téléphone')).toBeTruthy();
      fireEvent.changeText(screen.getByPlaceholderText(PHONE_PLACEHOLDER), '6');
      expect(screen.queryByText('Veuillez saisir votre numéro de téléphone')).toBeNull();
    });
  });

  describe('étape 2 (code OTP)', () => {
    it("envoie l'OTP au format international et passe à l'étape 2", async () => {
      render(<LoginScreen />);
      await goToStep2('0612345678');
      expect(AuthApi.sendPhoneOtp).toHaveBeenCalledWith('+33612345678');
      expect(screen.getByText('Code de vérification')).toBeTruthy();
      expect(screen.getByText('Renvoyer le code dans 45s')).toBeTruthy();
      expect(screen.getByText('05:00')).toBeTruthy();
    });

    it("revient à l'étape 1 et alerte si l'envoi échoue", async () => {
      AuthApi.sendPhoneOtp.mockRejectedValueOnce(new Error('SMS KO'));
      render(<LoginScreen />);
      await goToStep2();
      expect(alertSpy).toHaveBeenCalledWith('Erreur', 'SMS KO');
      expect(screen.getByText('Prêt à jouer ?')).toBeTruthy();
    });

    it("utilise un message par défaut quand l'erreur d'envoi n'a pas de message", async () => {
      AuthApi.sendPhoneOtp.mockRejectedValueOnce({});
      render(<LoginScreen />);
      await goToStep2();
      expect(alertSpy).toHaveBeenCalledWith('Erreur', 'Impossible de vous envoyer le code. Veuillez réessayer.');
    });

    it('décompte les minuteurs et active le renvoi du code', async () => {
      render(<LoginScreen />);
      await goToStep2();
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(screen.getByText('04:59')).toBeTruthy();
      expect(screen.getByText('Renvoyer le code dans 44s')).toBeTruthy();
      for (let i = 0; i < 45; i++) {
        act(() => {
          jest.advanceTimersByTime(1000);
        });
      }
      expect(screen.getByText('Renvoyer le code')).toBeTruthy();

      AuthApi.sendPhoneOtp.mockClear();
      await act(async () => {
        fireEvent.press(screen.getByText('Renvoyer le code'));
      });
      expect(AuthApi.sendPhoneOtp).toHaveBeenCalledWith('+33612345678');
      expect(screen.getByText('Renvoyer le code dans 45s')).toBeTruthy();
      expect(screen.getByText('05:00')).toBeTruthy();
    });

    it("alerte si le renvoi du code échoue (message par défaut ou de l'API)", async () => {
      render(<LoginScreen />);
      await goToStep2();
      for (let i = 0; i < 45; i++) {
        act(() => {
          jest.advanceTimersByTime(1000);
        });
      }
      AuthApi.sendPhoneOtp.mockRejectedValueOnce({});
      await act(async () => {
        fireEvent.press(screen.getByText('Renvoyer le code'));
      });
      expect(alertSpy).toHaveBeenCalledWith('Erreur', 'Impossible de renvoyer le code.');

      AuthApi.sendPhoneOtp.mockRejectedValueOnce(new Error('Trop de tentatives'));
      await act(async () => {
        fireEvent.press(screen.getByText('Renvoyer le code'));
      });
      expect(alertSpy).toHaveBeenCalledWith('Erreur', 'Trop de tentatives');
    });

    it('focalise le champ caché à l’arrivée et au toucher des cases', async () => {
      render(<LoginScreen />);
      await goToStep2();
      act(() => {
        jest.advanceTimersByTime(250);
      });
      // Toucher les cases ne doit pas planter (focus sur le champ caché)
      fireEvent.press(screen.getByTestId('otp-boxes'));
      expect(getOtpInput()).toBeTruthy();
    });

    it("permet de changer de numéro (retour à l'étape 1)", async () => {
      render(<LoginScreen />);
      await goToStep2();
      fireEvent.press(screen.getByText('Changer de numéro'));
      expect(screen.getByText('Prêt à jouer ?')).toBeTruthy();
    });

    it("le bouton retour de l'en-tête revient à l'étape précédente", async () => {
      render(<LoginScreen />);
      await goToStep2();
      fireEvent.press(screen.getByTestId('login-back'));
      expect(screen.getByText('Prêt à jouer ?')).toBeTruthy();
    });

    it("n'accepte que des chiffres et ne vérifie pas avant 6 chiffres", async () => {
      render(<LoginScreen />);
      await goToStep2();
      fireEvent.changeText(getOtpInput(), '12a3');
      expect(getOtpInput().props.value).toBe('123');
      expect(AuthApi.verifyPhoneOtp).not.toHaveBeenCalled();
    });

    it('connecte directement un numéro déjà inscrit puis redirige vers les onglets', async () => {
      const user = { id: 'u1', phone: '+33612345678', firstname: 'A', lastname: 'B' };
      AuthApi.verifyPhoneOtp.mockResolvedValue({ isRegistered: true, token: 'tok', user });
      render(<LoginScreen />);
      await goToStep2();
      await act(async () => {
        fireEvent.changeText(getOtpInput(), '123456');
      });
      expect(AuthApi.verifyPhoneOtp).toHaveBeenCalledWith('+33612345678', '123456');
      expect(mockAuth.current.authenticateWithSession).toHaveBeenCalledWith('tok', user);
      expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
    });

    it('reconduit vers la session partagée en attente après connexion (avec from)', async () => {
      AuthApi.verifyPhoneOtp.mockResolvedValue({ isRegistered: true, token: 't', user: { id: 'x' } });
      shareLink.getPendingShareToken.mockResolvedValue({ token: 'abc', from: 'u9' });
      render(<LoginScreen />);
      await goToStep2();
      await act(async () => {
        fireEvent.changeText(getOtpInput(), '123456');
      });
      expect(shareLink.clearPendingShareToken).toHaveBeenCalled();
      expect(mockRouter.replace).toHaveBeenCalledWith('/join/abc?from=u9&auto=1');
    });

    it('reconduit vers la session partagée en attente (sans from)', async () => {
      AuthApi.verifyPhoneOtp.mockResolvedValue({ isRegistered: true, token: 't', user: { id: 'x' } });
      shareLink.getPendingShareToken.mockResolvedValue({ token: 'abc', from: null });
      render(<LoginScreen />);
      await goToStep2();
      await act(async () => {
        fireEvent.changeText(getOtpInput(), '123456');
      });
      expect(mockRouter.replace).toHaveBeenCalledWith('/join/abc?auto=1');
    });

    it('affiche le formulaire de profil pour un numéro non inscrit', async () => {
      AuthApi.verifyPhoneOtp.mockResolvedValue({ isRegistered: false });
      render(<LoginScreen />);
      await goToStep2();
      await act(async () => {
        fireEvent.changeText(getOtpInput(), '123456');
      });
      expect(screen.getByText('Presque terminé !')).toBeTruthy();
    });

    it('alerte et vide le code si la vérification échoue', async () => {
      AuthApi.verifyPhoneOtp.mockRejectedValueOnce(new Error('Code expiré'));
      render(<LoginScreen />);
      await goToStep2();
      await act(async () => {
        fireEvent.changeText(getOtpInput(), '123456');
      });
      expect(alertSpy).toHaveBeenCalledWith('Code incorrect', 'Code expiré');
      expect(getOtpInput().props.value).toBe('');
    });

    it('message par défaut quand la vérification échoue sans message', async () => {
      AuthApi.verifyPhoneOtp.mockRejectedValueOnce({});
      render(<LoginScreen />);
      await goToStep2();
      await act(async () => {
        fireEvent.changeText(getOtpInput(), '123456');
      });
      expect(alertSpy).toHaveBeenCalledWith('Code incorrect', 'Le code saisi est invalide ou expiré.');
    });

    it('affiche "Vérification..." pendant la vérification et ignore une double saisie', async () => {
      let resolve: (v: any) => void = () => {};
      AuthApi.verifyPhoneOtp.mockImplementation(() => new Promise((r) => (resolve = r)));
      render(<LoginScreen />);
      await goToStep2();
      const onChangeText = getOtpInput().props.onChangeText;
      await act(async () => {
        onChangeText('123456');
        onChangeText('123456');
      });
      expect(screen.getByText('Vérification...')).toBeTruthy();
      expect(AuthApi.verifyPhoneOtp).toHaveBeenCalledTimes(1);
      await act(async () => {
        resolve({ isRegistered: false });
      });
      expect(screen.getByText('Presque terminé !')).toBeTruthy();
    });
  });

  describe('étape 3 (création du profil)', () => {
    const goToStep3 = async () => {
      AuthApi.verifyPhoneOtp.mockResolvedValue({ isRegistered: false });
      render(<LoginScreen />);
      await goToStep2('612345678');
      await act(async () => {
        fireEvent.changeText(getOtpInput(), '123456');
      });
    };

    it('exige prénom et nom', async () => {
      await goToStep3();
      fireEvent.changeText(screen.getByPlaceholderText('Ex: Thomas'), '   ');
      await act(async () => {
        fireEvent.press(screen.getByText('Créer mon profil'));
      });
      expect(alertSpy).toHaveBeenCalledWith('Erreur', 'Veuillez saisir votre prénom et votre nom');
      expect(AuthApi.registerPhone).not.toHaveBeenCalled();
    });

    it('crée le profil, authentifie et redirige', async () => {
      AuthApi.registerPhone.mockResolvedValue({ token: 'tk', user: { id: 'n' } });
      await goToStep3();
      fireEvent.changeText(screen.getByPlaceholderText('Ex: Thomas'), ' Thomas ');
      fireEvent.changeText(screen.getByPlaceholderText('Ex: Dubois'), ' Dubois ');
      await act(async () => {
        fireEvent.press(screen.getByText('Créer mon profil'));
      });
      expect(AuthApi.registerPhone).toHaveBeenCalledWith('+33612345678', 'Thomas', 'Dubois');
      expect(mockAuth.current.authenticateWithSession).toHaveBeenCalledWith('tk', { id: 'n' });
      expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
    });

    it('affiche "Création du profil..." pendant la création', async () => {
      AuthApi.registerPhone.mockImplementation(() => new Promise(() => {}));
      await goToStep3();
      fireEvent.changeText(screen.getByPlaceholderText('Ex: Thomas'), 'T');
      fireEvent.changeText(screen.getByPlaceholderText('Ex: Dubois'), 'D');
      await act(async () => {
        fireEvent.press(screen.getByText('Créer mon profil'));
      });
      expect(screen.getByText('Création du profil...')).toBeTruthy();
    });

    it('alerte si la création échoue (message API puis message par défaut)', async () => {
      AuthApi.registerPhone.mockRejectedValueOnce(new Error('Déjà pris'));
      await goToStep3();
      fireEvent.changeText(screen.getByPlaceholderText('Ex: Thomas'), 'T');
      fireEvent.changeText(screen.getByPlaceholderText('Ex: Dubois'), 'D');
      await act(async () => {
        fireEvent.press(screen.getByText('Créer mon profil'));
      });
      expect(alertSpy).toHaveBeenCalledWith('Erreur', 'Déjà pris');

      AuthApi.registerPhone.mockRejectedValueOnce({});
      await act(async () => {
        fireEvent.press(screen.getByText('Créer mon profil'));
      });
      expect(alertSpy).toHaveBeenCalledWith('Erreur', 'Impossible de créer le profil.');
    });
  });

  it('accepte un numéro collé au format +33 complet (double préfixe)', async () => {
    render(<LoginScreen />);
    await goToStep2('+33+33612345678');
    expect(AuthApi.sendPhoneOtp).toHaveBeenCalledWith('+33612345678');
  });

  it('refuse un numéro +33 de longueur invalide', async () => {
    render(<LoginScreen />);
    await goToStep2('+33+3361');
    expect(screen.getByText('Format invalide. Exemple: +33612345678')).toBeTruthy();
  });

});
