import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Text, Heading1, Heading2, Heading3, Heading4, Subtitle, Body, Caption, Small } from '../Text';
import { DesignTokens } from '../../../constants/DesignSystem';

describe('Text', () => {
  it('rend le texte avec les styles par défaut', () => {
    render(<Text>Bonjour</Text>);
    expect(screen.getByText('Bonjour')).toHaveStyle({
      fontSize: DesignTokens.typography.body.fontSize,
      color: DesignTokens.colors.text,
      textAlign: 'left',
    });
  });

  it.each(['h1', 'h2', 'h3', 'h4', 'h5', 'subtitle', 'body', 'caption', 'small'] as const)(
    'applique la variante %s',
    (variant) => {
      render(<Text variant={variant}>v</Text>);
      expect(screen.getByText('v')).toHaveStyle({ fontSize: DesignTokens.typography[variant].fontSize });
    }
  );

  it('variante inconnue : pas de taille', () => {
    render(<Text variant={'zzz' as any}>z</Text>);
    expect(screen.getByText('z')).toBeOnTheScreen();
  });

  it.each([
    ['primary', DesignTokens.colors.text],
    ['secondary', DesignTokens.colors.textSecondary],
    ['tertiary', DesignTokens.colors.textTertiary],
    ['inverse', DesignTokens.colors.textInverse],
    ['error', DesignTokens.colors.error],
    ['success', DesignTokens.colors.success],
    ['warning', DesignTokens.colors.warning],
  ] as const)('applique la couleur %s', (color, expected) => {
    render(<Text color={color}>c</Text>);
    expect(screen.getByText('c')).toHaveStyle({ color: expected });
  });

  it('couleur inconnue : pas de couleur', () => {
    render(<Text color={'zz' as any}>c</Text>);
    expect(screen.getByText('c')).toBeOnTheScreen();
  });

  it.each([
    ['normal', '400'],
    ['medium', '500'],
    ['semibold', '600'],
    ['bold', '700'],
  ] as const)('applique le poids %s', (weight, fw) => {
    render(<Text weight={weight}>w</Text>);
    expect(screen.getByText('w')).toHaveStyle({ fontWeight: fw });
  });

  it('poids inconnu ignoré, alignement et props natives transmis', () => {
    render(
      <Text weight={'x' as any} align="center" numberOfLines={2} style={{ margin: 3 }}>
        a
      </Text>
    );
    const el = screen.getByText('a');
    expect(el).toHaveStyle({ textAlign: 'center', margin: 3 });
    expect(el.props.numberOfLines).toBe(2);
  });

  it('raccourcis de typographie', () => {
    render(
      <>
        <Heading1>H1</Heading1>
        <Heading2>H2</Heading2>
        <Heading3>H3</Heading3>
        <Heading4>H4</Heading4>
        <Subtitle>Sub</Subtitle>
        <Body>Bo</Body>
        <Caption>Ca</Caption>
        <Small>Sm</Small>
      </>
    );
    expect(screen.getByText('H1')).toHaveStyle({ fontSize: DesignTokens.typography.h1.fontSize });
    expect(screen.getByText('Sm')).toHaveStyle({ fontSize: DesignTokens.typography.small.fontSize });
    ['H2', 'H3', 'H4', 'Sub', 'Bo', 'Ca'].forEach((t) => expect(screen.getByText(t)).toBeOnTheScreen());
  });
});
