import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApplicationController } from '../controllers/applicationController';
import { ApplicationService } from '../services/applicationService';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validationMiddleware';
import {
  createApplicationSchema,
  updateApplicationStatusSchema,
  queryApplicationsSchema,
} from '../validators/applicationValidators';

const router = Router();
const prisma = new PrismaClient();
const applicationService = new ApplicationService(prisma);
const applicationController = new ApplicationController(applicationService);

// 所有路由都需要认证
router.use(authMiddleware);

/**
 * 学生相关路由
 */

// 提交申请（学生）
router.post('/', validateRequest(createApplicationSchema), applicationController.submitApplication);

// 获取我的申请列表（学生）
router.get('/student/my', applicationController.getMyApplications);

// 撤回申请（学生）
router.delete('/:id', applicationController.withdrawApplication);

/**
 * 教师相关路由
 */

// 获取项目的申请列表（教师）
router.get('/project/:projectId', applicationController.getProjectApplications);

// 更新申请状态（教师）
router.put(
  '/:id/status',
  validateRequest(updateApplicationStatusSchema),
  applicationController.updateApplicationStatus
);

/**
 * 通用路由
 */

// 获取申请详情
router.get('/:id', applicationController.getApplicationById);

// 获取所有申请列表（管理员）
router.get('/', applicationController.getAllApplications);

export default router;
