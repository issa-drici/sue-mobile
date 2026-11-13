import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Platform, RefreshControl } from 'react-native';

import NotificationsScreen from '../../../app/(tabs)/notifications';
import { mockRouter, resetRouter, silenceConsole } from '../../../test-utils/screens';

jest.mock('expo-router', () => require('../../../test-utils/screens').expoRouterMock());

jest.mock('react-native-swipe-list-view', () => {
  const { View } = require('react-native');
  return {
    SwipeListView: ({ data, renderItem, renderHiddenItem, ListEmptyComponent, refreshControl, keyExtractor }: any) => (
      <View>
        {refreshControl}
        {data.length === 0
          ? ListEmptyComponent
          : data.map((item: any, index: number) => (
              <View key={keyExtractor(item)}>
                {renderHiddenItem({ item, index }, {})}
                {renderItem({ item, index })}
              </View>
            ))}
      </View>
    ),
  };
});

const mockState = {
  list: {} as any,
  global: {} as any,
  markAsRead: jest.fn(() => Promise.resolve()),
  markAllAsRead: jest.fn(() => Promise.resolve()),
  deleteNotification: jest.fn(() => Promise.resolve()),
};
jest.mock('../../../context/globalNotifications', () => ({ useGlobalNotifications: () => mockState.global }));
jest.mock('../../../services', () => ({
  useGetNotifications: () => mockState.list,
  useMarkNotificationAsRead: () => ({ markAsRead: mockState.markAsRead }),
  useMarkAllNotificationsAsRead: () => ({ markAllAsRead: mockState.markAllAsRead }),
  useDeleteNotification: () => ({ deleteNotification: mockState.deleteNotification }),
}));

const notif = (id: string, extra: Record<string, any> = {}) => ({
  id,
  type: 'session_invitation',
  title: `Titre ${id}`,
  message: `Message ${id}`,
  isRead: false,
  read: false,
  createdAt: '2026-01-05T10:00:00Z',
  ...extra,
});

describe('NotificationsScreen (onglet masqué)', () => {
  beforeEach(() => {
    silenceConsole();
    resetRouter();
    mockState.markAsRead.mockClear();
    mockState.markAllAsRead.mockClear();
    mockState.deleteNotification.mockClear();
    mockState.list = {
      data: [
        notif('n1', { data: { sessionId: 's1' } }),
        notif('n2', { type: 'friend_request', isRead: true, data: { userId: 'u2' } }),
        notif('n3', { read: true, sessionId: 's3', title: '', message: undefined }),
        notif('n4', { isRead: true }),
      ],
      isLoading: false,
      refetch: jest.fn(() => Promise.resolve()),
    };
    mockState.global = { unreadCount: 1, refetch: jest.fn(() => Promise.resolve()) };
  });
  afterEach(() => jest.restoreAllMocks());

  it('affiche les notifications et le compteur de non lues', () => {
    render(<NotificationsScreen />);
    expect(screen.getByText('ALERTS')).toBeTruthy();
    expect(screen.getByText('1 NON LUES')).toBeTruthy();
    expect(screen.getByText('Titre n1')).toBeTruthy();
    expect(screen.getByText('Notification')).toBeTruthy(); // titre par défaut
  });

  it('affiche "TOUT EST CALME" sans non lues (pas de bouton tout lire)', () => {
    mockState.global.unreadCount = 0;
    render(<NotificationsScreen />);
    expect(screen.getByText('TOUT EST CALME')).toBeTruthy();
    expect(screen.queryByTestId('mark-all-read')).toBeNull();
  });

  it('affiche un chargement', () => {
    mockState.list.isLoading = true;
    render(<NotificationsScreen />);
    expect(screen.getByText('Chargement...')).toBeTruthy();
  });

  it("affiche l'état vide (données nulles)", () => {
    mockState.list.data = null;
    render(<NotificationsScreen />);
    expect(screen.getByText('RIEN À SIGNALER')).toBeTruthy();
  });

  it('marque comme lue puis ouvre la session (data.sessionId)', async () => {
    render(<NotificationsScreen />);
    await act(async () => {
      fireEvent.press(screen.getByText('Titre n1'));
    });
    expect(mockState.markAsRead).toHaveBeenCalledWith('n1');
    expect(mockState.global.refetch).toHaveBeenCalled();
    expect(mockRouter.push).toHaveBeenCalledWith('/session/s1');
  });

  it("ouvre les amis pour une notification d'utilisateur déjà lue", async () => {
    render(<NotificationsScreen />);
    await act(async () => {
      fireEvent.press(screen.getByText('Titre n2'));
    });
    expect(mockState.markAsRead).not.toHaveBeenCalled();
    expect(mockRouter.push).toHaveBeenCalledWith('/friends');
  });

  it('utilise sessionId de premier niveau (ancien format)', async () => {
    render(<NotificationsScreen />);
    await act(async () => {
      fireEvent.press(screen.getByText('Notification'));
    });
    expect(mockRouter.push).toHaveBeenCalledWith('/session/s3');
  });

  it('ne navigue pas sans cible', async () => {
    render(<NotificationsScreen />);
    await act(async () => {
      fireEvent.press(screen.getByText('Titre n4'));
    });
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('supprime une notification', async () => {
    render(<NotificationsScreen />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('delete-notification-n2'));
    });
    expect(mockState.deleteNotification).toHaveBeenCalledWith('n2');
    expect(mockState.list.refetch).toHaveBeenCalled();
    expect(mockState.global.refetch).toHaveBeenCalled();
  });

  it('marque tout comme lu', async () => {
    render(<NotificationsScreen />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('mark-all-read'));
    });
    expect(mockState.markAllAsRead).toHaveBeenCalled();
    expect(mockState.list.refetch).toHaveBeenCalled();
  });

  it('rafraîchit la liste et le compteur global', async () => {
    render(<NotificationsScreen />);
    await act(async () => {
      await screen.UNSAFE_getByType(RefreshControl).props.onRefresh();
    });
    expect(mockState.list.refetch).toHaveBeenCalled();
    expect(mockState.global.refetch).toHaveBeenCalled();
  });

  it('applique les marges Android', () => {
    const original = Platform.OS;
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    try {
      render(<NotificationsScreen />);
      expect(screen.getByText('ALERTS')).toBeTruthy();
    } finally {
      Object.defineProperty(Platform, 'OS', { value: original, configurable: true });
    }
  });
});
