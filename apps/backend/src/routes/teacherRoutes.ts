import { Router } from 'express';
import { teacherController } from '../controllers/teacherController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validationMiddleware';
import {
  createTeacherProfileSchema,
  updateTeacherProfileSchema,
} from '../validators/teacherValidators';

const router = Router();

// 所有路由都需要认证
router.use(authMiddleware);

// 创建教师档案
router.post(
  '/profile',
  validateRequest(createTeacherProfileSchema),
  teacherController.createProfile.bind(teacherController)
);

// 获取当前教师档案
router.get('/profile', teacherController.getMyProfile.bind(teacherController));

// 更新教师档案
router.put(
  '/profile',
  validateRequest(updateTeacherProfileSchema),
  teacherController.updateProfile.bind(teacherController)
);

// 获取所有教师档案列表
router.get('/', teacherController.getAllProfiles.bind(teacherController));

// 根据用户ID获取教师档案
router.get('/:userId/profile', teacherController.getProfileByUserId.bind(teacherController));

// 获取教师的实习列表
router.get('/:teacherId/internships', async (req, res, next) => {
  const { internshipController } = await import('../controllers/internshipController');
  return internshipController.getInternshipsByTeacher(req, res, next);
});

// 获取教师创建的所有评价
router.get('/:teacherId/evaluations', async (req, res, next) => {
  const { evaluationController } = await import('../controllers/evaluationController');
  return evaluationController.getEvaluationsByTeacher(req, res, next);
});

export default router;
