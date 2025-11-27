import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ViewStyle, TouchableOpacity, TextStyle } from 'react-native';
import { DesignTokens } from '../../../constants/DesignSystem';

export type IconName = keyof typeof Ionicons.glyphMap;
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
export type IconColor = 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'error' | 'success' | 'warning' | 'info';

interface IconProps {
  name: IconName;
  size?: IconSize | number;
  color?: IconColor | string;
  style?: TextStyle;
  onPress?: () => void;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 'md',
  color = 'primary',
  style,
  onPress,
}) => {
  const getSize = (): number => {
    if (typeof size === 'number') {
      return size;
    }
    
    switch (size) {
      case 'xs':
        return DesignTokens.iconSizes.xs;
      case 'sm':
        return DesignTokens.iconSizes.sm;
      case 'md':
        return DesignTokens.iconSizes.md;
      case 'lg':
        return DesignTokens.iconSizes.lg;
      case 'xl':
        return DesignTokens.iconSizes.xl;
      case 'xxl':
        return DesignTokens.iconSizes.xxl;
      default:
        return DesignTokens.iconSizes.md;
    }
  };

  const getColor = (): string => {
    if (typeof color === 'string' && (color.startsWith('#') || color.startsWith('rgb'))) {
      return color;
    }
    
    switch (color) {
      case 'primary':
        return DesignTokens.colors.text;
      case 'secondary':
        return DesignTokens.colors.textSecondary;
      case 'tertiary':
        return DesignTokens.colors.textTertiary;
      case 'inverse':
        return DesignTokens.colors.textInverse;
      case 'error':
        return DesignTokens.colors.error;
      case 'success':
        return DesignTokens.colors.success;
      case 'warning':
        return DesignTokens.colors.warning;
      case 'info':
        return DesignTokens.colors.info;
      default:
        return typeof color === 'string' ? color : DesignTokens.colors.text;
    }
  };

  const IconComponent = (
    <Ionicons
      name={name}
      size={getSize()}
      color={getColor()}
      style={style}
    />
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {IconComponent}
      </TouchableOpacity>
    );
  }

  return IconComponent;
};

export const SmallIcon: React.FC<Omit<IconProps, 'size'>> = (props) => (
  <Icon {...props} size="sm" />
);

export const LargeIcon: React.FC<Omit<IconProps, 'size'>> = (props) => (
  <Icon {...props} size="lg" />
);

export const ErrorIcon: React.FC<Omit<IconProps, 'color'>> = (props) => (
  <Icon {...props} color="error" />
);

export const SuccessIcon: React.FC<Omit<IconProps, 'color'>> = (props) => (
  <Icon {...props} color="success" />
);

export const WarningIcon: React.FC<Omit<IconProps, 'color'>> = (props) => (
  <Icon {...props} color="warning" />
);

export const BackIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon {...props} name="chevron-back" />
);

export const CloseIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon {...props} name="close" />
);

export const SearchIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon {...props} name="search" />
);

export const AddIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon {...props} name="add" />
);

export const HeartIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon {...props} name="heart" />
);

export const StarIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon {...props} name="star" />
);

export const EditIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon {...props} name="pencil" />
);

export const DeleteIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon {...props} name="trash" />
);

export const CheckIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon {...props} name="checkmark" />
);

export const LocationIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon {...props} name="location" />
);

export const CalendarIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon {...props} name="calendar" />
);

export const TimeIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon {...props} name="time" />
);

export const PeopleIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon {...props} name="people" />
);

export const PersonIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon {...props} name="person" />
);

export const NotificationIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon {...props} name="notifications" />
);

export const SettingsIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon {...props} name="settings" />
);

export const MenuIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon {...props} name="menu" />
);

export const MoreIcon: React.FC<Omit<IconProps, 'name'>> = (props) => (
  <Icon {...props} name="ellipsis-horizontal" />
);
