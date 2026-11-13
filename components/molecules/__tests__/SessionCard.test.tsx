import React from 'react';

jest.mock('@expo/vector-icons', () => require('../../__testutils__/vectorIconsMock'));
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('../../../utils/dateHelpers', () => ({
  formatDate: jest.fn(() => 'lundi 1 janvier'),
  formatTimeFrance: jest.fn(() => '10:00'),
}));
const mockIsFinished = jest.fn((..._args: any[]) => false);
jest.mock('../../../utils/timeHelpers', () => ({
  isSessionFinished: (...args: any[]) => mockIsFinished(...args),
}));

import { render, screen, fireEvent } from '@testing-library/react-native';
import { SessionCard } from '../SessionCard';

const base = {
  id: '42',
  title: 'Foot du dimanche',
  sport: 'football',
  location: 'Stade',
  startTime: '2026-01-01T10:00:00Z',
};

describe('SessionCard', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockIsFinished.mockReset().mockReturnValue(false);
  });

  it('affiche titre, sport, lieu et date formatée', () => {
    render(<SessionCard session={base} />);
    expect(screen.getByText('Foot du dimanche')).toBeOnTheScreen();
    expect(screen.getByText(/football/)).toBeOnTheScreen();
    expect(screen.getByText('Stade')).toBeOnTheScreen();
    expect(screen.getByText('lundi 1 janvier à 10:00')).toBeOnTheScreen();
    expect(screen.queryByText(/participants/)).toBeNull();
    expect(screen.queryByText('Active')).toBeNull();
  });

  it('navigue vers la session par défaut au clic', () => {
    render(<SessionCard session={base} />);
    fireEvent.press(screen.getByText('Foot du dimanche'));
    expect(mockPush).toHaveBeenCalledWith('/session/42');
  });

  it('utilise onPress s’il est fourni', () => {
    const onPress = jest.fn();
    render(<SessionCard session={base} onPress={onPress} />);
    fireEvent.press(screen.getByText('Foot du dimanche'));
    expect(onPress).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it.each([
    ['active', 'Active'],
    ['cancelled', 'Annulée'],
    ['completed', 'Terminée'],
  ] as const)('statut %s', (status, label) => {
    render(<SessionCard session={{ ...base, status }} />);
    expect(screen.getByText(label)).toBeOnTheScreen();
  });

  it('compte uniquement les participants acceptés', () => {
    render(
      <SessionCard
        session={{
          ...base,
          maxParticipants: 10,
          participants: [{ status: 'accepted' }, { status: 'pending' }, { status: 'accepted' }],
        }}
      />
    );
    expect(screen.getByText('2 / 10 participants')).toBeOnTheScreen();
  });

  it('sans liste de participants : 0', () => {
    render(<SessionCard session={{ ...base, maxParticipants: 4 }} />);
    expect(screen.getByText('0 / 4 participants')).toBeOnTheScreen();
  });

  it('actions : créateur d’une session non terminée peut modifier', () => {
    render(
      <SessionCard
        session={{ ...base, isCreator: true, date: '2026-01-01', endTime: '12:00', maxParticipants: 2 }}
        showActions
      />
    );
    expect(mockIsFinished).toHaveBeenCalledWith('2026-01-01', '12:00', base.startTime);
    fireEvent.press(screen.getByText('Modifier'));
    expect(mockPush).toHaveBeenCalledWith('/edit-session/42');
    fireEvent.press(screen.getByText('Voir détails'));
    expect(mockPush).toHaveBeenCalledWith('/session/42');
  });

  it('actions : session terminée, pas de bouton Modifier', () => {
    mockIsFinished.mockReturnValue(true);
    render(<SessionCard session={{ ...base, isCreator: true, date: 'd', endTime: 'e' }} showActions />);
    expect(screen.getByText('Voir détails')).toBeOnTheScreen();
    expect(screen.queryByText('Modifier')).toBeNull();
  });

  it('actions : non créateur, pas de bouton Modifier', () => {
    render(<SessionCard session={base} showActions />);
    expect(screen.queryByText('Modifier')).toBeNull();
  });

  // BUG: `{session.maxParticipants && (...)}` rend le nombre 0 brut hors d'un <Text>
  // quand maxParticipants vaut 0 ; sur appareil React Native plante
  // ("Text strings must be rendered within a <Text> component"). Le renderer de test
  // ne lève pas d'erreur, on détecte donc la chaîne brute sous une View.
  it('maxParticipants = 0 ne rend pas de texte brut hors <Text>', () => {
    const findRawStringInView = (node: any): boolean => {
      if (!node || typeof node !== 'object') return false;
      if (Array.isArray(node)) return node.some(findRawStringInView);
      const children = node.children || [];
      if (node.type === 'View' && children.some((c: any) => typeof c === 'string')) return true;
      return children.some(findRawStringInView);
    };
    const { toJSON } = render(<SessionCard session={{ ...base, maxParticipants: 0 }} />);
    expect(findRawStringInView(toJSON())).toBe(false);
  });
});
