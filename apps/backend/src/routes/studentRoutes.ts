import { Router } from 'express';
import { studentController } from '../controllers/studentController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validationMiddleware';
import {
  createStudentProfileSchema,
  updateStudentProfileSchema,
  createProjectExperienceSchema,
  updateProjectExperienceSchema,
} from '../validators/studentValidators';

const router = Router();

// 所有路由都需要认证
router.use(authMiddleware);

// 创建学生档案
router.post(
  '/profile',
  validateRequest(createStudentProfileSchema),
  studentController.createProfile.bind(studentController)
);

// 获取当前学生档案
router.get('/profile', studentController.getMyProfile.bind(studentController));

// 更新学生档案
router.put(
  '/profile',
  validateRequest(updateStudentProfileSchema),
  studentController.updateProfile.bind(studentController)
);

// 添加项目经验
router.post(
  '/profile/experiences',
  validateRequest(createProjectExperienceSchema),
  studentController.addProjectExperience.bind(studentController)
);

// 更新项目经验
router.put(
  '/profile/experiences/:experienceId',
  validateRequest(updateProjectExperienceSchema),
  studentController.updateProjectExperience.bind(studentController)
);

// 删除项目经验
router.delete(
  '/profile/experiences/:experienceId',
  studentController.deleteProjectExperience.bind(studentController)
);

// 获取所有学生档案列表
router.get('/', studentController.getAllProfiles.bind(studentController));

// 根据用户ID获取学生档案
router.get('/:userId/profile', studentController.getProfileByUserId.bind(studentController));

export default router;
