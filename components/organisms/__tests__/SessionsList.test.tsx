import React from 'react';
import { RefreshControl } from 'react-native';

jest.mock('@expo/vector-icons', () => require('../../__testutils__/vectorIconsMock'));
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('../../../utils/dateHelpers', () => ({
  formatDate: () => 'date',
  formatTimeFrance: () => 'heure',
}));
jest.mock('../../../utils/timeHelpers', () => ({ isSessionFinished: () => false }));

import { render, screen, fireEvent } from '@testing-library/react-native';
import { SessionsList } from '../SessionsList';

const sessions = [
  { id: '1', sport: 'tennis', location: 'Club', startTime: 's' },
  { id: '2', title: 'Match', sport: 'foot', location: 'Stade', startTime: 's' },
];

describe('SessionsList', () => {
  beforeEach(() => mockPush.mockClear());

  it('affiche les sessions avec titre par défaut = sport capitalisé', () => {
    render(<SessionsList sessions={sessions} />);
    expect(screen.getByText('Tennis')).toBeOnTheScreen();
    expect(screen.getByText('Match')).toBeOnTheScreen();
  });

  it('onSessionPress reçoit la session', () => {
    const onSessionPress = jest.fn();
    render(<SessionsList sessions={sessions} onSessionPress={onSessionPress} />);
    fireEvent.press(screen.getByText('Match'));
    expect(onSessionPress).toHaveBeenCalledWith(sessions[1]);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('sans onSessionPress : navigation par défaut', () => {
    render(<SessionsList sessions={sessions} showActions />);
    fireEvent.press(screen.getByText('Tennis'));
    expect(mockPush).toHaveBeenCalledWith('/session/1');
    expect(screen.getAllByText('Voir détails')).toHaveLength(2);
  });

  it('état vide', () => {
    render(<SessionsList sessions={[]} emptyState={{ title: 'Aucune session', icon: 'calendar' }} />);
    expect(screen.getByText('Aucune session')).toBeOnTheScreen();
  });

  it('liste vide sans emptyState et refresh', () => {
    const onRefresh = jest.fn();
    const { UNSAFE_getByType } = render(<SessionsList sessions={[]} onRefresh={onRefresh} />);
    UNSAFE_getByType(RefreshControl).props.onRefresh();
    expect(onRefresh).toHaveBeenCalled();
  });
});
