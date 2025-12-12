import { Router } from 'express';
import {
  getStudentRecommendations,
  getProjectMatches,
  getCacheStats,
  clearCaches,
} from '../controllers/matchingController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateParams, validateQuery } from '../middleware/validationMiddleware.js';
import {
  projectIdParamSchema,
  recommendationsQuerySchema,
} from '../validators/matchingValidators.js';

const router = Router();

// All matching routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/matching/recommendations
 * @desc    Get recommended projects for the authenticated student
 * @access  Student only
 */
router.get(
  '/recommendations',
  validateQuery(recommendationsQuerySchema),
  getStudentRecommendations
);

/**
 * @route   GET /api/matching/projects/:projectId/students
 * @desc    Get matched students for a specific project
 * @access  Teacher only (project owner)
 */
router.get(
  '/projects/:projectId/students',
  validateParams(projectIdParamSchema),
  getProjectMatches
);

/**
 * @route   GET /api/matching/cache/stats
 * @desc    Get cache statistics
 * @access  Admin only
 */
router.get('/cache/stats', getCacheStats);

/**
 * @route   DELETE /api/matching/cache
 * @desc    Clear all matching caches
 * @access  Admin only
 */
router.delete('/cache', clearCaches);

export default router;
