import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';
import { DesignTokens } from '../../../constants/DesignSystem';

export type TextVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'subtitle' | 'body' | 'caption' | 'small';
export type TextColor = 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'error' | 'success' | 'warning';
export type TextAlign = 'left' | 'center' | 'right' | 'justify';
export type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: TextColor;
  align?: TextAlign;
  weight?: TextWeight;
  children: React.ReactNode;
  style?: TextStyle;
}

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  color = 'primary',
  align = 'left',
  weight,
  children,
  style,
  ...props
}) => {
  const getVariantStyles = (): TextStyle => {
    switch (variant) {
      case 'h1':
        return {
          fontSize: DesignTokens.typography.h1.fontSize,
          fontWeight: DesignTokens.typography.h1.fontWeight as any,
          lineHeight: DesignTokens.typography.h1.lineHeight,
        };
      
      case 'h2':
        return {
          fontSize: DesignTokens.typography.h2.fontSize,
          fontWeight: DesignTokens.typography.h2.fontWeight as any,
          lineHeight: DesignTokens.typography.h2.lineHeight,
        };
      
      case 'h3':
        return {
          fontSize: DesignTokens.typography.h3.fontSize,
          fontWeight: DesignTokens.typography.h3.fontWeight as any,
          lineHeight: DesignTokens.typography.h3.lineHeight,
        };
      
      case 'h4':
        return {
          fontSize: DesignTokens.typography.h4.fontSize,
          fontWeight: DesignTokens.typography.h4.fontWeight as any,
          lineHeight: DesignTokens.typography.h4.lineHeight,
        };
      
      case 'h5':
        return {
          fontSize: DesignTokens.typography.h5.fontSize,
          fontWeight: DesignTokens.typography.h5.fontWeight as any,
          lineHeight: DesignTokens.typography.h5.lineHeight,
        };
      
      case 'subtitle':
        return {
          fontSize: DesignTokens.typography.subtitle.fontSize,
          fontWeight: DesignTokens.typography.subtitle.fontWeight as any,
          lineHeight: DesignTokens.typography.subtitle.lineHeight,
        };
      
      case 'body':
        return {
          fontSize: DesignTokens.typography.body.fontSize,
          fontWeight: DesignTokens.typography.body.fontWeight as any,
          lineHeight: DesignTokens.typography.body.lineHeight,
        };
      
      case 'caption':
        return {
          fontSize: DesignTokens.typography.caption.fontSize,
          fontWeight: DesignTokens.typography.caption.fontWeight as any,
          lineHeight: DesignTokens.typography.caption.lineHeight,
        };
      
      case 'small':
        return {
          fontSize: DesignTokens.typography.small.fontSize,
          fontWeight: DesignTokens.typography.small.fontWeight as any,
          lineHeight: DesignTokens.typography.small.lineHeight,
        };
      
      default:
        return {};
    }
  };

  const getColorStyles = (): TextStyle => {
    switch (color) {
      case 'primary':
        return { color: DesignTokens.colors.text };
      
      case 'secondary':
        return { color: DesignTokens.colors.textSecondary };
      
      case 'tertiary':
        return { color: DesignTokens.colors.textTertiary };
      
      case 'inverse':
        return { color: DesignTokens.colors.textInverse };
      
      case 'error':
        return { color: DesignTokens.colors.error };
      
      case 'success':
        return { color: DesignTokens.colors.success };
      
      case 'warning':
        return { color: DesignTokens.colors.warning };
      
      default:
        return {};
    }
  };

  const getWeightStyles = (): TextStyle => {
    if (!weight) return {};
    
    switch (weight) {
      case 'normal':
        return { fontWeight: '400' };
      case 'medium':
        return { fontWeight: '500' };
      case 'semibold':
        return { fontWeight: '600' };
      case 'bold':
        return { fontWeight: '700' };
      default:
        return {};
    }
  };

  const getAlignStyles = (): TextStyle => {
    return { textAlign: align };
  };

  const finalStyle: TextStyle = {
    ...getVariantStyles(),
    ...getColorStyles(),
    ...getWeightStyles(),
    ...getAlignStyles(),
    ...style,
  };

  return (
    <RNText style={finalStyle} {...props}>
      {children}
    </RNText>
  );
};

export const Heading1: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text {...props} variant="h1" />
);

export const Heading2: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text {...props} variant="h2" />
);

export const Heading3: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text {...props} variant="h3" />
);

export const Heading4: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text {...props} variant="h4" />
);

export const Subtitle: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text {...props} variant="subtitle" />
);

export const Body: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text {...props} variant="body" />
);

export const Caption: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text {...props} variant="caption" />
);

export const Small: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text {...props} variant="small" />
);
