export type Sport = 
  | 'tennis' 
  | 'golf' 
  | 'musculation' 
  | 'football' 
  | 'basketball'
  | 'volleyball'
  | 'badminton'
  | 'padel'
  | 'squash'
  | 'natation'
  | 'course'
  | 'cyclisme'
  | 'escalade'
  | 'yoga'
  | 'pilates'
  | 'boxe'
  | 'jiu-jitsu-brésilien'
  | 'danse'
  | 'handball'
  | 'rugby'
  | 'hockey'
  | 'baseball'
  | 'ping-pong'
  | 'bowling'
  | 'pétanque'
  | 'randonnée'
  | 'ski'
  | 'snowboard'
  | 'surf'
  | 'planche-à-voile'
  | 'kayak'
  | 'aviron'
  | 'équitation'
  | 'gymnastique'
  | 'athlétisme'
  | 'triathlon'
  | 'pêche'
  | 'aïkido'
  | 'judo'
  | 'karaté'
  | 'tir-à-l-arc'
  | 'skateboard'
  | 'stand-up-paddle'
  | 'bodyboard'
  | 'marche-nordique'
  | 'marche-sportive'
  | 'aquafitness'
  | 'sauvetage-sportif';

export type SessionStatus = 'pending' | 'accepted' | 'declined';

export type SessionStatusType = 'active' | 'cancelled' | 'completed';

// Type pour l'API (retourne fullName)
export interface ApiSportSession {
  id: string;
  sport: Sport;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  maxParticipants?: number | null;
  pricePerPerson?: number | null;
  status?: SessionStatusType;
  shareToken?: string | null;
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
  startTime: string;
  endTime: string;
  location: string;
  maxParticipants?: number | null;
  pricePerPerson?: number | null;
  status?: SessionStatusType;
  shareToken?: string | null;
  organizer: {
    id: string;
    firstname: string;
    lastname: string;
    avatar?: string | null;
  };
  participants: {
    id: string;
    firstname: string;
    lastname: string;
    status: SessionStatus;
    avatar?: string | null;
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