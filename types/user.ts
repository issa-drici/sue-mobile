export type UserStatus = "online" | "offline";

export interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  avatar?: string;
  token?: string;
}

export interface Friend {
  id: string;
  firstname?: string; // API renvoie en minuscules
  lastname?: string; // API renvoie en minuscules
  avatar: string | null;
  status: UserStatus;
  lastSeen?: string;
}

export interface FriendRequest {
  id: string;
  firstname: string;
  lastname: string;
  avatar: string;
  mutualFriends: number;
}

export interface UserStats {
  sessionsCreated: number;
  sessionsParticipated: number;
  favoriteSport: string;
}

export interface UserProfile extends User {
  stats: UserStats;
  isAlreadyFriend?: boolean;
  hasPendingRequest?: boolean;
  relationshipStatus?: 'none' | 'pending' | 'accepted' | 'declined' | 'cancelled';
}
