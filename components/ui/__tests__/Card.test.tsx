import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import {
  Card,
  ElevatedCard,
  OutlinedCard,
  TouchableCard,
  CompactCard,
  SpacedCard,
  ListCard,
  SectionCard,
} from '../Card';
import { DesignTokens } from '../../../constants/DesignSystem';

const rootStyle = (utils: ReturnType<typeof render>) => {
  const json: any = utils.toJSON();
  return Object.assign({}, ...[].concat(json.props.style).filter(Boolean));
};

describe('Card', () => {
  it('par défaut : vue non touchable, ombre sm, padding md', () => {
    const u = render(
      <Card>
        <Text>Contenu</Text>
      </Card>
    );
    expect(screen.getByText('Contenu')).toBeOnTheScreen();
    expect(u.UNSAFE_queryByType(TouchableOpacity)).toBeNull();
    expect(rootStyle(u)).toMatchObject({
      padding: DesignTokens.spacing.md,
      backgroundColor: DesignTokens.colors.cardBackground,
      borderRadius: DesignTokens.borderRadius.lg,
      ...DesignTokens.shadows.sm,
    });
  });

  it('variantes elevated et outlined, ombre personnalisée prioritaire', () => {
    expect(rootStyle(render(<Card variant="elevated"><Text>e</Text></Card>))).toMatchObject(DesignTokens.shadows.md);
    expect(rootStyle(render(<Card variant="outlined"><Text>o</Text></Card>))).toMatchObject({
      borderWidth: 1,
      borderColor: DesignTokens.colors.border,
    });
    const s = rootStyle(render(<Card variant="outlined" shadow="lg"><Text>s</Text></Card>));
    expect(s.borderWidth).toBeUndefined();
    expect(s).toMatchObject(DesignTokens.shadows.lg);
  });

  it('marges, couleur, rayon et style personnalisés', () => {
    const s = rootStyle(
      render(
        <Card margin="sm" marginVertical="md" marginHorizontal="lg" backgroundColor="#abc" borderRadius="sm" style={{ width: 10 }}>
          <Text>m</Text>
        </Card>
      )
    );
    expect(s).toMatchObject({
      margin: DesignTokens.spacing.sm,
      marginVertical: DesignTokens.spacing.md,
      marginHorizontal: DesignTokens.spacing.lg,
      backgroundColor: '#abc',
      borderRadius: DesignTokens.borderRadius.sm,
      width: 10,
    });
  });

  it('touchable avec onPress', () => {
    const onPress = jest.fn();
    render(<Card onPress={onPress}><Text>Touche</Text></Card>);
    fireEvent.press(screen.getByText('Touche'));
    expect(onPress).toHaveBeenCalled();
  });

  it('désactivé : non touchable et opacité réduite', () => {
    const onPress = jest.fn();
    const u = render(<Card onPress={onPress} disabled><Text>Off</Text></Card>);
    expect(u.UNSAFE_queryByType(TouchableOpacity)).toBeNull();
    // (fireEvent remonterait jusqu'à la prop onPress du composant Card lui-même : on vérifie l'arbre hôte)
    expect(u.UNSAFE_getAllByType(View)[0].props.onPress).toBeUndefined();
    expect(rootStyle(u).opacity).toBe(DesignTokens.opacity.disabled);
  });

  it('variantes pré-configurées', () => {
    expect(rootStyle(render(<ElevatedCard><Text>a</Text></ElevatedCard>))).toMatchObject(DesignTokens.shadows.md);
    expect(rootStyle(render(<OutlinedCard><Text>a</Text></OutlinedCard>)).borderWidth).toBe(1);
    expect(rootStyle(render(<TouchableCard><Text>a</Text></TouchableCard>))).toMatchObject(DesignTokens.shadows.md);
    expect(rootStyle(render(<CompactCard><Text>a</Text></CompactCard>)).padding).toBe(DesignTokens.spacing.sm);
    expect(rootStyle(render(<SpacedCard><Text>a</Text></SpacedCard>)).padding).toBe(DesignTokens.spacing.lg);
    expect(rootStyle(render(<ListCard><Text>a</Text></ListCard>)).marginVertical).toBe(DesignTokens.spacing.xs);
    expect(rootStyle(render(<SectionCard><Text>a</Text></SectionCard>))).toMatchObject({
      marginVertical: DesignTokens.spacing.md,
      padding: DesignTokens.spacing.lg,
    });
    expect(View).toBeDefined();
  });
});
