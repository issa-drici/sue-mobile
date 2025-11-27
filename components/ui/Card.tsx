/**
 * Composant Card générique
 * Remplace les patterns de cartes répétitifs trouvés dans l'audit
 */

import React from 'react';
import { TouchableOpacity, View, ViewStyle } from 'react-native';
import { DesignTokens, ShadowKey, SpacingKey } from '../../constants/DesignSystem';

interface CardProps {
  /**
   * Contenu de la carte
   */
  children: React.ReactNode;
  
  /**
   * Variante visuelle de la carte
   */
  variant?: 'flat' | 'elevated' | 'outlined';
  
  /**
   * Taille du padding interne
   */
  padding?: SpacingKey;
  
  /**
   * Callback quand la carte est pressée (rend la carte touchable)
   */
  onPress?: () => void;
  
  /**
   * Style personnalisé pour le container
   */
  style?: ViewStyle;
  
  /**
   * Désactiver la carte (visuel et interaction)
   */
  disabled?: boolean;
  
  /**
   * Niveau d'ombre personnalisé (override la variante)
   */
  shadow?: ShadowKey;
  
  /**
   * Rayon de bordure personnalisé
   */
  borderRadius?: keyof typeof DesignTokens.borderRadius;
  
  /**
   * Couleur de fond personnalisée
   */
  backgroundColor?: string;
  
  /**
   * Marge externe
   */
  margin?: SpacingKey;
  
  /**
   * Marge verticale uniquement
   */
  marginVertical?: SpacingKey;
  
  /**
   * Marge horizontale uniquement
   */
  marginHorizontal?: SpacingKey;
  
  /**
   * Opacité lors du press (si touchable)
   */
  activeOpacity?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'flat',
  padding = 'md',
  onPress,
  style,
  disabled = false,
  shadow,
  borderRadius = 'lg',
  backgroundColor,
  margin,
  marginVertical,
  marginHorizontal,
  activeOpacity = 0.7,
}) => {
  // Déterminer les styles selon la variante
  const getVariantStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: backgroundColor || DesignTokens.colors.cardBackground,
      borderRadius: DesignTokens.borderRadius[borderRadius],
      padding: DesignTokens.spacing[padding],
    };

    // Appliquer les marges si spécifiées
    if (margin) {
      baseStyle.margin = DesignTokens.spacing[margin];
    }
    if (marginVertical) {
      baseStyle.marginVertical = DesignTokens.spacing[marginVertical];
    }
    if (marginHorizontal) {
      baseStyle.marginHorizontal = DesignTokens.spacing[marginHorizontal];
    }

    // Appliquer l'ombre personnalisée ou celle de la variante
    if (shadow) {
      Object.assign(baseStyle, DesignTokens.shadows[shadow]);
    } else {
      switch (variant) {
        case 'elevated':
          Object.assign(baseStyle, DesignTokens.shadows.md);
          break;
        case 'outlined':
          baseStyle.borderWidth = 1;
          baseStyle.borderColor = DesignTokens.colors.border;
          break;
        case 'flat':
        default:
          Object.assign(baseStyle, DesignTokens.shadows.sm);
          break;
      }
    }

    // Styles pour l'état désactivé
    if (disabled) {
      baseStyle.opacity = DesignTokens.opacity.disabled;
    }

    return baseStyle;
  };

  const cardStyle = [
    getVariantStyles(),
    style,
  ];

  // Si la carte est touchable
  if (onPress && !disabled) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={activeOpacity}
        disabled={disabled}
      >
        {children}
      </TouchableOpacity>
    );
  }

  // Carte non touchable
  return (
    <View style={cardStyle}>
      {children}
    </View>
  );
};

/**
 * Variantes pré-configurées pour des cas d'usage courants
 */

/**
 * Carte avec ombre prononcée pour les éléments importants
 */
export const ElevatedCard: React.FC<Omit<CardProps, 'variant'>> = (props) => (
  <Card {...props} variant="elevated" />
);

/**
 * Carte avec bordure pour les contenus secondaires
 */
export const OutlinedCard: React.FC<Omit<CardProps, 'variant'>> = (props) => (
  <Card {...props} variant="outlined" />
);

/**
 * Carte touchable avec feedback visuel
 */
export const TouchableCard: React.FC<CardProps> = (props) => (
  <Card {...props} shadow="md" />
);

/**
 * Carte compacte avec moins de padding
 */
export const CompactCard: React.FC<Omit<CardProps, 'padding'>> = (props) => (
  <Card {...props} padding="sm" />
);

/**
 * Carte avec beaucoup d'espace interne
 */
export const SpacedCard: React.FC<Omit<CardProps, 'padding'>> = (props) => (
  <Card {...props} padding="lg" />
);

/**
 * Carte pour les listes (avec marge verticale réduite)
 */
export const ListCard: React.FC<Omit<CardProps, 'marginVertical'>> = (props) => (
  <Card {...props} marginVertical="xs" />
);

/**
 * Carte pour les sections (avec plus d'espacement)
 */
export const SectionCard: React.FC<Omit<CardProps, 'marginVertical' | 'padding'>> = (props) => (
  <Card {...props} marginVertical="md" padding="lg" />
);
