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
    avatar?: string | null;
    avatarUrl?: string | null;
  };
  participants: {
    id: string;
    firstname?: string;
    lastname?: string;
    fullName?: string;
    status: SessionStatus;
    avatar?: string | null;
    avatarUrl?: string | null;
  }[];
  comments: Comment[];
}

// Aperçu public d'une session renvoyé par l'endpoint /join/{token}
export interface SessionSharePreview {
  sport: Sport;
  sportName: string;
  date: string;
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string;
  location: string;
  maxParticipants?: number | null;
  participantsCount: number;
  organizer: {
    id?: string;
    fullName: string;
    avatarUrl?: string | null;
  };
  // Personne qui a partagé le lien (présent seulement si ?from valide et participant)
  inviter?: {
    fullName: string;
    avatarUrl?: string | null;
  };
  // Présents seulement si le viewer authentifié est déjà organisateur ou
  // participant accepté : permet à l'app de sauter l'écran d'aperçu et
  // d'ouvrir directement la session.
  sessionId?: string;
  viewerRelationship?: 'organizer' | 'participant';
  participants?: {
    id: string;
    fullName: string;
    status: string;
    avatarUrl: string | null;
  }[];
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