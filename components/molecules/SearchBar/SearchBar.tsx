import React from 'react';
import { View, ViewStyle } from 'react-native';
import { Input, Button } from '../../atoms';
import { DesignTokens } from '../../../constants/DesignSystem';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  onSubmit?: () => void;
  loading?: boolean;
  style?: ViewStyle;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = "Rechercher...",
  onClear,
  onSubmit,
  loading = false,
  style,
}) => {
  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  return (
    <View style={[{ flexDirection: 'row', gap: DesignTokens.spacing.sm }, style]}>
      <Input
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        variant="filled"
        leftIcon="search"
        rightIcon={value ? "close-circle" : undefined}
        onRightIconPress={value ? handleClear : undefined}
        style={{ flex: 1 }}
      />
      {onSubmit && (
        <Button
          title="Rechercher"
          onPress={onSubmit}
          loading={loading}
          disabled={!value.trim() || loading}
          size="md"
        />
      )}
    </View>
  );
};
