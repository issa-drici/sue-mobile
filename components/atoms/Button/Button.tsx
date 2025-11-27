import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle, View } from 'react-native';
import { DesignTokens } from '../../../constants/DesignSystem';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  activeOpacity?: number;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  activeOpacity = 0.7,
  leftIcon,
  rightIcon,
}) => {
  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    const baseContainer: ViewStyle = {
      borderRadius: DesignTokens.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };

    const baseText: TextStyle = {
      fontWeight: '600',
    };

    switch (variant) {
      case 'primary':
        return {
          container: {
            ...baseContainer,
            backgroundColor: DesignTokens.colors.primary,
          },
          text: {
            ...baseText,
            color: DesignTokens.colors.textInverse,
          },
        };
      
      case 'secondary':
        return {
          container: {
            ...baseContainer,
            backgroundColor: DesignTokens.colors.backgroundSecondary,
          },
          text: {
            ...baseText,
            color: DesignTokens.colors.text,
          },
        };
      
      case 'outline':
        return {
          container: {
            ...baseContainer,
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: DesignTokens.colors.primary,
          },
          text: {
            ...baseText,
            color: DesignTokens.colors.primary,
          },
        };
      
      case 'ghost':
        return {
          container: {
            ...baseContainer,
            backgroundColor: 'transparent',
          },
          text: {
            ...baseText,
            color: DesignTokens.colors.primary,
          },
        };
      
      case 'danger':
        return {
          container: {
            ...baseContainer,
            backgroundColor: DesignTokens.colors.error,
          },
          text: {
            ...baseText,
            color: DesignTokens.colors.textInverse,
          },
        };
      
      default:
        return {
          container: baseContainer,
          text: baseText,
        };
    }
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          container: {
            paddingHorizontal: DesignTokens.spacing.sm,
            paddingVertical: DesignTokens.spacing.xs,
            minHeight: 32,
          },
          text: {
            fontSize: DesignTokens.typography.caption.fontSize,
          },
        };
      
      case 'md':
        return {
          container: {
            paddingHorizontal: DesignTokens.spacing.md,
            paddingVertical: DesignTokens.spacing.sm,
            minHeight: 44,
          },
          text: {
            fontSize: DesignTokens.typography.body.fontSize,
          },
        };
      
      case 'lg':
        return {
          container: {
            paddingHorizontal: DesignTokens.spacing.lg,
            paddingVertical: DesignTokens.spacing.md,
            minHeight: 52,
          },
          text: {
            fontSize: DesignTokens.typography.subtitle.fontSize,
          },
        };
      
      default:
        return {
          container: {},
          text: {},
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const containerStyle: ViewStyle = {
    ...variantStyles.container,
    ...sizeStyles.container,
    ...(fullWidth && { width: '100%' }),
    ...(disabled && { 
      opacity: DesignTokens.opacity.disabled,
      backgroundColor: DesignTokens.colors.disabled,
    }),
    ...style,
  };

  const finalTextStyle: TextStyle = {
    ...variantStyles.text,
    ...sizeStyles.text,
    ...(disabled && { color: DesignTokens.colors.disabledText }),
    ...textStyle,
  };

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={activeOpacity}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' || variant === 'danger' ? DesignTokens.colors.textInverse : DesignTokens.colors.primary}
        />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {leftIcon && (
            <View style={{ marginRight: DesignTokens.spacing.xs }}>
              {leftIcon}
            </View>
          )}
          <Text style={finalTextStyle}>{title}</Text>
          {rightIcon && (
            <View style={{ marginLeft: DesignTokens.spacing.xs }}>
              {rightIcon}
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

export const PrimaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button {...props} variant="primary" />
);

export const SecondaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button {...props} variant="secondary" />
);

export const OutlineButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button {...props} variant="outline" />
);

export const GhostButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button {...props} variant="ghost" />
);

export const DangerButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button {...props} variant="danger" />
);
