import type { Response, NextFunction } from 'express';
import { ProjectService } from '../services/projectService';
import type {
  CreateProjectInput,
  UpdateProjectInput,
  SearchProjectsInput,
} from '../validators/projectValidators';
import type { AuthRequest } from '../types';

export class ProjectController {
  constructor(private projectService: ProjectService) {}

  /**
   * 创建项目
   */
  createProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const teacherId = req.user!.userId;
      const data: CreateProjectInput = req.body;

      const project = await this.projectService.createProject(teacherId, data);

      res.status(201).json({
        success: true,
        message: '项目创建成功',
        data: project,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 更新项目
   */
  updateProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '项目ID不能为空',
          },
        });
      }

      const teacherId = req.user!.userId;
      const data: UpdateProjectInput = req.body;

      const project = await this.projectService.updateProject(id, teacherId, data);

      res.json({
        success: true,
        message: '项目更新成功',
        data: project,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 删除项目
   */
  deleteProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '项目ID不能为空',
          },
        });
      }

      const teacherId = req.user!.userId;

      await this.projectService.deleteProject(id, teacherId);

      res.json({
        success: true,
        message: '项目删除成功',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 获取项目详情
   */
  getProjectById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '项目ID不能为空',
          },
        });
      }

      const project = await this.projectService.getProjectById(id);

      if (!project) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: '项目不存在',
          },
        });
      }

      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 获取教师的项目列表
   */
  getTeacherProjects = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { teacherId } = req.params;
      if (!teacherId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '教师ID不能为空',
          },
        });
      }

      // 如果不是管理员，只能查看自己的项目
      if (req.user!.role !== 'ADMIN' && req.user!.userId !== teacherId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: '无权限查看其他教师的项目',
          },
        });
      }

      const projects = await this.projectService.getProjectsByTeacher(teacherId);

      res.json({
        success: true,
        data: projects,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 获取当前教师的项目列表
   */
  getMyProjects = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const teacherId = req.user!.userId;

      const projects = await this.projectService.getProjectsByTeacher(teacherId);

      res.json({
        success: true,
        data: projects,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 获取所有活跃项目
   */
  getAllActiveProjects = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const projects = await this.projectService.getAllActiveProjects();

      res.json({
        success: true,
        data: projects,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 搜索项目
   */
  searchProjects = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const criteria: SearchProjectsInput = req.query;

      const result = await this.projectService.searchProjects(criteria);

      res.json({
        success: true,
        data: result.projects,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 更新项目状态
   */
  updateProjectStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '项目ID不能为空',
          },
        });
      }

      const teacherId = req.user!.userId;
      const { status } = req.body;

      const project = await this.projectService.updateProjectStatus(id, teacherId, status);

      res.json({
        success: true,
        message: '项目状态更新成功',
        data: project,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 获取项目的申请列表
   */
  getProjectApplications = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '项目ID不能为空',
          },
        });
      }

      const teacherId = req.user!.userId;

      const applications = await this.projectService.getProjectApplications(id, teacherId);

      res.json({
        success: true,
        data: applications,
      });
    } catch (error) {
      next(error);
    }
  };
}
