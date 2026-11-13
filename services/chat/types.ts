/** Chat d'une session : formats renvoyés par l'API (cf. backend SessionChatService) */

export interface ChatMessage {
  id: number;
  clientId: string;
  sessionId: string;
  senderId: string;
  senderFirstname: string | null;
  body: string;
  mentions: string[];
  createdAt: string;
}

/** Message affiché : confirmé par le serveur, ou encore en attente sur le téléphone */
export interface DisplayMessage extends Omit<ChatMessage, 'id'> {
  id: number | null; // null tant que le serveur ne l'a pas confirmé
  /**
   * sending : en cours d'envoi ; waiting : pas de réseau, partira tout seul à son retour ;
   * failed : refusé par le serveur, ou toujours pas parti au bout de 30 s alors que le réseau est là
   */
  status: 'sending' | 'waiting' | 'sent' | 'failed';
}

export interface ChatMember {
  id: string;
  firstname: string;
  lastname: string;
  avatarUrl: string | null;
  status: 'accepted' | 'pending' | 'declined';
  isOrganizer: boolean;
}

export interface ChatMeta {
  members: ChatMember[];
  muted: boolean;
  lastReadMessageId: number;
  unreadCount: number;
  /** Dernier message lu par membre (id utilisateur -> id message) */
  reads: Record<string, number>;
}

export interface ChatPage {
  messages: ChatMessage[];
  hasMore: boolean;
}
