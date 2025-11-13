import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../types';
import { teacherService } from '../services/teacherService';
import {
  createTeacherProfileSchema,
  updateTeacherProfileSchema,
} from '../validators/teacherValidators';

export class TeacherController {
  /**
   * 创建教师档案
   * POST /api/teachers/profile
   */
  async createProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      // 验证请求数据
      const validatedData = createTeacherProfileSchema.parse(req.body);

      const profile = await teacherService.createProfile(userId, validatedData);

      res.status(201).json({
        success: true,
        data: profile,
        message: '教师档案创建成功',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取当前教师档案
   * GET /api/teachers/profile
   */
  async getMyProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      const profile = await teacherService.getProfile(userId);

      if (!profile) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'PROFILE_NOT_FOUND',
            message: '教师档案不存在',
          },
        });
      }

      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新教师档案
   * PUT /api/teachers/profile
   */
  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      // 验证请求数据
      const validatedData = updateTeacherProfileSchema.parse(req.body);

      const profile = await teacherService.updateProfile(userId, validatedData);

      res.json({
        success: true,
        data: profile,
        message: '教师档案更新成功',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 根据用户ID获取教师档案
   * GET /api/teachers/:userId/profile
   */
  async getProfileByUserId(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId!;

      const profile = await teacherService.getProfile(userId);

      if (!profile) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'PROFILE_NOT_FOUND',
            message: '教师档案不存在',
          },
        });
      }

      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取所有教师档案列表
   * GET /api/teachers
   */
  async getAllProfiles(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await teacherService.getAllProfiles(page, limit);

      res.json({
        success: true,
        data: result.profiles,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const teacherController = new TeacherController();
