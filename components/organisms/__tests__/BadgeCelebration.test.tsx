import React from 'react';
import { Modal, Share } from 'react-native';

const mockFetchBadges = jest.fn();
const mockMarkSeen = jest.fn();
jest.mock('../../../services/badges', () => ({
  fetchBadges: (...a: any[]) => mockFetchBadges(...a),
  markBadgesSeen: (...a: any[]) => mockMarkSeen(...a),
}));
const mockUseAuth = jest.fn();
jest.mock('../../../app/context/auth', () => ({ useAuth: () => mockUseAuth() }));
const mockIsFocused = jest.fn(() => true);
jest.mock('@react-navigation/native', () => ({ useIsFocused: () => mockIsFocused() }));
const mockCaptureRef = jest.fn();
jest.mock('react-native-view-shot', () => ({ captureRef: (...a: any[]) => mockCaptureRef(...a) }));

import * as Haptics from 'expo-haptics';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native';
import { BadgeCelebration } from '../Badges/BadgeCelebration';
import * as Badges from '../Badges';
import type { Badge } from '../../../services/badges';

const badge = (id: string, name: string, extra: Partial<Badge> = {}): Badge => ({
  id,
  name,
  description: `desc ${name}`,
  unlocked: true,
  unlockedAt: null,
  progress: 1,
  target: 1,
  seen: false,
  ...extra,
});

const all = [
  badge('first-session', 'Première'),
  badge('regular', 'Habitué'),
  badge('pillar', 'Pilier', { seen: true }),
  badge('captain', 'Capitaine', { unlocked: false }),
];

const renderAndWait = async (props = { checkKey: 1 }) => {
  const utils = render(<BadgeCelebration {...props} />);
  await act(async () => {});
  return utils;
};

describe('BadgeCelebration', () => {
  beforeEach(() => {
    mockFetchBadges.mockReset().mockResolvedValue(all);
    mockMarkSeen.mockReset().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({ user: { firstname: 'Issa' } });
    mockIsFocused.mockReturnValue(true);
    mockCaptureRef.mockReset().mockResolvedValue('file:///tmp/card.png');
    jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as any);
  });
  afterEach(() => jest.restoreAllMocks());

  it('le barrel exporte les composants badges', () => {
    expect(Badges.BadgeCelebration).toBe(BadgeCelebration);
    expect(Badges.BadgeGrid).toBeDefined();
  });

  it('ne rend rien sans badge à célébrer', async () => {
    mockFetchBadges.mockResolvedValue([badge('pillar', 'Pilier', { seen: true })]);
    const { toJSON } = await renderAndWait();
    expect(toJSON()).toBeNull();
  });

  it('ne rend rien si l’écran n’a pas le focus', async () => {
    mockIsFocused.mockReturnValue(false);
    const { toJSON } = await renderAndWait();
    expect(toJSON()).toBeNull();
  });

  it('erreur de chargement ignorée', async () => {
    mockFetchBadges.mockRejectedValue(new Error('réseau'));
    const { toJSON } = await renderAndWait();
    expect(toJSON()).toBeNull();
  });

  it('célèbre les badges non vus un par un, puis les marque vus', async () => {
    await renderAndWait();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
    expect(screen.getAllByText('Première').length).toBeGreaterThan(0);
    expect(screen.getAllByText('3 / 4 badges').length).toBe(2);
    expect(screen.getByText('ISSA A DÉBLOQUÉ')).toBeOnTheScreen();
    fireEvent.press(screen.getByText('Badge suivant'));
    expect(mockMarkSeen).toHaveBeenCalledWith(['first-session']);
    expect(screen.getAllByText('Habitué').length).toBeGreaterThan(0);
    fireEvent.press(screen.getByText('Continuer'));
    expect(mockMarkSeen).toHaveBeenLastCalledWith(['regular']);
    expect(screen.toJSON()).toBeNull();
  });

  it('erreur de markBadgesSeen ignorée et onRequestClose passe au suivant', async () => {
    mockMarkSeen.mockRejectedValue(new Error('x'));
    const { UNSAFE_getByType } = await renderAndWait();
    await act(async () => UNSAFE_getByType(Modal).props.onRequestClose());
    expect(screen.getAllByText('Habitué').length).toBeGreaterThan(0);
  });

  it('sans prénom : "BADGE DÉBLOQUÉ" sur la carte', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    await renderAndWait();
    expect(screen.getAllByText('BADGE DÉBLOQUÉ')).toHaveLength(2);
  });

  it('partage avec capture d’image', async () => {
    await renderAndWait();
    await act(async () => {
      fireEvent.press(screen.getByText('Partager mon badge'));
    });
    expect(Haptics.selectionAsync).toHaveBeenCalled();
    expect(mockCaptureRef).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ format: 'png', width: 1080 }));
    expect(Share.share).toHaveBeenCalledWith({
      url: 'file:///tmp/card.png',
      message: expect.stringContaining('« Première »'),
    });
    expect(screen.getByText('Partager mon badge')).toBeOnTheScreen();
  });

  it('affiche "Préparation…" pendant le partage', async () => {
    let resolve: (v: string) => void = () => {};
    mockCaptureRef.mockReturnValue(new Promise((r) => (resolve = r)));
    await renderAndWait();
    fireEvent.press(screen.getByText('Partager mon badge'));
    expect(screen.getByText('Préparation…')).toBeOnTheScreen();
    await act(async () => resolve('uri'));
    await waitFor(() => expect(screen.getByText('Partager mon badge')).toBeOnTheScreen());
  });

  it('partage annulé : pas de plantage', async () => {
    mockCaptureRef.mockRejectedValue(new Error('annulé'));
    await renderAndWait();
    await act(async () => {
      fireEvent.press(screen.getByText('Partager mon badge'));
    });
    expect(Share.share).not.toHaveBeenCalled();
    expect(screen.getByText('Partager mon badge')).toBeOnTheScreen();
  });

  it('recharge quand checkKey change', async () => {
    const { rerender } = await renderAndWait();
    rerender(<BadgeCelebration checkKey={2} />);
    await act(async () => {});
    expect(mockFetchBadges).toHaveBeenCalledTimes(2);
  });
});

describe('BadgeCelebration sans react-native-view-shot', () => {
  it('partage le message seul', async () => {
    jest.resetModules();
    jest.doMock('react-native-view-shot', () => {
      throw new Error('module natif absent');
    });
    jest.doMock('../../../services/badges', () => ({
      fetchBadges: () => Promise.resolve([badge('streak', 'Série')]),
      markBadgesSeen: () => Promise.resolve(),
    }));
    jest.doMock('../../../app/context/auth', () => ({ useAuth: () => ({ user: { firstname: 'A' } }) }));
    jest.doMock('@react-navigation/native', () => ({ useIsFocused: () => true }));
    const RN = require('react-native');
    const shareSpy = jest.spyOn(RN.Share, 'share').mockResolvedValue({} as any);
    const FreshReact = require('react');
    const RTL = require('@testing-library/react-native/pure');
    const { BadgeCelebration: Fresh } = require('../Badges/BadgeCelebration');
    RTL.render(FreshReact.createElement(Fresh, { checkKey: 0 }));
    await RTL.act(async () => {});
    await RTL.act(async () => {
      RTL.fireEvent.press(RTL.screen.getByText('Partager mon badge'));
    });
    expect(shareSpy).toHaveBeenCalledWith({ message: expect.stringContaining('« Série »') });
    shareSpy.mockRestore();
    RTL.cleanup();
  });
});
