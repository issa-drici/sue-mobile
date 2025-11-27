import React from 'react';
import { Alert } from 'react-native';
import { UserCard } from '../../molecules';
import { SectionList } from '../SectionList';

interface Friend {
  id: string;
  firstname?: string;
  lastname?: string;
  email: string;
  avatar?: string;
}

interface FriendRequest extends Friend {
  status: 'pending' | 'accepted' | 'declined';
}

interface FriendsListProps {
  friends: Friend[];
  friendRequests: FriendRequest[];
  refreshing?: boolean;
  onRefresh?: () => void;
  onRespondToRequest?: (requestId: string, response: 'accept' | 'decline') => Promise<void>;
  onRemoveFriend?: (friendId: string) => Promise<void>;
  onAddFriend?: () => void;
  isResponding?: boolean;
}

export const FriendsList: React.FC<FriendsListProps> = ({
  friends,
  friendRequests,
  refreshing = false,
  onRefresh,
  onRespondToRequest,
  onRemoveFriend,
  onAddFriend,
  isResponding = false,
}) => {
  const handleRespondToRequest = async (requestId: string, response: 'accept' | 'decline') => {
    if (onRespondToRequest) {
      try {
        await onRespondToRequest(requestId, response);
      } catch (error) {
        Alert.alert('Erreur', 'Une erreur est survenue');
      }
    }
  };

  const handleRemoveFriend = async (friendId: string, friendName: string) => {
    Alert.alert(
      'Supprimer ami',
      `Êtes-vous sûr de vouloir supprimer ${friendName} de vos amis ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            if (onRemoveFriend) {
              try {
                await onRemoveFriend(friendId);
              } catch (error) {
                Alert.alert('Erreur', 'Une erreur est survenue');
              }
            }
          },
        },
      ]
    );
  };

  const renderFriendRequest = (request: FriendRequest) => (
    <UserCard
      user={request}
      subtitle="Demande d'ami"
      actions={{
        primary: {
          title: 'Accepter',
          onPress: () => handleRespondToRequest(request.id, 'accept'),
          loading: isResponding,
          disabled: isResponding,
        },
        secondary: {
          title: 'Refuser',
          onPress: () => handleRespondToRequest(request.id, 'decline'),
          loading: isResponding,
          disabled: isResponding,
        },
      }}
    />
  );

  const renderFriend = (friend: Friend) => {
    const displayName = `${friend.firstname || ''} ${friend.lastname || ''}`.trim() || friend.email;
    
    return (
      <UserCard
        user={friend}
        actions={{
          secondary: {
            title: 'Supprimer',
            onPress: () => handleRemoveFriend(friend.id, displayName),
          },
        }}
        showChevron
      />
    );
  };

  const sections = [
    ...(friendRequests.length > 0 ? [{
      title: 'Demandes d\'amis',
      data: friendRequests,
      renderItem: renderFriendRequest,
    }] : []),
    {
      title: 'Mes amis',
      data: friends,
      renderItem: renderFriend,
    },
  ];

  return (
    <SectionList
      sections={sections}
      refreshing={refreshing}
      onRefresh={onRefresh}
      emptyState={{
        title: 'Aucun ami trouvé',
        subtitle: 'Commencez par ajouter des amis !',
        icon: 'people-outline',
        actionTitle: 'Ajouter un ami',
        onAction: onAddFriend,
      }}
    />
  );
};
