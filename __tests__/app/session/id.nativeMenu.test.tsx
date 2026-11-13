/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Fiche session sur un build qui embarque le menu natif (@react-native-menu/menu) :
 * HAS_NATIVE_MENU est calculé au chargement du module, d'où ce fichier séparé.
 */
import React from 'react';
import { Alert, Clipboard, UIManager } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { useGetSessionById } from '../../../services';
import { makeSportSession } from '../../../test-utils/sessionScreens';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => true) };
let mockUser: any = { id: 'org-1' };

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({ id: 's-1' }),
}));
jest.mock('@react-navigation/native', () => {
  const R = require('react');
  return { useFocusEffect: (cb: () => any) => R.useEffect(cb, [cb]) };
});
jest.mock('../../../app/context/auth', () => ({ useAuth: () => ({ user: mockUser }) }));
jest.mock('../../../services', () => ({
  useCancelParticipation: () => ({ cancelParticipation: jest.fn(), isLoading: false }),
  useCancelSession: () => ({ cancelSession: jest.fn() }),
  useGetFriends: () => ({ data: [], isLoading: false }),
  useGetSessionById: jest.fn(),
  useInviteFriends: () => ({ inviteFriends: jest.fn() }),
  useRespondToInvitation: () => ({ respondToInvitation: jest.fn(), isLoading: false }),
  useSlotFinding: () => ({ isLoading: false }),
}));
jest.mock('../../../services/users/getUserProfile', () => ({ useGetUserProfile: () => ({ data: null, isLoading: false }) }));
jest.mock('../../../services/chat/activeChat', () => ({ openChat: jest.fn() }));
jest.mock('../../../services/chat/chatApi', () => ({ chatApi: { getMeta: jest.fn(() => Promise.resolve({ unreadCount: 0 })) } }));
jest.mock('../../../services/chat/messageCache', () => ({ messageCache: { preload: jest.fn() } }));
jest.mock('../../../services/friends/contactsService', () => ({ contactsService: { getAllContacts: jest.fn(() => Promise.resolve([])) } }));
jest.mock('../../../services/notifications/pushNotifications', () => ({ pushNotificationService: {} }));
jest.mock('../../../config/env', () => ({ ENV: { WEB_BASE_URL: 'https://sue-app.fr' } }));
jest.mock('../../../hooks', () => ({ usePullToRefresh: () => ({ refreshing: false, onRefresh: jest.fn() }) }));
jest.mock('expo-contacts', () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'denied' })),
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

// Le module natif MenuView est présent : à positionner AVANT de charger l'écran
const originalGetConfig = (UIManager as any).getViewManagerConfig;
(UIManager as any).getViewManagerConfig = jest.fn((name: string) => (name === 'MenuView' ? {} : originalGetConfig?.(name)));
const SessionDetailsScreen = require('../../../app/session/[id]').default;

let mockSession: any;

beforeEach(() => {
  jest.clearAllMocks();
  mockUser = { id: 'org-1' };
  mockSession = makeSportSession();
  (useGetSessionById as jest.Mock).mockImplementation(() => ({
    data: mockSession,
    error: null,
    isLoading: false,
    getSessionById: jest.fn(),
  }));
  // Avertissement de dépréciation de Clipboard (react-native core), émis au premier accès
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  jest.spyOn(Clipboard, 'setString').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

afterAll(() => {
  (UIManager as any).getViewManagerConfig = originalGetConfig;
});

async function renderScreen() {
  render(<SessionDetailsScreen />);
  await act(async () => {});
}

describe('SessionDetailsScreen — menu natif', () => {
  it("affiche le menu natif avec les actions de l'organisateur", async () => {
    await renderScreen();
    expect(screen.getByTestId('native-menu')).toBeTruthy();
    expect(screen.getByText('Modifier la session')).toBeTruthy();
    expect(screen.getByText('Annuler la session')).toBeTruthy();
  });

  it('déclenche les actions du menu natif', async () => {
    await renderScreen();
    fireEvent.press(screen.getByTestId('native-menu-edit'));
    expect(mockRouter.push).toHaveBeenCalledWith('/edit-session/s-1');
    fireEvent.press(screen.getByTestId('native-menu-cancel-session'));
    expect(Alert.alert).toHaveBeenCalledWith('Annuler Session', expect.any(String), expect.any(Array));
    await act(async () => fireEvent.press(screen.getByTestId('native-menu-copy-link')));
    expect(Clipboard.setString).toHaveBeenCalledWith(expect.stringContaining('/join/'));
    await act(async () => fireEvent.press(screen.getByTestId('native-menu-invite')));
    expect(screen.getByPlaceholderText('Rechercher un contact')).toBeTruthy();
  });

  it('participant accepté : "Quitter la session"', async () => {
    mockUser = { id: 'u-2' };
    await renderScreen();
    fireEvent.press(screen.getByTestId('native-menu-leave'));
    expect(Alert.alert).toHaveBeenCalledWith('Annuler', 'Annuler votre participation ?', expect.any(Array));
  });

  it("session passée et utilisateur extérieur : pas de menu", async () => {
    mockUser = { id: 'stranger' };
    mockSession = makeSportSession({ date: '2000-01-01' });
    await renderScreen();
    expect(screen.queryByTestId('native-menu')).toBeNull();
  });
});
