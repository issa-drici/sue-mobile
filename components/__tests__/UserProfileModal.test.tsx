import React from 'react';
import { Alert, Image } from 'react-native';

jest.mock('@expo/vector-icons', () => require('../__testutils__/vectorIconsMock'));

const mockFetchUserById = jest.fn();
const mockSend = jest.fn();
const mockCancel = jest.fn();
let mockProfileState: { data: any; isLoading: boolean } = { data: null, isLoading: false };
let mockSending = false;
let mockCancelling = false;
jest.mock('../../services', () => ({
  useGetUserById: () => ({ ...mockProfileState, fetchUserById: mockFetchUserById }),
  useSendFriendRequest: () => ({ sendFriendRequest: mockSend, isLoading: mockSending }),
  useCancelFriendRequest: () => ({ cancelFriendRequest: mockCancel, isLoading: mockCancelling }),
}));
const mockChangeOrganizer = jest.fn();
jest.mock('../../services/api/sessionsApi', () => ({
  SessionsApi: { changeOrganizer: (...a: any[]) => mockChangeOrganizer(...a) },
}));
const mockUseBadges = jest.fn();
jest.mock('../../services/badges', () => ({ useBadges: (...a: any[]) => mockUseBadges(...a) }));
const mockUseAuth = jest.fn();
jest.mock('../../app/context/auth', () => ({ useAuth: () => mockUseAuth() }));

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import UserProfileModal from '../UserProfileModal';

const profile = (over: any = {}) => ({
  id: 'u2',
  firstname: 'alice',
  lastname: 'martin',
  avatar: null,
  isAlreadyFriend: false,
  hasPendingRequest: false,
  ...over,
});

const iconNames = () => screen.UNSAFE_getAllByType(Ionicons).map((i) => i.props.name);
const lastAlertButtons = () => (Alert.alert as jest.Mock).mock.calls.at(-1)[2];

