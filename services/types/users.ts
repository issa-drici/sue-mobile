// Types pour les utilisateurs
export interface UserProfile {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  avatar?: string;
  bio?: string;
  sports_preferences?: string[];
  createdAt: string;
}

export interface UpdateProfileData {
  firstname?: string;
  lastname?: string;
  avatar?: string;
  bio?: string;
  sports_preferences?: string[];
}

export interface Friend {
  id: string;
  firstname: string;
  lastname: string;
  avatar?: string;
  email?: string;
}

export interface FriendRequest {
  id: string;
  fromUser: Friend;
  toUser: Friend;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  mutualFriends?: number; // Ajouté pour l'affichage
}

export interface SearchUserResult {
  id: string;
  firstname: string;
  lastname: string;
  avatar?: string;
  email: string;
  isFriend: boolean;
  hasPendingRequest: boolean;
  mutualFriends?: number;
  relationshipStatus?: 'none' | 'pending' | 'accepted' | 'declined';
} 