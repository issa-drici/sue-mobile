/** Contexte des notifications de l'onglet : partage le résultat de useSynchronizedNotifications. */
import { render, renderHook, screen } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';
import { NotificationsProvider, useNotificationsContext } from '../notifications';

const mockValue = { unreadCount: 1, notifications: [{ id: 1 }], pagination: {}, isLoading: false, error: null };
const mockSync = jest.fn((..._args: unknown[]) => mockValue);
jest.mock('../../hooks/useSynchronizedNotifications', () => ({
  useSynchronizedNotifications: (...args: unknown[]) => mockSync(...args),
}));

beforeEach(() => { mockSync.mockClear(); });

it('expose les données synchronisées avec la page et la limite par défaut', () => {
  const { result } = renderHook(() => useNotificationsContext(), {
    wrapper: ({ children }) => <NotificationsProvider>{children}</NotificationsProvider>,
  });
  expect(result.current).toBe(mockValue);
  expect(mockSync).toHaveBeenCalledWith(1, 20);
});

it('transmet page et limite', () => {
  render(<NotificationsProvider page={3} limit={5}><Text>enfant</Text></NotificationsProvider>);
  expect(mockSync).toHaveBeenCalledWith(3, 5);
  expect(screen.getByText('enfant')).toBeOnTheScreen();
});

it('lève une erreur hors du provider', () => {
  expect(() => renderHook(() => useNotificationsContext())).toThrow(
    'useNotificationsContext must be used within a NotificationsProvider'
  );
});
