import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { ActivityIndicator, Alert, Modal } from 'react-native';

import PrivacyScreen from '../../../app/privacy';
import { makeAuth, mockRouter, pressAlertButton, resetRouter, silenceConsole, testUser } from '../../../test-utils/screens';

jest.mock('expo-router', () => require('../../../test-utils/screens').expoRouterMock());

const mockAuth = { current: {} as any };
jest.mock('../../../app/context/auth', () => ({ useAuth: () => mockAuth.current }));

jest.mock('../../../services/api/usersApi', () => ({
  UsersApi: {
    sendAccountCode: jest.fn(),
    sendNewPhoneCode: jest.fn(),
    verifyCurrentPhone: jest.fn(),
    confirmNewPhone: jest.fn(),
    deleteAccount: jest.fn(),
  },
}));
jest.mock('../../../components/molecules/OtpCodeInput/OtpCodeInput', () => {
  const { TextInput } = require('react-native');
  return {
    OtpCodeInput: ({ value, onChange, onComplete }: any) => (
      <TextInput
        testID="otp-input"
        value={value}
        onChangeText={(t: string) => {
          onChange(t);
          if (t.length === 6) onComplete?.(t);
        }}
      />
    ),
  };
});

const { UsersApi } = jest.requireMock('../../../services/api/usersApi');

