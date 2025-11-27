import React from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { SessionCard, EmptyState } from '../../molecules';
import { DesignTokens } from '../../../constants/DesignSystem';

interface Session {
  id: string;
  title?: string;
  sport: string;
  location: string;
  startTime: string;
  maxParticipants?: number;
  participants?: any[];
  status?: 'active' | 'cancelled' | 'completed';
  isCreator?: boolean;
}

interface SessionsListProps {
  sessions: Session[];
  refreshing?: boolean;
  onRefresh?: () => void;
  onSessionPress?: (session: Session) => void;
  showActions?: boolean;
  emptyState?: {
    title: string;
    subtitle?: string;
    icon?: string;
    actionTitle?: string;
    onAction?: () => void;
  };
}

export const SessionsList: React.FC<SessionsListProps> = ({
  sessions,
  refreshing = false,
  onRefresh,
  onSessionPress,
  showActions = false,
  emptyState,
}) => {
  const renderSession = ({ item }: { item: Session }) => (
    <SessionCard
      session={{
        id: item.id,
        title: item.title || item.sport.charAt(0).toUpperCase() + item.sport.slice(1),
        sport: item.sport,
        location: item.location,
        startTime: item.startTime,
        maxParticipants: item.maxParticipants,
        participants: item.participants,
        status: item.status,
        isCreator: item.isCreator,
      }}
      onPress={onSessionPress ? () => onSessionPress(item) : undefined}
      showActions={showActions}
    />
  );

  if (sessions.length === 0 && emptyState) {
    return (
      <EmptyState
        title={emptyState.title}
        subtitle={emptyState.subtitle}
        icon={emptyState.icon}
        actionTitle={emptyState.actionTitle}
        onAction={emptyState.onAction}
      />
    );
  }

  return (
    <FlatList
      data={sessions}
      renderItem={renderSession}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{
        padding: DesignTokens.spacing.md,
        paddingBottom: DesignTokens.spacing.xl,
      }}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
      showsVerticalScrollIndicator={false}
    />
  );
};
