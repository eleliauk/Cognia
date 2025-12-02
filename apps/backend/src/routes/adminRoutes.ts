import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';
import { UserRole } from '../types/index.js';
import {
  getUserList,
  getUserById,
  updateUserRole,
  setUserActiveStatus,
  deleteUser,
  getAuditLogs,
  getSystemMonitoring,
} from '../controllers/adminController.js';

const router = Router();

// All admin routes require authentication and ADMIN role
router.use(authMiddleware);
router.use(requireRole(UserRole.ADMIN));

/**
 * @route   GET /api/admin/users
 * @desc    Get paginated user list with filtering and sorting
 * @access  Admin only
 * @query   page, pageSize, role, isActive, search, sortBy, sortOrder
 */
router.get('/users', getUserList);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get user by ID with detailed information
 * @access  Admin only
 */
router.get('/users/:id', getUserById);

/**
 * @route   PUT /api/admin/users/:id/role
 * @desc    Update user role
 * @access  Admin only
 * @body    { role: 'TEACHER' | 'STUDENT' | 'ADMIN' }
 */
router.put('/users/:id/role', updateUserRole);

/**
 * @route   PUT /api/admin/users/:id/status
 * @desc    Enable or disable user
 * @access  Admin only
 * @body    { isActive: boolean }
 */
router.put('/users/:id/status', setUserActiveStatus);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user (soft delete by disabling)
 * @access  Admin only
 */
router.delete('/users/:id', deleteUser);

/**
 * @route   GET /api/admin/audit-logs
 * @desc    Get audit logs with filtering and pagination
 * @access  Admin only
 * @query   page, pageSize, userId, action, resource, startDate, endDate
 */
router.get('/audit-logs', getAuditLogs);

/**
 * @route   GET /api/admin/monitoring
 * @desc    Get system monitoring data
 * @access  Admin only
 */
router.get('/monitoring', getSystemMonitoring);

export default router;
