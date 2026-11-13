import React from 'react';
import { Text } from 'react-native';

const mockScheme = jest.fn<'light' | 'dark' | null, []>(() => 'light');
jest.mock('@/hooks/useColorScheme', () => ({ useColorScheme: () => mockScheme() }));
jest.mock('@/components/ui/TabBarBackground', () => ({ useBottomTabOverflow: () => 20 }));
jest.mock('react-native-reanimated', () => {
  const mock = require('react-native-reanimated/mock');
  return { ...mock, useScrollViewOffset: () => ({ value: 0 }), useAnimatedRef: () => ({ current: null }) };
});

import { render, screen } from '@testing-library/react-native';
import ParallaxScrollView from '../ParallaxScrollView';

const json = () => JSON.stringify(screen.toJSON());

describe('ParallaxScrollView', () => {
  it('affiche l’en-tête et le contenu, avec la couleur claire', () => {
    render(
      <ParallaxScrollView headerImage={<Text>Image</Text>} headerBackgroundColor={{ light: '#AAA', dark: '#111' }}>
        <Text>Corps</Text>
      </ParallaxScrollView>
    );
    expect(screen.getByText('Image')).toBeOnTheScreen();
    expect(screen.getByText('Corps')).toBeOnTheScreen();
    expect(json()).toContain('#AAA');
    expect(json()).toContain('"paddingBottom":20');
  });

  it('thème sombre et thème nul', () => {
    mockScheme.mockReturnValue('dark');
    const { unmount } = render(
      <ParallaxScrollView headerImage={<Text>I</Text>} headerBackgroundColor={{ light: '#AAA', dark: '#111' }}>
        <Text>C</Text>
      </ParallaxScrollView>
    );
    expect(json()).toContain('#111');
    unmount();
    mockScheme.mockReturnValue(null);
    render(
      <ParallaxScrollView headerImage={<Text>I</Text>} headerBackgroundColor={{ light: '#AAA', dark: '#111' }}>
        <Text>C</Text>
      </ParallaxScrollView>
    );
    expect(json()).toContain('#AAA');
  });
});
