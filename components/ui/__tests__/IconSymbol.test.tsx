import React from 'react';

jest.mock('@expo/vector-icons/MaterialIcons', () => {
  const R = require('react');
  const MaterialIcons = (p: any) => R.createElement('MaterialIcons', p);
  return { __esModule: true, default: MaterialIcons };
});
jest.mock('expo-symbols', () => {
  const R = require('react');
  return { SymbolView: (p: any) => R.createElement('SymbolView', p) };
});

import { render } from '@testing-library/react-native';

describe('IconSymbol (repli MaterialIcons)', () => {
  const { IconSymbol } = require('../IconSymbol.tsx');

  it('mappe le nom SF Symbol vers Material Icons', () => {
    const { toJSON } = render(<IconSymbol name="house.fill" color="red" style={{ margin: 1 }} />);
    expect((toJSON() as any).props).toMatchObject({ name: 'home', size: 24, color: 'red', style: { margin: 1 } });
  });

  it.each([
    ['paperplane.fill', 'send'],
    ['chevron.left.forwardslash.chevron.right', 'code'],
    ['chevron.right', 'chevron-right'],
  ])('%s → %s', (sf, mi) => {
    const { toJSON } = render(<IconSymbol name={sf} color="#000" size={12} />);
    expect((toJSON() as any).props).toMatchObject({ name: mi, size: 12 });
  });
});

describe('IconSymbol (iOS, SF Symbols)', () => {
  const { IconSymbol } = require('../IconSymbol.ios.tsx');

  it('rend un SymbolView avec taille et poids par défaut', () => {
    const { toJSON } = render(<IconSymbol name="house.fill" color="blue" />);
    const props = (toJSON() as any).props;
    expect(props).toMatchObject({ name: 'house.fill', tintColor: 'blue', weight: 'regular', resizeMode: 'scaleAspectFit' });
    expect(props.style[0]).toEqual({ width: 24, height: 24 });
  });

  it('taille, poids et style personnalisés', () => {
    const { toJSON } = render(<IconSymbol name="x" color="blue" size={10} weight="bold" style={{ opacity: 0.5 }} />);
    const props = (toJSON() as any).props;
    expect(props.weight).toBe('bold');
    expect(props.style).toEqual([{ width: 10, height: 10 }, { opacity: 0.5 }]);
  });
});
