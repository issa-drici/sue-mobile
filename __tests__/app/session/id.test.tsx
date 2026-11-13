/* eslint-disable @typescript-eslint/no-require-imports */
import React from 'react';
import { Alert, Clipboard, Linking, Platform, RefreshControl, Share } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as Contacts from 'expo-contacts';

import SessionDetailsScreen from '../../../app/session/[id]';
import {
  useCancelParticipation,
  useCancelSession,
  useGetFriends,
  useGetSessionById,
  useInviteFriends,
  useRespondToInvitation,
  useSlotFinding,
} from '../../../services';
import { openChat } from '../../../services/chat/activeChat';
import { chatApi } from '../../../services/chat/chatApi';
import { messageCache } from '../../../services/chat/messageCache';
import { contactsService } from '../../../services/friends/contactsService';
import { useGetUserProfile } from '../../../services/users/getUserProfile';
import { makeSportSession, slotFindingModule, sportSurfaceModule } from '../../../test-utils/sessionScreens';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => true) };
let mockParams: Record<string, any> = { id: 's-1' };
let mockUser: any = { id: 'org-1', firstname: 'Marc' };

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
}));
jest.mock('@react-navigation/native', () => {
  const R = require('react');
  return { useFocusEffect: (cb: () => any) => R.useEffect(cb, [cb]) };
});
jest.mock('../../../app/context/auth', () => ({ useAuth: () => ({ user: mockUser }) }));
jest.mock('../../../services', () => ({
  useCancelParticipation: jest.fn(),
  useCancelSession: jest.fn(),
  useGetFriends: jest.fn(),
  useGetSessionById: jest.fn(),
  useInviteFriends: jest.fn(),
  useRespondToInvitation: jest.fn(),
  useSlotFinding: jest.fn(),
}));
jest.mock('../../../services/users/getUserProfile', () => ({ useGetUserProfile: jest.fn() }));
jest.mock('../../../services/chat/activeChat', () => ({ openChat: jest.fn() }));
jest.mock('../../../services/chat/chatApi', () => ({ chatApi: { getMeta: jest.fn() } }));
jest.mock('../../../services/chat/messageCache', () => ({ messageCache: { preload: jest.fn() } }));
jest.mock('../../../services/friends/contactsService', () => ({ contactsService: { getAllContacts: jest.fn() } }));
jest.mock('../../../services/notifications/pushNotifications', () => ({
  pushNotificationService: { shouldShowSoftPrompt: jest.fn(() => Promise.resolve(false)) },
}));
jest.mock('../../../config/env', () => ({ ENV: { WEB_BASE_URL: 'https://sue-app.fr' } }));
jest.mock('../../../hooks', () => ({
  usePullToRefresh: ({ onRefresh }: { onRefresh: () => Promise<void> }) => ({ refreshing: false, onRefresh }),
}));
jest.mock('expo-contacts', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
}));
jest.mock('expo-linear-gradient', () => require('../../../test-utils/sessionScreens').linearGradientModule);
jest.mock('@react-native-menu/menu', () => require('../../../test-utils/sessionScreens').menuModule);
jest.mock('../../../components/atoms/SportIcon', () => require('../../../test-utils/sessionScreens').sportIconModule);
jest.mock('../../../components/atoms/SportSurface', () => require('../../../test-utils/sessionScreens').sportSurfaceModule);
jest.mock('../../../components/ui/ScreenLayout', () => require('../../../test-utils/sessionScreens').screenLayoutModule);
jest.mock('../../../components/UserProfileModal', () => require('../../../test-utils/sessionScreens').userProfileModalModule);
jest.mock('../../../components/NotificationPermissionSheet', () => require('../../../test-utils/sessionScreens').notificationSheetModule);
jest.mock('../../../components/PullToRefresh', () => require('../../../test-utils/sessionScreens').pullToRefreshModule);
jest.mock('../../../components/organisms/SlotFinding', () => require('../../../test-utils/sessionScreens').slotFindingModule);
jest.mock('../../../components/organisms/SlotPicker', () => require('../../../test-utils/sessionScreens').slotPickerModule);

const fns = {
  getSessionById: jest.fn(),
  inviteFriends: jest.fn(),
  respondToInvitation: jest.fn(),
  cancelParticipation: jest.fn(),
  cancelSession: jest.fn(),
  setAvailability: jest.fn(),
  confirmSlot: jest.fn(),
  updateSlots: jest.fn(),
  proposeSlot: jest.fn(),
  removeProposedSlot: jest.fn(),
};

let state: {
  session: any;
  error: string | null;
  isLoading: boolean;
  friends: any[] | null;
  isLoadingFriends: boolean;
  profile: any;
  isLoadingProfile: boolean;
  slotLoading: boolean;
};

const FRIENDS = [
  { id: 'f-1', firstname: 'Karim', lastname: 'Benali', avatar: null },
  { id: 'f-2', firstname: 'Léa', lastname: 'Roux', avatar: 'https://img/lea.png' },
  { id: 'u-2', firstname: 'Julie', lastname: 'Martin', avatar: null }, // déjà participante
  { id: 'u-4', firstname: 'Zoé', lastname: 'Petit', avatar: null }, // a refusé : ré-invitable
];

