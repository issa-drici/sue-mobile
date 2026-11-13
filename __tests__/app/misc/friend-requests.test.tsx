import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { ActivityIndicator, Alert } from 'react-native';

import FriendRequestsScreen from '../../../app/friend-requests';
import { mockRouter, resetRouter, silenceConsole } from '../../../test-utils/screens';

jest.mock('expo-router', () => require('../../../test-utils/screens').expoRouterMock());

const mockState = { requests: {} as any, respond: jest.fn(), globalRefetch: jest.fn() };
jest.mock('../../../services', () => ({
  useGetFriendRequests: () => mockState.requests,
  useRespondToFriendRequest: () => ({ respondToFriendRequest: mockState.respond }),
}));
jest.mock('../../../context/globalFriendRequests', () => ({
  useGlobalFriendRequests: () => ({ refetch: mockState.globalRefetch }),
}));

describe('FriendRequestsScreen', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    silenceConsole();
    resetRouter();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockState.respond = jest.fn(() => Promise.resolve());
    mockState.globalRefetch = jest.fn();
    mockState.requests = {
      data: [
        { id: 'r1', sender: { firstname: 'Max', lastname: 'Lune', avatar: 'https://x/a.png' } },
        { id: 'r2', fromUser: { firstname: 'Zoé', lastname: 'Sol' } },
        { id: 'r3' },
      ],
      isLoading: false,
      refetch: jest.fn(() => Promise.resolve()),
    };
  });
  afterEach(() => jest.restoreAllMocks());

  it('affiche un loader pendant le chargement', () => {
    mockState.requests = { ...mockState.requests, data: [], isLoading: true };
    render(<FriendRequestsScreen />);
    expect(screen.UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    expect(mockRouter.back).not.toHaveBeenCalled();
  });

  it('affiche les demandes (avatar, initiales, "?")', () => {
    render(<FriendRequestsScreen />);
    expect(screen.getByText('Demandes d’amis')).toBeTruthy();
    expect(screen.getByText('Max Lune')).toBeTruthy();
    expect(screen.getByText('Zoé Sol')).toBeTruthy();
    expect(screen.getByText('ZS')).toBeTruthy();
    expect(screen.getByText('?')).toBeTruthy();
  });

  it('revient en arrière', () => {
    render(<FriendRequestsScreen />);
    fireEvent.press(screen.getByTestId('friend-requests-back'));
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('accepte / refuse puis recharge la liste et le compteur global', async () => {
    render(<FriendRequestsScreen />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('accept-r1'));
    });
    expect(mockState.respond).toHaveBeenCalledWith('r1', 'accept');
    await act(async () => {
      fireEvent.press(screen.getByTestId('decline-r2'));
    });
    expect(mockState.respond).toHaveBeenCalledWith('r2', 'decline');
    expect(mockState.requests.refetch).toHaveBeenCalledTimes(2);
    expect(mockState.globalRefetch).toHaveBeenCalledTimes(2);
  });

  it('alerte si la réponse échoue', async () => {
    mockState.respond.mockRejectedValueOnce(new Error('x'));
    render(<FriendRequestsScreen />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('accept-r3'));
    });
    expect(alertSpy).toHaveBeenCalledWith('Erreur', 'Impossible de traiter la demande');
  });

  it("se ferme automatiquement quand il n'y a plus de demande (retour possible)", () => {
    mockState.requests.data = [];
    render(<FriendRequestsScreen />);
    expect(mockRouter.back).toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('va aux onglets quand aucun retour n’est possible', () => {
    mockState.requests.data = [];
    mockRouter.canGoBack.mockReturnValue(false);
    render(<FriendRequestsScreen />);
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
  });
});
