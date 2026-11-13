import React from 'react';
import { RefreshControl } from 'react-native';

jest.mock('@expo/vector-icons', () => require('../__testutils__/vectorIconsMock'));
const mockHookRefresh = jest.fn();
jest.mock('../../hooks/usePullToRefresh', () => ({
  usePullToRefresh: (opts: any) => {
    mockHookRefresh(opts);
    return { refreshing: false, onRefresh: () => opts.onRefresh() };
  },
}));

import { render, screen, act } from '@testing-library/react-native';
import InfoMessageExamples from '../InfoMessage.example';
import {
  BasicPullToRefreshExample,
  CustomColorPullToRefreshExample,
  HookPullToRefreshExample,
} from '../PullToRefresh.example';

describe('InfoMessage.example', () => {
  it('affiche les six exemples', () => {
    render(<InfoMessageExamples />);
    expect(screen.getByText("Bienvenue dans l'application Sue !")).toBeOnTheScreen();
    expect(screen.getByText('Session créée avec succès !')).toBeOnTheScreen();
    expect(screen.getByText(/limite de participants/)).toBeOnTheScreen();
  });
});

describe('PullToRefresh.example', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it.each([
    ['basique', BasicPullToRefreshExample],
    ['couleur personnalisée', CustomColorPullToRefreshExample],
  ])('exemple %s : rafraîchit les données après 2 s', async (_, Example) => {
    jest.setSystemTime(new Date(2026, 0, 1));
    render(<Example />);
    expect(screen.getByText('Item 1')).toBeOnTheScreen();
    await act(async () => {
      screen.UNSAFE_getByType(RefreshControl).props.onRefresh();
    });
    expect(screen.UNSAFE_getByType(RefreshControl).props.refreshing).toBe(true);
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    expect(screen.getByText('Nouvel Item 1')).toBeOnTheScreen();
    expect(screen.UNSAFE_getByType(RefreshControl).props.refreshing).toBe(false);
  });

  it('exemple avec le hook', async () => {
    jest.setSystemTime(new Date(2026, 0, 1));
    render(<HookPullToRefreshExample />);
    const opts = mockHookRefresh.mock.calls[0][0];
    expect(() => opts.onError(new Error('x'))).not.toThrow();
    await act(async () => {
      screen.UNSAFE_getByType(RefreshControl).props.onRefresh();
    });
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    expect(screen.getByText('Nouvel Item 2')).toBeOnTheScreen();
  });
});