describe('PrivacyScreen', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    silenceConsole();
    resetRouter();
    mockAuth.current = makeAuth();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    Object.values(UsersApi).forEach((fn: any) => fn.mockReset().mockResolvedValue(undefined));
  });
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const codeModalVisible = () => screen.UNSAFE_getAllByType(Modal)[0].props.visible;
  const typeCode = async (c: string) => {
    await act(async () => {
      fireEvent.changeText(screen.getByTestId('otp-input'), c);
    });
  };
  const startChangeNumber = async () => {
    await act(async () => {
      fireEvent.press(screen.getByText('Changer de numéro'));
    });
  };

  it('affiche les sections et le numéro actuel formaté', () => {
    render(<PrivacyScreen />);
    expect(screen.getByText('COMPTE')).toBeTruthy();
    expect(screen.getByText('06 12 34 56 78')).toBeTruthy();
    expect(codeModalVisible()).toBe(false);
  });

  it('masque le numéro quand il est inconnu', () => {
    mockAuth.current = makeAuth({ user: { ...testUser, phone: undefined } });
    render(<PrivacyScreen />);
    expect(screen.queryByText(/06/)).toBeNull();
  });

  it('revient en arrière', () => {
    render(<PrivacyScreen />);
    fireEvent.press(screen.getByTestId('privacy-back'));
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it.each([
    ['Politique de confidentialité', '1. COLLECTE DES DONNÉES'],
    ["Conditions d'utilisation", '1. ACCEPTATION DES CONDITIONS'],
  ])('ouvre et ferme la modale légale "%s"', (label, content) => {
    render(<PrivacyScreen />);
    fireEvent.press(screen.getByText(label));
    expect(screen.getByText(content)).toBeTruthy();
    fireEvent.press(screen.getByTestId('legal-close'));
    expect(screen.queryByText(content)).toBeNull();
    fireEvent.press(screen.getByText(label));
    act(() => {
      screen.UNSAFE_getAllByType(Modal)[1].props.onRequestClose();
    });
    expect(screen.queryByText(content)).toBeNull();
  });

  describe('changement de numéro', () => {
    it('parcours complet : code actuel → nouveau numéro → code du nouveau', async () => {
      render(<PrivacyScreen />);
      await startChangeNumber();
      expect(UsersApi.sendAccountCode).toHaveBeenCalled();
      expect(codeModalVisible()).toBe(true);
      expect(screen.getByText('Renvoyer le code dans 45s')).toBeTruthy();

      await typeCode('123456');
      expect(UsersApi.verifyCurrentPhone).toHaveBeenCalledWith('123456');
      expect(screen.getByText('NOUVEAU NUMÉRO')).toBeTruthy();

      const input = screen.getByPlaceholderText('06 12 34 56 78');
      fireEvent.changeText(input, '07 00 00 00 01');
      await act(async () => {
        fireEvent.press(screen.getByText('Recevoir le code'));
      });
      expect(UsersApi.sendNewPhoneCode).toHaveBeenCalledWith('+33700000001');
      expect(screen.getByText('07 00 00 00 01')).toBeTruthy();

      await typeCode('654321');
      expect(UsersApi.confirmNewPhone).toHaveBeenCalledWith('+33700000001', '654321');
      expect(mockAuth.current.refreshUser).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith('Numéro mis à jour', 'Tu te connecteras désormais avec le 07 00 00 00 01.');
      expect(codeModalVisible()).toBe(false);
    });

    it("alerte si l'envoi du premier code échoue (message API puis défaut)", async () => {
      UsersApi.sendAccountCode.mockRejectedValueOnce(new Error('Trop de codes'));
      render(<PrivacyScreen />);
      await startChangeNumber();
      expect(alertSpy).toHaveBeenCalledWith('Erreur', 'Trop de codes');
      expect(codeModalVisible()).toBe(false);

      UsersApi.sendAccountCode.mockRejectedValueOnce({});
      await startChangeNumber();
      expect(alertSpy).toHaveBeenLastCalledWith('Erreur', "Impossible d'envoyer le code.");
    });

    it('affiche le chargement global pendant le premier envoi', async () => {
      UsersApi.sendAccountCode.mockReturnValue(new Promise(() => {}));
      render(<PrivacyScreen />);
      await startChangeNumber();
      expect(screen.UNSAFE_getAllByType(ActivityIndicator).length).toBeGreaterThan(0);
    });

    it('affiche une erreur de code et vide le champ (message API puis défaut)', async () => {
      render(<PrivacyScreen />);
      await startChangeNumber();
      UsersApi.verifyCurrentPhone.mockRejectedValueOnce(new Error('Code faux'));
      await typeCode('111111');
      expect(screen.getByText('Code faux')).toBeTruthy();
      expect(screen.getByTestId('otp-input').props.value).toBe('');
      // retaper efface l'erreur
      await typeCode('1');
      expect(screen.queryByText('Code faux')).toBeNull();

      UsersApi.verifyCurrentPhone.mockRejectedValueOnce({});
      await typeCode('222222');
      expect(screen.getByText('Code invalide ou expiré.')).toBeTruthy();
    });

    it('valide via le bouton, ignore un code incomplet', async () => {
      render(<PrivacyScreen />);
      await startChangeNumber();
      await typeCode('12');
      await act(async () => {
        fireEvent.press(screen.getByText('Valider'));
      });
      expect(UsersApi.verifyCurrentPhone).not.toHaveBeenCalled();
    });

    it('renvoie le code après le délai, et affiche une erreur dans la feuille en cas d’échec', async () => {
      render(<PrivacyScreen />);
      await startChangeNumber();
      for (let i = 0; i < 45; i++) {
        act(() => {
          jest.advanceTimersByTime(1000);
        });
      }
      expect(screen.getByText('Renvoyer le code')).toBeTruthy();
      await act(async () => {
        fireEvent.press(screen.getByText('Renvoyer le code'));
      });
      expect(UsersApi.sendAccountCode).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Renvoyer le code dans 45s')).toBeTruthy();

      for (let i = 0; i < 45; i++) {
        act(() => {
          jest.advanceTimersByTime(1000);
        });
      }
      UsersApi.sendAccountCode.mockRejectedValueOnce(new Error('Quota'));
      await act(async () => {
        fireEvent.press(screen.getByText('Renvoyer le code'));
      });
      expect(screen.getByText('Quota')).toBeTruthy();
    });

    it('nouveau numéro : bouton désactivé si invalide, erreur dans la feuille si l’envoi échoue', async () => {
      render(<PrivacyScreen />);
      await startChangeNumber();
      await typeCode('123456');
      fireEvent.changeText(screen.getByPlaceholderText('06 12 34 56 78'), '12');
      await act(async () => {
        fireEvent.press(screen.getByText('Recevoir le code'));
      });
      expect(UsersApi.sendNewPhoneCode).not.toHaveBeenCalled();

      fireEvent.changeText(screen.getByPlaceholderText('06 12 34 56 78'), '0700000001');
      UsersApi.sendNewPhoneCode.mockRejectedValueOnce({});
      await act(async () => {
        fireEvent.press(screen.getByText('Recevoir le code'));
      });
      expect(screen.getByText("Impossible d'envoyer le code.")).toBeTruthy();
      fireEvent.changeText(screen.getByPlaceholderText('06 12 34 56 78'), '0700000002');
      expect(screen.queryByText("Impossible d'envoyer le code.")).toBeNull();
    });

    it('ferme la feuille (croix et retour Android) et réinitialise', async () => {
      render(<PrivacyScreen />);
      await startChangeNumber();
      fireEvent.press(screen.getByTestId('code-flow-close'));
      expect(codeModalVisible()).toBe(false);
      await startChangeNumber();
      act(() => {
        screen.UNSAFE_getAllByType(Modal)[0].props.onRequestClose();
      });
      expect(codeModalVisible()).toBe(false);
    });

    it('affiche un indicateur pendant la vérification et ignore une saisie concurrente', async () => {
      UsersApi.verifyCurrentPhone.mockReturnValue(new Promise(() => {}));
      render(<PrivacyScreen />);
      await startChangeNumber();
      await typeCode('123456');
      expect(screen.queryByText('Valider')).toBeNull();
      await typeCode('654321');
      expect(UsersApi.verifyCurrentPhone).toHaveBeenCalledTimes(1);
    });
  });

  describe('suppression du compte', () => {
    const startDelete = async () => {
      fireEvent.press(screen.getByText('Supprimer mon compte'));
      expect(alertSpy).toHaveBeenCalledWith('Supprimer le compte', expect.stringContaining('irréversible'), expect.any(Array));
      await pressAlertButton(alertSpy, 'Recevoir le code');
    };

    it('demande un code puis supprime, déconnecte et redirige', async () => {
      render(<PrivacyScreen />);
      await startDelete();
      expect(UsersApi.sendAccountCode).toHaveBeenCalled();
      expect(screen.getAllByText('Supprimer mon compte').length).toBe(2);
      expect(screen.getByText(/Saisis-le pour supprimer définitivement/)).toBeTruthy();
      // pas de validation automatique
      await typeCode('123456');
      expect(UsersApi.deleteAccount).not.toHaveBeenCalled();
      await act(async () => {
        fireEvent.press(screen.getByText('Supprimer définitivement'));
      });
      expect(UsersApi.deleteAccount).toHaveBeenCalledWith('123456');
      expect(mockAuth.current.signOut).toHaveBeenCalled();
      expect(mockRouter.replace).toHaveBeenCalledWith('/(auth)/login');
    });

    it('affiche un indicateur blanc pendant la suppression', async () => {
      UsersApi.deleteAccount.mockReturnValue(new Promise(() => {}));
      render(<PrivacyScreen />);
      await startDelete();
      await typeCode('123456');
      await act(async () => {
        fireEvent.press(screen.getByText('Supprimer définitivement'));
      });
      expect(screen.UNSAFE_getAllByType(ActivityIndicator).some((n) => n.props.color === '#FFF')).toBe(true);
    });
  });
});
