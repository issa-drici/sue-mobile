import React from 'react';
import { Text } from 'react-native';

const mockScheme = jest.fn<'light' | 'dark' | null, []>(() => 'light');
jest.mock('@/hooks/useColorScheme', () => ({ useColorScheme: () => mockScheme() }));
jest.mock('@/components/ui/IconSymbol', () => {
  const R = require('react');
  return { IconSymbol: (p: any) => R.createElement('IconSymbol', p) };
});

import { render, screen, fireEvent } from '@testing-library/react-native';
import { Collapsible } from '../Collapsible';
import { Colors } from '@/constants/Colors';

const icon = () => screen.UNSAFE_getByType('IconSymbol' as any);

describe('Collapsible', () => {
  it('fermé par défaut, s’ouvre et se referme au clic', () => {
    render(
      <Collapsible title="Détails">
        <Text>Caché</Text>
      </Collapsible>
    );
    expect(screen.queryByText('Caché')).toBeNull();
    expect(icon().props.style).toEqual({ transform: [{ rotate: '0deg' }] });
    expect(icon().props.color).toBe(Colors.light.icon);
    fireEvent.press(screen.getByText('Détails'));
    expect(screen.getByText('Caché')).toBeOnTheScreen();
    expect(icon().props.style).toEqual({ transform: [{ rotate: '90deg' }] });
    fireEvent.press(screen.getByText('Détails'));
    expect(screen.queryByText('Caché')).toBeNull();
  });

  it('icône sombre en thème sombre, clair si thème nul', () => {
    mockScheme.mockReturnValue('dark');
    const { unmount } = render(<Collapsible title="T"><Text>x</Text></Collapsible>);
    expect(icon().props.color).toBe(Colors.dark.icon);
    unmount();
    mockScheme.mockReturnValue(null);
    render(<Collapsible title="T"><Text>x</Text></Collapsible>);
    expect(icon().props.color).toBe(Colors.light.icon);
  });
});
