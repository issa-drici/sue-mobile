/**
 * Composant ScreenLayout générique
 * Remplace le pattern répétitif SafeAreaView + StatusBar + Header trouvé dans tous les écrans
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { DesignTokens } from '../../constants/DesignSystem';
import { CommonStyles } from '../../styles/CommonStyles';

interface ScreenLayoutProps {
  /**
   * Titre affiché dans le header
   */
  title?: string;
  
  /**
   * Afficher le bouton de retour
   */
  showBackButton?: boolean;
  
  /**
   * Action personnalisée à droite du header (bouton, icône, etc.)
   */
  rightAction?: React.ReactNode;
  
  /**
   * Contenu de l'écran
   */
  children: React.ReactNode;
  
  /**
   * Rendre le contenu scrollable
   */
  scrollable?: boolean;
  
  /**
   * Afficher le header
   */
  showHeader?: boolean;
  
  /**
   * Style personnalisé pour le container principal
   */
  containerStyle?: any;
  
  /**
   * Style personnalisé pour le header
   */
  headerStyle?: any;
  
  /**
   * Style de la StatusBar
   */
  statusBarStyle?: 'default' | 'light-content' | 'dark-content';
  
  /**
   * Couleur de fond de la StatusBar
   */
  statusBarBackgroundColor?: string;
  
  /**
   * Padding horizontal pour le contenu
   */
  horizontalPadding?: keyof typeof DesignTokens.spacing;
  
  /**
   * Callback personnalisé pour le bouton retour
   */
  onBackPress?: () => void;
  
  /**
   * Désactiver le SafeAreaView (utile pour certains cas spécifiques)
   */
  disableSafeArea?: boolean;
}

export const ScreenLayout: React.FC<ScreenLayoutProps> = ({
  title,
  showBackButton = false,
  rightAction,
  children,
  scrollable = false,
  showHeader = true,
  containerStyle,
  headerStyle,
  statusBarStyle = 'dark-content',
  statusBarBackgroundColor,
  horizontalPadding,
  onBackPress,
  disableSafeArea = false,
}) => {
  const router = useRouter();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const renderHeader = () => {
    if (!showHeader) return null;

    return (
      <View style={[CommonStyles.header, headerStyle]}>
        {/* Bouton de retour ou espace vide */}
        <View style={styles.headerLeft}>
          {showBackButton ? (
            <TouchableOpacity
              style={CommonStyles.backButton}
              onPress={handleBackPress}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="chevron-back" 
                size={DesignTokens.iconSizes.lg} 
                color={DesignTokens.colors.text} 
              />
            </TouchableOpacity>
          ) : (
            <View style={CommonStyles.headerSpacer} />
          )}
        </View>

        {/* Titre centré */}
        <View style={styles.headerCenter}>
          {title && (
            <Text style={CommonStyles.headerTitle} numberOfLines={1}>
              {title}
            </Text>
          )}
        </View>

        {/* Action à droite ou espace vide */}
        <View style={styles.headerRight}>
          {rightAction || <View style={CommonStyles.headerSpacer} />}
        </View>
      </View>
    );
  };

  const renderContent = () => {
    const contentStyle = [
      styles.content,
      horizontalPadding && { paddingHorizontal: DesignTokens.spacing[horizontalPadding] },
    ];

    if (scrollable) {
      return (
        <ScrollView
          style={CommonStyles.flex1}
          contentContainerStyle={contentStyle}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      );
    }

    return (
      <View style={[CommonStyles.flex1, contentStyle]}>
        {children}
      </View>
    );
  };

  const Container = disableSafeArea ? View : SafeAreaView;

  return (
    <Container style={[CommonStyles.container, containerStyle]}>
      <StatusBar 
        barStyle={statusBarStyle}
        backgroundColor={statusBarBackgroundColor || DesignTokens.colors.background}
        translucent={Platform.OS === 'android'}
      />
      
      {renderHeader()}
      {renderContent()}
    </Container>
  );
};

const styles = StyleSheet.create({
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 2,
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  content: {
    flexGrow: 1,
  },
});

/**
 * Composants pré-configurés pour des cas d'usage courants
 */

/**
 * Layout pour écran avec bouton de retour et titre
 */
export const BackScreenLayout: React.FC<Omit<ScreenLayoutProps, 'showBackButton'>> = (props) => (
  <ScreenLayout {...props} showBackButton={true} />
);

/**
 * Layout pour écran principal (sans bouton retour)
 */
export const MainScreenLayout: React.FC<Omit<ScreenLayoutProps, 'showBackButton'>> = (props) => (
  <ScreenLayout {...props} showBackButton={false} />
);

/**
 * Layout pour écran scrollable avec padding
 */
export const ScrollableScreenLayout: React.FC<Omit<ScreenLayoutProps, 'scrollable' | 'horizontalPadding'>> = (props) => (
  <ScreenLayout {...props} scrollable={true} horizontalPadding="md" />
);

/**
 * Layout pour modale (sans SafeAreaView)
 */
export const ModalScreenLayout: React.FC<Omit<ScreenLayoutProps, 'disableSafeArea'>> = (props) => (
  <ScreenLayout {...props} disableSafeArea={true} />
);
