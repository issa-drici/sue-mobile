import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Platform } from 'react-native';

import HistoryScreen from '../../../app/(tabs)/history';
import { mockRouter, resetRouter, silenceConsole } from '../../../test-utils/screens';

jest.mock('expo-router', () => require('../../../test-utils/screens').expoRouterMock());

const mockHistory = { current: {} as any };
jest.mock('../../../services', () => ({ useGetHistory: () => mockHistory.current }));

const mockPull = { refreshing: false, onRefresh: jest.fn() };
const mockUsePull = jest.fn((_opts: any) => mockPull);
jest.mock('../../../hooks/usePullToRefresh', () => ({ usePullToRefresh: (o: any) => mockUsePull(o) }));
jest.mock('../../../components/PullToRefresh', () => {
  const { RefreshControl } = require('react-native');
  return { __esModule: true, default: (p: any) => <RefreshControl {...p} /> };
});

const now = new Date();
const pad = (n: number) => String(n).padStart(2, '0');
const thisMonth = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;

const session = (id: string, sport: string, date: string, extra: Record<string, any> = {}) => ({
  id,
  sport,
  date,
  startTime: '18:30:00',
  endTime: '20:00:00',
  location: `stade ${id}`,
  organizer: { id: 'o', firstname: 'O', lastname: 'R' },
  participants: [
    { id: 'a', firstname: 'A', lastname: 'B', status: 'accepted' },
    { id: 'c', firstname: 'C', lastname: 'D', status: 'declined' },
  ],
  comments: [],
  ...extra,
});

describe('HistoryScreen (onglet)', () => {
  beforeEach(() => {
    silenceConsole();
    resetRouter();
    mockUsePull.mockClear();
    mockHistory.current = {
      data: [
        session('s1', 'football', '2020-03-15'),
        session('s2', 'tennis', thisMonth, { status: 'cancelled' }),
        session('s3', 'football', '2021-07-04'),
      ],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    };
  });
  afterEach(() => jest.restoreAllMocks());

  it('affiche les statistiques et les filtres par sport', () => {
    render(<HistoryScreen />);
    expect(screen.getByText('LÉGENDE')).toBeTruthy();
    expect(screen.getAllByText('3').length).toBeGreaterThan(0); // total
    expect(screen.getAllByText('1').length).toBeGreaterThan(0); // ce mois
    expect(screen.getByText('TOUS 3')).toBeTruthy();
    expect(screen.getByText('FOOTBALL 2')).toBeTruthy();
    expect(screen.getByText('TENNIS 1')).toBeTruthy();
    expect(mockUsePull).toHaveBeenCalledWith(expect.objectContaining({ minDelay: 800, onRefresh: mockHistory.current.refetch }));
  });

  it('trie les sessions de la plus récente à la plus ancienne', () => {
    render(<HistoryScreen />);
    const locations = screen.getAllByText(/^STADE/).map((n) => n.props.children);
    expect(locations).toEqual(['STADE S2', 'STADE S3', 'STADE S1']);
    expect(screen.getAllByText('1 ATHLÈTES')).toHaveLength(3);
  });

  it('filtre par sport', () => {
    render(<HistoryScreen />);
    fireEvent.press(screen.getByText('TENNIS 1'));
    expect(screen.getAllByText(/^STADE/)).toHaveLength(1);
    expect(screen.getByText('STADE S2')).toBeTruthy();
    fireEvent.press(screen.getByText('TOUS 3'));
    expect(screen.getAllByText(/^STADE/)).toHaveLength(3);
  });

  it("ouvre une session depuis l'historique", () => {
    render(<HistoryScreen />);
    fireEvent.press(screen.getByText('STADE S1'));
    expect(mockRouter.push).toHaveBeenCalledWith('/session/s1?source=history');
  });

  it.each([
    [{ isLoading: true }, 'CHARGEMENT...'],
    [{ error: new Error('x') }, 'ERREUR SYSTÈME'],
    [{}, 'AUCUNE SESSION'],
  ])('affiche le bon état vide %j', (extra, text) => {
    mockHistory.current = { ...mockHistory.current, data: [], ...extra };
    render(<HistoryScreen />);
    expect(screen.getByText(text)).toBeTruthy();
  });

  it('applique les marges Android', () => {
    const original = Platform.OS;
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    try {
      render(<HistoryScreen />);
      expect(screen.getByText('VOTRE')).toBeTruthy();
    } finally {
      Object.defineProperty(Platform, 'OS', { value: original, configurable: true });
    }
  });
});
