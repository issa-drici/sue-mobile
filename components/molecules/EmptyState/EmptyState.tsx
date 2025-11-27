import React from 'react';
import { View, ViewStyle } from 'react-native';
import { Text, Icon, Button } from '../../atoms';
import { DesignTokens } from '../../../constants/DesignSystem';

type EmptyStateVariant = 'default' | 'error' | 'search' | 'loading';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  icon?: string;
  title: string;
  subtitle?: string;
  actionTitle?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'default',
  icon,
  title,
  subtitle,
  actionTitle,
  onAction,
  style,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'error':
        return {
          iconColor: 'error' as const,
          titleColor: 'error' as const,
          defaultIcon: 'alert-circle-outline',
        };
      case 'search':
        return {
          iconColor: 'secondary' as const,
          titleColor: 'primary' as const,
          defaultIcon: 'search-outline',
        };
      case 'loading':
        return {
          iconColor: 'secondary' as const,
          titleColor: 'secondary' as const,
          defaultIcon: 'time-outline',
        };
      default:
        return {
          iconColor: 'secondary' as const,
          titleColor: 'primary' as const,
          defaultIcon: 'information-circle-outline',
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <View style={[{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: DesignTokens.spacing.xl,
    }, style]}>
      
      <Icon 
        name={icon || variantStyles.defaultIcon} 
        size="xxl" 
        color={variantStyles.iconColor}
        style={{ marginBottom: DesignTokens.spacing.md }}
      />
      
      <Text 
        variant="h3" 
        color={variantStyles.titleColor}
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
            marginBottom: onAction ? DesignTokens.spacing.lg : 0 
          }}
        >
          {subtitle}
        </Text>
      )}
      
      {onAction && actionTitle && (
        <Button
          title={actionTitle}
          onPress={onAction}
          variant="primary"
        />
      )}
      
    </View>
  );
};
