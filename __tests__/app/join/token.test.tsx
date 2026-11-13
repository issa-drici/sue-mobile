import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import JoinSessionScreen from '../../../app/join/[token]';
import { SessionsApi } from '../../../services/api/sessionsApi';
import { clearPendingShareToken, setPendingShareToken } from '../../../utils/shareLink';
import type { SessionSharePreview } from '../../../services/types/sessions';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
let mockParams: Record<string, string | undefined> = {};
let mockAuth = { isAuthenticated: true };

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
}));
jest.mock('../../../app/context/auth', () => ({ useAuth: () => mockAuth }));
jest.mock('../../../services/api/sessionsApi', () => ({
  SessionsApi: { resolveShareToken: jest.fn(), joinByShareToken: jest.fn() },
}));
jest.mock('../../../utils/shareLink', () => ({
  setPendingShareToken: jest.fn(() => Promise.resolve()),
  clearPendingShareToken: jest.fn(() => Promise.resolve()),
}));

const resolveMock = SessionsApi.resolveShareToken as jest.Mock;
const joinMock = SessionsApi.joinByShareToken as jest.Mock;

function makePreview(overrides: Partial<SessionSharePreview> = {}): SessionSharePreview {
  return {
    sport: 'padel' as any,
    sportName: 'Padel',
    date: '2026-07-06',
    startTime: '18:00:00',
    endTime: '19:30:00',
    startDate: '2026-07-06T18:00:00',
    endDate: '2026-07-06T19:30:00',
    location: 'Padel Club Paris',
    scheduling: 'scheduled',
    participantsCount: 5,
    organizer: { id: 'org', fullName: 'Marc Dupont', avatarUrl: null },
    participants: [
      { id: 'org', fullName: 'Marc Dupont', status: 'accepted', avatarUrl: null },
      { id: 'p1', fullName: 'Julie Martin', status: 'accepted', avatarUrl: 'https://img/julie.png' },
      { id: 'p2', fullName: 'Paul Durand', status: 'accepted', avatarUrl: null },
      { id: 'p3', fullName: 'Zoé Petit', status: 'pending', avatarUrl: null },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = { token: 'tok-123' };
  mockAuth = { isAuthenticated: true };
});

describe('JoinSessionScreen', () => {
  it("affiche un loader pendant la résolution du lien", () => {
    resolveMock.mockReturnValue(new Promise(() => {}));
    render(<JoinSessionScreen />);
    expect(screen.queryByText('Lien indisponible')).toBeNull();
    expect(screen.queryByText('Plus tard')).toBeNull();
  });

  it("affiche l'erreur quand aucun token n'est fourni", async () => {
    mockParams = {};
    render(<JoinSessionScreen />);
    expect(await screen.findByText('Lien indisponible')).toBeTruthy();
    expect(resolveMock).not.toHaveBeenCalled();
  });

  it("affiche l'erreur si la résolution échoue et permet de revenir à l'accueil", async () => {
    resolveMock.mockRejectedValue(new Error('404'));
    render(<JoinSessionScreen />);
    fireEvent.press(await screen.findByText("Retour à l'accueil"));
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
  });

  it('redirige directement vers la session si déjà participant', async () => {
    resolveMock.mockResolvedValue(makePreview({ sessionId: 's-42', viewerRelationship: 'participant' }));
    render(<JoinSessionScreen />);
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/session/s-42'));
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
  });

  it("passe le paramètre from à l'API", async () => {
    mockParams = { token: 'tok-123', from: 'u-9' };
    resolveMock.mockResolvedValue(makePreview());
    render(<JoinSessionScreen />);
    await screen.findByText('Plus tard');
    expect(resolveMock).toHaveBeenCalledWith('tok-123', 'u-9');
  });

  it("affiche l'aperçu d'une session planifiée avec organisateur et participants", async () => {
    resolveMock.mockResolvedValue(makePreview());
    render(<JoinSessionScreen />);
    expect(await screen.findByText('Organisé par Marc Dupont')).toBeTruthy();
    expect(screen.getByText(/Padel$/)).toBeTruthy();
    expect(screen.getByText('18:00 – 19:30')).toBeTruthy();
    expect(screen.getByText('Padel Club Paris')).toBeTruthy();
    expect(screen.getByText('Organisateur')).toBeTruthy();
    expect(screen.getByText('Julie')).toBeTruthy();
    expect(screen.getByText('Paul')).toBeTruthy();
    expect(screen.queryByText('Zoé')).toBeNull();
    // 5 - 1 organisateur - 2 affichés = +2
    expect(screen.getByText('+2')).toBeTruthy();
    expect(screen.getByText('Je rejoins la session')).toBeTruthy();
    expect(screen.getAllByText('MD').length).toBe(2);
  });

  it("utilise l'invitant, l'avatar et le rôle féminin", async () => {
    resolveMock.mockResolvedValue(
      makePreview({
        organizer: { id: 'org', fullName: 'Sophie Laurent', avatarUrl: 'https://img/s.png' },
        inviter: { fullName: 'Karim Benali', avatarUrl: null },
        participants: undefined,
        participantsCount: 1,
      })
    );
    render(<JoinSessionScreen />);
    expect(await screen.findByText('Karim')).toBeTruthy();
    expect(screen.getByText('Organisatrice')).toBeTruthy();
    expect(screen.getByText('?')).toBeTruthy();
  });

  it('affiche les créneaux proposés pour une session "trouver un créneau"', async () => {
    resolveMock.mockResolvedValue(
      makePreview({
        scheduling: 'finding_slot',
        slotProposals: [
          { date: '2026-07-06', startTime: '10:00', endTime: '11:00' },
          { date: '2026-07-07', startTime: '', endTime: '12:00' },
        ],
      })
    );
    render(<JoinSessionScreen />);
    expect(await screen.findByText('Date à définir')).toBeTruthy();
    expect(screen.getByText(/10:00 – 11:00/)).toBeTruthy();
    expect(screen.getByText(/00:00 – 12:00/)).toBeTruthy();
    expect(screen.getByText('Donner mes disponibilités')).toBeTruthy();
  });

  it('gère les créneaux absents et le libellé non connecté en mode créneau', async () => {
    mockAuth = { isAuthenticated: false };
    resolveMock.mockResolvedValue(makePreview({ scheduling: 'finding_slot', slotProposals: undefined }));
    render(<JoinSessionScreen />);
    expect(await screen.findByText('Se connecter pour répondre')).toBeTruthy();
  });

  it("non connecté : mémorise le token et redirige vers la connexion", async () => {
    mockAuth = { isAuthenticated: false };
    resolveMock.mockResolvedValue(makePreview());
    render(<JoinSessionScreen />);
    fireEvent.press(await screen.findByText('Se connecter pour rejoindre'));
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/(auth)/login'));
    expect(setPendingShareToken).toHaveBeenCalledWith('tok-123');
    expect(joinMock).not.toHaveBeenCalled();
  });

  it('connecté : rejoint la session et redirige', async () => {
    resolveMock.mockResolvedValue(makePreview());
    let resolveJoin: (v: any) => void = () => {};
    joinMock.mockReturnValue(new Promise((r) => (resolveJoin = r)));
    render(<JoinSessionScreen />);
    fireEvent.press(await screen.findByText('Je rejoins la session'));
    expect(await screen.findByText('On te fait entrer…')).toBeTruthy();
    await act(async () => resolveJoin({ id: 's-77' }));
    expect(clearPendingShareToken).toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith('/session/s-77');
  });

  it("affiche le message d'erreur si l'adhésion échoue", async () => {
    resolveMock.mockResolvedValue(makePreview());
    joinMock.mockRejectedValue(new Error('Session complète'));
    render(<JoinSessionScreen />);
    fireEvent.press(await screen.findByText('Je rejoins la session'));
    expect(await screen.findByText('Session complète')).toBeTruthy();
  });

  it("affiche un message générique si l'erreur n'a pas de message", async () => {
    resolveMock.mockResolvedValue(makePreview());
    joinMock.mockRejectedValue({});
    render(<JoinSessionScreen />);
    fireEvent.press(await screen.findByText('Je rejoins la session'));
    expect(await screen.findByText('Impossible de rejoindre la session pour le moment.')).toBeTruthy();
  });

  it('rejoint automatiquement avec auto=1 une seule fois', async () => {
    mockParams = { token: 'tok-123', auto: '1' };
    resolveMock.mockResolvedValue(makePreview());
    joinMock.mockResolvedValue({ id: 's-1' });
    render(<JoinSessionScreen />);
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/session/s-1'));
    expect(joinMock).toHaveBeenCalledTimes(1);
  });

  it('"Plus tard" renvoie vers l\'accueil', async () => {
    resolveMock.mockResolvedValue(makePreview());
    render(<JoinSessionScreen />);
    fireEvent.press(await screen.findByText('Plus tard'));
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
  });

  it("ignore la réponse si l'écran est démonté", async () => {
    let resolveFn: (v: any) => void = () => {};
    resolveMock.mockReturnValue(new Promise((r) => (resolveFn = r)));
    const { unmount } = render(<JoinSessionScreen />);
    unmount();
    await act(async () => resolveFn(makePreview({ sessionId: 'x' })));
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it("ignore l'erreur si l'écran est démonté", async () => {
    let rejectFn: (e: any) => void = () => {};
    resolveMock.mockReturnValue(new Promise((_, r) => (rejectFn = r)));
    const { unmount } = render(<JoinSessionScreen />);
    unmount();
    await act(async () => rejectFn(new Error('x')));
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });
});
