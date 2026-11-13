/** Compteur global des notifications non lues, rafraîchi toutes les 30 s. */
import { act, render, renderHook, screen } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';
import { GlobalNotificationsProvider, useGlobalNotifications } from '../globalNotifications';

const mockHook: { count: number | undefined; isLoading: boolean | undefined; error: unknown; refetch: jest.Mock } = {
  count: 4, isLoading: false, error: null, refetch: jest.fn(),
};
jest.mock('../../services/notifications/getUnreadCount', () => ({ useGetUnreadCount: () => mockHook }));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <GlobalNotificationsProvider>{children}</GlobalNotificationsProvider>
);

beforeEach(() => {
  jest.useFakeTimers();
  mockHook.count = 4;
  mockHook.isLoading = false;
  mockHook.error = null;
  mockHook.refetch = jest.fn();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

it('expose le compteur et les états', () => {
  mockHook.isLoading = true;
  mockHook.error = 'e';
  const { result } = renderHook(() => useGlobalNotifications(), { wrapper });
  expect(result.current).toEqual({ unreadCount: 4, isLoading: true, error: 'e', refetch: mockHook.refetch });
});

it('valeurs absentes → valeurs sûres', () => {
  mockHook.count = undefined;
  mockHook.isLoading = undefined;
  mockHook.error = undefined;
  const { result } = renderHook(() => useGlobalNotifications(), { wrapper });
  expect(result.current).toMatchObject({ unreadCount: 0, isLoading: false, error: null });
});

it('affiche ses enfants', () => {
  render(<GlobalNotificationsProvider><Text>enfant</Text></GlobalNotificationsProvider>);
  expect(screen.getByText('enfant')).toBeOnTheScreen();
});

it('rafraîchit toutes les 30 s et s’arrête au démontage', async () => {
  const { unmount } = renderHook(() => useGlobalNotifications(), { wrapper });
  await act(async () => { await jest.advanceTimersByTimeAsync(29999); });
  expect(mockHook.refetch).not.toHaveBeenCalled();
  await act(async () => { await jest.advanceTimersByTimeAsync(1); });
  expect(mockHook.refetch).toHaveBeenCalledTimes(1);
  unmount();
  await jest.advanceTimersByTimeAsync(60000);
  expect(mockHook.refetch).toHaveBeenCalledTimes(1);
});

it('redémarre le polling quand refetch change', async () => {
  const { rerender } = renderHook(() => useGlobalNotifications(), { wrapper });
  await act(async () => { await jest.advanceTimersByTimeAsync(20000); });
  mockHook.refetch = jest.fn();
  rerender({});
  await act(async () => { await jest.advanceTimersByTimeAsync(20000); });
  expect(mockHook.refetch).not.toHaveBeenCalled();
  await act(async () => { await jest.advanceTimersByTimeAsync(10000); });
  expect(mockHook.refetch).toHaveBeenCalledTimes(1);
});

it('journalise une erreur synchrone du polling sans planter', async () => {
  mockHook.refetch.mockImplementation(() => { throw new Error('x'); });
  renderHook(() => useGlobalNotifications(), { wrapper });
  await act(async () => { await jest.advanceTimersByTimeAsync(30000); });
  expect(console.error).toHaveBeenCalled();
});

it('lève une erreur hors du provider', () => {
  expect(() => renderHook(() => useGlobalNotifications())).toThrow(
    'useGlobalNotifications must be used within a GlobalNotificationsProvider'
  );
});
