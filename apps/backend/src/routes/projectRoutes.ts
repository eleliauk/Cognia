import { Router } from 'express';
import { prisma } from '../config/database';
import { ProjectController } from '../controllers/projectController';
import { ProjectService } from '../services/projectService';
import { validateRequest } from '../middleware/validationMiddleware';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  createProjectSchema,
  updateProjectSchema,
  searchProjectsSchema,
  updateProjectStatusSchema,
} from '../validators/projectValidators';

const router = Router();
const projectService = new ProjectService(prisma);
const projectController = new ProjectController(projectService);

// 所有路由都需要认证
router.use(authMiddleware);

// 公共路由（所有认证用户可访问）
router.get('/', validateRequest(searchProjectsSchema, 'query'), projectController.searchProjects);
router.get('/active', projectController.getAllActiveProjects);
router.get('/:id', projectController.getProjectById);
router.get('/:id/applications', projectController.getProjectApplications);

// 教师专用路由
router.get('/teacher/my-projects', projectController.getMyProjects);
router.get('/teacher/:teacherId', projectController.getTeacherProjects);
router.post('/', validateRequest(createProjectSchema), projectController.createProject);
router.put('/:id', validateRequest(updateProjectSchema), projectController.updateProject);
router.delete('/:id', projectController.deleteProject);
router.patch(
  '/:id/status',
  validateRequest(updateProjectStatusSchema),
  projectController.updateProjectStatus
);

export default router;
