process.env.TZ = 'Europe/Paris';

import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Platform, RefreshControl } from 'react-native';

import HomeScreen from '../../../app/(tabs)/index';
import { makeAuth, mockRouter, resetRouter, silenceConsole, testUser } from '../../../test-utils/screens';

jest.mock('expo-router', () => require('../../../test-utils/screens').expoRouterMock());
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (cb: () => void) => require('react').useEffect(() => cb(), [cb]),
}));

const mockAuth = { current: {} as any };
jest.mock('../../../app/context/auth', () => ({ useAuth: () => mockAuth.current }));

const mockSessions = { current: {} as any };
jest.mock('../../../services', () => ({ useGetSessions: () => mockSessions.current }));

const mockFriendRequests = { current: {} as any };
jest.mock('../../../context/globalFriendRequests', () => ({
  useGlobalFriendRequests: () => mockFriendRequests.current,
}));
jest.mock('../../../context/globalNotifications', () => ({
  useGlobalNotifications: () => ({ unreadCount: 2 }),
}));

jest.mock('../../../components/organisms/HomeEmptyState', () => {
  const { Text } = require('react-native');
  return {
    HomeEmptyState: () => <Text>home-empty-state</Text>,
    QuickCreateRow: () => <Text>quick-create-row</Text>,
    NextSessionPrompt: ({ title, hint }: any) => <Text>{`prompt:${title}|${hint}`}</Text>,
  };
});
jest.mock('../../../components/organisms/NotificationsCard', () => {
  const { Text } = require('react-native');
  return { NotificationsCard: () => <Text>notifications-card</Text> };
});
jest.mock('../../../components/organisms/Badges', () => {
  const { Text } = require('react-native');
  return { BadgeCelebration: ({ checkKey }: any) => <Text>{`badge-check:${checkKey}`}</Text> };
});
// Football : terrain + icône 3D ; aquafitness : icône 3D seule ; curling : rien
jest.mock('../../../components/atoms/SportIcon', () => ({
  SportIcon: ({ children }: any) => children ?? null,
  hasSportImage: (s: string) => ['football', 'aquafitness'].includes((s || '').toLowerCase()),
}));
jest.mock('../../../components/atoms/SportSurface', () => ({
  SportSurface: () => null,
  hasSportSurface: (s: string) => (s || '').toLowerCase() === 'football',
}));

const day = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const person = (id: string, status = 'accepted', extra: Record<string, any> = {}) => ({
  id,
  firstname: `F${id}`,
  lastname: `L${id}`,
  status,
  ...extra,
});

const session = (id: string, overrides: Record<string, any> = {}) => ({
  id,
  sport: 'football',
  date: day(3),
  startTime: '18:00:00',
  endTime: '20:00:00',
  location: `Lieu ${id}`,
  maxParticipants: null,
  scheduling: 'fixed',
  status: 'active',
  organizer: { id: 'other', firstname: 'O', lastname: 'R' },
  participants: [],
  comments: [],
  ...overrides,
});

const setSessions = (data: any[] | null, extra: Record<string, any> = {}) => {
  mockSessions.current = {
    data,
    isLoading: false,
    isFirstLoading: false,
    refetch: jest.fn(() => Promise.resolve()),
    ...extra,
  };
};