describe('UserProfileModal', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    mockProfileState = { data: profile(), isLoading: false };
    mockSending = false;
    mockCancelling = false;
    mockFetchUserById.mockReset().mockResolvedValue(undefined);
    mockSend.mockReset().mockResolvedValue(undefined);
    mockCancel.mockReset().mockResolvedValue(undefined);
    mockChangeOrganizer.mockReset().mockResolvedValue(undefined);
    mockUseBadges.mockReset().mockReturnValue({ badges: [] });
    mockUseAuth.mockReturnValue({ user: { id: 'me' } });
    onClose.mockReset();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  const renderModal = (props: any = {}) => render(<UserProfileModal visible onClose={onClose} userId="u2" {...props} />);

  it('charge le profil à l’ouverture et demande les badges', () => {
    renderModal();
    expect(mockFetchUserById).toHaveBeenCalledWith('u2');
    expect(mockUseBadges).toHaveBeenCalledWith('u2', true);
  });

  it('ne charge pas si invisible ou sans userId', () => {
    render(<UserProfileModal visible={false} onClose={onClose} userId="u2" />);
    render(<UserProfileModal visible onClose={onClose} />);
    expect(mockFetchUserById).not.toHaveBeenCalled();
    expect(mockUseBadges).toHaveBeenCalledWith(undefined, false);
  });

  it('chargement : message dédié', () => {
    mockProfileState = { data: null, isLoading: true };
    renderModal();
    expect(screen.getByText('Chargement du profil...')).toBeOnTheScreen();
  });

  it('profil d’un autre joueur : initiales, nom, statut squad, bouton ajouter', () => {
    renderModal();
    expect(screen.getByText('AM')).toBeOnTheScreen();
    expect(screen.getByText('alice martin')).toBeOnTheScreen();
    expect(screen.getByText('Pas encore dans ton Squad')).toBeOnTheScreen();
    expect(screen.getByText('Ajouter au répertoire')).toBeOnTheScreen();
    expect(screen.queryByText('Nommer administrateur')).toBeNull();
  });

  it('initiales "?" sans nom ni id, avatar image si présent', () => {
    mockProfileState = { data: profile({ id: undefined, firstname: '', lastname: '' }), isLoading: false };
    const { unmount } = renderModal();
    expect(screen.getByText('?')).toBeOnTheScreen();
    unmount();
    mockProfileState = { data: profile({ avatar: 'https://x/a.png' }), isLoading: false };
    renderModal();
    expect(screen.UNSAFE_getByType(Image).props.source).toEqual({ uri: 'https://x/a.png' });
  });

  it('ami : "Dans ton Squad", pas de bouton d’ajout', () => {
    mockProfileState = { data: profile({ isAlreadyFriend: true }), isLoading: false };
    renderModal();
    expect(screen.getByText('Dans ton Squad')).toBeOnTheScreen();
    expect(screen.queryByText('Ajouter au répertoire')).toBeNull();
    expect(screen.queryByText('Annuler la demande')).toBeNull();
  });

  it('mon propre profil : pas de bloc squad ni d’actions, badges en mode "moi"', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'u2' } });
    mockUseBadges.mockReturnValue({
      badges: [{ id: 'regular', name: 'Habitué', description: 'd', unlocked: false, unlockedAt: null, progress: 2, target: 10 }],
    });
    renderModal({ isSessionOrganizer: true, sessionId: 's1' });
    expect(screen.queryByText(/Squad/)).toBeNull();
    expect(screen.queryByText('Ajouter au répertoire')).toBeNull();
    expect(screen.queryByText('Nommer administrateur')).toBeNull();
    expect(screen.getByText('0 / 1 débloqué')).toBeOnTheScreen();
    fireEvent.press(screen.getByText('Habitué'));
    expect(screen.getByText('2 / 10')).toBeOnTheScreen();
  });

  it.each([
    ['accepted', 'checkmark'],
    ['pending', 'time'],
    ['declined', 'close'],
  ])('badge de statut %s', (status, icon) => {
    renderModal({ userStatus: status, isPlayerOrganizer: true });
    expect(iconNames()).toEqual(expect.arrayContaining(['star', icon]));
  });

  it('ajouter un ami : succès puis rechargement', async () => {
    renderModal();
    await act(async () => {
      fireEvent.press(screen.getByText('Ajouter au répertoire'));
    });
    expect(Haptics.impactAsync).toHaveBeenCalledWith('medium');
    expect(mockSend).toHaveBeenCalledWith('u2');
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
    expect(mockFetchUserById).toHaveBeenCalledTimes(2);
  });

  it('ajouter : demande déjà existante → proposition d’annulation', async () => {
    mockSend.mockRejectedValue(new Error('La demande existe déjà'));
    renderModal();
    await act(async () => {
      fireEvent.press(screen.getByText('Ajouter au répertoire'));
    });
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('error');
    expect(Alert.alert).toHaveBeenCalledWith('Déjà demandé', expect.any(String), expect.any(Array));
    await act(async () => {
      await lastAlertButtons()[1].onPress();
    });
    expect(mockCancel).toHaveBeenCalledWith('u2');
  });

  it('ajouter : autre erreur (avec ou sans message)', async () => {
    mockSend.mockRejectedValueOnce(new Error('boom')).mockRejectedValueOnce({});
    renderModal();
    await act(async () => {
      fireEvent.press(screen.getByText('Ajouter au répertoire'));
    });
    await act(async () => {
      fireEvent.press(screen.getByText('Ajouter au répertoire'));
    });
    expect(Alert.alert).toHaveBeenCalledTimes(2);
    expect(Alert.alert).toHaveBeenLastCalledWith('Erreur', "Impossible d'envoyer la demande");
  });

  it('demande en attente : annuler, succès et échec', async () => {
    mockProfileState = { data: profile({ hasPendingRequest: true }), isLoading: false };
    renderModal();
    await act(async () => {
      fireEvent.press(screen.getByText('Annuler la demande'));
    });
    expect(mockCancel).toHaveBeenCalledWith('u2');
    expect(mockFetchUserById).toHaveBeenCalledTimes(2);
    mockCancel.mockRejectedValue(new Error('x'));
    await act(async () => {
      fireEvent.press(screen.getByText('Annuler la demande'));
    });
    expect(Alert.alert).toHaveBeenCalledWith('Erreur', "Impossible d'annuler la demande");
  });

  it('boutons désactivés pendant l’envoi / l’annulation', async () => {
    mockSending = true;
    const { unmount } = renderModal();
    fireEvent.press(screen.getByText('Ajouter au répertoire'));
    expect(mockSend).not.toHaveBeenCalled();
    unmount();
    mockCancelling = true;
    mockProfileState = { data: profile({ hasPendingRequest: true }), isLoading: false };
    renderModal();
    fireEvent.press(screen.getByText('Annuler la demande'));
    expect(mockCancel).not.toHaveBeenCalled();
  });

  it('sans userId : ajouter / annuler ne font rien', async () => {
    mockProfileState = { data: profile(), isLoading: false };
    const { unmount } = render(<UserProfileModal visible onClose={onClose} />);
    await act(async () => {
      fireEvent.press(screen.getByText('Ajouter au répertoire'));
    });
    expect(mockSend).not.toHaveBeenCalled();
    unmount();
    mockProfileState = { data: profile({ hasPendingRequest: true }), isLoading: false };
    render(<UserProfileModal visible onClose={onClose} />);
    await act(async () => {
      fireEvent.press(screen.getByText('Annuler la demande'));
    });
    expect(mockCancel).not.toHaveBeenCalled();
  });

  describe('nommer administrateur', () => {
    const adminProps = { isSessionOrganizer: true, sessionId: 's1', userStatus: 'accepted' };

    it('masqué si joueur refusé ou session terminée', () => {
      const { unmount } = renderModal({ ...adminProps, userStatus: 'declined' });
      expect(screen.queryByText('Nommer administrateur')).toBeNull();
      unmount();
      renderModal({ ...adminProps, isSessionFinished: true });
      expect(screen.queryByText('Nommer administrateur')).toBeNull();
    });

    it('confirmation puis changement d’organisateur', async () => {
      const onOrganizerChanged = jest.fn();
      renderModal({ ...adminProps, onOrganizerChanged });
      fireEvent.press(screen.getByText('Nommer administrateur'));
      expect((Alert.alert as jest.Mock).mock.calls[0][1]).toContain('alice');
      await act(async () => {
        await lastAlertButtons()[1].onPress();
      });
      expect(mockChangeOrganizer).toHaveBeenCalledWith('s1', 'u2');
      expect(onClose).toHaveBeenCalled();
      expect(onOrganizerChanged).toHaveBeenCalled();
    });

    it('sans callback onOrganizerChanged', async () => {
      renderModal(adminProps);
      fireEvent.press(screen.getByText('Nommer administrateur'));
      await act(async () => {
        await lastAlertButtons()[1].onPress();
      });
      expect(onClose).toHaveBeenCalled();
    });

    it('échec du changement', async () => {
      mockChangeOrganizer.mockRejectedValue(new Error('x'));
      renderModal(adminProps);
      fireEvent.press(screen.getByText('Nommer administrateur'));
      await act(async () => {
        await lastAlertButtons()[1].onPress();
      });
      expect(Alert.alert).toHaveBeenLastCalledWith('Erreur', "Impossible de changer l'organisateur");
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  it('Fermer et croix appellent onClose', () => {
    renderModal();
    fireEvent.press(screen.getByText('Fermer'));
    const closeIcon = screen.UNSAFE_getAllByType(Ionicons).find((i) => i.props.name === 'close' && i.props.size === 20)!;
    fireEvent.press(closeIcon);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
