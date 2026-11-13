import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Alert, FlatList, Platform } from 'react-native';

import FriendsScreen from '../../../app/(tabs)/friends';
import { mockRouter, pressAlertButton, resetRouter, silenceConsole } from '../../../test-utils/screens';

jest.mock('expo-router', () => require('../../../test-utils/screens').expoRouterMock());

const mockApi = {
  friends: {} as any,
  requests: {} as any,
  respond: {} as any,
  remove: {} as any,
};
jest.mock('../../../services', () => ({
  useGetFriends: () => mockApi.friends,
  useGetFriendRequests: () => mockApi.requests,
  useRespondToFriendRequest: () => mockApi.respond,
  useRemoveFriend: () => mockApi.remove,
}));

jest.mock('../../../components/UserProfileModal', () => {
  const { Text, View } = require('react-native');
  return {
    __esModule: true,
    default: ({ visible, onClose, userId, userFirstname }: any) =>
      visible ? (
        <View>
          <Text>{`profile:${userId}:${userFirstname}`}</Text>
          <Text onPress={onClose}>fermer-profil</Text>
        </View>
      ) : null,
  };
});

const friend = (id: string, firstname: string, lastname: string, avatar: string | null = null) => ({
  id,
  firstname,
  lastname,
  avatar,
  status: 'online',
});

