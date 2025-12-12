import { apiClient } from './apiClient';
import type { Notification } from '@/stores/notificationStore';

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

export interface NotificationListParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

class NotificationService {
  /**
   * Get notifications for the current user
   */
  async getNotifications(params: NotificationListParams = {}): Promise<NotificationListResponse> {
    const { page = 1, limit = 20, unreadOnly = false } = params;
    const response = await apiClient.get('/api/notifications', {
      params: { page, limit, unreadOnly },
    });
    const data = response.data.data;
    return {
      notifications: data.notifications,
      total: data.pagination.total,
      unreadCount: data.unreadCount,
    };
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get('/api/notifications/unread-count');
    return response.data.data.count;
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<Notification> {
    const response = await apiClient.put(`/api/notifications/${notificationId}/read`);
    return response.data.data;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ count: number }> {
    const response = await apiClient.put('/api/notifications/read-all');
    return response.data.data;
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await apiClient.delete(`/api/notifications/${notificationId}`);
  }
}

export const notificationService = new NotificationService();
export default notificationService;
