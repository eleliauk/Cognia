import { Router } from 'express';
import multer from 'multer';
import { internshipController } from '../controllers/internshipController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validationMiddleware';
import {
  createInternshipSchema,
  updateProgressSchema,
  updateStatusSchema,
  createMilestoneSchema,
  updateMilestoneSchema,
} from '../validators/internshipValidators';

const router = Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// All routes require authentication
router.use(authMiddleware);

// ==================== Internship Management ====================

// Create internship
router.post(
  '/',
  validateRequest(createInternshipSchema),
  internshipController.createInternship.bind(internshipController)
);

// Get internship by ID
router.get('/:id', internshipController.getInternshipById.bind(internshipController));

// Update internship progress
router.put(
  '/:id/progress',
  validateRequest(updateProgressSchema),
  internshipController.updateProgress.bind(internshipController)
);

// Update internship status
router.put(
  '/:id/status',
  validateRequest(updateStatusSchema),
  internshipController.updateStatus.bind(internshipController)
);

// ==================== Milestone Management ====================

// Create milestone
router.post(
  '/:id/milestones',
  validateRequest(createMilestoneSchema),
  internshipController.createMilestone.bind(internshipController)
);

// Get milestones for internship
router.get('/:id/milestones', internshipController.getMilestones.bind(internshipController));

// Update milestone
router.put(
  '/:internshipId/milestones/:milestoneId',
  validateRequest(updateMilestoneSchema),
  internshipController.updateMilestone.bind(internshipController)
);

// Delete milestone
router.delete(
  '/:internshipId/milestones/:milestoneId',
  internshipController.deleteMilestone.bind(internshipController)
);

// Mark milestone as completed
router.put(
  '/:internshipId/milestones/:milestoneId/complete',
  internshipController.completeMilestone.bind(internshipController)
);

// ==================== Document Management ====================

// Upload document
router.post(
  '/:id/documents',
  upload.single('file'),
  internshipController.uploadDocument.bind(internshipController)
);

// Get documents for internship
router.get('/:id/documents', internshipController.getDocuments.bind(internshipController));

// Delete document
router.delete(
  '/:internshipId/documents/:documentId',
  internshipController.deleteDocument.bind(internshipController)
);

export default router;
