/**
 * Export centralisé des composants UI génériques
 * Facilite l'import des composants dans l'application
 */

// Composants de layout
export {
  ScreenLayout,
  BackScreenLayout,
  MainScreenLayout,
  ScrollableScreenLayout,
  ModalScreenLayout,
} from './ScreenLayout';

// Composants de carte
export {
  Card,
  ElevatedCard,
  OutlinedCard,
  TouchableCard,
  CompactCard,
  SpacedCard,
  ListCard,
  SectionCard,
} from './Card';

// Styles et tokens
export { DesignTokens } from '../../constants/DesignSystem';
export { CommonStyles, TextStyles } from '../../styles/CommonStyles';
