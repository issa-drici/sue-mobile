/**
 * Couleurs de l'application Alarrache
 * Palette de couleurs principale basée sur le rouge #f93e34
 */

// Couleurs principales
export const BrandColors = {
  primary: '#f93e34',      // Rouge principal
  white: '#fcfcfc',        // Blanc
  lightPink: '#fbe0df',    // Rose clair
  mediumPink: '#fbc5c2',   // Rose moyen
  darkPink: '#faaaa6',     // Rose foncé
};

// Couleurs système (héritées)
const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
  // Ajout des couleurs de marque
  brand: BrandColors,
};
