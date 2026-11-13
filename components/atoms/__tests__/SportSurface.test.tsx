import React from 'react';
import { Image, View } from 'react-native';
import { render, fireEvent, act } from '@testing-library/react-native';
import { SportSurface, hasSportSurface } from '../SportSurface';
import { hasSportSurface as fromIndex } from '../SportSurface/index';

describe('SportSurface', () => {
  beforeEach(() => {
    jest.spyOn(Image, 'resolveAssetSource').mockReturnValue({ width: 200, height: 100, uri: 'x', scale: 1 } as any);
  });
  afterEach(() => jest.restoreAllMocks());

  it('hasSportSurface', () => {
    expect(hasSportSurface('Rugby')).toBe(true);
    expect(hasSportSurface('curling')).toBe(false);
    expect(hasSportSurface(null)).toBe(false);
    expect(fromIndex('tennis')).toBe(true);
  });

  it('ne rend rien pour un sport inconnu ou vide', () => {
    expect(render(<SportSurface sport="curling" />).toJSON()).toBeNull();
    expect(render(<SportSurface sport={undefined as any} />).toJSON()).toBeNull();
  });

  it('affiche l’image après le layout, calée à droite', () => {
    const { UNSAFE_queryByType, UNSAFE_getAllByType } = render(<SportSurface sport="tennis" borderRadius={8} />);
    expect(UNSAFE_queryByType(Image)).toBeNull();
    const root = UNSAFE_getAllByType(View)[0];
    expect(root.props.pointerEvents).toBe('none');
    act(() => {
      fireEvent(root, 'layout', { nativeEvent: { layout: { width: 300, height: 100 } } });
    });
    const img = UNSAFE_queryByType(Image)!;
    // ratio 2 : hauteur = max(100, 300/2) = 150, largeur = 300
    expect(img.props.style).toMatchObject({ right: 0, width: 300, height: 150, top: -25 });
  });
});
