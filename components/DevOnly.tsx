import React from 'react';
import { View } from 'react-native';
import { Icon, Heading3, Body } from './atoms';
import { DesignTokens } from '../constants/DesignSystem';
import { ENV } from '../config/env';

interface DevOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const DevOnly: React.FC<DevOnlyProps> = ({ 
  children, 
  fallback 
}) => {
  const isDev = __DEV__ && ENV.NODE_ENV === 'development';
  
  if (!isDev) {
    return (
      fallback || (
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center',
          padding: DesignTokens.spacing.xl 
        }}>
          <Icon name="lock-closed" size="xxl" color="error" />
          <Heading3 style={{ 
            marginTop: DesignTokens.spacing.md,
            textAlign: 'center' 
          }}>
            Développement uniquement
          </Heading3>
          <Body style={{ 
            marginTop: DesignTokens.spacing.sm,
            textAlign: 'center',
            color: DesignTokens.colors.textSecondary 
          }}>
            Cette fonctionnalité n'est disponible qu'en mode développement
          </Body>
        </View>
      )
    );
  }

  return <>{children}</>;
};
