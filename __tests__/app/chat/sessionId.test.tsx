/* eslint-disable @typescript-eslint/no-require-imports */
import React from 'react';
import { Alert, AppState } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import SessionChatRoute from '../../../app/chat/[sessionId]';
import { SessionsApi } from '../../../services/api/sessionsApi';
import { activeChat } from '../../../services/chat/activeChat';
import type { ChatMember, DisplayMessage } from '../../../services/chat/types';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  navigate: jest.fn(),
  canGoBack: jest.fn(() => true),
};
let mockParams: Record<string, string> = { sessionId: 's1' };
let mockNavState: any = { index: 0, routes: [{ name: 'chat/[sessionId]' }] };
let mockIsFocused = true;
let mockChat: any;

jest.mock('expo-router', () => {
  const R = require('react');
  return {
    get router() {
      return mockRouter;
    },
    useRouter: () => mockRouter,
    useLocalSearchParams: () => mockParams,
    useFocusEffect: (cb: () => any) => R.useEffect(cb, [cb]),
  };
});
jest.mock('@react-navigation/native', () => ({
  useIsFocused: () => mockIsFocused,
  useNavigation: () => ({ getState: () => mockNavState }),
}));
jest.mock('../../../app/context/auth', () => ({
  useAuth: () => ({ user: { id: 'me', firstname: 'Issa' } }),
}));
jest.mock('../../../hooks/useSessionChat', () => ({ useSessionChat: jest.fn(() => mockChat) }));
jest.mock('../../../services/api/sessionsApi', () => ({ SessionsApi: { getById: jest.fn() } }));
jest.mock('../../../services/chat/activeChat', () => ({
  activeChat: { focus: jest.fn(), blur: jest.fn(), mount: jest.fn(() => jest.fn()) },
}));

const getByIdMock = SessionsApi.getById as jest.Mock;

const member = (id: string, firstname: string, extra: Partial<ChatMember> = {}): ChatMember => ({
  id,
  firstname,
  lastname: 'Nom',
  avatarUrl: null,
  status: 'accepted',
  isOrganizer: false,
  ...extra,
});

const MEMBERS: ChatMember[] = [
  member('me', 'Issa', { isOrganizer: true }),
  member('u2', 'Paul', { avatarUrl: 'https://img/paul.png' }),
  member('u3', 'Julie'),
  member('u4', 'Karim', { status: 'declined' }),
];

const NOW = Date.now();
const iso = (offsetMs: number) => new Date(NOW + offsetMs).toISOString();

function msg(id: number | null, senderId: string, body: string, extra: Partial<DisplayMessage> = {}): DisplayMessage {
  return {
    id,
    clientId: `c-${id ?? body}`,
    sessionId: 's1',
    senderId,
    senderFirstname: null,
    body,
    mentions: [],
    createdAt: iso(-60_000),
    status: 'sent',
    ...extra,
  };
}

function makeChat(overrides: any = {}) {
  return {
    messages: [],
    members: MEMBERS,
    reads: {},
    hydrated: true,
    loading: false,
    synced: true,
    loadError: null,
    hasOlder: false,
    loadingOlder: false,
    typingUsers: [],
    isOnline: true,
    initialLastReadId: null,
    initialLatestId: null,
    header: { title: '🎾 Padel', subtitle: 'sam. 6 juil.' },
    setHeader: jest.fn(),
    send: jest.fn(),
    retry: jest.fn(),
    discard: jest.fn(),
    rejectionReason: jest.fn(() => null),
    loadOlder: jest.fn(),
    notifyTyping: jest.fn(),
    markRead: jest.fn(),
    reload: jest.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  // La FlatList planifie des rendus par setTimeout : horloge simulée pour les vider avant la fin du test
  jest.useFakeTimers();
  jest.clearAllMocks();
  mockParams = { sessionId: 's1' };
  mockNavState = { index: 0, routes: [{ name: 'chat/[sessionId]' }] };
  mockIsFocused = true;
  mockChat = makeChat();
  getByIdMock.mockResolvedValue({ sport: 'padel', date: '2026-07-06', startTime: '18:00:00', endTime: '19:00:00' });
  mockRouter.canGoBack.mockReturnValue(true);
  Object.defineProperty(AppState, 'currentState', { value: 'active', configurable: true, writable: true });
});

