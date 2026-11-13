import React from 'react';
import { Alert } from 'react-native';

jest.mock('@expo/vector-icons', () => require('../../__testutils__/vectorIconsMock'));
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { FriendsList } from '../FriendsList';

const friends = [
  { id: 'f1', firstname: 'Ana', lastname: 'B', email: 'ana@x.fr' },
  { id: 'f2', email: 'nobody@x.fr' },
];
const requests = [{ id: 'r1', firstname: 'Bob', email: 'bob@x.fr', status: 'pending' as const }];

const lastAlertButtons = () => (Alert.alert as jest.Mock).mock.calls.at(-1)[2];

describe('FriendsList', () => {
  beforeEach(() => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('affiche les demandes et les amis', () => {
    render(<FriendsList friends={friends} friendRequests={requests} />);
    expect(screen.getByText("Demandes d'amis")).toBeOnTheScreen();
    expect(screen.getByText('Mes amis')).toBeOnTheScreen();
    expect(screen.getByText('Bob')).toBeOnTheScreen();
    expect(screen.getByText('Ana B')).toBeOnTheScreen();
  });

  it('sans demandes : pas de section demandes', () => {
    render(<FriendsList friends={friends} friendRequests={[]} />);
    expect(screen.queryByText("Demandes d'amis")).toBeNull();
  });

  it('état vide avec action Ajouter un ami', () => {
    const onAddFriend = jest.fn();
    render(<FriendsList friends={[]} friendRequests={[]} onAddFriend={onAddFriend} />);
    expect(screen.getByText('Aucun ami trouvé')).toBeOnTheScreen();
    fireEvent.press(screen.getByText('Ajouter un ami'));
    expect(onAddFriend).toHaveBeenCalled();
  });

  it('accepter / refuser une demande', async () => {
    const onRespond = jest.fn(() => Promise.resolve());
    render(<FriendsList friends={[]} friendRequests={requests} onRespondToRequest={onRespond} />);
    await act(async () => fireEvent.press(screen.getByText('Accepter')));
    await act(async () => fireEvent.press(screen.getByText('Refuser')));
    expect(onRespond).toHaveBeenCalledWith('r1', 'accept');
    expect(onRespond).toHaveBeenCalledWith('r1', 'decline');
  });

  it('erreur lors de la réponse : alerte', async () => {
    const onRespond = jest.fn(() => Promise.reject(new Error('x')));
    render(<FriendsList friends={[]} friendRequests={requests} onRespondToRequest={onRespond} />);
    await act(async () => fireEvent.press(screen.getByText('Accepter')));
    expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Une erreur est survenue');
  });

  it('réponse sans callback : rien ne se passe', async () => {
    render(<FriendsList friends={[]} friendRequests={requests} />);
    await act(async () => fireEvent.press(screen.getByText('Accepter')));
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('isResponding : boutons de demande en chargement', () => {
    render(<FriendsList friends={[]} friendRequests={requests} isResponding />);
    expect(screen.queryByText('Accepter')).toBeNull();
  });

  it('supprimer un ami : confirmation puis appel', async () => {
    const onRemove = jest.fn(() => Promise.resolve());
    render(<FriendsList friends={friends} friendRequests={[]} onRemoveFriend={onRemove} />);
    fireEvent.press(screen.getAllByText('Supprimer')[0]);
    expect(Alert.alert).toHaveBeenCalledWith(
      'Supprimer ami',
      'Êtes-vous sûr de vouloir supprimer Ana B de vos amis ?',
      expect.any(Array)
    );
    await act(async () => {
      await lastAlertButtons()[1].onPress();
    });
    expect(onRemove).toHaveBeenCalledWith('f1');
  });

  it('supprimer : nom par défaut = email, erreur → alerte', async () => {
    const onRemove = jest.fn(() => Promise.reject(new Error('x')));
    render(<FriendsList friends={friends} friendRequests={[]} onRemoveFriend={onRemove} />);
    fireEvent.press(screen.getAllByText('Supprimer')[1]);
    expect((Alert.alert as jest.Mock).mock.calls[0][1]).toContain('nobody@x.fr');
    await act(async () => {
      await lastAlertButtons()[1].onPress();
    });
    expect(Alert.alert).toHaveBeenLastCalledWith('Erreur', 'Une erreur est survenue');
  });

  it('supprimer sans callback', async () => {
    render(<FriendsList friends={friends} friendRequests={[]} />);
    fireEvent.press(screen.getAllByText('Supprimer')[0]);
    await act(async () => {
      await lastAlertButtons()[1].onPress();
    });
    expect(Alert.alert).toHaveBeenCalledTimes(1);
  });
});
