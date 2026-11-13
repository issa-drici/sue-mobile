/**
 * Hooks des sessions : appel de l'API, conversion vers le format de l'app, états de chargement
 * et d'erreur, mode simulé (ENV.USE_MOCKS).
 */
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { ENV } from '../../../config/env';
import { mockSessions } from '../../../mocks/sessions';
import { baseApiService } from '../../api/baseApi';
import { SessionsApi } from '../../api/sessionsApi';
import {
  useCancelParticipation, useCancelSession, useCreateSession, useDeleteSession, useGetSessionById, useGetSessions,
  useInviteFriends, useRecentLocations, useRespondToInvitation, useSlotFinding, useUpdateSession,
} from '..';
import { useGetHistory } from '../getHistory';
import { useGetMyCreatedSessions } from '../getMyCreatedSessions';
import { useGetMyParticipations } from '../getMyParticipations';

jest.mock('@react-navigation/native', () => {
  const React = jest.requireActual('react');
  return { useFocusEffect: (cb: () => void) => React.useEffect(cb, [cb]) };
});

const mockAuth: { user: any } = { user: { id: 'me', firstname: 'Moi', lastname: 'Même' } };
jest.mock('../../../app/context/auth', () => ({ useAuth: () => mockAuth }));

const mockApiRequest: { fn?: () => Promise<any>; options?: any; result: any } = { result: { data: null, isLoading: false } };
jest.mock('../../../hooks/useApiRequest', () => ({
  useApiRequest: (fn: () => Promise<any>, options: any) => {
    mockApiRequest.fn = fn;
    mockApiRequest.options = options;
    return mockApiRequest.result;
  },
}));

jest.mock('../../api/sessionsApi', () => ({
  SessionsApi: {
    getAll: jest.fn(), getMyCreated: jest.fn(), getMyParticipations: jest.fn(), getById: jest.fn(), create: jest.fn(),
    update: jest.fn(), delete: jest.fn(), respondToInvitation: jest.fn(), cancelParticipation: jest.fn(),
    cancelSession: jest.fn(), inviteFriends: jest.fn(), setSlotAvailability: jest.fn(), confirmSlot: jest.fn(),
    updateSlots: jest.fn(), proposeSlot: jest.fn(), removeProposedSlot: jest.fn(),
  },
}));
jest.mock('../../api/baseApi', () => ({ baseApiService: { get: jest.fn() } }));

const api = SessionsApi as jest.Mocked<typeof SessionsApi>;
const get = baseApiService.get as jest.Mock;
const env = ENV as { USE_MOCKS: boolean };

let spies: jest.SpyInstance[] = [];
beforeEach(() => {
  jest.clearAllMocks();
  Object.values(api).forEach((fn) => (fn as jest.Mock).mockReset());
  get.mockReset();
  env.USE_MOCKS = false;
  mockAuth.user = { id: 'me', firstname: 'Moi', lastname: 'Même' };
  mockApiRequest.result = { data: null, isLoading: false };
  spies = (['log', 'error', 'warn'] as const).map((m) => jest.spyOn(console, m).mockImplementation(() => {}));
});
afterEach(() => {
  env.USE_MOCKS = false;
  spies.forEach((s) => s.mockRestore());
});

/** Session telle que renvoyée par l'API (noms complets) */
const apiSession = (overrides: any = {}) => ({
  id: 's1',
  sport: 'tennis',
  date: '2026-03-01',
  startTime: '10:00',
  endTime: '11:00',
  location: 'Club',
  maxParticipants: 4,
  pricePerPerson: 5,
  status: 'active',
  shareToken: 'tok',
  scheduling: 'fixed',
  slotProposals: [{ id: 'p' }],
  organizer: { id: 'o1', fullName: 'Jean Pierre Dupont', avatar: '/storage/o.png' },
  participants: [
    { id: 'p1', fullName: 'Léa Martin', status: 'accepted', avatarUrl: 'https://cdn/p1.png', hasGivenAvailability: 1, hasNewSlots: 0 },
    { fullName: null },
  ],
  comments: [{ id: 'c1', authorId: 'p1', fullName: 'Léa Martin', authorName: 'Léa M', content: 'Yo', createdAt: 'd' }],
  ...overrides,
});

/** Lance une action asynchrone d'un hook et attend la fin des mises à jour d'état */
async function call<T>(fn: () => Promise<T>): Promise<{ value?: T; error?: any }> {
  let out: { value?: T; error?: any } = {};
  await act(async () => {
    try {
      out = { value: await fn() };
    } catch (error) {
      out = { error };
    }
  });
  return out;
}

