import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateQuery, validateParams } from '../middleware/validationMiddleware';
import {
  getNotificationsQuerySchema,
  markAsReadParamsSchema,
} from '../validators/notificationValidators';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notificationController';

const router = Router();

// All notification routes require authentication
router.use(authMiddleware);

// GET /api/notifications - Get notifications for authenticated user
router.get('/', validateQuery(getNotificationsQuerySchema), getNotifications);

// GET /api/notifications/unread-count - Get unread notification count
router.get('/unread-count', getUnreadCount);

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', markAllAsRead);

// PUT /api/notifications/:id/read - Mark a notification as read
router.put('/:id/read', validateParams(markAsReadParamsSchema), markAsRead);

// DELETE /api/notifications/:id - Delete a notification
router.delete('/:id', validateParams(markAsReadParamsSchema), deleteNotification);

export default router;
