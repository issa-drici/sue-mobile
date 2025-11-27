import React from 'react';
import { ActivityIndicator, View, ViewStyle } from 'react-native';
import { DesignTokens } from '../../../constants/DesignSystem';
import { Text } from '../Text';

export type SpinnerSize = 'small' | 'large';
export type SpinnerColor = 'primary' | 'secondary' | 'inverse';

interface SpinnerProps {
  size?: SpinnerSize;
  color?: SpinnerColor;
  message?: string;
  style?: ViewStyle;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'small',
  color = 'primary',
  message,
  style,
}) => {
  const getColor = (): string => {
    switch (color) {
      case 'secondary':
        return DesignTokens.colors.textSecondary;
      case 'inverse':
        return DesignTokens.colors.textInverse;
      default:
        return DesignTokens.colors.primary;
    }
  };

  const containerStyle: ViewStyle = {
    alignItems: 'center',
    justifyContent: 'center',
    ...style,
  };

  return (
    <View style={containerStyle}>
      <ActivityIndicator size={size} color={getColor()} />
      {message && (
        <Text 
          variant="caption" 
          color="secondary" 
          style={{ marginTop: DesignTokens.spacing.xs }}
        >
          {message}
        </Text>
      )}
    </View>
  );
};

export const LoadingSpinner: React.FC<Omit<SpinnerProps, 'message'>> = (props) => (
  <Spinner {...props} message="Chargement..." />
);

export const LargeSpinner: React.FC<Omit<SpinnerProps, 'size'>> = (props) => (
  <Spinner {...props} size="large" />
);