describe('HomeScreen (onglet Sessions)', () => {
  beforeEach(() => {
    silenceConsole();
    resetRouter();
    mockAuth.current = makeAuth();
    mockFriendRequests.current = { friendRequestsCount: 0, refetch: jest.fn(() => Promise.resolve()) };
    setSessions([]);
  });
  afterEach(() => jest.restoreAllMocks());

  it("affiche l'état vide quand il n'y a aucune session", () => {
    render(<HomeScreen />);
    expect(screen.getByText('home-empty-state')).toBeTruthy();
    expect(screen.getByText('Bonjour Alex 👋')).toBeTruthy();
    expect(screen.queryByText('PROCHAINE SESSION')).toBeNull();
    expect(screen.queryByText('notifications-card')).toBeNull();
  });

  it('recharge les demandes et relance la vérification des badges au focus', () => {
    render(<HomeScreen />);
    expect(mockFriendRequests.current.refetch).toHaveBeenCalled();
    expect(screen.getByText('badge-check:1')).toBeTruthy();
  });

  it('affiche un chargement au premier chargement (données nulles)', () => {
    setSessions(null, { isFirstLoading: true });
    render(<HomeScreen />);
    expect(screen.queryByText('home-empty-state')).toBeNull();
    expect(screen.getAllByText('Chargement...').length).toBeGreaterThan(0);
    expect(screen.getByText('À VENIR')).toBeTruthy();
  });

  it("utilise le prénom par défaut et l'avatar par défaut sans utilisateur complet", () => {
    mockAuth.current = makeAuth({ user: { ...testUser, firstname: '', avatar: 'https://x/a.png' } });
    render(<HomeScreen />);
    expect(screen.getByText('Bonjour Issa 👋')).toBeTruthy();
  });

  it("affiche le bouton des demandes d'amis avec compteur et navigue", () => {
    mockFriendRequests.current.friendRequestsCount = 3;
    render(<HomeScreen />);
    fireEvent.press(screen.getByText('3'));
    expect(mockRouter.push).toHaveBeenCalledWith('/friend-requests');
  });

  describe('avec des sessions', () => {
    const fiveAccepted = [
      person('me', 'accepted', { avatar: 'https://x/me.png' }),
      { id: '', firstname: '', lastname: '', status: 'accepted' },
      person('a'),
      person('b'),
      person('c'),
      person('d', 'declined'),
    ];
    const data = () => [
      // Prochaine session : j'organise, complète (5/5), +2 avatars
      session('next', { organizer: { id: 'u1', firstname: 'A', lastname: 'R' }, maxParticipants: 5, participants: fiveAccepted }),
      // Demain, je n'y suis pas : complet sur 2
      session('tomorrow', { sport: 'tennis', date: day(1), maxParticipants: 2, participants: [person('a'), person('b')] }),
      // Aujourd'hui tard : il manque 1 joueur
      session('today', { sport: 'aquafitness', date: day(0), startTime: '23:59:59', maxParticipants: 2, participants: [person('a')] }),
      // Invitation en attente, sport sans terrain ni icône, session ouverte, heure manquante
      session('invite', { sport: 'curling', date: day(5), startTime: '', participants: [person('u1', 'pending')] }),
      // Il manque 3 joueurs, sport football (fond sombre)
      session('missing', { date: day(8), maxParticipants: 4, participants: [person('x')] }),
      // À organiser : la mienne, 2 créneaux, 1 invité sur 2 a répondu
      session('org-mine', {
        scheduling: 'finding_slot',
        organizer: { id: 'u1', firstname: 'A', lastname: 'R' },
        slotProposals: [{ id: 's1' }, { id: 's2' }],
        participants: [
          person('u1'),
          person('i1', 'pending', { hasGivenAvailability: true }),
          person('i2', 'pending', { hasGivenAvailability: true, hasNewSlots: true }),
          person('i3', 'declined'),
        ],
      }),
      // À organiser : la mienne sans créneau ni invité
      session('org-empty', { sport: 'curling', scheduling: 'finding_slot', organizer: { id: 'u1', firstname: 'A', lastname: 'R' }, slotProposals: [], participants: [] }),
      // À organiser par un autre : nouveau créneau → je dois répondre
      session('org-new', { scheduling: 'finding_slot', slotProposals: [{ id: 's' }], participants: [person('u1', 'pending', { hasGivenAvailability: true, hasNewSlots: true })] }),
      // À organiser par un autre : déjà répondu
      session('org-done', { sport: 'tennis', scheduling: 'finding_slot', slotProposals: [{ id: 's' }, { id: 't' }], participants: [person('u1', 'accepted', { hasGivenAvailability: true })] }),
      // Masquées : sans créneau d'un autre, annulée
      session('org-hidden', { scheduling: 'finding_slot', slotProposals: [], participants: [] }),
      session('org-cancelled', { scheduling: 'finding_slot', status: 'cancelled', slotProposals: [{ id: 's' }], participants: [] }),
    ];

    it('affiche la prochaine session de l’utilisateur avec ses informations', () => {
      setSessions(data());
      render(<HomeScreen />);
      expect(screen.getByText('PROCHAINE SESSION')).toBeTruthy();
      expect(screen.getAllByText('Football').length).toBeGreaterThan(0);
      expect(screen.getByText('Lieu next')).toBeTruthy();
      expect(screen.getByText('+2')).toBeTruthy();
      expect(screen.getByText('?')).toBeTruthy();
      expect(screen.getAllByText('FL').length).toBeGreaterThan(0);
      expect(screen.getByText('quick-create-row')).toBeTruthy();
      expect(screen.getByText('notifications-card')).toBeTruthy();
    });

    it('affiche les sessions à venir avec leurs statuts et dates', () => {
      setSessions(data());
      render(<HomeScreen />);
      expect(screen.getByText('Demain • 18:00')).toBeTruthy();
      expect(screen.getByText("Aujourd'hui • 23:59")).toBeTruthy();
      expect(screen.getAllByText('Complet').length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('Il manque 1 joueur')).toBeTruthy();
      expect(screen.getByText('Il manque 3 joueurs')).toBeTruthy();
      expect(screen.getByText('Session ouverte')).toBeTruthy();
      expect(screen.getByText('Invitation à confirmer')).toBeTruthy();
      expect(screen.getByText(/ • 00:00$/)).toBeTruthy();
      expect(screen.getAllByText('Curling').length).toBeGreaterThan(0);
    });

    it('affiche la section À ORGANISER avec les bons statuts', () => {
      setSessions(data());
      render(<HomeScreen />);
      expect(screen.getByText('À ORGANISER')).toBeTruthy();
      expect(screen.getAllByText('Créneau à définir · 2 proposés')).toHaveLength(2);
      expect(screen.getByText('Créneau à définir · 1 proposé')).toBeTruthy();
      expect(screen.getByText('Aucun créneau à venir')).toBeTruthy();
      expect(screen.getByText('1/2 réponse')).toBeTruthy();
      expect(screen.getByText('0/0 réponse')).toBeTruthy();
      expect(screen.getByText('Nouveau créneau')).toBeTruthy();
      expect(screen.getByText('Répondre')).toBeTruthy();
      expect(screen.getByText('Répondu')).toBeTruthy();
      expect(screen.queryByText('Lieu org-hidden')).toBeNull();
      expect(screen.queryByText('Lieu org-cancelled')).toBeNull();
    });

    it('navigue vers une session et vers son invitation', () => {
      setSessions(data());
      render(<HomeScreen />);
      fireEvent.press(screen.getByText('Voir la session'));
      expect(mockRouter.push).toHaveBeenCalledWith('/session/next');
      fireEvent.press(screen.getByText('Inviter des joueurs'));
      expect(mockRouter.push).toHaveBeenCalledWith('/session/next?openInvite=true');
      fireEvent.press(screen.getByText('Lieu tomorrow'));
      expect(mockRouter.push).toHaveBeenCalledWith('/session/tomorrow');
      fireEvent.press(screen.getByText('Lieu org-mine'));
      expect(mockRouter.push).toHaveBeenCalledWith('/session/org-mine');
    });

    it('rafraîchit sessions et demandes au tirer-pour-rafraîchir', async () => {
      setSessions(data());
      render(<HomeScreen />);
      await act(async () => {
        await screen.UNSAFE_getByType(RefreshControl).props.onRefresh();
      });
      expect(mockSessions.current.refetch).toHaveBeenCalled();
      expect(mockFriendRequests.current.refetch).toHaveBeenCalledTimes(2);
      expect(screen.UNSAFE_getByType(RefreshControl).props.refreshing).toBe(false);
    });

    it('journalise une erreur de rafraîchissement sans planter', async () => {
      setSessions(data(), { refetch: jest.fn(() => Promise.reject(new Error('KO'))) });
      render(<HomeScreen />);
      await act(async () => {
        await screen.UNSAFE_getByType(RefreshControl).props.onRefresh();
      });
      expect(console.error).toHaveBeenCalled();
      expect(screen.UNSAFE_getByType(RefreshControl).props.refreshing).toBe(false);
    });
  });

  it('chargement impossible : message et « Réessayer », jamais l’écran « aucune session »', () => {
    setSessions([], { loadFailed: true });
    render(<HomeScreen />);
    expect(screen.getByText('Impossible de charger tes sessions')).toBeTruthy();
    expect(screen.queryByText('home-empty-state')).toBeNull();
    expect(screen.queryByText(/^prompt:/)).toBeNull();
    fireEvent.press(screen.getByText('Réessayer'));
    expect(mockSessions.current.refetch).toHaveBeenCalled();
  });

  it("choisit la première session future quand l'utilisateur n'est dans aucune, sans doublon des boutons de création", () => {
    setSessions([session('only', { sport: 'aquafitness', participants: [person('z')], maxParticipants: 3 })]);
    render(<HomeScreen />);
    expect(screen.getByText('Lieu only')).toBeTruthy();
    expect(screen.getByText('Il manque 2 joueurs')).toBeTruthy();
    expect(screen.getByText('1 / 3 joueur')).toBeTruthy();
    // « Créer une autre session » sous la carte, une seule fois : ni second bloc, ni « À VENIR » vide
    expect(screen.getAllByText('quick-create-row')).toHaveLength(1);
    expect(screen.queryByText(/^prompt:/)).toBeNull();
    expect(screen.queryByText('À VENIR')).toBeNull();
  });

  it('prend la première session passée quand aucune n’est à venir (sport sans icône 3D)', () => {
    setSessions([
      session('old2', { sport: 'curling', date: day(-2), participants: [person('a'), person('b')], maxParticipants: 2 }),
      session('old1', { sport: 'curling', date: day(-5), participants: [person('a')] }),
    ]);
    render(<HomeScreen />);
    // La plus ancienne (tri chronologique) devient la "prochaine"
    expect(screen.getByText('PROCHAINE SESSION')).toBeTruthy();
    expect(screen.getByText('joueur')).toBeTruthy();
    expect(screen.getByText('Lieu old2')).toBeTruthy();
  });

  it('affiche le ratio et le statut complet pour une prochaine session sans icône 3D', () => {
    setSessions([session('c', { sport: 'curling', participants: [person('a'), person('b')], maxParticipants: 2 })]);
    render(<HomeScreen />);
    expect(screen.getByText('joueurs')).toBeTruthy();
    expect(screen.getByText(' / 2')).toBeTruthy();
    expect(screen.getByText('Complet')).toBeTruthy();
  });

  it('affiche "Session ouverte" sur la prochaine session sans maximum', () => {
    setSessions([session('o', { sport: 'football', participants: [person('a'), person('b')] })]);
    render(<HomeScreen />);
    expect(screen.getByText('Session ouverte')).toBeTruthy();
    expect(screen.getByText(/2 joueurs/)).toBeTruthy();
  });

  it('affiche "Invitation à confirmer" sur la prochaine session en attente', () => {
    setSessions([session('p', { participants: [person('u1', 'pending')] })]);
    render(<HomeScreen />);
    expect(screen.getByText('Invitation à confirmer')).toBeTruthy();
  });

  it("invite à créer une session quand il n'y a que des sessions à organiser", () => {
    setSessions([
      session('o', { scheduling: 'finding_slot', organizer: { id: 'u1', firstname: 'A', lastname: 'R' }, slotProposals: [], participants: [] }),
    ]);
    render(<HomeScreen />);
    expect(screen.getByText("prompt:Rien de prévu pour l'instant|Tes potes répondent en un tap.")).toBeTruthy();
  });

  it('gère les sports sans nom et les sessions sans organisateur', () => {
    setSessions([
      session('n', { sport: 'basketball', organizer: undefined, participants: [person('a', 'accepted', { firstname: undefined, lastname: undefined })] }),
    ]);
    render(<HomeScreen />);
    expect(screen.getByText('Basketball')).toBeTruthy();
  });

  it('applique les marges Android', () => {
    const original = Platform.OS;
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    try {
      setSessions([session('a')]);
      render(<HomeScreen />);
      expect(screen.getByText('PROCHAINE SESSION')).toBeTruthy();
    } finally {
      Object.defineProperty(Platform, 'OS', { value: original, configurable: true });
    }
  });
});
