import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../types';
import { notificationService } from '../services/notificationService';
import type { GetNotificationsQuery } from '../validators/notificationValidators';

/**
 * Get notifications for the authenticated user
 * GET /api/notifications
 */
export async function getNotifications(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const query = req.query as unknown as GetNotificationsQuery;

    const result = await notificationService.getNotificationsByUser(userId, {
      page: query.page,
      limit: query.limit,
      unreadOnly: query.unreadOnly,
    });

    res.json({
      success: true,
      data: {
        notifications: result.notifications,
        pagination: {
          page: query.page || 1,
          limit: query.limit || 20,
          total: result.total,
          totalPages: Math.ceil(result.total / (query.limit || 20)),
        },
        unreadCount: result.unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get unread notification count
 * GET /api/notifications/unread-count
 */
export async function getUnreadCount(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const count = await notificationService.getUnreadCount(userId);

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark a notification as read
 * PUT /api/notifications/:id/read
 */
export async function markAsRead(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const notification = await notificationService.markAsRead(id, userId);

    if (!notification) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOTIFICATION_NOT_FOUND',
          message: '通知不存在或无权访问',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark all notifications as read
 * PUT /api/notifications/read-all
 */
export async function markAllAsRead(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const count = await notificationService.markAllAsRead(userId);

    res.json({
      success: true,
      data: { markedCount: count },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a notification
 * DELETE /api/notifications/:id
 */
export async function deleteNotification(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const deleted = await notificationService.deleteNotification(id, userId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOTIFICATION_NOT_FOUND',
          message: '通知不存在或无权访问',
        },
      });
      return;
    }

    res.json({
      success: true,
      message: '通知已删除',
    });
  } catch (error) {
    next(error);
  }
}