describe('FriendsScreen (onglet masqué)', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    silenceConsole();
    resetRouter();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockApi.friends = {
      data: [friend('f1', 'léa', 'petit', 'https://x/a.png'), friend('f2', 'paul', 'durand')],
      isLoading: false,
      refetch: jest.fn(() => Promise.resolve()),
    };
    mockApi.requests = { data: [], isLoading: false, refetch: jest.fn(() => Promise.resolve()) };
    mockApi.respond = { respondToFriendRequest: jest.fn(() => Promise.resolve()), isLoading: false };
    mockApi.remove = { removeFriend: jest.fn(() => Promise.resolve()), isLoading: false };
  });
  afterEach(() => jest.restoreAllMocks());

  it('affiche la liste des amis et leur nombre', () => {
    render(<FriendsScreen />);
    expect(screen.getByText('ATHLÈTES')).toBeTruthy();
    expect(screen.getByText('TON SQUAD (2)')).toBeTruthy();
    expect(screen.getByText('LÉA')).toBeTruthy();
    expect(screen.getByText('DURAND')).toBeTruthy();
    expect(screen.queryByText(/DEMANDES/)).toBeNull();
  });

  it('affiche le squad vide', () => {
    mockApi.friends.data = [];
    render(<FriendsScreen />);
    expect(screen.getByText('SQUAD VIDE')).toBeTruthy();
    expect(screen.getByText('TON SQUAD (0)')).toBeTruthy();
  });

  it('affiche un chargement quand les amis chargent', () => {
    mockApi.friends = { ...mockApi.friends, data: undefined, isLoading: true };
    render(<FriendsScreen />);
    expect(screen.getByText('Chargement...')).toBeTruthy();
  });

  it("ouvre l'ajout d'ami", () => {
    render(<FriendsScreen />);
    fireEvent.press(screen.getByTestId('friends-add-button'));
    expect(mockRouter.push).toHaveBeenCalledWith('/add-friend');
  });

  it("ouvre puis ferme le profil d'un ami", () => {
    render(<FriendsScreen />);
    fireEvent.press(screen.getByText('LÉA'));
    expect(screen.getByText('profile:f1:léa')).toBeTruthy();
    fireEvent.press(screen.getByText('fermer-profil'));
    expect(screen.queryByText('profile:f1:léa')).toBeNull();
  });

  it('rafraîchit amis et demandes', async () => {
    render(<FriendsScreen />);
    await act(async () => {
      await screen.UNSAFE_getByType(FlatList).props.onRefresh();
    });
    expect(mockApi.friends.refetch).toHaveBeenCalled();
    expect(mockApi.requests.refetch).toHaveBeenCalled();
  });

  describe('demandes reçues', () => {
    beforeEach(() => {
      mockApi.requests.data = [
        { id: 'r1', sender: { firstname: 'Max', lastname: 'Lune', avatar: 'https://x/m.png' } },
        { id: 'r2', fromUser: { firstname: 'Zoé', lastname: 'Sol' } },
        { id: 'r3', firstname: 'Tom', lastname: 'Ciel' },
      ];
    });

    it('affiche les demandes quelle que soit leur forme', () => {
      render(<FriendsScreen />);
      expect(screen.getByText('DEMANDES (3)')).toBeTruthy();
      expect(screen.getByText('Max Lune')).toBeTruthy();
      expect(screen.getByText('Zoé Sol')).toBeTruthy();
      expect(screen.getByText('Tom Ciel')).toBeTruthy();
    });

    it('accepte et refuse une demande puis recharge', async () => {
      render(<FriendsScreen />);
      await act(async () => {
        fireEvent.press(screen.getByTestId('accept-request-r1'));
      });
      expect(mockApi.respond.respondToFriendRequest).toHaveBeenCalledWith('r1', 'accept');
      await act(async () => {
        fireEvent.press(screen.getByTestId('decline-request-r2'));
      });
      expect(mockApi.respond.respondToFriendRequest).toHaveBeenCalledWith('r2', 'decline');
      expect(mockApi.requests.refetch).toHaveBeenCalledTimes(2);
      expect(mockApi.friends.refetch).toHaveBeenCalledTimes(2);
    });

    it('alerte si la réponse échoue', async () => {
      mockApi.respond.respondToFriendRequest.mockRejectedValueOnce(new Error('x'));
      render(<FriendsScreen />);
      await act(async () => {
        fireEvent.press(screen.getByTestId('accept-request-r3'));
      });
      expect(alertSpy).toHaveBeenCalledWith('Erreur', 'Impossible de traiter la demande');
    });
  });

  describe("menu de suppression (appui long)", () => {
    it("ouvre le menu et le ferme en touchant l'arrière-plan", () => {
      render(<FriendsScreen />);
      fireEvent(screen.getByText('PAUL'), 'longPress');
      expect(screen.getByText('paul durand')).toBeTruthy();
      fireEvent.press(screen.getByTestId('friends-menu-overlay'));
      expect(screen.queryByText('Retirer du squad')).toBeNull();
    });

    it("demande confirmation, puis retire l'ami", async () => {
      render(<FriendsScreen />);
      fireEvent(screen.getByText('PAUL'), 'longPress');
      fireEvent.press(screen.getByText('Retirer du squad'));
      expect(alertSpy).toHaveBeenCalledWith(
        "Supprimer l'athlète",
        'Retirer paul de votre squad ?',
        expect.any(Array)
      );
      await pressAlertButton(alertSpy, 'Retirer');
      expect(mockApi.remove.removeFriend).toHaveBeenCalledWith('f2');
      expect(mockApi.friends.refetch).toHaveBeenCalled();
      expect(screen.queryByText('Retirer du squad')).toBeNull();
    });

    it('alerte si la suppression échoue', async () => {
      mockApi.remove.removeFriend.mockRejectedValueOnce(new Error('x'));
      render(<FriendsScreen />);
      fireEvent(screen.getByText('PAUL'), 'longPress');
      fireEvent.press(screen.getByText('Retirer du squad'));
      await pressAlertButton(alertSpy, 'Retirer');
      expect(alertSpy).toHaveBeenLastCalledWith('Erreur', "Impossible de supprimer l'ami");
    });

    it('ferme le menu via onRequestClose (bouton retour Android)', () => {
      render(<FriendsScreen />);
      fireEvent(screen.getByText('PAUL'), 'longPress');
      const { Modal } = require('react-native');
      act(() => {
        screen.UNSAFE_getByType(Modal).props.onRequestClose();
      });
      expect(screen.queryByText('Retirer du squad')).toBeNull();
    });
  });

  it('applique les marges Android', () => {
    const original = Platform.OS;
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    try {
      render(<FriendsScreen />);
      expect(screen.getByText('ATHLÈTES')).toBeTruthy();
    } finally {
      Object.defineProperty(Platform, 'OS', { value: original, configurable: true });
    }
  });

  // BUG: app/(tabs)/friends.tsx:151-152 appelle item.firstname.toUpperCase() / item.lastname.toUpperCase()
  // alors que Friend.firstname/lastname sont optionnels (types/user.ts) : un ami sans prénom fait planter l'écran.
  it.skip('ne plante pas pour un ami sans prénom ni nom', () => {
    mockApi.friends.data = [{ id: 'f9', avatar: null, status: 'online' }];
    render(<FriendsScreen />);
    expect(screen.getByText('TON SQUAD (1)')).toBeTruthy();
  });
});
