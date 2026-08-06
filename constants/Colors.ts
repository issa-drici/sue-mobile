/**
 * Couleurs de l'application Alarrache
 * Palette de couleurs principale basée sur le rouge #f93e34
 */

// Couleurs principales
export const BrandColors = {
  primary: '#D4FC79',      // Volt Électrique (unifié)
  primaryDark: '#D4FC79',  // Volt Électrique
  white: '#FFFFFF',        // Blanc
  lightPink: '#E6F2D6',    // Vert très clair (ancien lightPink)
  mediumPink: '#CDE5A8',   // Vert clair (ancien mediumPink)
  darkPink: '#8CBF3D',     // Vert vif (ancien darkPink)
  warning: '#F59223',      // Orange (maquette)
  success: '#70A831',      // Vert réussite/complet (maquette)
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
