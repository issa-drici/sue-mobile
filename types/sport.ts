export type Sport = 'tennis' | 'golf' | 'musculation' | 'football' | 'basketball';

export type SessionStatus = 'pending' | 'accepted' | 'declined';

export type SessionStatusType = 'active' | 'cancelled' | 'completed';

// Type pour l'API (retourne fullName)
export interface ApiSportSession {
  id: string;
  sport: Sport;
  date: string;
  time: string;
  location: string;
  maxParticipants?: number | null;
  status?: SessionStatusType;
  organizer: {
    id: string;
    fullName: string;
  };
  participants: {
    id: string;
    fullName: string;
    status: SessionStatus;
  }[];
  comments: {
    id: string;
    userId: string;
    fullName: string;
    content: string;
    createdAt: string;
  }[];
}

// Type pour le frontend (utilise firstname/lastname)
export interface SportSession {
  id: string;
  sport: Sport;
  date: string;
  time: string;
  location: string;
  maxParticipants?: number | null;
  status?: SessionStatusType;
  organizer: {
    id: string;
    firstname: string;
    lastname: string;
  };
  participants: {
    id: string;
    firstname: string;
    lastname: string;
    status: SessionStatus;
  }[];
  comments: {
    id: string;
    userId: string;
    firstname: string;
    lastname: string;
    content: string;
    createdAt: string;
  }[];
} 