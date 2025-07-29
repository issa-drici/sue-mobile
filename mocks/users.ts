import { Friend, FriendRequest, User, UserProfile } from '../types/user';

export const mockUsers: User[] = [
  {
    id: '1',
    firstname: 'Jean',
    lastname: 'Dupont',
    email: 'jean.dupont@example.com',
    avatar: 'https://i.pravatar.cc/150?img=1',
  },
  {
    id: '2',
    firstname: 'Marie',
    lastname: 'Martin',
    email: 'marie.martin@example.com',
    avatar: 'https://i.pravatar.cc/150?img=2',
  },
  {
    id: '3',
    firstname: 'Pierre',
    lastname: 'Durand',
    email: 'pierre.durand@example.com',
    avatar: 'https://i.pravatar.cc/150?img=3',
  },
  {
    id: '4',
    firstname: 'Sophie',
    lastname: 'Leroy',
    email: 'sophie.leroy@example.com',
    avatar: 'https://i.pravatar.cc/150?img=4',
  },
  {
    id: '5',
    firstname: 'Lucas',
    lastname: 'Moreau',
    email: 'lucas.moreau@example.com',
    avatar: 'https://i.pravatar.cc/150?img=5',
  },
];

export const mockFriends: Friend[] = [
  {
    id: '1',
    firstname: 'Jean',
    lastname: 'Dupont',
    avatar: null,
    status: 'online',
  },
  {
    id: '2',
    firstname: 'Marie',
    lastname: 'Martin',
    avatar: null,
    status: 'offline',
    lastSeen: '2024-03-20T15:30:00Z',
  },
  {
    id: '3',
    firstname: 'Pierre',
    lastname: 'Durand',
    avatar: 'https://i.pravatar.cc/150?img=3',
    status: 'online',
  },
  {
    id: '4',
    firstname: 'Sophie',
    lastname: 'Leroy',
    avatar: 'https://i.pravatar.cc/150?img=4',
    status: 'offline',
    lastSeen: '2024-03-20T10:15:00Z',
  },
];

export const mockFriendRequests: FriendRequest[] = [
  {
    id: '5',
    firstname: 'Emma',
    lastname: 'Leroy',
    avatar: 'https://i.pravatar.cc/150?img=5',
    mutualFriends: 3,
  },
  {
    id: '6',
    firstname: 'Hugo',
    lastname: 'Moreau',
    avatar: 'https://i.pravatar.cc/150?img=6',
    mutualFriends: 7,
  },
  {
    id: '7',
    firstname: 'Léa',
    lastname: 'Petit',
    avatar: 'https://i.pravatar.cc/150?img=7',
    mutualFriends: 2,
  },
];

export const mockUserProfile: UserProfile = {
  id: '1',
  firstname: 'John',
  lastname: 'Doe',
  email: 'john.doe@example.com',
  avatar: 'https://i.pravatar.cc/150?img=1',
  stats: {
    sessionsCreated: 12,
    sessionsParticipated: 45,
    favoriteSport: 'Football',
  },
}; 