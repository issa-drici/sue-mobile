export type NotificationType = 'invitation' | 'reminder' | 'update';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  sessionId: string;
  createdAt: string;
  read: boolean;
} 