describe('actions simples (annuler, supprimer, inviter, répondre)', () => {
  it.each([
    ['useCancelParticipation', useCancelParticipation, 'cancelParticipation', 'cancelParticipation', ['s1'], { sessionId: 's1', status: 'cancelled', success: true }],
    ['useCancelSession', useCancelSession, 'cancelSession', 'cancelSession', ['s1'], { sessionId: 's1', status: 'cancelled', success: true }],
    ['useRespondToInvitation', useRespondToInvitation, 'respondToInvitation', 'respondToInvitation', ['s1', 'accept'], { sessionId: 's1', response: 'accept', status: 'success' }],
    ['useInviteFriends', useInviteFriends, 'inviteFriends', 'inviteFriends', ['s1', ['u1']], { sessionId: 's1', invitedUsers: ['u1'], errors: [] }],
  ] as const)('%s : API, puis mode simulé', async (_name, hook: any, method, apiMethod, args, mockValue) => {
    (api as any)[apiMethod].mockResolvedValueOnce({ ok: 1 });
    const { result } = renderHook(() => hook());
    expect(result.current.isLoading).toBe(false);
    const { value } = await call(() => result.current[method](...args));
    expect(value).toEqual({ ok: 1 });
    expect((api as any)[apiMethod]).toHaveBeenCalledWith(...args);
    expect(result.current.data).toEqual({ ok: 1 });
    expect(result.current.isLoading).toBe(false);

    env.USE_MOCKS = true;
    const mocked = await call(() => result.current[method](...args));
    expect(mocked.value).toEqual(mockValue);
    expect(result.current.data).toEqual(mockValue);
    expect((api as any)[apiMethod]).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['useCancelParticipation', useCancelParticipation, 'cancelParticipation', 'cancelParticipation', 'Erreur lors de l\'annulation de participation'],
    ['useCancelSession', useCancelSession, 'cancelSession', 'cancelSession', 'Erreur lors de l\'annulation de la session'],
    ['useRespondToInvitation', useRespondToInvitation, 'respondToInvitation', 'respondToInvitation', 'Erreur lors de la réponse à l\'invitation'],
  ] as const)('%s : extrait le message d’erreur de plusieurs formats', async (_name, hook: any, method, apiMethod, fallback) => {
    const { result } = renderHook(() => hook());
    const cases: [any, string][] = [
      [new Error('direct'), 'direct'],
      [{ error: { message: 'imbriqué' } }, 'imbriqué'],
      [{ response: { data: { message: 'réponse' } } }, 'réponse'],
      [{ response: { data: { error: { message: 'réponse imbriquée' } } } }, 'réponse imbriquée'],
      [{}, fallback],
    ];
    for (const [thrown, expected] of cases) {
      (api as any)[apiMethod].mockRejectedValueOnce(thrown);
      const { error } = await call(() => result.current[method]('s1', 'accept'));
      expect(error.message).toBe(expected);
      expect(result.current.error).toBe(expected);
      expect(result.current.isLoading).toBe(false);
    }
  });

  it('useInviteFriends : erreur relayée', async () => {
    const { result } = renderHook(() => useInviteFriends());
    api.inviteFriends.mockRejectedValueOnce(new Error('refus'));
    const { error } = await call(() => result.current.inviteFriends('s1', []));
    expect(error.message).toBe('refus');
    expect(result.current.error).toBe('refus');
    api.inviteFriends.mockRejectedValueOnce({});
    await call(() => result.current.inviteFriends('s1', []));
    expect(result.current.error).toBe('Erreur lors de l\'envoi des invitations');
  });

  it('useDeleteSession : API, mode simulé, erreurs', async () => {
    const { result } = renderHook(() => useDeleteSession());
    api.delete.mockResolvedValueOnce(undefined);
    expect((await call(() => result.current.deleteSession('s1'))).value).toBe(true);
    expect(api.delete).toHaveBeenCalledWith('s1');
    expect(result.current.data).toBe(true);
    api.delete.mockRejectedValueOnce(new Error('non'));
    expect((await call(() => result.current.deleteSession('s1'))).error.message).toBe('non');
    expect(result.current.error).toBe('non');
    api.delete.mockRejectedValueOnce({});
    await call(() => result.current.deleteSession('s1'));
    expect(result.current.error).toBe('Erreur lors de la suppression de la session');
    env.USE_MOCKS = true;
    expect((await call(() => result.current.deleteSession('s1'))).value).toBe(true);
    expect(api.delete).toHaveBeenCalledTimes(3);
  });
});

