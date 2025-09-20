import { BrandColors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type InfoMessageType = 'info' | 'warning' | 'success' | 'error';

interface InfoMessageProps {
  type: InfoMessageType;
  message: string;
  icon?: string;
  style?: any;
}

const InfoMessage: React.FC<InfoMessageProps> = ({ 
  type, 
  message, 
  icon,
  style 
}) => {
  // Configuration par type
  const getTypeConfig = (type: InfoMessageType) => {
    switch (type) {
      case 'info':
        return {
          backgroundColor: BrandColors.white,
          borderColor: BrandColors.primary,
          textColor: BrandColors.primary,
          iconColor: BrandColors.primary,
          defaultIcon: 'information-circle'
        };
      case 'warning':
        return {
          backgroundColor: '#FFF3CD',
          borderColor: '#FFEAA7',
          textColor: '#856404',
          iconColor: '#FF9500',
          defaultIcon: 'warning'
        };
      case 'success':
        return {
          backgroundColor: '#D4EDDA',
          borderColor: '#C3E6CB',
          textColor: '#155724',
          iconColor: '#34C759',
          defaultIcon: 'checkmark-circle'
        };
      case 'error':
        return {
          backgroundColor: '#F8D7DA',
          borderColor: '#F5C6CB',
          textColor: '#721C24',
          iconColor: '#FF3B30',
          defaultIcon: 'close-circle'
        };
      default:
        return {
          backgroundColor: BrandColors.white,
          borderColor: BrandColors.primary,
          textColor: BrandColors.primary,
          iconColor: BrandColors.primary,
          defaultIcon: 'information-circle'
        };
    }
  };

  const config = getTypeConfig(type);
  const iconName = icon || config.defaultIcon;

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: config.backgroundColor,
        borderColor: config.borderColor,
      },
      style
    ]}>
      <Ionicons 
        name={iconName as any} 
        size={20} 
        color={config.iconColor} 
        style={styles.icon} 
      />
      <Text style={[
        styles.text,
        { color: config.textColor }
      ]}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
});

export default InfoMessage; 