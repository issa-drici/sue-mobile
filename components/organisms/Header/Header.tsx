import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, Icon, Button } from '../../atoms';
import { DesignTokens } from '../../../constants/DesignSystem';
import { CommonStyles } from '../../../styles/CommonStyles';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBackButton = false,
  onBackPress,
  rightAction,
  style,
}) => {
  const router = useRouter();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View style={[CommonStyles.header, style]}>
      
      <View style={{ width: 40, alignItems: 'flex-start' }}>
        {showBackButton && (
          <Button
            title=""
            variant="ghost"
            size="sm"
            onPress={handleBackPress}
            leftIcon={<Icon name="chevron-back" size="lg" color="text" />}
            style={{ paddingHorizontal: 0, minWidth: 40 }}
          />
        )}
      </View>

      <View style={{ flex: 1, alignItems: 'center' }}>
        {title && (
          <Text 
            variant="h4" 
            weight="semibold"
            style={{ textAlign: 'center' }}
            numberOfLines={1}
          >
            {title}
          </Text>
        )}
      </View>

      <View style={{ width: 40, alignItems: 'flex-end' }}>
        {rightAction}
      </View>
      
    </View>
  );
};
