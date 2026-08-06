/**
 * Système de design unifié pour l'application
 * Centralise tous les tokens de design pour assurer la cohérence visuelle
 */

import { BrandColors } from './Colors';

export const DesignTokens = {
  /**
   * Espacements standardisés
   * Utilisez ces valeurs pour tous les paddings, margins, gaps
   */
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  /**
   * Palette de couleurs étendue
   * Basée sur BrandColors existant + couleurs système
   */
  colors: {
    // Couleurs principales
    primary: BrandColors.primary,
    primaryDark: BrandColors.primaryDark,
    secondary: '#6C7B7F',
    
    // Couleurs de fond
    background: '#FAFAFA',
    backgroundSecondary: '#F7F7F9',
    backgroundTertiary: '#F5F5F5',
    
    // Couleurs de texte
    text: '#000000',
    textSecondary: '#666666',
    textTertiary: '#999999',
    textInverse: '#FFFFFF',
    
    // Couleurs de bordure
    border: '#EFEFEF',
    borderLight: '#F5F5F5',
    borderDark: '#CCCCCC',
    
    // Couleurs d'état
    success: BrandColors.success,
    warning: BrandColors.warning,
    error: '#FF3B30',
    info: BrandColors.primary,
    
    // Couleurs d'interaction
    disabled: '#E5E5E5',
    disabledText: '#AAAAAA',
    overlay: 'rgba(0, 0, 0, 0.5)',
    
    // Couleurs spécifiques aux cartes
    cardBackground: '#FFFFFF',
    cardShadow: 'rgba(0, 0, 0, 0.05)',
  },

  /**
   * Typographie standardisée
   * Définit tous les styles de texte utilisés dans l'app
   */
  typography: {
    // Titres
    h1: {
      fontSize: 28,
      fontWeight: '700' as const,
      lineHeight: 34,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600' as const,
      lineHeight: 30,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 26,
    },
    h4: {
      fontSize: 18,
      fontWeight: '500' as const,
      lineHeight: 24,
    },
    h5: {
      fontSize: 16,
      fontWeight: '500' as const,
      lineHeight: 22,
    },
    subtitle: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 22,
    },
    
    // Corps de texte
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 22,
    },
    bodyMedium: {
      fontSize: 16,
      fontWeight: '500' as const,
      lineHeight: 22,
    },
    bodySemiBold: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 22,
    },
    
    // Textes secondaires
    caption: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    captionMedium: {
      fontSize: 14,
      fontWeight: '500' as const,
      lineHeight: 20,
    },
    
    // Petits textes
    small: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
    },
    smallMedium: {
      fontSize: 12,
      fontWeight: '500' as const,
      lineHeight: 16,
    },
    
    // Textes de boutons
    button: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 22,
    },
    buttonSmall: {
      fontSize: 14,
      fontWeight: '600' as const,
      lineHeight: 20,
    },
  },

  /**
   * Rayons de bordure standardisés
   */
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 20,
    round: 50, // Pour les éléments circulaires
  },

  /**
   * Ombres standardisées
   * Compatible iOS et Android
   */
  shadows: {
    none: {
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: {
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
    xl: {
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 16,
    },
  },

  /**
   * Tailles d'icônes standardisées
   */
  iconSizes: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  /**
   * Hauteurs standardisées pour les éléments interactifs
   */
  heights: {
    button: 48,
    buttonSmall: 36,
    input: 48,
    inputSmall: 36,
    tabBar: 60,
    header: 56,
  },

  /**
   * Largeurs standardisées
   */
  widths: {
    buttonMinWidth: 120,
    inputMinWidth: 200,
  },

  /**
   * Opacités standardisées
   */
  opacity: {
    disabled: 0.5,
    pressed: 0.7,
    overlay: 0.8,
  },

  /**
   * Durées d'animation standardisées
   */
  animation: {
    fast: 150,
    normal: 200,
    slow: 300,
  },
} as const;

/**
 * Types pour l'autocomplétion TypeScript
 */
export type SpacingKey = keyof typeof DesignTokens.spacing;
export type ColorKey = keyof typeof DesignTokens.colors;
export type TypographyKey = keyof typeof DesignTokens.typography;
export type BorderRadiusKey = keyof typeof DesignTokens.borderRadius;
export type ShadowKey = keyof typeof DesignTokens.shadows;
export type IconSizeKey = keyof typeof DesignTokens.iconSizes;

/**
 * Helpers pour accéder facilement aux tokens
 */
export const getSpacing = (key: SpacingKey): number => DesignTokens.spacing[key];
export const getColor = (key: ColorKey): string => DesignTokens.colors[key];
export const getTypography = (key: TypographyKey) => DesignTokens.typography[key];
export const getBorderRadius = (key: BorderRadiusKey): number => DesignTokens.borderRadius[key];
export const getShadow = (key: ShadowKey) => DesignTokens.shadows[key];
export const getIconSize = (key: IconSizeKey): number => DesignTokens.iconSizes[key];
