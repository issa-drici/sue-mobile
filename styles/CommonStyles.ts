/**
 * Styles communs réutilisables
 * Remplace les patterns répétitifs trouvés dans l'audit DRY
 */

import { StyleSheet } from 'react-native';
import { DesignTokens } from '../constants/DesignSystem';

/**
 * Styles de layout les plus utilisés dans l'application
 * Remplace les 153 occurrences de alignItems: 'center' et autres patterns
 */
export const CommonStyles = StyleSheet.create({
  // === CONTENEURS PRINCIPAUX ===
  
  /**
   * Container principal d'écran - remplace le pattern répété dans 34 fichiers
   */
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background,
  },

  /**
   * Container avec padding standard
   */
  containerWithPadding: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background,
    padding: DesignTokens.spacing.md,
  },

  /**
   * Container de contenu scrollable
   */
  scrollContainer: {
    flexGrow: 1,
    padding: DesignTokens.spacing.md,
  },

  // === LAYOUTS FLEXBOX ===
  
  /**
   * Centrage complet - remplace les 153 occurrences de alignItems: 'center'
   */
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /**
   * Centrage horizontal uniquement
   */
  centerHorizontal: {
    alignItems: 'center',
  },

  /**
   * Centrage vertical uniquement
   */
  centerVertical: {
    justifyContent: 'center',
  },

  /**
   * Row layout - remplace les 105 occurrences de flexDirection: 'row'
   */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  /**
   * Row avec espacement entre les éléments
   */
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  /**
   * Row avec espacement autour des éléments
   */
  rowAround: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },

  /**
   * Row avec éléments centrés
   */
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /**
   * Column layout
   */
  column: {
    flexDirection: 'column',
  },

  /**
   * Column avec espacement entre les éléments
   */
  columnBetween: {
    flexDirection: 'column',
    justifyContent: 'space-between',
  },

  // === HEADERS D'ÉCRANS ===
  
  /**
   * Header standard d'écran - pattern répété dans tous les écrans
   */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.sm,
    backgroundColor: DesignTokens.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.borderLight,
  },

  /**
   * Header simple sans bordure
   */
  headerSimple: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.sm,
    backgroundColor: DesignTokens.colors.background,
  },

  /**
   * Titre de header
   */
  headerTitle: {
    ...DesignTokens.typography.h3,
    color: DesignTokens.colors.text,
  },

  /**
   * Bouton de retour dans le header
   */
  backButton: {
    padding: DesignTokens.spacing.sm,
    marginLeft: -DesignTokens.spacing.sm,
  },

  /**
   * Espace pour équilibrer le header (côté droit)
   */
  headerSpacer: {
    width: 40,
  },

  // === CARTES ET CONTENEURS ===
  
  /**
   * Card de base - remplace les patterns répétés
   */
  card: {
    backgroundColor: DesignTokens.colors.cardBackground,
    borderRadius: DesignTokens.borderRadius.lg,
    padding: DesignTokens.spacing.md,
    marginVertical: DesignTokens.spacing.sm,
    ...DesignTokens.shadows.sm,
  },

  /**
   * Card avec ombre plus prononcée
   */
  cardElevated: {
    backgroundColor: DesignTokens.colors.cardBackground,
    borderRadius: DesignTokens.borderRadius.lg,
    padding: DesignTokens.spacing.md,
    marginVertical: DesignTokens.spacing.sm,
    ...DesignTokens.shadows.md,
  },

  /**
   * Card avec bordure
   */
  cardOutlined: {
    backgroundColor: DesignTokens.colors.cardBackground,
    borderRadius: DesignTokens.borderRadius.lg,
    padding: DesignTokens.spacing.md,
    marginVertical: DesignTokens.spacing.sm,
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
  },

  // === BOUTONS ===
  
  /**
   * Bouton principal
   */
  buttonPrimary: {
    backgroundColor: DesignTokens.colors.primary,
    borderRadius: DesignTokens.borderRadius.lg,
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingVertical: DesignTokens.spacing.sm,
    minHeight: DesignTokens.heights.button,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },

  /**
   * Texte de bouton principal
   */
  buttonPrimaryText: {
    ...DesignTokens.typography.button,
    color: DesignTokens.colors.textInverse,
  },

  /**
   * Bouton secondaire
   */
  buttonSecondary: {
    backgroundColor: DesignTokens.colors.backgroundSecondary,
    borderRadius: DesignTokens.borderRadius.lg,
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingVertical: DesignTokens.spacing.sm,
    minHeight: DesignTokens.heights.button,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
  },

  /**
   * Texte de bouton secondaire
   */
  buttonSecondaryText: {
    ...DesignTokens.typography.button,
    color: DesignTokens.colors.text,
  },

  /**
   * Bouton petit
   */
  buttonSmall: {
    backgroundColor: DesignTokens.colors.primary,
    borderRadius: DesignTokens.borderRadius.md,
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.xs,
    minHeight: DesignTokens.heights.buttonSmall,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },

  /**
   * Texte de bouton petit
   */
  buttonSmallText: {
    ...DesignTokens.typography.buttonSmall,
    color: DesignTokens.colors.textInverse,
  },

  // === ÉTATS VIDES ET CHARGEMENT ===
  
  /**
   * Container pour les états vides
   */
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DesignTokens.spacing.xl,
  },

  /**
   * Texte principal d'état vide
   */
  emptyStateTitle: {
    ...DesignTokens.typography.h4,
    color: DesignTokens.colors.textSecondary,
    textAlign: 'center',
    marginTop: DesignTokens.spacing.md,
  },

  /**
   * Texte secondaire d'état vide
   */
  emptyStateSubtitle: {
    ...DesignTokens.typography.body,
    color: DesignTokens.colors.textTertiary,
    textAlign: 'center',
    marginTop: DesignTokens.spacing.sm,
  },

  /**
   * Container de chargement
   */
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DesignTokens.spacing.lg,
  },

  /**
   * Texte de chargement
   */
  loadingText: {
    ...DesignTokens.typography.body,
    color: DesignTokens.colors.textSecondary,
    marginTop: DesignTokens.spacing.sm,
  },

  // === SÉPARATEURS ===
  
  /**
   * Séparateur horizontal
   */
  separator: {
    height: 1,
    backgroundColor: DesignTokens.colors.borderLight,
    marginVertical: DesignTokens.spacing.sm,
  },

  /**
   * Séparateur avec plus d'espacement
   */
  separatorLarge: {
    height: 1,
    backgroundColor: DesignTokens.colors.borderLight,
    marginVertical: DesignTokens.spacing.lg,
  },

  // === MODALES ===
  
  /**
   * Overlay de modale
   */
  modalOverlay: {
    flex: 1,
    backgroundColor: DesignTokens.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /**
   * Container de modale
   */
  modalContainer: {
    backgroundColor: DesignTokens.colors.background,
    borderRadius: DesignTokens.borderRadius.xl,
    padding: DesignTokens.spacing.lg,
    margin: DesignTokens.spacing.lg,
    maxWidth: '90%',
    ...DesignTokens.shadows.lg,
  },

  // === UTILITAIRES ===
  
  /**
   * Élément flexible qui prend tout l'espace disponible
   */
  flex1: {
    flex: 1,
  },

  /**
   * Élément qui s'adapte à son contenu
   */
  flexShrink: {
    flexShrink: 1,
  },

  /**
   * Masquer un élément
   */
  hidden: {
    display: 'none',
  },

  /**
   * Position absolue centrée
   */
  absoluteCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
  },

  /**
   * Position absolue en haut à droite
   */
  absoluteTopRight: {
    position: 'absolute',
    top: DesignTokens.spacing.sm,
    right: DesignTokens.spacing.sm,
  },

  /**
   * Position absolue en bas
   */
  absoluteBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});

