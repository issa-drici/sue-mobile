import React from 'react';
import { Text } from 'react-native';

const mockScheme = jest.fn<'light' | 'dark' | null, []>(() => 'light');
jest.mock('@/hooks/useColorScheme', () => ({ useColorScheme: () => mockScheme() }));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

import { render, screen } from '@testing-library/react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { HelloWave } from '../HelloWave';
import { Colors } from '@/constants/Colors';

describe('ThemedText', () => {
  beforeEach(() => mockScheme.mockReturnValue('light'));

  it('couleur du thème clair par défaut et type default', () => {
    render(<ThemedText>Salut</ThemedText>);
    expect(screen.getByText('Salut')).toHaveStyle({ color: Colors.light.text, fontSize: 16, lineHeight: 24 });
  });

  it.each([
    ['title', { fontSize: 32, fontWeight: 'bold' }],
    ['defaultSemiBold', { fontWeight: '600' }],
    ['subtitle', { fontSize: 20 }],
    ['link', { color: '#0a7ea4' }],
  ] as const)('type %s', (type, expected) => {
    render(<ThemedText type={type}>t</ThemedText>);
    expect(screen.getByText('t')).toHaveStyle(expected);
  });

  it('couleurs passées en props selon le thème', () => {
    mockScheme.mockReturnValue('dark');
    render(<ThemedText lightColor="#fff" darkColor="#111">d</ThemedText>);
    expect(screen.getByText('d')).toHaveStyle({ color: '#111' });
  });

  it('thème nul : retombe sur clair', () => {
    mockScheme.mockReturnValue(null);
    render(<ThemedText style={{ margin: 2 }}>n</ThemedText>);
    expect(screen.getByText('n')).toHaveStyle({ color: Colors.light.text, margin: 2 });
  });
});

describe('ThemedView', () => {
  it('fond selon le thème et props transmises', () => {
    mockScheme.mockReturnValue('dark');
    render(
      <ThemedView testID="vue" style={{ padding: 3 }}>
        <Text>enfant</Text>
      </ThemedView>
    );
    expect(screen.getByTestId('vue')).toHaveStyle({ backgroundColor: Colors.dark.background, padding: 3 });
  });

  it('couleur claire personnalisée', () => {
    mockScheme.mockReturnValue('light');
    render(<ThemedView testID="v" lightColor="pink" />);
    expect(screen.getByTestId('v')).toHaveStyle({ backgroundColor: 'pink' });
  });
});

describe('HelloWave', () => {
  it('affiche la main qui salue', () => {
    render(<HelloWave />);
    expect(screen.getByText('👋')).toHaveStyle({ fontSize: 28 });
  });
});
