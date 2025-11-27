import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, Icon, Button } from '../../atoms';
import { Card } from '../../ui/Card';
import { DesignTokens } from '../../../constants/DesignSystem';
import { formatDate, formatTimeFrance } from '../../../utils/dateHelpers';

interface SessionCardProps {
  session: {
    id: string;
    title: string;
    sport: string;
    location: string;
    startTime: string;
    maxParticipants?: number;
    participants?: any[];
    status?: 'active' | 'cancelled' | 'completed';
    isCreator?: boolean;
  };
  onPress?: () => void;
  showActions?: boolean;
}

export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  onPress,
  showActions = false,
}) => {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/session/${session.id}`);
    }
  };

  const getStatusColor = () => {
    switch (session.status) {
      case 'cancelled': return DesignTokens.colors.error;
      case 'completed': return DesignTokens.colors.success;
      default: return DesignTokens.colors.primary;
    }
  };

  const getStatusText = () => {
    switch (session.status) {
      case 'cancelled': return 'Annulée';
      case 'completed': return 'Terminée';
      default: return 'Active';
    }
  };

  return (
    <Card padding="md" style={{ marginBottom: DesignTokens.spacing.sm }}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: DesignTokens.spacing.sm 
        }}>
          <View style={{ flex: 1 }}>
            <Text variant="h4" style={{ marginBottom: DesignTokens.spacing.xs }}>
              {session.title}
            </Text>
            <Text variant="body" color="primary" style={{ marginBottom: DesignTokens.spacing.xs }}>
              🏃‍♂️ {session.sport}
            </Text>
          </View>
          
          {session.status && (
            <View style={{
              backgroundColor: getStatusColor(),
              paddingHorizontal: DesignTokens.spacing.xs,
              paddingVertical: DesignTokens.spacing.xs / 2,
              borderRadius: DesignTokens.borderRadius.sm,
            }}>
              <Text variant="caption" color="textInverse">
                {getStatusText()}
              </Text>
            </View>
          )}
        </View>

        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center',
          marginBottom: DesignTokens.spacing.xs 
        }}>
          <Icon name="location-outline" size="sm" color="secondary" />
          <Text variant="body" color="secondary" style={{ marginLeft: DesignTokens.spacing.xs }}>
            {session.location}
          </Text>
        </View>

        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center',
          marginBottom: DesignTokens.spacing.sm 
        }}>
          <Icon name="time-outline" size="sm" color="secondary" />
          <Text variant="body" color="secondary" style={{ marginLeft: DesignTokens.spacing.xs }}>
            {formatDate(session.startTime)} à {formatTimeFrance(session.startTime)}
          </Text>
        </View>

        {session.maxParticipants && (
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center',
            marginBottom: showActions ? DesignTokens.spacing.md : 0 
          }}>
            <Icon name="people-outline" size="sm" color="secondary" />
            <Text variant="caption" color="secondary" style={{ marginLeft: DesignTokens.spacing.xs }}>
              {session.participants?.length || 0} / {session.maxParticipants} participants
            </Text>
          </View>
        )}

        {showActions && (
          <View style={{ 
            flexDirection: 'row', 
            gap: DesignTokens.spacing.sm,
            marginTop: DesignTokens.spacing.sm 
          }}>
            <Button
              title="Voir détails"
              variant="outline"
              size="sm"
              onPress={handlePress}
              style={{ flex: 1 }}
            />
            {session.isCreator && (
              <Button
                title="Modifier"
                variant="secondary"
                size="sm"
                onPress={() => router.push(`/edit-session/${session.id}`)}
                style={{ flex: 1 }}
              />
            )}
          </View>
        )}

      </TouchableOpacity>
    </Card>
  );
};