afterEach(() => {
  act(() => jest.runOnlyPendingTimers());
  jest.useRealTimers();
});

describe('SessionChatScreen', () => {
  it("affiche l'état vide et l'en-tête", async () => {
    render(<SessionChatRoute />);
    expect(screen.getByText('Lance la discussion')).toBeTruthy();
    expect(screen.getByText('🎾 Padel')).toBeTruthy();
    expect(screen.getByText('sam. 6 juil. · 4 membres')).toBeTruthy();
    await waitFor(() => expect(mockChat.setHeader).toHaveBeenCalled());
    const [title, subtitle, endsAt] = mockChat.setHeader.mock.calls[0];
    expect(title).toContain('Padel');
    expect(subtitle).toContain('18:00');
    expect(typeof endsAt).toBe('string');
    expect(activeChat.focus).toHaveBeenCalledWith('s1');
    expect(activeChat.mount).toHaveBeenCalledWith('s1');
    expect(mockChat.markRead).toHaveBeenCalled();
  });

  it('en-tête "Créneau à trouver" pour une session sans date fixée', async () => {
    getByIdMock.mockResolvedValue({ sport: 'tennis', scheduling: 'finding_slot' });
    render(<SessionChatRoute />);
    await waitFor(() =>
      expect(mockChat.setHeader).toHaveBeenCalledWith(expect.stringContaining('Tennis'), 'Créneau à trouver', null)
    );
  });

  it('en-tête sans heure de début et session sans sport', async () => {
    getByIdMock.mockResolvedValue({ date: '2026-07-06' });
    render(<SessionChatRoute />);
    await waitFor(() => expect(mockChat.setHeader).toHaveBeenCalled());
    expect(mockChat.setHeader.mock.calls[0][1]).not.toContain('·');
  });

  it("ignore l'échec du chargement de la session", async () => {
    getByIdMock.mockRejectedValue(new Error('offline'));
    render(<SessionChatRoute />);
    await act(async () => {});
    expect(mockChat.setHeader).not.toHaveBeenCalled();
  });

  it('affiche un sous-titre vide sans membres ni header', () => {
    mockChat = makeChat({ members: [], header: null });
    render(<SessionChatRoute />);
    expect(screen.getByPlaceholderText('Message')).toBeTruthy();
  });

  it('affiche "En attente du réseau…" hors ligne', () => {
    mockChat = makeChat({ isOnline: false });
    render(<SessionChatRoute />);
    expect(screen.getByText('En attente du réseau…')).toBeTruthy();
  });

  it('affiche le spinner seulement si le chargement dure', () => {
    jest.useFakeTimers();
    mockChat = makeChat({ loading: true });
    const { unmount, UNSAFE_queryAllByType } = render(<SessionChatRoute />);
    const { ActivityIndicator } = require('react-native');
    expect(UNSAFE_queryAllByType(ActivityIndicator)).toHaveLength(0);
    act(() => jest.advanceTimersByTime(500));
    expect(UNSAFE_queryAllByType(ActivityIndicator).length).toBeGreaterThan(0);
    unmount();
  });

  it("n'affiche rien tant que le cache n'est pas lu", () => {
    mockChat = makeChat({ hydrated: false });
    render(<SessionChatRoute />);
    expect(screen.queryByText('Lance la discussion')).toBeNull();
  });

  it("affiche l'erreur de chargement et permet de réessayer", () => {
    mockChat = makeChat({ loadError: 'Impossible de charger le chat' });
    render(<SessionChatRoute />);
    expect(screen.getByText('Impossible de charger le chat')).toBeTruthy();
    fireEvent.press(screen.getByText('Réessayer'));
    expect(mockChat.reload).toHaveBeenCalled();
  });

  it('affiche les messages, séparateurs de jour, groupes et nouveaux messages', () => {
    mockChat = makeChat({
      initialLastReadId: 2,
      initialLatestId: 10,
      messages: [
        msg(1, 'u2', 'Message ancien', { createdAt: '2026-01-05T10:00:00.000Z' }),
        msg(2, 'u2', 'Hier soir', { createdAt: iso(-24 * 3600 * 1000) }),
        msg(3, 'u3', 'Salut tout le monde', { createdAt: iso(-120_000) }),
        msg(4, 'u3', 'Ça va ?', { createdAt: iso(-100_000) }),
        msg(5, 'ghost', 'Je suis parti', { senderFirstname: 'Fantôme', createdAt: iso(-90_000) }),
        msg(6, 'zz', 'Inconnu', { createdAt: iso(-80_000) }),
        msg(7, 'me', 'Coucou @Paul', { mentions: ['u2'], createdAt: iso(-70_000) }),
        msg(8, 'u2', 'Hello @Issa', { mentions: ['me'], createdAt: iso(-60_000) }),
      ],
      reads: { u2: 7, u3: 7 },
    });
    render(<SessionChatRoute />);
    expect(screen.getByText('Salut tout le monde')).toBeTruthy();
    expect(screen.getByText('Nouveaux messages')).toBeTruthy();
    expect(screen.getByText("Aujourd'hui")).toBeTruthy();
    expect(screen.getByText('Hier')).toBeTruthy();
    expect(screen.getByText('Fantôme')).toBeTruthy();
    expect(screen.getByText('Ancien membre')).toBeTruthy();
    expect(screen.getByText('@Paul')).toBeTruthy();
    expect(screen.getByText('@Issa')).toBeTruthy();
  });

  it('marque "Orga" l\'organisateur dans les messages des autres', () => {
    mockChat = makeChat({
      members: [member('me', 'Issa'), member('u2', 'Paul', { isOrganizer: true })],
      messages: [msg(1, 'u2', 'Bienvenue')],
    });
    render(<SessionChatRoute />);
    expect(screen.getByText(/Orga/)).toBeTruthy();
  });

  it('affiche les coches selon le statut de mes messages', () => {
    mockChat = makeChat({
      messages: [
        msg(1, 'me', 'Vu par tous', { createdAt: iso(-3_000_000) }),
        msg(2, 'me', 'Envoyé', { createdAt: iso(-2_000_000) }),
        msg(null, 'me', 'En attente', { status: 'sending', clientId: 'p1', createdAt: iso(-1_000_000) }),
      ],
      reads: { u2: 1, u3: 1 },
    });
    render(<SessionChatRoute />);
    expect(screen.getByText('Vu par tous')).toBeTruthy();
    expect(screen.getByText('En attente')).toBeTruthy();
  });

  it("affiche l'indicateur de saisie pour 1, 2 et 3+ personnes", () => {
    mockChat = makeChat({ typingUsers: [{ id: 'u2', firstname: 'Paul' }] });
    const view = render(<SessionChatRoute />);
    expect(screen.getByText('Paul écrit')).toBeTruthy();

    mockChat = makeChat({ typingUsers: [{ id: 'u2', firstname: 'Paul' }, { id: 'u3', firstname: 'Julie' }] });
    view.rerender(<SessionChatRoute />);
    expect(screen.getByText('Paul et Julie écrivent')).toBeTruthy();

    mockChat = makeChat({
      typingUsers: [
        { id: 'u2', firstname: 'Paul' },
        { id: 'u3', firstname: 'Julie' },
        { id: 'x9', firstname: 'Nora' },
      ],
    });
    view.rerender(<SessionChatRoute />);
    expect(screen.getByText('Paul et 2 autres écrivent')).toBeTruthy();
  });

  it('message échoué : Alert avec supprimer / renvoyer', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockChat = makeChat({
      messages: [msg(null, 'me', 'Raté', { status: 'failed', clientId: 'f1' })],
      rejectionReason: jest.fn().mockReturnValueOnce('Message refusé').mockReturnValue(null),
    });
    render(<SessionChatRoute />);
    fireEvent.press(screen.getByLabelText('Message non envoyé, réessayer'));
    expect(alertSpy).toHaveBeenCalledWith('Message non envoyé', 'Message refusé', expect.any(Array));
    const buttons = alertSpy.mock.calls[0][2] as any[];
    buttons[0].onPress();
    expect(mockChat.discard).toHaveBeenCalledWith('f1');
    buttons[1].onPress();
    expect(mockChat.retry).toHaveBeenCalledWith('f1');

    fireEvent.press(screen.getByText('Raté'));
    expect(alertSpy).toHaveBeenCalledTimes(2);
    expect(alertSpy.mock.calls[1][1]).toContain('réseau revient');
    alertSpy.mockRestore();
  });

  it("appui long sur mon message : feuille « Vu par »", () => {
    mockChat = makeChat({
      messages: [msg(5, 'me', 'Qui a lu ?')],
      reads: { u2: 5 },
    });
    render(<SessionChatRoute />);
    fireEvent(screen.getByText('Qui a lu ?'), 'longPress');
    expect(screen.getByText('Vu par 1')).toBeTruthy();
    expect(screen.getByText('Pas encore vu')).toBeTruthy();
    expect(screen.getByText('a refusé')).toBeTruthy();
    // Appui dans la feuille : ne la ferme pas
    fireEvent.press(screen.getByText('Vu par 1'));
    expect(screen.getByText('Vu par 1')).toBeTruthy();
    // Appui sur le fond : la ferme
    const { Modal } = require('react-native');
    const sheet = screen.UNSAFE_getAllByType(Modal).find((m: any) => m.props.visible);
    act(() => sheet.props.onRequestClose());
    expect(screen.queryByText('Vu par 1')).toBeNull();
  });

  it('feuille « Vu par » vide', () => {
    mockChat = makeChat({ messages: [msg(5, 'me', 'Personne')], members: [member('me', 'Issa')] });
    render(<SessionChatRoute />);
    fireEvent(screen.getByText('Personne'), 'longPress');
    expect(screen.getByText('Vu par 0')).toBeTruthy();
    expect(screen.getByText('Personne pour l’instant')).toBeTruthy();
  });

  it("saisie : notifie la frappe, envoie et vide le champ", () => {
    render(<SessionChatRoute />);
    const input = screen.getByTestId('chat-input');
    fireEvent.changeText(input, '   ');
    expect(mockChat.notifyTyping).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId('chat-send'));
    expect(mockChat.send).not.toHaveBeenCalled();
    fireEvent.changeText(input, '  Bonjour  ');
    expect(mockChat.notifyTyping).toHaveBeenCalled();
    fireEvent.press(screen.getByTestId('chat-send'));
    expect(mockChat.send).toHaveBeenCalledWith('Bonjour', []);
    expect(input.props.value).toBe('');
  });

  it('mentions : suggestions, insertion et envoi avec ids', () => {
    render(<SessionChatRoute />);
    const input = screen.getByTestId('chat-input');
    fireEvent.changeText(input, 'Salut @');
    fireEvent(input, 'selectionChange', { nativeEvent: { selection: { start: 7, end: 7 } } });
    expect(screen.getByTestId('mention-suggestion-Paul')).toBeTruthy();
    expect(screen.queryByTestId('mention-suggestion-Issa')).toBeNull();
    expect(screen.getByText('a refusé')).toBeTruthy();
    fireEvent.press(screen.getByTestId('mention-suggestion-Paul'));
    expect(input.props.value).toBe('Salut @Paul ');
    expect(screen.queryByTestId('mention-suggestion-Paul')).toBeNull();
    // Le curseur forcé est relâché après le prochain changement de sélection
    fireEvent(input, 'selectionChange', { nativeEvent: { selection: { start: 12, end: 12 } } });
    // iOS renvoie le même texte : pas de réouverture
    fireEvent.changeText(input, 'Salut @Paul ');
    fireEvent.press(screen.getByTestId('chat-send'));
    expect(mockChat.send).toHaveBeenCalledWith('Salut @Paul', ['u2']);
  });

  it("n'affiche pas de suggestion pour une mention déjà complétée", () => {
    mockChat = makeChat({ members: [member('me', 'Issa', { isOrganizer: false }), member('u2', 'Paul', { isOrganizer: true })] });
    render(<SessionChatRoute />);
    const input = screen.getByTestId('chat-input');
    fireEvent.changeText(input, '@P');
    fireEvent(input, 'selectionChange', { nativeEvent: { selection: { start: 2, end: 2 } } });
    expect(screen.getByText('orga')).toBeTruthy();
    fireEvent.press(screen.getByTestId('mention-suggestion-Paul'));
    fireEvent(input, 'selectionChange', { nativeEvent: { selection: { start: 6, end: 6 } } });
    fireEvent.changeText(input, '@Paul');
    fireEvent(input, 'selectionChange', { nativeEvent: { selection: { start: 5, end: 5 } } });
    expect(screen.queryByTestId('mention-suggestion-Paul')).toBeNull();
  });

  it('retour : back si possible, sinon remplace vers la session', () => {
    render(<SessionChatRoute />);
    fireEvent.press(screen.getByTestId('chat-back'));
    expect(mockRouter.back).toHaveBeenCalled();
    mockRouter.canGoBack.mockReturnValue(false);
    fireEvent.press(screen.getByTestId('chat-back'));
    expect(mockRouter.replace).toHaveBeenCalledWith('/session/s1');
  });

  it("titre : revient à la fiche session si elle est juste en dessous", () => {
    mockNavState = { index: 1, routes: [{ name: 'session/[id]', params: { id: 's1' } }, { name: 'chat' }] };
    render(<SessionChatRoute />);
    fireEvent.press(screen.getByText('🎾 Padel'));
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it("titre : ouvre la fiche session sinon", () => {
    mockNavState = undefined;
    render(<SessionChatRoute />);
    fireEvent.press(screen.getByText('🎾 Padel'));
    expect(mockRouter.navigate).toHaveBeenCalledWith('/session/s1');
  });

  it('défilement : bouton "revenir en bas" et compteur de nouveaux messages', () => {
    mockChat = makeChat({ messages: [msg(1, 'u2', 'Un')] });
    const view = render(<SessionChatRoute />);
    const list = screen.UNSAFE_getByType(require('react-native').FlatList);
    act(() => list.props.onScroll({ nativeEvent: { contentOffset: { y: 500 } } }));
    expect(screen.getByLabelText('Revenir aux derniers messages')).toBeTruthy();

    mockChat = makeChat({ messages: [msg(1, 'u2', 'Un'), msg(2, 'u3', 'Deux'), msg(3, 'me', 'Moi')] });
    view.rerender(<SessionChatRoute />);
    expect(screen.getByText('1 nouveau')).toBeTruthy();
    mockChat = makeChat({ messages: [...mockChat.messages, msg(4, 'u3', 'Quatre'), msg(5, 'u2', 'Cinq')] });
    view.rerender(<SessionChatRoute />);
    expect(screen.getByText('3 nouveaux')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Revenir aux derniers messages'));
    expect(screen.queryByText('3 nouveaux')).toBeNull();

    act(() => list.props.onScroll({ nativeEvent: { contentOffset: { y: 0 } } }));
    expect(screen.queryByLabelText('Revenir aux derniers messages')).toBeNull();
  });

  it("affiche le spinner de chargement de l'historique", () => {
    mockChat = makeChat({ loadingOlder: true, messages: [msg(1, 'u2', 'Un')] });
    render(<SessionChatRoute />);
    const list = screen.UNSAFE_getByType(require('react-native').FlatList);
    expect(list.props.ListFooterComponent).toBeTruthy();
    expect(list.props.onEndReached).toBe(mockChat.loadOlder);
  });

  it("ne marque pas comme lu si l'écran n'est pas au premier plan, puis au retour dans l'app", () => {
    mockIsFocused = false;
    let listener: (s: string) => void = () => {};
    jest.spyOn(AppState, 'addEventListener').mockImplementationOnce(((_: string, cb: any) => {
      listener = cb;
      return { remove: jest.fn() };
    }) as any);
    render(<SessionChatRoute />);
    expect(mockChat.markRead).not.toHaveBeenCalled();
    act(() => listener('background'));
    act(() => listener('active'));
  });

  it('clavier : écoute show/hide', () => {
    const { Keyboard } = require('react-native');
    const handlers: Record<string, () => void> = {};
    const impl = ((evt: string, cb: any) => {
      handlers[evt] = cb;
      return { remove: jest.fn() };
    }) as any;
    jest.spyOn(Keyboard, 'addListener').mockImplementationOnce(impl).mockImplementationOnce(impl);
    render(<SessionChatRoute />);
    const showKey = Object.keys(handlers).find((k) => k.includes('Show'))!;
    const hideKey = Object.keys(handlers).find((k) => k.includes('Hide'))!;
    act(() => handlers[showKey]());
    act(() => handlers[hideKey]());
  });

  it('démontage : blur du chat', () => {
    const { unmount } = render(<SessionChatRoute />);
    unmount();
    expect(activeChat.blur).toHaveBeenCalledWith('s1');
  });
});
