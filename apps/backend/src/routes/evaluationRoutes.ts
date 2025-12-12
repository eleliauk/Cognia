import { Router } from 'express';
import { evaluationController } from '../controllers/evaluationController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validationMiddleware';
import { createEvaluationSchema } from '../validators/evaluationValidators';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Create evaluation
router.post(
  '/',
  validateRequest(createEvaluationSchema),
  evaluationController.createEvaluation.bind(evaluationController)
);

// Get evaluation by ID
router.get('/:id', evaluationController.getEvaluationById.bind(evaluationController));

// Get evaluation by internship ID
router.get(
  '/internship/:internshipId',
  evaluationController.getEvaluationByInternship.bind(evaluationController)
);

export default router;