const alertMock = () => Alert.alert as unknown as jest.Mock;
const lastAlertButtons = () => alertMock().mock.calls[alertMock().mock.calls.length - 1][2] as any[];
const pressAlertButton = async (text: string) => {
  const btn = lastAlertButtons().find((b) => b.text === text);
  await act(async () => {
    await btn.onPress();
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = { id: 's-1' };
  mockUser = { id: 'org-1', firstname: 'Marc' };
  state = {
    session: makeSportSession(),
    error: null,
    isLoading: false,
    friends: FRIENDS,
    isLoadingFriends: false,
    profile: { stats: { sessionsCreated: 0 } },
    isLoadingProfile: false,
    slotLoading: false,
  };
  mockRouter.canGoBack.mockReturnValue(true);
  (useGetSessionById as jest.Mock).mockImplementation(() => ({
    data: state.session,
    error: state.error,
    isLoading: state.isLoading,
    getSessionById: fns.getSessionById,
  }));
  (useGetFriends as jest.Mock).mockImplementation(() => ({ data: state.friends, isLoading: state.isLoadingFriends }));
  (useGetUserProfile as jest.Mock).mockImplementation(() => ({ data: state.profile, isLoading: state.isLoadingProfile }));
  (useInviteFriends as jest.Mock).mockReturnValue({ inviteFriends: fns.inviteFriends });
  (useRespondToInvitation as jest.Mock).mockReturnValue({ respondToInvitation: fns.respondToInvitation, isLoading: false });
  (useCancelParticipation as jest.Mock).mockReturnValue({ cancelParticipation: fns.cancelParticipation, isLoading: false });
  (useCancelSession as jest.Mock).mockReturnValue({ cancelSession: fns.cancelSession });
  (useSlotFinding as jest.Mock).mockImplementation(() => ({
    setAvailability: fns.setAvailability,
    confirmSlot: fns.confirmSlot,
    updateSlots: fns.updateSlots,
    proposeSlot: fns.proposeSlot,
    removeProposedSlot: fns.removeProposedSlot,
    isLoading: state.slotLoading,
  }));
  (chatApi.getMeta as jest.Mock).mockResolvedValue({ unreadCount: 0 });
  (Contacts.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
  (Contacts.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
  (contactsService.getAllContacts as jest.Mock).mockResolvedValue([]);
  (sportSurfaceModule.hasSportSurface as jest.Mock).mockReturnValue(false);
  // Avertissement de dépréciation de Clipboard (react-native core), émis au premier accès
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as any);
  jest.spyOn(Clipboard, 'setString').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  // Les réponses simulées du rechargement ne doivent pas déborder sur le test suivant
  fns.getSessionById.mockReset();
  jest.restoreAllMocks();
  jest.useRealTimers();
});

async function renderScreen() {
  const view = render(<SessionDetailsScreen />);
  await act(async () => {});
  return view;
}

/** Ouvre le menu « … » de secours (Alert) et déclenche une action */
async function runFallbackMenu(title: string) {
  fireEvent.press(screen.UNSAFE_getByProps({ name: 'ellipsis-horizontal' }));
  await pressAlertButton(title);
}

const menuTitles = () => (alertMock().mock.calls.slice(-1)[0][2] as any[]).map((b) => b.text);

describe('SessionDetailsScreen — états', () => {
  it('affiche un indicateur pendant le chargement', async () => {
    state.isLoading = true;
    await renderScreen();
    expect(screen.queryByText('SESSION')).toBeNull();
  });

  it("affiche l'erreur de chargement", async () => {
    state.error = 'Erreur réseau';
    await renderScreen();
    expect(screen.getByText('Erreur réseau')).toBeTruthy();
  });

  it('affiche "Session introuvable" sans session', async () => {
    state.session = null;
    await renderScreen();
    expect(screen.getByText('Session introuvable')).toBeTruthy();
  });

  it("charge la session, le chat et précharge le cache au focus", async () => {
    await renderScreen();
    expect(fns.getSessionById).toHaveBeenCalledWith('s-1');
    expect(chatApi.getMeta).toHaveBeenCalledWith('s-1');
    expect(messageCache.preload).toHaveBeenCalledWith('org-1', 's-1');
  });

  it("n'appelle rien sans id valide", async () => {
    mockParams = { id: undefined };
    mockUser = null;
    await renderScreen();
    expect(fns.getSessionById).not.toHaveBeenCalled();
    expect(chatApi.getMeta).not.toHaveBeenCalled();
  });

  it("organisateur : affiche les détails, joueurs et résumé", async () => {
    await renderScreen();
    expect(screen.getByText('SESSION')).toBeTruthy();
    expect(screen.getByText('Tennis')).toBeTruthy();
    expect(screen.getByText('18:00 - 19:30')).toBeTruthy();
    expect(screen.getByText('Tennis Club de Paris')).toBeTruthy();
    expect(screen.getByText(/2 confirmés/)).toBeTruthy();
    expect(screen.getByText(/1 en attente/)).toBeTruthy();
    expect(screen.getByText('Session ouverte')).toBeTruthy();
    expect(screen.getByText('Confirmés (2)')).toBeTruthy();
    expect(screen.getByText('En attente (1)')).toBeTruthy();
    expect(screen.getByText('Ne vient pas (1)')).toBeTruthy();
    expect(screen.getByText('Inviter des joueurs')).toBeTruthy();
    expect(screen.getByText('MD')).toBeTruthy();
    expect(screen.getByTestId('session-chat-button')).toBeTruthy();
  });

  it('affiche le badge des messages non lus (et 9+)', async () => {
    (chatApi.getMeta as jest.Mock).mockResolvedValueOnce({ unreadCount: 3 });
    const view = await renderScreen();
    expect(screen.getByText('3')).toBeTruthy();
    view.unmount();
    (chatApi.getMeta as jest.Mock).mockResolvedValueOnce({ unreadCount: 12 });
    await renderScreen();
    expect(screen.getByText('9+')).toBeTruthy();
  });

  it('met le compteur du chat à zéro si la récupération échoue', async () => {
    (chatApi.getMeta as jest.Mock).mockRejectedValue(new Error('offline'));
    await renderScreen();
    expect(screen.queryByText('9+')).toBeNull();
  });

  it('limite atteinte : "Complet"', async () => {
    state.session = makeSportSession({ maxParticipants: 2 });
    await renderScreen();
    expect(screen.getByText('Complet')).toBeTruthy();
    expect(screen.getByText(' / 2 joueurs')).toBeTruthy();
  });

  it('places restantes : "Il manque N joueurs" / "1 joueur"', async () => {
    state.session = makeSportSession({ maxParticipants: 4 });
    const view = await renderScreen();
    expect(screen.getByText('Il manque 2 joueurs')).toBeTruthy();
    view.unmount();
    state.session = makeSportSession({
      maxParticipants: 2,
      participants: [{ id: 'org-1', firstname: 'Marc', lastname: 'Dupont', status: 'accepted' }, { id: 'x', status: undefined }] as any,
    });
    await renderScreen();
    expect(screen.getByText('Il manque 1 joueur')).toBeTruthy();
    expect(screen.getByText('1 confirmé • 1 en attente')).toBeTruthy();
    expect(screen.getByText('?')).toBeTruthy();
  });

  it('carte héro sombre pour les sports avec terrain', async () => {
    (sportSurfaceModule.hasSportSurface as jest.Mock).mockReturnValue(true);
    state.session = makeSportSession({ sport: 'padel' as any });
    await renderScreen();
    expect(screen.getByTestId('sport-surface')).toBeTruthy();
  });

  it('sport non configuré : icône par défaut', async () => {
    state.session = makeSportSession({ sport: 'escalade' as any });
    await renderScreen();
    expect(screen.getByText('Escalade')).toBeTruthy();
  });

  it('session annulée : pas de bouton inviter', async () => {
    state.session = makeSportSession({ status: 'cancelled' });
    await renderScreen();
    expect(screen.queryByText('Inviter des joueurs')).toBeNull();
  });

  it('la feuille de notifications (désactivée) reste masquée et se ferme', async () => {
    await renderScreen();
    expect(screen.queryByText('Feuille notifications visible')).toBeNull();
    fireEvent.press(screen.getByTestId('notif-sheet-dismiss'));
  });

  it('pull to refresh recharge la session sans loader', async () => {
    await renderScreen();
    await act(async () => {
      await screen.UNSAFE_getByType(RefreshControl).props.onRefresh();
    });
    expect(fns.getSessionById).toHaveBeenCalledWith('s-1', false);
  });

  it('openComments=true ouvre le chat ; le bouton chat aussi', async () => {
    mockParams = { id: 's-1', openComments: 'true' };
    await renderScreen();
    expect(openChat).toHaveBeenCalledWith('s-1');
    fireEvent.press(screen.getByTestId('session-chat-button'));
    expect(openChat).toHaveBeenCalledTimes(2);
  });

  it('bouton retour : back ou accueil', async () => {
    await renderScreen();
    fireEvent.press(screen.UNSAFE_getByProps({ name: 'arrow-back' }));
    expect(mockRouter.back).toHaveBeenCalled();
    mockRouter.canGoBack.mockReturnValue(false);
    fireEvent.press(screen.UNSAFE_getByProps({ name: 'arrow-back' }));
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
  });

  it('appui sur un joueur : ouvre son profil, ferme et changement d\'organisateur', async () => {
    await renderScreen();
    fireEvent.press(screen.getByText('Julie'));
    expect(screen.getByText('Profil Julie Martin (accepted)')).toBeTruthy();
    fireEvent.press(screen.getByTestId('user-profile-organizer-changed'));
    expect(fns.getSessionById).toHaveBeenCalledTimes(2);
    fireEvent.press(screen.getByTestId('user-profile-close'));
    expect(screen.queryByTestId('user-profile-modal')).toBeNull();
    fireEvent.press(screen.getAllByText('Marc')[0]);
    expect(screen.getByText('Profil Marc Dupont (accepted) orga')).toBeTruthy();
  });

  it('joueur sans prénom ni statut : valeurs par défaut', async () => {
    state.session = makeSportSession({ participants: [{ id: 'z', status: 'declined' }] as any });
    await renderScreen();
    fireEvent.press(screen.getByText('?'));
    expect(screen.getByText('Profil   (declined)')).toBeTruthy();
  });
});

describe('SessionDetailsScreen — a refusé ou quitté', () => {
  beforeEach(() => {
    mockUser = { id: 'u-4' };
  });

  it('peut revenir de lui-même avec « Finalement je viens »', async () => {
    fns.respondToInvitation.mockResolvedValue({});
    state.session = makeSportSession();
    await renderScreen();
    expect(screen.getByText('Tu ne viens pas')).toBeTruthy();
    expect(screen.queryByText('Tu participes ?')).toBeNull();
    await act(async () => fireEvent.press(screen.getByText('Finalement je viens')));
    expect(fns.respondToInvitation).toHaveBeenCalledWith('s-1', 'accept');
  });

  it('pas de retour possible si la session est pleine, annulée ou sans créneau fixé', async () => {
    state.session = makeSportSession({ maxParticipants: 2 });
    const { unmount } = await renderScreen();
    expect(screen.queryByText('Finalement je viens')).toBeNull();
    unmount();

    state.session = makeSportSession({ status: 'cancelled' } as any);
    const second = await renderScreen();
    expect(screen.queryByText('Finalement je viens')).toBeNull();
    second.unmount();

    state.session = makeSportSession({ scheduling: 'finding_slot' } as any);
    await renderScreen();
    expect(screen.queryByText('Finalement je viens')).toBeNull();
  });
});

describe('SessionDetailsScreen — invité en attente', () => {
  beforeEach(() => {
    mockUser = { id: 'u-3' };
  });

  it('accepte l\'invitation', async () => {
    fns.respondToInvitation.mockResolvedValue({});
    await renderScreen();
    expect(screen.getByText('Tu participes ?')).toBeTruthy();
    await act(async () => fireEvent.press(screen.getByText('Je participe')));
    expect(fns.respondToInvitation).toHaveBeenCalledWith('s-1', 'accept');
    expect(fns.getSessionById).toHaveBeenCalledTimes(2);
  });

  it("alerte si l'acceptation échoue", async () => {
    fns.respondToInvitation.mockRejectedValue(new Error('x'));
    await renderScreen();
    await act(async () => fireEvent.press(screen.getByText('Je participe')));
    expect(alertMock()).toHaveBeenCalledWith('Erreur', "Impossible d'accepter");
  });

  it("refuse après confirmation, et alerte en cas d'échec", async () => {
    fns.respondToInvitation.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('x'));
    await renderScreen();
    await act(async () => fireEvent.press(screen.getByText('Je ne peux pas')));
    expect(alertMock()).toHaveBeenCalledWith('Refuser', 'Sûr de vouloir refuser ?', expect.any(Array));
    await pressAlertButton('Refuser');
    expect(fns.respondToInvitation).toHaveBeenCalledWith('s-1', 'decline');
    await act(async () => fireEvent.press(screen.getByText('Je ne peux pas')));
    await pressAlertButton('Refuser');
    expect(alertMock()).toHaveBeenCalledWith('Erreur', 'Impossible de refuser');
  });

  it("pas de réponse possible si complet, depuis l'historique ou session annulée", async () => {
    state.session = makeSportSession({ maxParticipants: 2 });
    const v1 = await renderScreen();
    expect(screen.queryByText('Tu participes ?')).toBeNull();
    v1.unmount();
    state.session = makeSportSession();
    mockParams = { id: 's-1', source: 'history' };
    const v2 = await renderScreen();
    expect(screen.queryByText('Tu participes ?')).toBeNull();
    v2.unmount();
    mockParams = { id: 's-1' };
    state.session = makeSportSession({ status: 'cancelled' });
    await renderScreen();
    expect(screen.queryByText('Tu participes ?')).toBeNull();
  });
});

describe('SessionDetailsScreen — menu « … » (alerte de secours)', () => {
  it("organisateur : propose inviter, copier, modifier, annuler", async () => {
    await renderScreen();
    fireEvent.press(screen.UNSAFE_getByProps({ name: 'ellipsis-horizontal' }));
    expect(menuTitles()).toEqual(['Inviter des joueurs', 'Copier le lien', 'Modifier la session', 'Annuler la session', 'Annuler']);
  });

  it('modifier : navigue vers l\'édition', async () => {
    await renderScreen();
    await runFallbackMenu('Modifier la session');
    expect(mockRouter.push).toHaveBeenCalledWith('/edit-session/s-1');
  });

  it('annuler la session : confirmation, retour, accueil ou erreur', async () => {
    fns.cancelSession.mockResolvedValueOnce({}).mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('x'));
    await renderScreen();
    await runFallbackMenu('Annuler la session');
    expect(alertMock()).toHaveBeenLastCalledWith('Annuler Session', 'Action irréversible. Annuler la session ?', expect.any(Array));
    await pressAlertButton('Oui, supprimer');
    expect(fns.cancelSession).toHaveBeenCalledWith('s-1');
    expect(mockRouter.back).toHaveBeenCalled();

    mockRouter.canGoBack.mockReturnValue(false);
    await runFallbackMenu('Annuler la session');
    await pressAlertButton('Oui, supprimer');
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');

    await runFallbackMenu('Annuler la session');
    await pressAlertButton('Oui, supprimer');
    expect(alertMock()).toHaveBeenLastCalledWith('Erreur', "Impossible d'annuler la session");
  });

  it('copier le lien : presse-papiers et confirmation temporaire', async () => {
    jest.useFakeTimers();
    await renderScreen();
    await runFallbackMenu('Copier le lien');
    const url = (Clipboard.setString as jest.Mock).mock.calls[0][0];
    expect(url).toMatch(/^https:\/\/sue-app\.fr\/join\/share-tok\?from=org-1&p=[0-9a-z]+$/);
    expect(screen.getByText('Lien copié')).toBeTruthy();
    act(() => jest.advanceTimersByTime(2100));
    expect(screen.queryByText('Lien copié')).toBeNull();
  });

  it('inviter : ouvre la fenêtre d\'invitation', async () => {
    await renderScreen();
    await runFallbackMenu('Inviter des joueurs');
    expect(screen.getAllByText('Inviter des joueurs').length).toBeGreaterThan(1);
  });

  it('participant accepté : quitter la session (succès et échec)', async () => {
    mockUser = { id: 'u-2' };
    fns.cancelParticipation.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('x'));
    await renderScreen();
    fireEvent.press(screen.UNSAFE_getByProps({ name: 'ellipsis-horizontal' }));
    expect(menuTitles()).toEqual(['Inviter des joueurs', 'Copier le lien', 'Quitter la session', 'Annuler']);
    expect(lastAlertButtons()[2].style).toBe('destructive');
    await pressAlertButton('Quitter la session');
    await pressAlertButton('Oui, annuler');
    expect(fns.cancelParticipation).toHaveBeenCalledWith('s-1');
    await runFallbackMenu('Quitter la session');
    await pressAlertButton('Oui, annuler');
    expect(alertMock()).toHaveBeenLastCalledWith('Erreur', "Impossible d'annuler");
  });

  it('sans token de partage : pas de "Copier le lien", URL de repli', async () => {
    mockUser = { id: 'stranger' };
    state.session = makeSportSession({ shareToken: null });
    await renderScreen();
    expect(screen.queryByTestId('session-chat-button')).toBeNull();
    fireEvent.press(screen.UNSAFE_getByProps({ name: 'ellipsis-horizontal' }));
    expect(menuTitles()).toEqual(['Inviter des joueurs', 'Annuler']);
    expect(lastAlertButtons()[1].style).toBe('cancel');
  });

  it('session passée sans participation : aucun menu', async () => {
    mockUser = { id: 'stranger' };
    state.session = makeSportSession({ date: '2000-01-01' });
    await renderScreen();
    expect(screen.UNSAFE_queryByProps({ name: 'ellipsis-horizontal' })).toBeNull();
  });
});

