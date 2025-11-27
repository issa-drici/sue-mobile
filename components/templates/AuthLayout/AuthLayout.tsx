import React from 'react';
import { 
  SafeAreaView, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  View,
  ViewStyle,
  ImageBackground,
  StatusBar 
} from 'react-native';
import { Text, Icon } from '../../atoms';
import { DesignTokens } from '../../../constants/DesignSystem';
import { CommonStyles } from '../../../styles/CommonStyles';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  backgroundImage?: any;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  showLogo?: boolean;
  logoSource?: any;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  title,
  subtitle,
  children,
  footer,
  backgroundImage,
  style,
  contentStyle,
  showLogo = true,
  logoSource,
}) => {
  const renderHeader = () => (
    <View style={{
      alignItems: 'center',
      marginBottom: DesignTokens.spacing.xl,
      paddingTop: DesignTokens.spacing.xl,
    }}>
      {showLogo && (
        <View style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: DesignTokens.colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: DesignTokens.spacing.lg,
        }}>
          {logoSource ? (
            <Icon name="logo" size="xl" color="textInverse" />
          ) : (
            <Icon name="person-circle" size="xl" color="textInverse" />
          )}
        </View>
      )}
      
      <Text 
        variant="h1" 
        weight="bold"
        style={{ 
          textAlign: 'center',
          marginBottom: DesignTokens.spacing.sm 
        }}
      >
        {title}
      </Text>
      
      {subtitle && (
        <Text 
          variant="body" 
          color="secondary"
          style={{ 
            textAlign: 'center',
            paddingHorizontal: DesignTokens.spacing.lg 
          }}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );

  const renderContent = () => (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[{
          flexGrow: 1,
          padding: DesignTokens.spacing.lg,
        }, contentStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        
        <View style={{ flex: 1 }}>
          {children}
        </View>
        
        {footer && (
          <View style={{
            marginTop: DesignTokens.spacing.xl,
            alignItems: 'center',
          }}>
            {footer}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const containerStyle = [
    CommonStyles.container,
    { backgroundColor: DesignTokens.colors.background },
    style
  ];

  if (backgroundImage) {
    return (
      <ImageBackground source={backgroundImage} style={containerStyle}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <SafeAreaView style={{ flex: 1 }}>
          {renderContent()}
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <SafeAreaView style={containerStyle}>
      <StatusBar barStyle="dark-content" backgroundColor={DesignTokens.colors.background} />
      {renderContent()}
    </SafeAreaView>
  );
};