describe('useCreateSession', () => {
  it('convertit les données envoyées et la réponse', async () => {
    api.create.mockResolvedValueOnce({
      id: 'new', sport: 'padel', date: '2026-04-01', time: '09:00', location: 'L', maxParticipants: 4, pricePerPerson: null,
      scheduling: 'fixed',
      organizer: { id: 'o', fullName: 'Ana De La Cruz', avatarUrl: 'a.png' },
      participants: [{ id: 'p', firstname: 'Bo', lastname: 'B', status: 'accepted', avatarUrl: 'b.png' }, {}],
      comments: [{ id: 'c', authorId: 'p', authorName: 'Bo Bee', content: 'x', createdAt: 'd' }, { id: 'c2', userId: 'u', firstname: 'F', lastname: 'L' }, { id: 'c3' }],
    } as any);
    const { result } = renderHook(() => useCreateSession());
    const { value } = await call(() => result.current.createSession({
      sport: 'padel', date: '2026-04-01', startTime: '09:00', endTime: '10:00', location: 'L',
      maxParticipants: 4, participants: [{ id: 'p' } as any],
    } as any));

    expect(api.create).toHaveBeenCalledWith({
      title: 'padel', date: '2026-04-01', startTime: '09:00', endTime: '10:00', location: 'L', sport: 'padel',
      maxParticipants: 4, pricePerPerson: null, participantIds: ['p'],
    });
    expect(value).toEqual({
      id: 'new', sport: 'padel', date: '2026-04-01', startTime: '09:00', endTime: '20:00', location: 'L',
      maxParticipants: 4, pricePerPerson: null, scheduling: 'fixed', slotProposals: [],
      organizer: { id: 'o', firstname: 'Ana', lastname: 'De La Cruz', avatar: 'a.png' },
      participants: [
        { id: 'p', firstname: 'Bo', lastname: 'B', status: 'accepted', avatar: 'b.png' },
        { id: '', firstname: '', lastname: '', status: 'pending', avatar: null },
      ],
      comments: [
        { id: 'c', userId: 'p', firstname: 'Bo', lastname: 'Bee', content: 'x', createdAt: 'd' },
        { id: 'c2', userId: 'u', firstname: 'F', lastname: 'L', content: undefined, createdAt: undefined },
        { id: 'c3', userId: undefined, firstname: '', lastname: '', content: undefined, createdAt: undefined },
      ],
    });
    expect(result.current.data).toEqual(value);
  });

  it('valeurs par défaut, réponse enveloppée et « trouver un créneau »', async () => {
    api.create.mockResolvedValueOnce({ data: { id: 'w', slotProposals: [{ id: 'x' }] } } as any);
    const { result } = renderHook(() => useCreateSession());
    const { value } = await call(() => result.current.createSession({
      scheduling: 'finding_slot',
      slotProposals: [{ id: 'tmp', date: 'd', startTime: 's', endTime: 'e' } as any],
    } as any));
    const sent = api.create.mock.calls[0][0] as any;
    expect(sent).toEqual(expect.objectContaining({
      startTime: '18:00', endTime: '20:00', location: 'Lieu par défaut', sport: 'tennis', participantIds: [],
      scheduling: 'finding_slot', slotProposals: [{ date: 'd', startTime: 's', endTime: 'e' }],
    }));
    expect(sent.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(value).toEqual(expect.objectContaining({
      id: 'w', startTime: '18:00', slotProposals: [{ id: 'x' }],
      organizer: { id: '', firstname: 'Organisateur', lastname: '', avatar: null },
    }));

    api.create.mockResolvedValueOnce({ data: { id: 'z' } } as any);
    await call(() => result.current.createSession({ scheduling: 'finding_slot' } as any));
    expect((api.create.mock.calls[1][0] as any).slotProposals).toEqual([]);
  });

  it('erreur : message gardé et relancée', async () => {
    const { result } = renderHook(() => useCreateSession());
    api.create.mockRejectedValueOnce(new Error('invalide'));
    expect((await call(() => result.current.createSession({}))).error.message).toBe('invalide');
    expect(result.current.error).toBe('invalide');
    api.create.mockRejectedValueOnce({});
    await call(() => result.current.createSession({}));
    expect(result.current.error).toBe('Erreur lors de la création de la session');
  });

  it('mode simulé : session locale avec l’utilisateur comme organisateur', async () => {
    env.USE_MOCKS = true;
    const { result } = renderHook(() => useCreateSession());
    const { value } = await call(() => result.current.createSession({ sport: 'golf' } as any));
    expect(value).toEqual(expect.objectContaining({
      sport: 'golf', startTime: '18:00', endTime: '20:00', location: 'Lieu par défaut', maxParticipants: null,
      pricePerPerson: null, organizer: { id: 'me', firstname: 'Moi', lastname: 'Même' }, participants: [], comments: [],
    }));
    const organizer = { id: 'x', firstname: 'X', lastname: 'Y' };
    const full = await call(() => result.current.createSession({
      sport: 'ski', date: '2026-01-01', startTime: '8:00', endTime: '9:00', location: 'Alpes', maxParticipants: 2, pricePerPerson: 3,
      organizer, participants: [{ id: 'p' }], comments: [{ id: 'c' }],
    } as any));
    expect(full.value).toEqual(expect.objectContaining({ organizer, date: '2026-01-01', participants: [{ id: 'p' }], comments: [{ id: 'c' }] }));
    mockAuth.user = null;
    const { result: r2 } = renderHook(() => useCreateSession());
    const anon = await call(() => r2.current.createSession({}));
    expect(anon.value).toEqual(expect.objectContaining({ sport: 'tennis', organizer: { id: '1', firstname: 'Utilisateur', lastname: 'Test' } }));
    expect(api.create).not.toHaveBeenCalled();
  });
});

describe('useUpdateSession', () => {
  it('envoie seulement les champs fournis et convertit la réponse', async () => {
    api.update.mockResolvedValueOnce({
      id: 's1', sport: 'tennis', date: 'd', time: '07:00', location: 'L', maxParticipants: null, pricePerPerson: null,
      organizer: { id: 'o', firstname: 'O', lastname: 'P', avatarUrl: 'o.png' },
      participants: [{ id: 'p', status: 'accepted', avatar: 'p.png' }],
      comments: [{ id: 'c', authorId: 'p', authorName: 'Marie Claire Dubois', content: 'x', createdAt: 'd' }, { id: 'c2', authorId: 'q', authorName: null }],
    } as any);
    const { result } = renderHook(() => useUpdateSession());
    const { value } = await call(() => result.current.updateSession('s1', {
      sport: 'tennis', date: 'd', location: 'L', startTime: '07:00', endTime: '08:00', maxParticipants: null, pricePerPerson: 0,
    } as any));
    expect(api.update).toHaveBeenCalledWith('s1', {
      title: 'tennis', date: 'd', location: 'L', sport: 'tennis', startTime: '07:00', endTime: '08:00', maxParticipants: null, pricePerPerson: 0,
    });
    expect(value).toEqual({
      id: 's1', sport: 'tennis', date: 'd', startTime: '07:00', endTime: '20:00', location: 'L', maxParticipants: null, pricePerPerson: null,
      organizer: { id: 'o', firstname: 'O', lastname: 'P', avatar: 'o.png' },
      participants: [{ id: 'p', firstname: '', lastname: '', status: 'accepted', avatar: 'p.png' }],
      comments: [
        { id: 'c', userId: 'p', firstname: 'Marie Claire', lastname: 'Dubois', content: 'x', createdAt: 'd' },
        { id: 'c2', userId: 'q', firstname: 'Utilisateur', lastname: '', content: undefined, createdAt: undefined },
      ],
    });
  });

  it('sans heures ni capacité : champs absents ; réponse minimale', async () => {
    api.update.mockResolvedValueOnce({ id: 's1', comments: [], participants: undefined } as any);
    const { result } = renderHook(() => useUpdateSession());
    const { value } = await call(() => result.current.updateSession('s1', { location: 'X' } as any));
    expect(api.update.mock.calls[0][1]).toEqual({ title: undefined, date: undefined, location: 'X', sport: undefined });
    expect(value).toEqual(expect.objectContaining({
      startTime: '18:00', organizer: { id: '', firstname: '', lastname: '', avatar: null }, participants: [],
    }));
  });

  it('erreur relayée avec message', async () => {
    const { result } = renderHook(() => useUpdateSession());
    api.update.mockRejectedValueOnce(new Error('non'));
    expect((await call(() => result.current.updateSession('s1', {}))).error.message).toBe('non');
    expect(result.current.error).toBe('non');
    api.update.mockRejectedValueOnce({});
    await call(() => result.current.updateSession('s1', {}));
    expect(result.current.error).toBe('Erreur lors de la mise à jour de la session');
  });
});

describe('listes rechargées à chaque affichage', () => {
  it.each([
    ['useGetMyCreatedSessions', useGetMyCreatedSessions, 'getMyCreated', 'Erreur lors du chargement de mes sessions créées'],
    ['useGetMyParticipations', useGetMyParticipations, 'getMyParticipations', 'Erreur lors du chargement de mes participations'],
  ] as const)('%s', async (_name, hook: any, apiMethod, fallback) => {
    (api as any)[apiMethod].mockResolvedValueOnce([apiSession(), apiSession({ id: 's2', organizer: undefined, participants: undefined, comments: undefined, time: '06:00', startTime: undefined, endTime: undefined, slotProposals: undefined })]);
    const { result } = renderHook(() => hook());
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const [first, second] = result.current.data;
    expect(first).toEqual(expect.objectContaining({
      id: 's1', startTime: '10:00', endTime: '11:00', slotProposals: [{ id: 'p' }],
      organizer: { id: 'o1', firstname: 'Jean Pierre', lastname: 'Dupont', avatar: '/storage/o.png' },
    }));
    expect(first.participants).toEqual([
      { id: 'p1', firstname: 'Léa', lastname: 'Martin', status: 'accepted', hasGivenAvailability: true, hasNewSlots: false, avatar: 'https://cdn/p1.png' },
      { id: '', firstname: 'Utilisateur', lastname: '', status: 'pending', hasGivenAvailability: false, hasNewSlots: false, avatar: null },
    ]);
    expect(first.comments).toEqual([{ id: 'c1', userId: 'p1', firstname: 'Léa', lastname: 'M', content: 'Yo', createdAt: 'd' }]);
    expect(second).toEqual(expect.objectContaining({
      startTime: '06:00', endTime: '20:00', slotProposals: [], participants: [], comments: [],
      organizer: { id: '', firstname: 'Utilisateur', lastname: '', avatar: null },
    }));

    // Réponse enveloppée { data } puis réponse invalide
    (api as any)[apiMethod].mockResolvedValueOnce({ data: [apiSession({ comments: [{ id: 'c', userId: 'u', fullName: 'Solo' }] })] });
    await act(async () => { await result.current.refetch(); });
    expect(result.current.data[0].comments[0]).toEqual(expect.objectContaining({ userId: 'u', firstname: '', lastname: 'Solo' }));
    (api as any)[apiMethod].mockResolvedValueOnce({ data: 'pas un tableau' });
    await act(async () => { await result.current.refetch(); });
    expect(result.current.data).toEqual([]);

    (api as any)[apiMethod].mockRejectedValueOnce(new Error('panne'));
    await act(async () => { await result.current.refetch(); });
    expect(result.current.error).toBe('panne');
    (api as any)[apiMethod].mockRejectedValueOnce({});
    await act(async () => { await result.current.refetch(); });
    expect(result.current.error).toBe(fallback);

    env.USE_MOCKS = true;
    await act(async () => { await result.current.refetch(); });
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});

describe('useGetHistory', () => {
  it('charge /sessions/history et convertit', async () => {
    get.mockResolvedValueOnce({ data: [apiSession(), apiSession({ id: 's2', organizer: undefined, participants: [{ id: 'x' }], comments: [{ id: 'c' }], startTime: undefined, time: undefined, endTime: undefined, slotProposals: undefined })] });
    const { result } = renderHook(() => useGetHistory());
    await waitFor(() => expect(result.current.data).toHaveLength(2));
    expect(get).toHaveBeenCalledWith('/sessions/history');
    const [first, second] = result.current.data;
    expect(first).toEqual(expect.objectContaining({
      status: 'active', organizer: { id: 'o1', firstname: 'Jean', lastname: 'Pierre Dupont', avatar: '/storage/o.png' },
    }));
    expect(first.participants[0]).toEqual({ id: 'p1', firstname: 'Léa', lastname: 'Martin', status: 'accepted', hasGivenAvailability: true, hasNewSlots: false, avatar: 'https://cdn/p1.png' });
    expect(first.participants[1]).toEqual(expect.objectContaining({ id: '', firstname: 'Participant', lastname: '' }));
    expect(first.comments[0]).toEqual({ id: 'c1', userId: 'p1', firstname: 'Léa', lastname: 'Martin', content: 'Yo', createdAt: 'd' });
    expect(second).toEqual(expect.objectContaining({
      startTime: '18:00', endTime: '20:00', slotProposals: [],
      organizer: { id: '', firstname: 'Organisateur', lastname: '', avatar: null },
    }));
    expect(second.comments[0]).toEqual(expect.objectContaining({ userId: '', firstname: '', lastname: '' }));
  });

  it('réponse brute non tableau, erreurs (sauf « Unauthenticated. ») et mode simulé', async () => {
    get.mockResolvedValueOnce({ foo: 1 });
    const { result } = renderHook(() => useGetHistory());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual([]);

    get.mockRejectedValueOnce(new Error('Unauthenticated.'));
    await act(async () => { await result.current.refetch(); });
    expect(result.current.error).toBeNull();
    get.mockRejectedValueOnce(new Error('panne'));
    await act(async () => { await result.current.refetch(); });
    expect(result.current.error).toBe('panne');
    get.mockRejectedValueOnce({});
    await act(async () => { await result.current.refetch(); });
    expect(result.current.error).toBe('Erreur lors du chargement de l\'historique');

    env.USE_MOCKS = true;
    await act(async () => { await result.current.refetch(); });
    const past = mockSessions.filter((s) => new Date(s.date) < new Date());
    expect(result.current.data).toEqual(past);
  });
});

describe('useGetSessionById', () => {
  it('charge, convertit (avatars absolus) et recharge au focus suivant sans spinner', async () => {
    api.getById.mockResolvedValue({ data: apiSession() } as any);
    const { result } = renderHook(() => useGetSessionById());
    expect(result.current.data).toBeNull();
    const { value } = await call(() => result.current.getSessionById('s1'));
    expect(api.getById).toHaveBeenCalledWith('s1');
    expect(value).toEqual(expect.objectContaining({ id: 's1', shareToken: 'tok', status: 'active' }));
    expect((value as any).organizer.avatar).toMatch(/^https?:\/\/.+\/storage\/o\.png$/);
    expect((value as any).participants[0].avatar).toBe('https://cdn/p1.png');
    expect((value as any).participants[1]).toEqual(expect.objectContaining({ firstname: 'Utilisateur', avatar: null }));
    expect((value as any).comments[0]).toEqual(expect.objectContaining({ firstname: 'Léa', lastname: 'Martin' }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    // Le focus effect relance un chargement pour la session courante
    expect(api.getById.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('réponse brute minimale', async () => {
    api.getById.mockResolvedValue({ id: 's9', comments: [{ id: 'c', userId: 'u' }] } as any);
    const { result } = renderHook(() => useGetSessionById());
    const { value } = await call(() => result.current.getSessionById('s9', false));
    expect(value).toEqual(expect.objectContaining({
      id: 's9', startTime: '18:00', participants: [], slotProposals: [],
      organizer: { id: '', firstname: 'Utilisateur', lastname: '', avatar: null },
    }));
    expect((value as any).comments[0]).toEqual(expect.objectContaining({ userId: 'u', firstname: 'Utilisateur' }));
  });

  it('erreur relayée, puis mode simulé', async () => {
    const { result } = renderHook(() => useGetSessionById());
    api.getById.mockResolvedValue({ id: 'x' } as any);
    await call(() => result.current.getSessionById('x'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Même session : pas de rechargement au focus, l'erreur reste affichée
    api.getById.mockRejectedValueOnce(new Error('introuvable'));
    expect((await call(() => result.current.getSessionById('x'))).error.message).toBe('introuvable');
    expect(result.current.error).toBe('introuvable');
    expect(result.current.isLoading).toBe(false);
    api.getById.mockRejectedValueOnce({});
    await call(() => result.current.getSessionById('x'));
    expect(result.current.error).toBe('Erreur lors du chargement de la session');

    env.USE_MOCKS = true;
    expect((await call(() => result.current.getSessionById('1'))).value).toBe(mockSessions[0]);
    expect((await call(() => result.current.getSessionById('inexistant'))).value).toBeNull();
    await act(async () => {});
    expect(result.current.data).toBeNull();
  });

  // BUG: services/sessions/getSessionById.ts (useFocusEffect, ligne 118) appelle getSessionById sans
  // .catch : si le rechargement au retour sur l'écran échoue (réseau coupé), la promesse rejetée n'est
  // jamais gérée (« unhandled promise rejection »). L'erreur est bien mise dans `error`, mais le rejet
  // remonte. Correctif suggéré : getSessionById(currentSessionId, !dataRef.current).catch(() => {}).
  it.skip('un échec du rechargement au focus ne produit pas de rejet non géré', async () => {
    const { result } = renderHook(() => useGetSessionById());
    api.getById.mockRejectedValueOnce(new Error('première')).mockRejectedValueOnce(new Error('focus'));
    await call(() => result.current.getSessionById('x'));
    await act(async () => {});
    expect(result.current.error).toBe('focus');
  });
});

describe('useGetSessions', () => {
  it('passe une requête avec 5 tentatives et convertit la liste', async () => {
    mockApiRequest.result = { data: null, isLoading: true, refetch: jest.fn() };
    const { result } = renderHook(() => useGetSessions());
    expect(result.current.data).toEqual([]);
    expect(result.current.isFirstLoading).toBe(true);
    expect(mockApiRequest.options).toEqual(expect.objectContaining({ maxRetries: 5, retryDelay: 1000, enableRetry: true }));
    mockApiRequest.options.onRetry(1, new Error('x'));
    mockApiRequest.options.onMaxRetriesReached(new Error('x'));
    expect(console.error).toHaveBeenCalled();

    api.getAll.mockResolvedValueOnce([apiSession()] as any);
    const sessions = await mockApiRequest.fn!();
    expect(sessions[0]).toEqual(expect.objectContaining({ id: 's1', status: 'active' }));
    expect(sessions[0].organizer.avatar).toMatch(/\/storage\/o\.png$/);
    expect(sessions[0].comments[0]).toEqual(expect.objectContaining({ firstname: 'Léa' }));
    api.getAll.mockResolvedValueOnce({ data: [apiSession({ organizer: null, participants: null, comments: null, startTime: null, endTime: null, slotProposals: null })] } as any);
    const [minimal] = await mockApiRequest.fn!();
    expect(minimal).toEqual(expect.objectContaining({ startTime: '18:00', endTime: '20:00', participants: [], comments: [], slotProposals: [] }));
    api.getAll.mockResolvedValueOnce({ data: {} } as any);
    await expect(mockApiRequest.fn!()).resolves.toEqual([]);

    env.USE_MOCKS = true;
    await expect(mockApiRequest.fn!()).resolves.toBe(mockSessions);
  });

  it('données présentes : plus de premier chargement', () => {
    mockApiRequest.result = { data: [{ id: 'x' }], isLoading: true };
    const { result } = renderHook(() => useGetSessions());
    expect(result.current.data).toEqual([{ id: 'x' }]);
    expect(result.current.isFirstLoading).toBe(false);
  });

  it('loadFailed : seulement jamais chargé, en erreur, et plus de relance en cours', () => {
    const cases: [Record<string, unknown>, boolean][] = [
      [{ data: null, isLoading: false, isRetrying: false, error: 'x' }, true],
      [{ data: null, isLoading: false, isRetrying: true, error: 'x' }, false],
      [{ data: null, isLoading: true, isRetrying: false, error: null }, false],
      [{ data: [], isLoading: false, isRetrying: false, error: 'x' }, false],
      [{ data: null, isLoading: false, isRetrying: false, error: null }, false],
    ];
    cases.forEach(([state, expected]) => {
      mockApiRequest.result = state;
      const { result } = renderHook(() => useGetSessions());
      expect(result.current.loadFailed).toBe(expected);
    });
  });
});

describe('useRecentLocations', () => {
  it('lieux où j’ai joué, du plus récent au plus ancien, sans doublon, 10 maximum', async () => {
    const sessions = [
      { location: 'Club A', date: '2026-01-01', organizer: { id: 'me' } },
      { location: ' club a ', startDate: '2026-02-01', organizer: { id: 'x' }, participants: [{ id: 'me', status: 'accepted' }] },
      { location: 'Refusé', date: '2026-03-01', organizer: { id: 'x' }, participants: [{ id: 'me', status: 'declined' }] },
      { location: '', date: '2026-03-02', organizer: { id: 'me' } },
      { location: '   ', date: '2026-03-03', organizer: { id: 'me' } },
      { date: '2026-03-04', organizer: { id: 'me' } },
      { location: 'Pas moi', date: '2026-03-05', organizer: { id: 'x' } },
      ...Array.from({ length: 12 }, (_, i) => ({ location: `Lieu ${i}`, date: `2025-01-${String(i + 10)}`, organizer: { id: 'me' } })),
    ];
    get.mockImplementation((url: string) => (url.startsWith('/sessions/history')
      ? Promise.resolve({ data: sessions })
      : Promise.resolve(sessions.slice(0, 1))));
    const { result } = renderHook(() => useRecentLocations());
    await waitFor(() => expect(result.current.length).toBeGreaterThan(0));
    expect(get).toHaveBeenCalledWith('/sessions/history?limit=50');
    expect(get).toHaveBeenCalledWith('/sessions?limit=50');
    expect(result.current).toHaveLength(10);
    expect(result.current[0]).toBe('club a');
    expect(result.current).not.toContain('Club A');
    expect(result.current).not.toContain('Refusé');
    expect(result.current).not.toContain('Pas moi');
    expect(result.current.slice(1)).toEqual(['Lieu 11', 'Lieu 10', 'Lieu 9', 'Lieu 8', 'Lieu 7', 'Lieu 6', 'Lieu 5', 'Lieu 4', 'Lieu 3']);
  });

  it('ignore les requêtes en échec et les réponses non tableaux', async () => {
    get.mockImplementation((url: string) => (url.startsWith('/sessions/history')
      ? Promise.reject(new Error('x'))
      : Promise.resolve({ data: { pas: 'un tableau' } })));
    const { result } = renderHook(() => useRecentLocations());
    await act(async () => {});
    expect(result.current).toEqual([]);
  });

  it('sans utilisateur : aucun appel', () => {
    mockAuth.user = null;
    const { result } = renderHook(() => useRecentLocations());
    expect(result.current).toEqual([]);
    expect(get).not.toHaveBeenCalled();
  });

  it('démonté avant la réponse : rien n’est mis à jour', async () => {
    let resolve!: (v: unknown) => void;
    get.mockImplementation(() => new Promise((r) => { resolve = r; }));
    const { result, unmount } = renderHook(() => useRecentLocations());
    unmount();
    await act(async () => { resolve([{ location: 'X', organizer: { id: 'me' } }]); });
    expect(result.current).toEqual([]);
  });
});

describe('useSlotFinding', () => {
  it('chaque action appelle l’API et gère le chargement', async () => {
    const { result } = renderHook(() => useSlotFinding());
    const slot = { date: 'd', startTime: 's', endTime: 'e' };
    api.setSlotAvailability.mockResolvedValueOnce('a' as any);
    api.confirmSlot.mockResolvedValueOnce('b' as any);
    api.updateSlots.mockResolvedValueOnce('c' as any);
    api.proposeSlot.mockResolvedValueOnce('d' as any);
    api.removeProposedSlot.mockResolvedValueOnce('e' as any);
    expect((await call(() => result.current.setAvailability('s1', ['x']))).value).toBe('a');
    expect(api.setSlotAvailability).toHaveBeenCalledWith('s1', ['x']);
    expect((await call(() => result.current.confirmSlot('s1', 'x'))).value).toBe('b');
    expect(api.confirmSlot).toHaveBeenCalledWith('s1', 'x');
    expect((await call(() => result.current.updateSlots('s1', [slot]))).value).toBe('c');
    expect(api.updateSlots).toHaveBeenCalledWith('s1', [slot]);
    expect((await call(() => result.current.proposeSlot('s1', slot))).value).toBe('d');
    expect(api.proposeSlot).toHaveBeenCalledWith('s1', slot);
    expect((await call(() => result.current.removeProposedSlot('s1', 'x'))).value).toBe('e');
    expect(api.removeProposedSlot).toHaveBeenCalledWith('s1', 'x');
    expect(result.current.isLoading).toBe(false);
  });

  it('isLoading vrai pendant l’appel', async () => {
    let resolve!: (v: any) => void;
    api.confirmSlot.mockImplementationOnce(() => new Promise((r) => { resolve = r; }));
    const { result } = renderHook(() => useSlotFinding());
    let pending!: Promise<unknown>;
    act(() => { pending = result.current.confirmSlot('s1', 'x'); });
    expect(result.current.isLoading).toBe(true);
    await act(async () => { resolve('ok'); await pending; });
    expect(result.current.isLoading).toBe(false);
  });

  it.each([
    [new Error('direct'), 'direct'],
    [{ error: { message: 'imbriqué' } }, 'imbriqué'],
    [null, 'Une erreur est survenue'],
  ])('erreur %p → « %s »', async (thrown, expected) => {
    api.confirmSlot.mockRejectedValueOnce(thrown);
    const { result } = renderHook(() => useSlotFinding());
    expect((await call(() => result.current.confirmSlot('s1', 'x'))).error.message).toBe(expected);
  });
});
