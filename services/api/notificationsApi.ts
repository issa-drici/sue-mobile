import { Notification } from '../types/notifications';
import { baseApiService } from './baseApi';
import { NOTIFICATIONS_ENDPOINTS } from './endpoints';
import { LaravelResponse } from './types';

// Types pour la réponse du compteur de notifications non lues
interface UnreadCountResponse {
  unreadCount: number;
}

// Service API des notifications
export class NotificationsApi {
  // Récupérer toutes les notifications
  static async getAll(): Promise<Notification[]> {
    const response = await baseApiService.get<LaravelResponse<Notification[]>>(NOTIFICATIONS_ENDPOINTS.ALL);
    return response.data || [];
  }

  // Marquer une notification comme lue
  static async markAsRead(notificationId: string): Promise<Notification> {
    const response = await baseApiService.patch<LaravelResponse<Notification>>(
      NOTIFICATIONS_ENDPOINTS.MARK_AS_READ(notificationId), 
      {}
    );
    return response.data;
  }

  // Marquer toutes les notifications comme lues
  static async markAllAsRead(): Promise<void> {
    const response = await baseApiService.patch<LaravelResponse<void>>(NOTIFICATIONS_ENDPOINTS.MARK_ALL_AS_READ, {});
    return response.data;
  }

  // Récupérer le nombre de notifications non lues
  static async getUnreadCount(): Promise<number> {
    const response = await baseApiService.get<LaravelResponse<UnreadCountResponse>>(NOTIFICATIONS_ENDPOINTS.UNREAD_COUNT);
    return response.data.unreadCount;
  }
} 