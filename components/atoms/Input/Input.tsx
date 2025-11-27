import React from 'react';
import { TextInput, View, ViewStyle, TextStyle } from 'react-native';
import { DesignTokens } from '../../../constants/DesignSystem';
import { Icon, IconName } from '../Icon';

export type InputVariant = 'default' | 'outlined' | 'filled';
export type InputSize = 'sm' | 'md' | 'lg';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  variant?: InputVariant;
  size?: InputSize;
  disabled?: boolean;
  error?: boolean;
  leftIcon?: IconName;
  rightIcon?: IconName;
  onRightIconPress?: () => void;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'email' | 'password' | 'name' | 'off';
  editable?: boolean;
}

export const Input: React.FC<InputProps> = ({
  value,
  onChangeText,
  placeholder,
  variant = 'default',
  size = 'md',
  disabled = false,
  error = false,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  inputStyle,
  ...props
}) => {
  const getVariantStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: DesignTokens.borderRadius.md,
    };

    switch (variant) {
      case 'outlined':
        return {
          ...baseStyle,
          borderWidth: 1,
          borderColor: error ? DesignTokens.colors.error : DesignTokens.colors.border,
          backgroundColor: DesignTokens.colors.background,
        };
      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: DesignTokens.colors.backgroundSecondary,
          borderWidth: 0,
        };
      default:
        return {
          ...baseStyle,
          borderBottomWidth: 1,
          borderBottomColor: error ? DesignTokens.colors.error : DesignTokens.colors.border,
          backgroundColor: 'transparent',
        };
    }
  };

  const getSizeStyles = (): { container: ViewStyle; input: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          container: {
            paddingHorizontal: DesignTokens.spacing.sm,
            paddingVertical: DesignTokens.spacing.xs,
            minHeight: 36,
          },
          input: {
            fontSize: DesignTokens.typography.caption.fontSize,
          },
        };
      case 'lg':
        return {
          container: {
            paddingHorizontal: DesignTokens.spacing.lg,
            paddingVertical: DesignTokens.spacing.md,
            minHeight: 52,
          },
          input: {
            fontSize: DesignTokens.typography.subtitle.fontSize,
          },
        };
      default:
        return {
          container: {
            paddingHorizontal: DesignTokens.spacing.md,
            paddingVertical: DesignTokens.spacing.sm,
            minHeight: 44,
          },
          input: {
            fontSize: DesignTokens.typography.body.fontSize,
          },
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const containerStyle: ViewStyle = {
    ...variantStyles,
    ...sizeStyles.container,
    ...(disabled && { opacity: DesignTokens.opacity.disabled }),
    ...style,
  };

  const textInputStyle: TextStyle = {
    flex: 1,
    color: DesignTokens.colors.text,
    ...sizeStyles.input,
    ...inputStyle,
  };

  return (
    <View style={containerStyle}>
      {leftIcon && (
        <Icon 
          name={leftIcon} 
          size="sm" 
          color="secondary" 
          style={{ marginRight: DesignTokens.spacing.xs }} 
        />
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={DesignTokens.colors.textTertiary}
        style={textInputStyle}
        editable={!disabled}
        {...props}
      />
      {rightIcon && (
        <Icon 
          name={rightIcon} 
          size="sm" 
          color="secondary" 
          style={{ marginLeft: DesignTokens.spacing.xs }}
          onPress={onRightIconPress}
        />
      )}
    </View>
  );
};

export const OutlinedInput: React.FC<Omit<InputProps, 'variant'>> = (props) => (
  <Input {...props} variant="outlined" />
);

export const FilledInput: React.FC<Omit<InputProps, 'variant'>> = (props) => (
  <Input {...props} variant="filled" />
);