describe('SessionDetailsScreen — trouver un créneau', () => {
  const SLOTS = [
    { id: 'slot-1', date: '2099-07-06', startTime: '10:00', endTime: '11:30', availableUserIds: [] },
    { id: 'slot-2', date: '2099-07-07', startTime: '23:00', endTime: '00:30', availableUserIds: [] },
    { date: '2099-07-08', startTime: '09:00', endTime: '10:00' },
  ];

  it('organisateur : carte de confirmation et confirmation d\'un créneau', async () => {
    state.session = makeSportSession({ scheduling: 'finding_slot', slotProposals: SLOTS });
    fns.confirmSlot.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('Trop tard')).mockRejectedValueOnce('x');
    await renderScreen();
    expect(screen.getByText('Créneau à définir · 3 proposés')).toBeTruthy();
    expect(screen.queryByText('Session ouverte')).toBeNull();
    expect(screen.getByText("Inviter d'autres joueurs")).toBeTruthy();

    fireEvent.press(screen.getByTestId('confirm-slot-0'));
    expect(alertMock()).toHaveBeenLastCalledWith('Confirmer ce créneau ?', expect.stringContaining('Jour 2099-07-06, 10:00 - 11:30'), expect.any(Array));
    await pressAlertButton('Confirmer');
    expect(fns.confirmSlot).toHaveBeenCalledWith('s-1', 'slot-1');
    expect(fns.getSessionById).toHaveBeenCalledWith('s-1', false);

    fireEvent.press(screen.getByTestId('confirm-slot-0'));
    await pressAlertButton('Confirmer');
    expect(alertMock()).toHaveBeenLastCalledWith('Erreur', 'Trop tard');
    fireEvent.press(screen.getByTestId('confirm-slot-0'));
    await pressAlertButton('Confirmer');
    expect(alertMock()).toHaveBeenLastCalledWith('Erreur', 'Impossible de confirmer le créneau');

    // Créneau sans id : rien
    const calls = alertMock().mock.calls.length;
    fireEvent.press(screen.getByTestId('confirm-slot-2'));
    expect(alertMock().mock.calls.length).toBe(calls);

    await act(async () => fireEvent.press(screen.getByTestId('confirm-card-invite')));
    expect(screen.getByText(/Date à définir/)).toBeTruthy();
  });

  it('organisateur : modifier les créneaux (ids conservés pour les existants)', async () => {
    state.session = makeSportSession({ scheduling: 'finding_slot', slotProposals: SLOTS });
    fns.updateSlots.mockRejectedValueOnce(new Error('Refus')).mockRejectedValueOnce('x').mockResolvedValueOnce({});
    await renderScreen();
    fireEvent.press(screen.getByTestId('confirm-card-edit'));
    expect(screen.getByText('CRÉNEAUX POSSIBLES')).toBeTruthy();
    expect(screen.getByText('3 créneau(x) dans le sélecteur')).toBeTruthy();
    fireEvent.press(screen.getByTestId('slot-picker-add'));

    await act(async () => fireEvent.press(screen.getByText('ENREGISTRER')));
    expect(alertMock()).toHaveBeenLastCalledWith('Erreur', 'Refus');
    await act(async () => fireEvent.press(screen.getByText('ENREGISTRER')));
    expect(alertMock()).toHaveBeenLastCalledWith('Erreur', 'Impossible de modifier les créneaux');
    await act(async () => fireEvent.press(screen.getByText('ENREGISTRER')));
    expect(fns.updateSlots).toHaveBeenLastCalledWith('s-1', [
      { id: 'slot-1', date: '2099-07-06', startTime: '10:00', endTime: '11:30' },
      { id: 'slot-2', date: '2099-07-07', startTime: '23:00', endTime: '00:30' },
      { date: '2099-07-08', startTime: '09:00', endTime: '10:00' },
      { date: '2026-07-06', startTime: '10:00', endTime: '11:30' },
    ]);
    expect(screen.queryByText('CRÉNEAUX POSSIBLES')).toBeNull();
  });

  it('organisateur : fermer l\'éditeur de créneaux et état "enregistrement"', async () => {
    state.session = makeSportSession({ scheduling: 'finding_slot', slotProposals: [SLOTS[0]] });
    const view = await renderScreen();
    expect(screen.getByText('Créneau à définir · 1 proposé')).toBeTruthy();
    fireEvent.press(screen.getByTestId('confirm-card-edit'));
    state.slotLoading = true;
    view.rerender(<SessionDetailsScreen />);
    expect(screen.getByText('ENREGISTREMENT...')).toBeTruthy();
    const { Modal } = require('react-native');
    act(() => screen.UNSAFE_getAllByType(Modal).forEach((m: any) => m.props.visible && m.props.onRequestClose?.()));
    expect(screen.queryByText('ENREGISTREMENT...')).toBeNull();
    fireEvent.press(screen.getByTestId('confirm-card-edit'));
    const closes = screen.UNSAFE_getAllByProps({ name: 'close' });
    fireEvent.press(closes[closes.length - 1]);
    expect(screen.queryByText('ENREGISTREMENT...')).toBeNull();
  });

  it('aucun créneau : libellé dédié, pas de carte de dispo pour un invité', async () => {
    mockUser = { id: 'u-3' };
    state.session = makeSportSession({ scheduling: 'finding_slot', slotProposals: undefined });
    await renderScreen();
    expect(screen.getByText('Créneau à définir · aucun créneau à venir')).toBeTruthy();
    expect(screen.queryByTestId('slot-availability-card')).toBeNull();
    expect(screen.queryByText('Tu participes ?')).toBeNull();
  });

  it('invité : envoie ses dispos, propose et retire un créneau', async () => {
    mockUser = { id: 'u-3' };
    state.session = makeSportSession({ scheduling: 'finding_slot', slotProposals: SLOTS });
    fns.setAvailability.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('KO')).mockRejectedValueOnce('x');
    fns.proposeSlot.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('Doublon')).mockRejectedValueOnce('x');
    fns.removeProposedSlot.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('Non')).mockRejectedValueOnce('x');
    await renderScreen();
    expect(screen.queryByTestId('slot-confirm-card')).toBeNull();

    await act(async () => fireEvent.press(screen.getByTestId('availability-send')));
    expect(fns.setAvailability).toHaveBeenCalledWith('s-1', ['slot-1']);
    await act(async () => fireEvent.press(screen.getByTestId('availability-send')));
    expect(alertMock()).toHaveBeenLastCalledWith('Erreur', 'KO');
    await act(async () => fireEvent.press(screen.getByTestId('availability-send')));
    expect(alertMock()).toHaveBeenLastCalledWith('Erreur', "Impossible d'envoyer tes disponibilités");

    await act(async () => fireEvent.press(screen.getByTestId('availability-propose')));
    expect(fns.proposeSlot).toHaveBeenCalledWith('s-1', { date: '2026-07-08', startTime: '09:00', endTime: '10:00' });
    expect((slotFindingModule as any).lastProposeResult).toBe(true);
    await act(async () => fireEvent.press(screen.getByTestId('availability-propose')));
    expect(alertMock()).toHaveBeenLastCalledWith('Erreur', 'Doublon');
    expect((slotFindingModule as any).lastProposeResult).toBe(false);
    await act(async () => fireEvent.press(screen.getByTestId('availability-propose')));
    expect(alertMock()).toHaveBeenLastCalledWith('Erreur', 'Impossible de proposer ce créneau');

    await act(async () => fireEvent.press(screen.getByTestId('availability-remove')));
    expect(fns.removeProposedSlot).toHaveBeenCalledWith('s-1', 'slot-2');
    await act(async () => fireEvent.press(screen.getByTestId('availability-remove')));
    expect(alertMock()).toHaveBeenLastCalledWith('Erreur', 'Non');
    await act(async () => fireEvent.press(screen.getByTestId('availability-remove')));
    expect(alertMock()).toHaveBeenLastCalledWith('Erreur', 'Impossible de retirer ce créneau');
  });
});

