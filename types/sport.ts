export type Sport = 'tennis' | 'golf' | 'musculation' | 'football' | 'basketball';

export type SessionStatus = 'pending' | 'accepted' | 'declined';

export interface SportSession {
  id: string;
  sport: Sport;
  date: string;
  time: string;
  location: string;
  maxParticipants?: number | null; // ✅ Ajouter maxParticipants (peut être null)
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