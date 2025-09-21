import { SessionStatus, Sport } from '../../types/sport';

// Types pour les sessions
export interface Session {
  id: string;
  title?: string;
  description?: string;
  date: string;
  time: string; // Ancien champ pour compatibilité
  startTime?: string; // Nouveau champ
  endTime?: string; // Nouveau champ
  location: string;
  sport: Sport;
  maxParticipants?: number;
  pricePerPerson?: number;
  currentParticipants?: number;
  createdBy?: string;
  status: 'open' | 'full' | 'cancelled' | SessionStatus;
  organizer: {
    id: string;
    firstname?: string;
    lastname?: string;
    fullName?: string;
  };
  participants: {
    id: string;
    firstname?: string;
    lastname?: string;
    fullName?: string;
    status: SessionStatus;
  }[];
  comments: Comment[];
}

export interface CreateSessionData {
  title?: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  sport: Sport;
  maxParticipants?: number | null;
  pricePerPerson?: number | null;
  participantIds?: string[]; // ✅ IDs des participants à inviter
}

export type UpdateSessionData = Partial<CreateSessionData>;

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
} 