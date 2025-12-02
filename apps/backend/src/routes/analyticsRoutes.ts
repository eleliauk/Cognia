import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  getTeacherDashboard,
  getAdminDashboard,
  getMatchingMetrics,
} from '../controllers/analyticsController.js';

const router = Router();

// All analytics routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/analytics/teacher/:id
 * @desc    Get teacher dashboard statistics
 * @access  Private (Teacher - own data, Admin - any)
 * @query   startDate - Optional start date for time range filter (ISO string)
 * @query   endDate - Optional end date for time range filter (ISO string)
 */
router.get('/teacher/:id', getTeacherDashboard);

/**
 * @route   GET /api/analytics/admin
 * @desc    Get admin dashboard statistics
 * @access  Private (Admin only)
 * @query   startDate - Optional start date for time range filter (ISO string)
 * @query   endDate - Optional end date for time range filter (ISO string)
 */
router.get('/admin', getAdminDashboard);

/**
 * @route   GET /api/analytics/matching
 * @desc    Get matching metrics and analysis
 * @access  Private (Admin only)
 * @query   startDate - Optional start date for time range filter (ISO string)
 * @query   endDate - Optional end date for time range filter (ISO string)
 */
router.get('/matching', getMatchingMetrics);

export default router;