/**
 * Styles de texte standardisés basés sur le système de design
 */
export const TextStyles = StyleSheet.create({
  h1: {
    ...DesignTokens.typography.h1,
    color: DesignTokens.colors.text,
  },
  h2: {
    ...DesignTokens.typography.h2,
    color: DesignTokens.colors.text,
  },
  h3: {
    ...DesignTokens.typography.h3,
    color: DesignTokens.colors.text,
  },
  h4: {
    ...DesignTokens.typography.h4,
    color: DesignTokens.colors.text,
  },
  body: {
    ...DesignTokens.typography.body,
    color: DesignTokens.colors.text,
  },
  bodyMedium: {
    ...DesignTokens.typography.bodyMedium,
    color: DesignTokens.colors.text,
  },
  bodySemiBold: {
    ...DesignTokens.typography.bodySemiBold,
    color: DesignTokens.colors.text,
  },
  caption: {
    ...DesignTokens.typography.caption,
    color: DesignTokens.colors.textSecondary,
  },
  captionMedium: {
    ...DesignTokens.typography.captionMedium,
    color: DesignTokens.colors.textSecondary,
  },
  small: {
    ...DesignTokens.typography.small,
    color: DesignTokens.colors.textTertiary,
  },
  smallMedium: {
    ...DesignTokens.typography.smallMedium,
    color: DesignTokens.colors.textTertiary,
  },
});

/**
 * Helpers pour créer des styles dynamiques
 */
export const createSpacingStyle = (spacing: keyof typeof DesignTokens.spacing) => ({
  padding: DesignTokens.spacing[spacing],
});

export const createMarginStyle = (margin: keyof typeof DesignTokens.spacing) => ({
  margin: DesignTokens.spacing[margin],
});

export const createShadowStyle = (shadow: keyof typeof DesignTokens.shadows) => 
  DesignTokens.shadows[shadow];
