import { Notification } from '../types/notifications';
import { baseApiService } from './baseApi';
import { NOTIFICATIONS_ENDPOINTS } from './endpoints';
import { LaravelResponse } from './types';

// Types pour la réponse du compteur de notifications non lues
interface UnreadCountResponse {
  unreadCount: number;
}

// Types pour la réponse paginée
interface NotificationResponse {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  session_id: string;
  created_at: string;
  read: boolean;
  push_sent: boolean;
  push_sent_at: string | null;
  push_data: any;
}

interface PaginatedResponse {
  data: NotificationResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Service API des notifications
export class NotificationsApi {
  // Récupérer toutes les notifications avec pagination
  static async getAll(page: number = 1, limit: number = 20): Promise<{ data: Notification[], pagination: any }> {
    const url = `${NOTIFICATIONS_ENDPOINTS.ALL}?page=${page}&limit=${limit}`;
    console.log('🔍 [NotificationsApi] Appel getAll avec URL:', url);
    
    const response = await baseApiService.get<PaginatedResponse>(url);
    
    console.log('🔍 [NotificationsApi] Réponse brute reçue:', response);
    console.log('🔍 [NotificationsApi] response.data type:', typeof response.data);
    console.log('🔍 [NotificationsApi] response.data keys:', Object.keys(response.data || {}));
    
    // Extraire les données et la pagination de la réponse
    // response.data est un objet avec des clés numériques, on doit le convertir en tableau
    const rawNotifications = Array.isArray(response.data) ? response.data : Object.values(response.data as any);
    
    // La pagination est dans response.pagination (pas dans response.data.pagination)
    const apiPagination = (response as any)?.pagination || {};
    
    console.log('🔍 [NotificationsApi] Données brutes reçues (rawNotifications):', rawNotifications.slice(0, 2));
    console.log('🔍 [NotificationsApi] Pagination API reçue:', apiPagination);
    
    const notifications: Notification[] = (rawNotifications || []).map((notification: any) => ({
      id: notification.id,
      type: notification.type as any, // Cast pour compatibilité avec les nouveaux types
      title: notification.title,
      message: notification.message,
      sessionId: notification.session_id || '',
      createdAt: notification.created_at,
      read: notification.read,
      isRead: notification.read, // Propriété requise par le type Notification
      data: notification.push_data || {},
    }));
    
    console.log('✅ [NotificationsApi] Notifications converties:', notifications.slice(0, 2));
    console.log('📊 [NotificationsApi] Structure de retour:', {
      dataLength: notifications.length,
      pagination: apiPagination
    });
    
    return {
      data: notifications,
      pagination: apiPagination
    };
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

  // Supprimer une notification
  static async delete(notificationId: string): Promise<void> {
    const response = await baseApiService.delete<LaravelResponse<void>>(
      NOTIFICATIONS_ENDPOINTS.DELETE(notificationId)
    );
    return response.data;
  }

  // Enregistrer un token push
  static async registerPushToken(tokenData: any): Promise<void> {
    const response = await baseApiService.post<LaravelResponse<void>>(
      NOTIFICATIONS_ENDPOINTS.PUSH_TOKENS, 
      tokenData
    );
    return response.data;
  }

  // Supprimer un token push
  static async deletePushToken(token: string): Promise<void> {
    const response = await baseApiService.delete<LaravelResponse<void>>(
      `${NOTIFICATIONS_ENDPOINTS.PUSH_TOKENS}/${token}`
    );
    return response.data;
  }

  // Récupérer le nombre de notifications non lues
  static async getUnreadCount(): Promise<number> {
    console.log('🔍 [NotificationsApi] Appel getUnreadCount');
    const response = await baseApiService.get<LaravelResponse<UnreadCountResponse>>(NOTIFICATIONS_ENDPOINTS.UNREAD_COUNT);
    console.log('🔍 [NotificationsApi] Réponse getUnreadCount brute:', response);
    console.log('🔍 [NotificationsApi] response.data:', response.data);
    const count = response.data.unreadCount;
    console.log('✅ [NotificationsApi] Count extrait:', count);
    return count;
  }
} 