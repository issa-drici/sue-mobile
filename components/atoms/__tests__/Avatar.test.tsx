import React from 'react';
import { Image, View } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Avatar, SmallAvatar, LargeAvatar } from '../Avatar';
import { DesignTokens } from '../../../constants/DesignSystem';

describe('Avatar', () => {
  it('affiche une image si une source est fournie', () => {
    const { UNSAFE_getByType } = render(<Avatar source={{ uri: 'https://x/y.png' }} size="lg" />);
    expect(UNSAFE_getByType(Image).props.style).toEqual({ width: 56, height: 56 });
  });

  it('affiche les initiales ou "?"', () => {
    render(<Avatar initials="AB" />);
    expect(screen.getByText('AB')).toBeOnTheScreen();
    render(<Avatar />);
    expect(screen.getByText('?')).toBeOnTheScreen();
  });

  it.each([
    ['xs', 24, 'caption'],
    ['sm', 32, 'caption'],
    ['md', 40, 'body'],
    ['lg', 56, 'body'],
    ['xl', 72, 'body'],
    ['xxl', 96, 'body'],
    ['zz', 40, 'body'],
  ])('taille %s = %ipx', (size, px, variant) => {
    const { UNSAFE_getAllByType } = render(<Avatar size={size as any} initials="Z" />);
    expect(UNSAFE_getAllByType(View)[0].props.style).toMatchObject({ width: px, height: px });
    expect(screen.getByText('Z')).toHaveStyle({
      fontSize: DesignTokens.typography[variant as 'caption' | 'body'].fontSize,
    });
  });

  it('SmallAvatar et LargeAvatar', () => {
    const { UNSAFE_getAllByType } = render(
      <>
        <SmallAvatar initials="S" />
        <LargeAvatar initials="L" />
      </>
    );
    const views = UNSAFE_getAllByType(View);
    expect(views[0].props.style).toMatchObject({ width: 32 });
    expect(views[1].props.style).toMatchObject({ width: 56 });
  });
});
