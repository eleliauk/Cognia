import type { Response, NextFunction } from 'express';
import { ApplicationService } from '../services/applicationService';
import {
  queryApplicationsSchema,
  type CreateApplicationInput,
  type UpdateApplicationStatusInput,
  type QueryApplicationsInput,
} from '../validators/applicationValidators';
import type { AuthRequest } from '../types';

export class ApplicationController {
  constructor(private applicationService: ApplicationService) {}

  /**
   * 提交申请
   * POST /api/applications
   */
  submitApplication = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const studentId = req.user!.userId;
      const data: CreateApplicationInput = req.body;

      // 默认计算匹配度，除非明确指定不计算
      const calculateMatch = req.body.calculateMatch !== false;

      const application = await this.applicationService.submitApplication(
        studentId,
        data,
        calculateMatch
      );

      res.status(201).json({
        success: true,
        message: '申请提交成功',
        data: application,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 更新申请状态（教师）
   * PUT /api/applications/:id/status
   */
  updateApplicationStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '申请ID不能为空',
          },
        });
      }

      const teacherId = req.user!.userId;
      const data: UpdateApplicationStatusInput = req.body;

      const application = await this.applicationService.updateApplicationStatus(
        id,
        teacherId,
        data
      );

      res.json({
        success: true,
        message: '申请状态更新成功',
        data: application,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 获取申请详情
   * GET /api/applications/:id
   */
  getApplicationById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '申请ID不能为空',
          },
        });
      }

      const application = await this.applicationService.getApplicationById(id);

      if (!application) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: '申请不存在',
          },
        });
      }

      // 权限检查：只有申请的学生、项目的教师或管理员可以查看
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const appWithProject = application as any;

      if (
        userRole !== 'ADMIN' &&
        application.studentId !== userId &&
        appWithProject.project?.teacherId !== userId
      ) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: '无权限查看此申请',
          },
        });
      }

      res.json({
        success: true,
        data: application,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 获取学生的申请列表
   * GET /api/applications/student/my
   */
  getMyApplications = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const studentId = req.user!.userId;
      const query = queryApplicationsSchema.parse(req.query);

      const result = await this.applicationService.getApplicationsByStudent(studentId, query);

      res.json({
        success: true,
        data: result.applications,
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
   * 获取项目的申请列表（教师）
   * GET /api/applications/project/:projectId
   */
  getProjectApplications = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { projectId } = req.params;
      if (!projectId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '项目ID不能为空',
          },
        });
      }

      const teacherId = req.user!.userId;
      const query = queryApplicationsSchema.parse(req.query);

      const result = await this.applicationService.getApplicationsByProject(
        projectId,
        teacherId,
        query
      );

      res.json({
        success: true,
        data: result.applications,
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
   * 撤回申请（学生）
   * DELETE /api/applications/:id
   */
  withdrawApplication = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '申请ID不能为空',
          },
        });
      }

      const studentId = req.user!.userId;

      const application = await this.applicationService.withdrawApplication(id, studentId);

      res.json({
        success: true,
        message: '申请已撤回',
        data: application,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 获取所有申请列表（管理员）
   * GET /api/applications
   */
  getAllApplications = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const query = queryApplicationsSchema.parse(req.query);

      const result = await this.applicationService.getAllApplications(query);

      res.json({
        success: true,
        data: result.applications,
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
}
