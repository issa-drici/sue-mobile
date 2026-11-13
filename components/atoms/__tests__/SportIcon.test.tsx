import React from 'react';
import { Image, Text, View } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { SportIcon, hasSportImage } from '../SportIcon';

describe('SportIcon', () => {
  it('hasSportImage reconnaît les sports connus (insensible à la casse)', () => {
    expect(hasSportImage('Tennis')).toBe(true);
    expect(hasSportImage('équitation')).toBe(true);
    expect(hasSportImage('curling')).toBe(false);
    expect(hasSportImage(null)).toBe(false);
    expect(hasSportImage(undefined)).toBe(false);
    expect(hasSportImage('')).toBe(false);
  });

  it('affiche les enfants si le sport n’a pas d’image', () => {
    render(
      <SportIcon sport="curling" size={20}>
        <Text>fallback</Text>
      </SportIcon>
    );
    expect(screen.getByText('fallback')).toBeOnTheScreen();
  });

  it('gère un sport vide', () => {
    render(
      <SportIcon sport={undefined as any} size={20}>
        <Text>vide</Text>
      </SportIcon>
    );
    expect(screen.getByText('vide')).toBeOnTheScreen();
  });

  it('affiche l’image à la bonne taille', () => {
    const { UNSAFE_getByType, UNSAFE_queryAllByType } = render(<SportIcon sport="Football" size={30} />);
    expect(UNSAFE_getByType(Image).props.style).toEqual({ width: 30, height: 30 });
    expect(UNSAFE_queryAllByType(View)).toHaveLength(0);
  });

  it('enveloppe l’image dans un conteneur si containerStyle est fourni', () => {
    const { UNSAFE_getByType } = render(
      <SportIcon sport="yoga" size={10} containerStyle={{ backgroundColor: 'red' }} />
    );
    expect(UNSAFE_getByType(View).props.style).toEqual({ backgroundColor: 'red' });
  });
});
