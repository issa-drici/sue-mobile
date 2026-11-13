import React from 'react';
import { ActivityIndicator } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Spinner, LoadingSpinner, LargeSpinner } from '../Spinner';
import { DesignTokens } from '../../../constants/DesignSystem';

describe('Spinner', () => {
  it.each([
    ['primary', DesignTokens.colors.primary],
    ['secondary', DesignTokens.colors.textSecondary],
    ['inverse', DesignTokens.colors.textInverse],
  ] as const)('couleur %s', (color, expected) => {
    const { UNSAFE_getByType } = render(<Spinner color={color} />);
    expect(UNSAFE_getByType(ActivityIndicator).props.color).toBe(expected);
  });

  it('affiche le message optionnel', () => {
    render(<Spinner message="Patience" />);
    expect(screen.getByText('Patience')).toBeOnTheScreen();
  });

  it('LoadingSpinner affiche "Chargement..." et LargeSpinner est grand', () => {
    const { UNSAFE_getAllByType } = render(
      <>
        <LoadingSpinner />
        <LargeSpinner />
      </>
    );
    expect(screen.getByText('Chargement...')).toBeOnTheScreen();
    expect(UNSAFE_getAllByType(ActivityIndicator)[1].props.size).toBe('large');
  });
});
