import { NotificationType, type Notification } from '@prisma/client';
import prisma from '../config/database';
import { socketService } from './socketService';
import logger from '../utils/logger';

export interface CreateNotificationDTO {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
}

export interface NotificationWithMeta extends Notification {
  // Additional metadata can be added here
}

class NotificationService {
  /**
   * Create a new notification and push to user if online
   */
  async createNotification(data: CreateNotificationDTO): Promise<Notification> {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        relatedId: data.relatedId,
        isRead: false,
      },
    });

    // Push notification to user if online
    this.pushNotificationToUser(notification);

    logger.info('Notification created', {
      notificationId: notification.id,
      userId: data.userId,
      type: data.type,
    });

    return notification;
  }

  /**
   * Push notification to user via WebSocket
   */
  private pushNotificationToUser(notification: Notification): void {
    if (socketService.isUserOnline(notification.userId)) {
      socketService.sendToUser(notification.userId, 'notification:new', notification);
      logger.debug('Notification pushed to user', {
        userId: notification.userId,
        notificationId: notification.id,
      });
    }
  }

  /**
   * Get notifications for a user with pagination
   */
  async getNotificationsByUser(
    userId: string,
    options: { page?: number; limit?: number; unreadOnly?: boolean } = {}
  ): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
    const { page = 1, limit = 20, unreadOnly = false } = options;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return { notifications, total, unreadCount };
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<Notification | null> {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      return null;
    }

    if (notification.isRead) {
      return notification;
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });

    // Notify client about the read status change
    socketService.sendToUser(userId, 'notification:read', { notificationId });

    return updated;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    // Notify client about the read all action
    socketService.sendToUser(userId, 'notification:read-all', {
      count: result.count,
    });

    logger.info('All notifications marked as read', {
      userId,
      count: result.count,
    });

    return result.count;
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      return false;
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return true;
  }

  // ============================================
  // Event-triggered notification methods
  // ============================================

  /**
   * Notify teacher when a student submits an application
   */
  async notifyApplicationSubmitted(
    teacherId: string,
    studentName: string,
    projectTitle: string,
    applicationId: string
  ): Promise<Notification> {
    return this.createNotification({
      userId: teacherId,
      type: NotificationType.APPLICATION_SUBMITTED,
      title: '新的实习申请',
      message: `学生 ${studentName} 申请了您的项目「${projectTitle}」`,
      relatedId: applicationId,
    });
  }

  /**
   * Notify student when their application status changes
   */
  async notifyApplicationReviewed(
    studentId: string,
    projectTitle: string,
    status: 'ACCEPTED' | 'REJECTED',
    applicationId: string
  ): Promise<Notification> {
    const statusText = status === 'ACCEPTED' ? '已通过' : '未通过';
    return this.createNotification({
      userId: studentId,
      type: NotificationType.APPLICATION_REVIEWED,
      title: '申请状态更新',
      message: `您申请的项目「${projectTitle}」${statusText}`,
      relatedId: applicationId,
    });
  }

  /**
   * Notify about internship progress update
   */
  async notifyProgressUpdated(
    userId: string,
    projectTitle: string,
    progress: number,
    internshipId: string
  ): Promise<Notification> {
    return this.createNotification({
      userId,
      type: NotificationType.PROGRESS_UPDATED,
      title: '实习进度更新',
      message: `项目「${projectTitle}」的实习进度已更新至 ${progress}%`,
      relatedId: internshipId,
    });
  }

  /**
   * Notify student when they receive an evaluation
   */
  async notifyEvaluationReceived(
    studentId: string,
    projectTitle: string,
    evaluationId: string
  ): Promise<Notification> {
    return this.createNotification({
      userId: studentId,
      type: NotificationType.EVALUATION_RECEIVED,
      title: '收到新评价',
      message: `您在项目「${projectTitle}」的实习已收到教师评价`,
      relatedId: evaluationId,
    });
  }

  /**
   * Send system announcement to multiple users
   */
  async sendSystemAnnouncement(
    userIds: string[],
    title: string,
    message: string
  ): Promise<Notification[]> {
    const notifications = await Promise.all(
      userIds.map((userId) =>
        this.createNotification({
          userId,
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
          title,
          message,
        })
      )
    );

    return notifications;
  }
}

export const notificationService = new NotificationService();
export default notificationService;
