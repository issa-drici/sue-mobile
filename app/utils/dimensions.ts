import { Dimensions, Platform, StatusBar } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const STATUSBAR_HEIGHT = StatusBar.currentHeight || 0;

// Tailles d'écran de référence pour iPhone
const IPHONE_WIDTHS = {
  SE: 375, // iPhone SE, 6, 7, 8
  X: 375, // iPhone X, XS, 11 Pro
  XR: 414, // iPhone XR, 11
  PRO_MAX: 428, // iPhone 12 Pro Max, 13 Pro Max, 14 Pro Max
  PRO_MAX_15: 430, // iPhone 15 Pro Max
};

// Calcul des ratios pour le scaling
const baseWidth = IPHONE_WIDTHS.SE;
const scale = SCREEN_WIDTH / baseWidth;

// Fonction pour ajuster la taille en fonction de l'écran
export const normalize = (size: number) => {
  // Pour les tailles de police et les icônes, on utilise un scaling plus subtil
  if (size <= 24) {
    return Math.round(size * Math.min(scale, 1.1)); // Max 10% d'augmentation
  }
  // Pour les autres éléments, on utilise un scaling plus conservateur
  const newSize = size * Math.min(scale, 1.05); // Max 5% d'augmentation
  return Math.round(newSize);
};

// Fonction pour obtenir une taille qui ne dépasse pas la taille maximale
export const normalizeMax = (size: number) => {
  const newSize = size * 1.2; // 20% de marge maximum
  return Math.min(Math.round(newSize), newSize);
};

// Dimensions de l'écran
export const screenWidth = SCREEN_WIDTH;
export const screenHeight = SCREEN_HEIGHT;

// Marges et espacements standards
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Tailles de police standards
export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Rayons de bordure standards
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  round: 9999,
};

// Hauteurs standards
export const height = {
  input: 44,
  button: 44,
  tabBar: Platform.OS === "ios" ? 49 : 60,
  header: Platform.OS === "ios" ? 44 : 56,
  card: 100,
  statusBar: STATUSBAR_HEIGHT,
  safeAreaTop: Platform.OS === "ios" ? 44 : STATUSBAR_HEIGHT,
  safeAreaBottom: Platform.OS === "ios" ? 34 : 0,
};

// Largeurs standards
export const width = {
  button: 120,
  card: 300,
  icon: 24,
  avatar: {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96,
  },
};

// Export par défaut de toutes les dimensions
export default {
  normalize,
  normalizeMax,
  screenWidth,
  screenHeight,
  spacing,
  fontSize,
  borderRadius,
  height,
  width,
};
