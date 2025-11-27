import React from 'react';
import { Image, View, ViewStyle, ImageStyle } from 'react-native';
import { DesignTokens } from '../../../constants/DesignSystem';
import { Text } from '../Text';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

interface AvatarProps {
  source?: { uri: string } | number;
  initials?: string;
  size?: AvatarSize;
  style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  initials,
  size = 'md',
  style,
}) => {
  const getSize = (): number => {
    switch (size) {
      case 'xs': return 24;
      case 'sm': return 32;
      case 'md': return 40;
      case 'lg': return 56;
      case 'xl': return 72;
      case 'xxl': return 96;
      default: return 40;
    }
  };

  const avatarSize = getSize();
  
  const containerStyle: ViewStyle = {
    width: avatarSize,
    height: avatarSize,
    borderRadius: avatarSize / 2,
    backgroundColor: DesignTokens.colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...style,
  };

  const imageStyle: ImageStyle = {
    width: avatarSize,
    height: avatarSize,
  };

  if (source) {
    return (
      <View style={containerStyle}>
        <Image source={source} style={imageStyle} />
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <Text 
        variant={size === 'xs' || size === 'sm' ? 'caption' : 'body'} 
        color="secondary"
        weight="medium"
      >
        {initials || '?'}
      </Text>
    </View>
  );
};

export const SmallAvatar: React.FC<Omit<AvatarProps, 'size'>> = (props) => (
  <Avatar {...props} size="sm" />
);

export const LargeAvatar: React.FC<Omit<AvatarProps, 'size'>> = (props) => (
  <Avatar {...props} size="lg" />
);
