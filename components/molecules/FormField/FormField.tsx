import React from 'react';
import { View, ViewStyle } from 'react-native';
import { Text, Input } from '../../atoms';
import { DesignTokens } from '../../../constants/DesignSystem';

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'email' | 'password' | 'name' | 'off';
  style?: ViewStyle;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  required = false,
  disabled = false,
  leftIcon,
  rightIcon,
  onRightIconPress,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  autoComplete,
  style,
}) => {
  return (
    <View style={[{ marginBottom: DesignTokens.spacing.md }, style]}>
      
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center',
        marginBottom: DesignTokens.spacing.xs 
      }}>
        <Text variant="body" weight="medium">
          {label}
        </Text>
        {required && (
          <Text variant="body" color="error" style={{ marginLeft: DesignTokens.spacing.xs }}>
            *
          </Text>
        )}
      </View>
      
      <Input
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        error={!!error}
        disabled={disabled}
        leftIcon={leftIcon}
        rightIcon={rightIcon}
        onRightIconPress={onRightIconPress}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        variant="outlined"
      />
      
      {error && (
        <Text 
          variant="caption" 
          color="error"
          style={{ marginTop: DesignTokens.spacing.xs }}
        >
          {error}
        </Text>
      )}
      
    </View>
  );
};
