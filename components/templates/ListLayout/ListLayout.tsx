import React from 'react';
import { ViewStyle } from 'react-native';
import { PageLayout } from '../PageLayout';
import { SessionsList, FriendsList, SectionList } from '../../organisms';
import { SearchBar, EmptyState } from '../../molecules';
import { DesignTokens } from '../../../constants/DesignSystem';

type ListType = 'sessions' | 'friends' | 'sections' | 'custom';

interface BaseListLayoutProps {
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
  searchable?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
}

interface SessionsListLayoutProps extends BaseListLayoutProps {
  type: 'sessions';
  sessions: any[];
  onSessionPress?: (session: any) => void;
  showSessionActions?: boolean;
  emptyState?: {
    title: string;
    subtitle?: string;
    icon?: string;
    actionTitle?: string;
    onAction?: () => void;
  };
}

interface FriendsListLayoutProps extends BaseListLayoutProps {
  type: 'friends';
  friends: any[];
  friendRequests?: any[];
  onRespondToRequest?: (requestId: string, response: 'accept' | 'decline') => Promise<void>;
  onRemoveFriend?: (friendId: string) => Promise<void>;
  onAddFriend?: () => void;
  isResponding?: boolean;
}

interface SectionsListLayoutProps extends BaseListLayoutProps {
  type: 'sections';
  sections: Array<{
    title: string;
    data: any[];
    renderItem: (item: any, index: number) => React.ReactNode;
  }>;
  emptyState?: {
    title: string;
    subtitle?: string;
    icon?: string;
    actionTitle?: string;
    onAction?: () => void;
  };
}

interface CustomListLayoutProps extends BaseListLayoutProps {
  type: 'custom';
  children: React.ReactNode;
}

type ListLayoutProps = 
  | SessionsListLayoutProps 
  | FriendsListLayoutProps 
  | SectionsListLayoutProps 
  | CustomListLayoutProps;

export const ListLayout: React.FC<ListLayoutProps> = (props) => {
  const {
    title,
    showBackButton,
    onBackPress,
    rightAction,
    style,
    searchable = false,
    searchValue = '',
    onSearchChange,
    searchPlaceholder = 'Rechercher...',
    refreshing = false,
    onRefresh,
  } = props;

  const renderSearchBar = () => {
    if (!searchable || !onSearchChange) return null;
    
    return (
      <SearchBar
        value={searchValue}
        onChangeText={onSearchChange}
        placeholder={searchPlaceholder}
        style={{ 
          margin: DesignTokens.spacing.md,
          marginBottom: DesignTokens.spacing.sm 
        }}
      />
    );
  };

  const renderList = () => {
    switch (props.type) {
      case 'sessions':
        return (
          <SessionsList
            sessions={props.sessions}
            refreshing={refreshing}
            onRefresh={onRefresh}
            onSessionPress={props.onSessionPress}
            showActions={props.showSessionActions}
            emptyState={props.emptyState}
          />
        );

      case 'friends':
        return (
          <FriendsList
            friends={props.friends}
            friendRequests={props.friendRequests || []}
            refreshing={refreshing}
            onRefresh={onRefresh}
            onRespondToRequest={props.onRespondToRequest}
            onRemoveFriend={props.onRemoveFriend}
            onAddFriend={props.onAddFriend}
            isResponding={props.isResponding}
          />
        );

      case 'sections':
        return (
          <SectionList
            sections={props.sections}
            refreshing={refreshing}
            onRefresh={onRefresh}
            emptyState={props.emptyState}
          />
        );

      case 'custom':
        return props.children;

      default:
        return null;
    }
  };

  return (
    <PageLayout
      title={title}
      showBackButton={showBackButton}
      onBackPress={onBackPress}
      rightAction={rightAction}
      style={style}
    >
      {renderSearchBar()}
      {renderList()}
    </PageLayout>
  );
};
