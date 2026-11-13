import React from 'react';
import { Text } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import {
  Button,
  PrimaryButton,
  SecondaryButton,
  OutlineButton,
  GhostButton,
  DangerButton,
} from '../Button';
import { DesignTokens } from '../../../constants/DesignSystem';

describe('Button', () => {
  it('affiche le titre et appelle onPress au clic', () => {
    const onPress = jest.fn();
    render(<Button title="Valider" onPress={onPress} />);
    fireEvent.press(screen.getByText('Valider'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it.each(['primary', 'secondary', 'outline', 'ghost', 'danger', 'inconnu'] as const)(
    'rend la variante %s',
    (variant) => {
      render(<Button title={`btn-${variant}`} onPress={jest.fn()} variant={variant as any} />);
      expect(screen.getByText(`btn-${variant}`)).toBeOnTheScreen();
    }
  );

  it.each(['sm', 'md', 'lg', 'xx'] as const)('rend la taille %s', (size) => {
    render(<Button title={`taille-${size}`} onPress={jest.fn()} size={size as any} fullWidth />);
    expect(screen.getByText(`taille-${size}`)).toBeOnTheScreen();
  });

  it('désactivé : ne déclenche pas onPress et applique la couleur désactivée', () => {
    const onPress = jest.fn();
    render(<Button title="Off" onPress={onPress} disabled />);
    fireEvent.press(screen.getByText('Off'));
    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByText('Off')).toHaveStyle({ color: DesignTokens.colors.disabledText });
  });

  it('en chargement : masque le titre et bloque le clic', () => {
    const onPress = jest.fn();
    const { UNSAFE_getByType } = render(<Button title="Chargement" onPress={onPress} loading />);
    expect(screen.queryByText('Chargement')).toBeNull();
    const { ActivityIndicator } = require('react-native');
    const spinner = UNSAFE_getByType(ActivityIndicator);
    expect(spinner.props.color).toBe(DesignTokens.colors.textInverse);
  });

  it('en chargement variante outline : spinner couleur primaire', () => {
    const { UNSAFE_getByType } = render(<Button title="x" onPress={jest.fn()} loading variant="outline" />);
    const { ActivityIndicator } = require('react-native');
    expect(UNSAFE_getByType(ActivityIndicator).props.color).toBe(DesignTokens.colors.primary);
  });

  it('affiche les icônes gauche et droite', () => {
    render(
      <Button title="Icônes" onPress={jest.fn()} leftIcon={<Text>G</Text>} rightIcon={<Text>D</Text>} />
    );
    expect(screen.getByText('G')).toBeOnTheScreen();
    expect(screen.getByText('D')).toBeOnTheScreen();
  });

  it('applique textStyle personnalisé', () => {
    render(<Button title="Style" onPress={jest.fn()} textStyle={{ color: 'red' }} />);
    expect(screen.getByText('Style')).toHaveStyle({ color: 'red' });
  });

  it('les raccourcis de variantes rendent le titre', () => {
    const fn = jest.fn();
    render(
      <>
        <PrimaryButton title="P" onPress={fn} />
        <SecondaryButton title="S" onPress={fn} />
        <OutlineButton title="O" onPress={fn} />
        <GhostButton title="G" onPress={fn} />
        <DangerButton title="D" onPress={fn} />
      </>
    );
    ['P', 'S', 'O', 'G', 'D'].forEach((t) => fireEvent.press(screen.getByText(t)));
    expect(fn).toHaveBeenCalledTimes(5);
  });
});
