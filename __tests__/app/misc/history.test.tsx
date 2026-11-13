import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import HistoryScreen from '../../../app/history';
import { mockRouter, resetRouter, silenceConsole } from '../../../test-utils/screens';

jest.mock('expo-router', () => require('../../../test-utils/screens').expoRouterMock());

const mockHistory = { current: {} as any };
jest.mock('../../../services', () => ({ useGetHistory: () => mockHistory.current }));

const session = (id: string, sport: string, date: string, extra: Record<string, any> = {}) => ({
  id,
  sport,
  date,
  startTime: '10:00',
  endTime: '11:00',
  location: `Lieu ${id}`,
  organizer: { id: 'o', firstname: 'O', lastname: 'R' },
  participants: [],
  comments: [],
  ...extra,
});

describe('HistoryScreen (écran historique hors onglets)', () => {
  beforeEach(() => {
    silenceConsole();
    resetRouter();
    mockHistory.current = {
      data: [
        session('s1', 'tennis', '2021-05-01', {
          participants: [
            { id: 'p1', firstname: 'Ana', lastname: 'A', status: 'accepted' },
            { id: 'p2', firstname: 'Ben', lastname: 'B', status: 'declined' },
            { id: 'p3', firstname: 'Cé', lastname: 'C', status: 'pending' },
          ],
          comments: [{ id: 'c1' }],
        }),
        session('s2', 'football', '2022-05-01', { comments: [{ id: 'c1' }, { id: 'c2' }] }),
        session('future', 'tennis', '2999-01-01'),
      ],
      isLoading: false,
      error: null,
    };
  });
  afterEach(() => jest.restoreAllMocks());

  it('affiche uniquement les sessions passées, de la plus récente à la plus ancienne', () => {
    render(<HistoryScreen />);
    expect(screen.getByText('Historique')).toBeTruthy();
    const locations = screen.getAllByText(/^Lieu /).map((n) => n.props.children);
    expect(locations).toEqual(['Lieu s2', 'Lieu s1']);
  });

  it('affiche participants, statuts et nombre de commentaires', () => {
    render(<HistoryScreen />);
    expect(screen.getByText('Ana A')).toBeTruthy();
    expect(screen.getByText('✓')).toBeTruthy();
    expect(screen.getByText('✕')).toBeTruthy();
    expect(screen.getByText('?')).toBeTruthy();
    expect(screen.getByText('1 commentaire')).toBeTruthy();
    expect(screen.getByText('2 commentaires')).toBeTruthy();
  });

  it('filtre par sport (insensible à la casse) et liste vide pour un sport absent', () => {
    render(<HistoryScreen />);
    fireEvent.press(screen.getByText('Tennis'));
    expect(screen.getAllByText(/^Lieu /)).toHaveLength(1);
    fireEvent.press(screen.getByText('Natation'));
    expect(screen.queryAllByText(/^Lieu /)).toHaveLength(0);
    fireEvent.press(screen.getByText('Tous'));
    expect(screen.getAllByText(/^Lieu /)).toHaveLength(2);
  });

  it('ouvre une session', () => {
    render(<HistoryScreen />);
    fireEvent.press(screen.getByText('Lieu s1'));
    expect(mockRouter.push).toHaveBeenCalledWith('/session/s1');
  });

  it("affiche l'erreur", () => {
    mockHistory.current = { data: [], isLoading: false, error: 'Réseau indisponible' };
    render(<HistoryScreen />);
    expect(screen.getByText('Erreur: Réseau indisponible')).toBeTruthy();
  });
});
