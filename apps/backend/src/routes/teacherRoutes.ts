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

export default router;