describe('SessionDetailsScreen — invitation', () => {
  async function openInviteModal() {
    await renderScreen();
    await act(async () => fireEvent.press(screen.getByText('Inviter des joueurs')));
  }

  // Juste après la création, la session affichée peut ne pas encore avoir son code de partage :
  // le lien copié doit quand même être le lien /join (seul lien avec un aperçu de la session dans
  // iMessage / WhatsApp), récupéré en rechargeant la session, jamais un lien de repli sans aperçu.
  it('copier le lien sans code de partage chargé : recharge la session et copie le lien /join', async () => {
    mockParams = { id: 's-1', openInvite: 'true' };
    state.session = makeSportSession({ shareToken: null });
    fns.getSessionById.mockResolvedValue(makeSportSession({ shareToken: 'fresh-tok' }));
    await renderScreen();
    await act(async () => fireEvent.press(screen.getByText('Copier le lien')));
    expect(fns.getSessionById).toHaveBeenCalledWith('s-1', false);
    expect(Clipboard.setString).toHaveBeenCalledWith(expect.stringContaining('https://sue-app.fr/join/fresh-tok'));
    expect(Clipboard.setString).not.toHaveBeenCalledWith(expect.stringContaining('/session/'));
  });

  it('copier le lien sans code de partage ni réseau : message clair, rien de copié', async () => {
    mockParams = { id: 's-1', openInvite: 'true' };
    state.session = makeSportSession({ shareToken: null });
    // Le vrai hook ne rejette pas : il renvoie null quand le rechargement échoue
    fns.getSessionById.mockResolvedValue(null);
    await renderScreen();
    await act(async () => fireEvent.press(screen.getByText('Copier le lien')));
    expect(Clipboard.setString).not.toHaveBeenCalled();
    expect(alertMock()).toHaveBeenLastCalledWith('Lien indisponible', expect.any(String));
  });

  it('openInvite=true ouvre directement la fenêtre', async () => {
    mockParams = { id: 's-1', openInvite: 'true' };
    await renderScreen();
    expect(screen.getByPlaceholderText('Rechercher un contact')).toBeTruthy();
  });

  it('liste les amis invitables et invite la sélection', async () => {
    fns.inviteFriends.mockResolvedValue({});
    await openInviteModal();
    expect(screen.getByText(/Tennis .*18:00$/)).toBeTruthy();
    expect(screen.getByText('AMIS SUE (3)')).toBeTruthy();
    expect(screen.getByText('Karim Benali')).toBeTruthy();
    expect(screen.getByText('Zoé Petit')).toBeTruthy();
    expect(screen.queryByText('Julie Martin')).toBeNull();
    expect(screen.getByText('Terminé')).toBeTruthy();

    fireEvent.press(screen.getByText('Karim Benali'));
    fireEvent.press(screen.getByText('Léa Roux'));
    expect(screen.getByText('Inviter 2 joueurs')).toBeTruthy();
    fireEvent.press(screen.getByText('Léa Roux'));
    expect(screen.getByText('Inviter 1 joueur')).toBeTruthy();
    await act(async () => fireEvent.press(screen.getByText('Inviter 1 joueur')));
    expect(fns.inviteFriends).toHaveBeenCalledWith('s-1', ['f-1']);
    expect(screen.queryByPlaceholderText('Rechercher un contact')).toBeNull();
  });

  it("alerte si l'invitation échoue", async () => {
    fns.inviteFriends.mockRejectedValue(new Error('x'));
    await openInviteModal();
    fireEvent.press(screen.getByText('Karim Benali'));
    await act(async () => fireEvent.press(screen.getByText('Inviter 1 joueur')));
    expect(alertMock()).toHaveBeenCalledWith('Erreur', "Echec de l'envoi");
  });

  it('recherche dans les amis et "Terminé" ferme', async () => {
    await openInviteModal();
    fireEvent.changeText(screen.getByPlaceholderText('Rechercher un contact'), 'léa');
    expect(screen.getByText('AMIS SUE (1)')).toBeTruthy();
    fireEvent.changeText(screen.getByPlaceholderText('Rechercher un contact'), 'zzz');
    expect(screen.queryByText(/AMIS SUE/)).toBeNull();
    fireEvent.press(screen.getByText('Terminé'));
    expect(screen.queryByPlaceholderText('Rechercher un contact')).toBeNull();
  });

  it('squelette pendant le chargement des amis, placeholder pendant le profil', async () => {
    state.isLoadingFriends = true;
    state.isLoadingProfile = true;
    state.friends = null;
    await openInviteModal();
    expect(screen.getByText('AMIS SUE')).toBeTruthy();
    expect(screen.queryByText('Partagez cette session ✨')).toBeNull();
  });

  it('phase 1 : grande carte de partage, partager et copier le lien', async () => {
    jest.useFakeTimers();
    await openInviteModal();
    expect(screen.getByText('Partagez cette session ✨')).toBeTruthy();
    await act(async () => fireEvent.press(screen.getByText('Partager la session')));
    expect(Share.share).toHaveBeenCalledWith({ message: expect.stringContaining('https://sue-app.fr/join/share-tok') });
    await act(async () => fireEvent.press(screen.getByText('Copier le lien')));
    expect(screen.getByText('Lien copié !')).toBeTruthy();
    await act(async () => fireEvent.press(screen.getByText('Lien copié !')));
    act(() => jest.advanceTimersByTime(2100));
    expect(screen.getByText('Copier le lien')).toBeTruthy();
    expect(Clipboard.setString).toHaveBeenCalledTimes(2);
  });

  it('phase 2 : lien de partage simple', async () => {
    state.profile = { stats: { sessionsCreated: 10 } };
    await openInviteModal();
    expect(screen.queryByText('Partagez cette session ✨')).toBeNull();
    await act(async () => fireEvent.press(screen.getByText('Partager la session')));
    expect(Share.share).toHaveBeenCalled();
  });

  it('phase 3 : partage entre amis et contacts', async () => {
    state.friends = Array.from({ length: 31 }, (_, i) => ({ id: `ff-${i}`, firstname: `Ami${i}`, lastname: 'X', avatar: null }));
    await openInviteModal();
    expect(screen.getByText('Invitez des personnes qui ne sont pas encore sur SUE.')).toBeTruthy();
    await act(async () => fireEvent.press(screen.getByText('Partager la session')));
    expect(Share.share).toHaveBeenCalled();
  });

  it('contacts autorisés : liste triée, sans les amis, invitation par partage', async () => {
    (contactsService.getAllContacts as jest.Mock).mockResolvedValue([
      { id: 'c2', name: 'Zinedine Z', phoneNumbers: [] },
      { id: 'c1', name: 'Alice Bob', phoneNumbers: [] },
      { id: 'c3', name: 'Karim Benali', phoneNumbers: [] },
      { id: 'c4', name: '', phoneNumbers: [] },
    ]);
    await openInviteModal();
    expect(screen.getByText('Alice Bob')).toBeTruthy();
    expect(screen.getByText('AB')).toBeTruthy();
    expect(screen.getAllByText('Karim Benali')).toHaveLength(1);
    await act(async () => fireEvent.press(screen.getAllByText('Inviter')[1]));
    expect(Share.share).toHaveBeenCalledWith({ message: expect.stringContaining('Alice') });
  });

  it('contacts autorisés mais vides : message dédié', async () => {
    await openInviteModal();
    expect(screen.getByText('Aucun contact local trouvé.')).toBeTruthy();
  });

  it('contacts : chargement par pages au défilement', async () => {
    (contactsService.getAllContacts as jest.Mock).mockResolvedValue(
      Array.from({ length: 70 }, (_, i) => ({ id: `c${i}`, name: `Contact ${String(i).padStart(2, '0')}`, phoneNumbers: [] }))
    );
    await openInviteModal();
    expect(screen.getByText('Fais défiler pour voir plus de contacts…')).toBeTruthy();
    expect(screen.queryByText('Contact 65')).toBeNull();
    const scroll = screen.UNSAFE_getAllByProps({ scrollEventThrottle: 200 })[0];
    act(() => scroll.props.onScroll({ nativeEvent: { contentOffset: { y: 0 }, contentSize: { height: 5000 }, layoutMeasurement: { height: 800 } } }));
    expect(screen.queryByText('Contact 65')).toBeNull();
    act(() => scroll.props.onScroll({ nativeEvent: { contentOffset: { y: 4100 }, contentSize: { height: 5000 }, layoutMeasurement: { height: 800 } } }));
    expect(screen.getByText('Contact 65')).toBeTruthy();
    expect(screen.queryByText('Fais défiler pour voir plus de contacts…')).toBeNull();
    // Avec une recherche, tous les résultats sont affichés
    fireEvent.changeText(screen.getByPlaceholderText('Rechercher un contact'), 'contact 6');
    expect(screen.getByText('Contact 69')).toBeTruthy();
  });

  it("erreur de chargement des contacts : liste vide", async () => {
    (contactsService.getAllContacts as jest.Mock).mockRejectedValue(new Error('x'));
    await openInviteModal();
    expect(screen.getByText('Aucun contact local trouvé.')).toBeTruthy();
  });

  it('contacts refusés : bannière, réglages iOS puis Android', async () => {
    (Contacts.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any);
    const openSettings = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined as any);
    await openInviteModal();
    expect(screen.getByText('Accède à tes contacts')).toBeTruthy();
    await act(async () => fireEvent.press(screen.getByText('AUTORISER L’ACCÈS')));
    expect(openURL).toHaveBeenCalledWith('app-settings:');
    jest.replaceProperty(Platform, 'OS', 'android');
    await act(async () => fireEvent.press(screen.getByText('AUTORISER L’ACCÈS')));
    expect(openSettings).toHaveBeenCalled();
  });

  it('permission non demandée : écran d\'introduction, "PLUS TARD"', async () => {
    (Contacts.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'undetermined' });
    await openInviteModal();
    expect(screen.getByText('INVITER DES JOUEURS')).toBeTruthy();
    await act(async () => fireEvent.press(screen.getByText('PLUS TARD')));
    expect(screen.getByPlaceholderText('Rechercher un contact')).toBeTruthy();
    expect(screen.getByText('Accède à tes contacts')).toBeTruthy();
  });

  it("permission non demandée : autoriser l'accès charge les contacts", async () => {
    (Contacts.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'undetermined' }).mockResolvedValue({ status: 'undetermined' });
    (contactsService.getAllContacts as jest.Mock).mockResolvedValue([{ id: 'c1', name: 'Nina', phoneNumbers: [] }]);
    await openInviteModal();
    (Contacts.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'undetermined' }).mockResolvedValue({ status: 'granted' });
    await act(async () => fireEvent.press(screen.getByText('AUTORISER L’ACCÈS')));
    expect(Contacts.requestPermissionsAsync).toHaveBeenCalled();
    expect(screen.getByText('Nina')).toBeTruthy();
  });

  it("permission : échec de la demande -> refusé", async () => {
    (Contacts.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'undetermined' });
    (Contacts.requestPermissionsAsync as jest.Mock).mockRejectedValue(new Error('x'));
    await openInviteModal();
    await act(async () => fireEvent.press(screen.getByText('AUTORISER L’ACCÈS')));
    expect(screen.getByText('Accède à tes contacts')).toBeTruthy();
  });

  it("permission : échec de la vérification -> refusé", async () => {
    (Contacts.getPermissionsAsync as jest.Mock).mockRejectedValue(new Error('x'));
    await openInviteModal();
    expect(screen.getByText('Accède à tes contacts')).toBeTruthy();
  });

  it("fermeture depuis l'introduction et depuis la liste", async () => {
    (Contacts.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'undetermined' });
    await openInviteModal();
    const closes = screen.UNSAFE_getAllByProps({ name: 'close' });
    await act(async () => fireEvent.press(closes[closes.length - 1]));
    expect(screen.queryByText('INVITER DES JOUEURS')).toBeNull();

    (Contacts.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    await act(async () => fireEvent.press(screen.getByText('Inviter des joueurs')));
    await act(async () => fireEvent.press(screen.UNSAFE_getByProps({ name: 'chevron-back' })));
    expect(screen.queryByPlaceholderText('Rechercher un contact')).toBeNull();
  });

  it('sans ami ni profil : phase 1 par défaut', async () => {
    state.friends = null;
    state.profile = null;
    await openInviteModal();
    expect(screen.getByText('Partagez cette session ✨')).toBeTruthy();
  });
});
