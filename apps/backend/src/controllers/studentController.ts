import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../types';
import { studentService } from '../services/studentService';
import {
  createStudentProfileSchema,
  updateStudentProfileSchema,
  createProjectExperienceSchema,
  updateProjectExperienceSchema,
} from '../validators/studentValidators';

export class StudentController {
  /**
   * 创建学生档案
   * POST /api/students/profile
   */
  async createProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      // 验证请求数据
      const validatedData = createStudentProfileSchema.parse(req.body);

      const profile = await studentService.createProfile(userId, validatedData);

      res.status(201).json({
        success: true,
        data: profile,
        message: '学生档案创建成功',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取当前学生档案
   * GET /api/students/profile
   */
  async getMyProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      const profile = await studentService.getProfile(userId);

      if (!profile) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'PROFILE_NOT_FOUND',
            message: '学生档案不存在',
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
   * 更新学生档案
   * PUT /api/students/profile
   */
  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      // 验证请求数据
      const validatedData = updateStudentProfileSchema.parse(req.body);

      const profile = await studentService.updateProfile(userId, validatedData);

      res.json({
        success: true,
        data: profile,
        message: '学生档案更新成功',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 添加项目经验
   * POST /api/students/profile/experiences
   */
  async addProjectExperience(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      // 验证请求数据
      const validatedData = createProjectExperienceSchema.parse(req.body);

      const experience = await studentService.addProjectExperience(userId, validatedData);

      res.status(201).json({
        success: true,
        data: experience,
        message: '项目经验添加成功',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新项目经验
   * PUT /api/students/profile/experiences/:experienceId
   */
  async updateProjectExperience(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const experienceId = req.params.experienceId!;

      // 验证请求数据
      const validatedData = updateProjectExperienceSchema.parse(req.body);

      const experience = await studentService.updateProjectExperience(
        userId,
        experienceId,
        validatedData
      );

      res.json({
        success: true,
        data: experience,
        message: '项目经验更新成功',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 删除项目经验
   * DELETE /api/students/profile/experiences/:experienceId
   */
  async deleteProjectExperience(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const experienceId = req.params.experienceId!;

      await studentService.deleteProjectExperience(userId, experienceId);

      res.json({
        success: true,
        message: '项目经验删除成功',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 根据用户ID获取学生档案
   * GET /api/students/:userId/profile
   */
  async getProfileByUserId(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId!;

      const profile = await studentService.getProfile(userId);

      if (!profile) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'PROFILE_NOT_FOUND',
            message: '学生档案不存在',
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
   * 获取所有学生档案列表
   * GET /api/students
   */
  async getAllProfiles(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await studentService.getAllProfiles(page, limit);

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

export const studentController = new StudentController();
