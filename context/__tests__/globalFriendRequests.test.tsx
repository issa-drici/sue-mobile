/** Compteur global des demandes d'ami, rafraîchi toutes les 10 s. */
import { act, render, renderHook, screen } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';
import { GlobalFriendRequestsProvider, useGlobalFriendRequests } from '../globalFriendRequests';

const mockHook: { count: number | undefined; isLoading: boolean; error: string | null; refetch: jest.Mock } = {
  count: 2, isLoading: false, error: null, refetch: jest.fn(),
};
jest.mock('../../services', () => ({ useGetFriendRequestsCount: () => mockHook }));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <GlobalFriendRequestsProvider>{children}</GlobalFriendRequestsProvider>
);

beforeEach(() => {
  jest.useFakeTimers();
  mockHook.count = 2;
  mockHook.isLoading = false;
  mockHook.error = null;
  mockHook.refetch = jest.fn().mockResolvedValue(undefined);
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
  const { result } = renderHook(() => useGlobalFriendRequests(), { wrapper });
  expect(result.current).toEqual({ friendRequestsCount: 2, isLoading: true, error: 'e', refetch: mockHook.refetch });
});

it('compteur absent → 0', () => {
  mockHook.count = undefined;
  const { result } = renderHook(() => useGlobalFriendRequests(), { wrapper });
  expect(result.current.friendRequestsCount).toBe(0);
});

it('affiche ses enfants', () => {
  render(<GlobalFriendRequestsProvider><Text>enfant</Text></GlobalFriendRequestsProvider>);
  expect(screen.getByText('enfant')).toBeOnTheScreen();
});

it('rafraîchit toutes les 10 s et s’arrête au démontage', async () => {
  const { unmount } = renderHook(() => useGlobalFriendRequests(), { wrapper });
  await act(async () => { await jest.advanceTimersByTimeAsync(20000); });
  expect(mockHook.refetch).toHaveBeenCalledTimes(2);
  unmount();
  await jest.advanceTimersByTimeAsync(20000);
  expect(mockHook.refetch).toHaveBeenCalledTimes(2);
});

it('redémarre le polling quand refetch change', async () => {
  const { rerender } = renderHook(() => useGlobalFriendRequests(), { wrapper });
  await act(async () => { await jest.advanceTimersByTimeAsync(6000); });
  const first = mockHook.refetch;
  mockHook.refetch = jest.fn().mockResolvedValue(undefined);
  rerender({});
  await act(async () => { await jest.advanceTimersByTimeAsync(6000); });
  expect(first).not.toHaveBeenCalled();
  expect(mockHook.refetch).not.toHaveBeenCalled();
  await act(async () => { await jest.advanceTimersByTimeAsync(4000); });
  expect(mockHook.refetch).toHaveBeenCalledTimes(1);
});

it('journalise une erreur de polling sans planter', async () => {
  mockHook.refetch.mockRejectedValue(new Error('x'));
  renderHook(() => useGlobalFriendRequests(), { wrapper });
  await act(async () => { await jest.advanceTimersByTimeAsync(10000); });
  expect(console.error).toHaveBeenCalled();
});

it('lève une erreur hors du provider', () => {
  expect(() => renderHook(() => useGlobalFriendRequests())).toThrow(
    'useGlobalFriendRequests must be used within a GlobalFriendRequestsProvider'
  );
});
