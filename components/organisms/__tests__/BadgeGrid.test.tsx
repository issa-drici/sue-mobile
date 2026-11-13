import React from 'react';
import { Image } from 'react-native';
import * as Haptics from 'expo-haptics';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { BadgeGrid } from '../Badges/BadgeGrid';
import { BADGE_IMAGES } from '../Badges/badgeImages';
import type { Badge } from '../../../services/badges';

const badges: Badge[] = [
  { id: 'first-session', name: 'Première', description: 'Ta première session', unlocked: true, unlockedAt: '2026-03-05T10:00:00Z', progress: 1, target: 1 },
  { id: 'regular', name: 'Habitué', description: '10 sessions', unlocked: false, unlockedAt: null, progress: 4, target: 10 },
  { id: 'pillar', name: 'Pilier', description: 'Sans date', unlocked: true, unlockedAt: null, progress: 1, target: 1 },
];

describe('BadgeGrid', () => {
  it('compte les badges débloqués (pluriel)', () => {
    render(<BadgeGrid badges={badges} />);
    expect(screen.getByText('2 / 3 débloqués')).toBeOnTheScreen();
    expect(screen.getByText('Première')).toBeOnTheScreen();
    expect(screen.getByText('Habitué')).toHaveStyle({ color: '#AEAEB2' });
  });

  it('singulier', () => {
    render(<BadgeGrid badges={[badges[0], badges[1]]} />);
    expect(screen.getByText('1 / 2 débloqué')).toBeOnTheScreen();
  });

  it('images des médailles, grisées si verrouillées', () => {
    const { UNSAFE_getAllByType } = render(<BadgeGrid badges={badges} />);
    const imgs = UNSAFE_getAllByType(Image);
    expect(imgs[0].props.source).toBe(BADGE_IMAGES['first-session']);
    expect(imgs[1].props.style).toEqual(expect.arrayContaining([expect.objectContaining({ opacity: 0.25 })]));
  });

  it('isMe : barre de progression et détail "4 / 10"', () => {
    const { toJSON } = render(<BadgeGrid badges={badges} isMe />);
    expect(JSON.stringify(toJSON())).toContain('"width":"40%"');
    fireEvent.press(screen.getByText('Habitué'));
    expect(Haptics.selectionAsync).toHaveBeenCalled();
    expect(screen.getByText('10 sessions')).toBeOnTheScreen();
    expect(screen.getByText('4 / 10')).toBeOnTheScreen();
  });

  it('autre profil : "Pas encore débloqué"', () => {
    render(<BadgeGrid badges={badges} />);
    fireEvent.press(screen.getByText('Habitué'));
    expect(screen.getByText('Pas encore débloqué')).toBeOnTheScreen();
  });

  it('détail d’un badge débloqué avec date, puis fermeture', () => {
    render(<BadgeGrid badges={badges} />);
    fireEvent.press(screen.getByText('Première'));
    expect(screen.getByText('Débloqué le 5 mars')).toBeOnTheScreen();
    fireEvent.press(screen.getByText('Ta première session'));
    expect(screen.queryByText('Ta première session')).toBeNull();
  });

  it('badge débloqué sans date', () => {
    render(<BadgeGrid badges={badges} />);
    fireEvent.press(screen.getByText('Pilier'));
    expect(screen.getByText('Débloqué')).toBeOnTheScreen();
  });

  it('onRequestClose ferme le détail', () => {
    const { UNSAFE_getByType } = render(<BadgeGrid badges={badges} />);
    fireEvent.press(screen.getByText('Pilier'));
    const { Modal } = require('react-native');
    const { act } = require('@testing-library/react-native');
    act(() => UNSAFE_getByType(Modal).props.onRequestClose());
    expect(screen.queryByText('Sans date')).toBeNull();
  });
});
