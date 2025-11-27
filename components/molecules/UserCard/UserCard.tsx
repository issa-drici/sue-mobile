import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text, Avatar, Button, Icon } from '../../atoms';
import { Card } from '../../ui/Card';
import { DesignTokens } from '../../../constants/DesignSystem';

interface UserCardProps {
  user: {
    id: string;
    firstname?: string;
    lastname?: string;
    email: string;
    avatar?: string;
  };
  subtitle?: string;
  onPress?: () => void;
  actions?: {
    primary?: {
      title: string;
      onPress: () => void;
      loading?: boolean;
      disabled?: boolean;
    };
    secondary?: {
      title: string;
      onPress: () => void;
      loading?: boolean;
      disabled?: boolean;
    };
  };
  showChevron?: boolean;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  subtitle,
  onPress,
  actions,
  showChevron = false,
}) => {
  const displayName = `${user.firstname || ''} ${user.lastname || ''}`.trim() || user.email;

  const CardContent = (
    <View style={{ 
      flexDirection: 'row', 
      alignItems: 'center',
      padding: DesignTokens.spacing.md 
    }}>
      
      <Avatar
        source={user.avatar ? { uri: user.avatar } : undefined}
        initials={user.firstname?.[0] || user.email[0]}
        size="md"
        style={{ marginRight: DesignTokens.spacing.md }}
      />
      
      <View style={{ flex: 1 }}>
        <Text variant="body" weight="medium" style={{ marginBottom: DesignTokens.spacing.xs }}>
          {displayName}
        </Text>
        
        {subtitle ? (
          <Text variant="caption" color="secondary">
            {subtitle}
          </Text>
        ) : (
          <Text variant="caption" color="secondary">
            {user.email}
          </Text>
        )}
      </View>
      
      {actions && (
        <View style={{ 
          flexDirection: 'row', 
          gap: DesignTokens.spacing.xs,
          marginLeft: DesignTokens.spacing.sm 
        }}>
          {actions.secondary && (
            <Button
              title={actions.secondary.title}
              variant="secondary"
              size="sm"
              onPress={actions.secondary.onPress}
              loading={actions.secondary.loading}
              disabled={actions.secondary.disabled}
            />
          )}
          {actions.primary && (
            <Button
              title={actions.primary.title}
              variant="primary"
              size="sm"
              onPress={actions.primary.onPress}
              loading={actions.primary.loading}
              disabled={actions.primary.disabled}
            />
          )}
        </View>
      )}
      
      {showChevron && !actions && (
        <Icon name="chevron-forward" size="md" color="secondary" />
      )}
      
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <Card style={{ marginBottom: DesignTokens.spacing.sm }}>
          {CardContent}
        </Card>
      </TouchableOpacity>
    );
  }

  return (
    <Card style={{ marginBottom: DesignTokens.spacing.sm }}>
      {CardContent}
    </Card>
  );
};
