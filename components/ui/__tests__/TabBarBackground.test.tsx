import React from 'react';

jest.mock('expo-blur', () => {
  const R = require('react');
  return { BlurView: (p: any) => R.createElement('BlurView', p) };
});
jest.mock('@react-navigation/bottom-tabs', () => ({ useBottomTabBarHeight: () => 83 }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 34, left: 0, right: 0 }) }));

import { render, renderHook } from '@testing-library/react-native';

describe('TabBarBackground (iOS)', () => {
  const mod = require('../TabBarBackground.ios.tsx');

  it('rend un BlurView chrome système', () => {
    const Bg = mod.default;
    const { toJSON } = render(<Bg />);
    expect((toJSON() as any).props).toMatchObject({ tint: 'systemChromeMaterial', intensity: 100 });
  });

  it('useBottomTabOverflow = hauteur de la tab bar - inset bas', () => {
    const { result } = renderHook(() => mod.useBottomTabOverflow());
    expect(result.current).toBe(49);
  });
});

describe('TabBarBackground (Android / web)', () => {
  const mod = require('../TabBarBackground.tsx');

  it('pas de fond et débordement nul', () => {
    expect(mod.default).toBeUndefined();
    expect(mod.useBottomTabOverflow()).toBe(0);
  });
});
