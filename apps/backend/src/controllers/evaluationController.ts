import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../types';
import { evaluationService } from '../services/evaluationService';

export class EvaluationController {
  /**
   * Create evaluation for an internship
   * POST /api/evaluations
   */
  async createEvaluation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Only teachers can create evaluations
      if (userRole !== 'TEACHER' && userRole !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only teachers can create evaluations',
          },
        });
      }

      const {
        internshipId,
        overallScore,
        technicalSkills,
        communication,
        initiative,
        reliability,
        feedback,
        strengths,
        improvements,
      } = req.body;

      const evaluation = await evaluationService.createEvaluation({
        internshipId,
        teacherId: userId,
        overallScore,
        technicalSkills,
        communication,
        initiative,
        reliability,
        feedback,
        strengths,
        improvements,
      });

      res.status(201).json({
        success: true,
        data: evaluation,
        message: 'Evaluation created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get evaluation by internship ID
   * GET /api/evaluations/internship/:internshipId
   */
  async getEvaluationByInternship(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const internshipId = req.params.internshipId as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      const evaluation = await evaluationService.getEvaluationByInternship(internshipId);

      if (!evaluation) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Evaluation not found for this internship',
          },
        });
      }

      // Check authorization
      const isStudent = userRole === 'STUDENT' && evaluation.internship.studentId === userId;
      const isTeacher =
        userRole === 'TEACHER' && evaluation.internship.application.project.teacherId === userId;
      const isAdmin = userRole === 'ADMIN';

      if (!isStudent && !isTeacher && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to view this evaluation',
          },
        });
      }

      res.json({
        success: true,
        data: evaluation,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all evaluations for a student
   * GET /api/students/:studentId/evaluations
   */
  async getEvaluationsByStudent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const studentId = req.params.studentId as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Check authorization
      if (userRole === 'STUDENT' && studentId !== userId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only view your own evaluations',
          },
        });
      }

      const evaluations = await evaluationService.getEvaluationsByStudent(studentId);

      res.json({
        success: true,
        data: evaluations,
        count: evaluations.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all evaluations created by a teacher
   * GET /api/teachers/:teacherId/evaluations
   */
  async getEvaluationsByTeacher(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const teacherId = req.params.teacherId as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Check authorization
      if (userRole === 'TEACHER' && teacherId !== userId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only view your own evaluations',
          },
        });
      }

      const evaluations = await evaluationService.getEvaluationsByTeacher(teacherId);

      res.json({
        success: true,
        data: evaluations,
        count: evaluations.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get evaluation by ID
   * GET /api/evaluations/:id
   */
  async getEvaluationById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      const evaluation = await evaluationService.getEvaluationById(id);

      // Check authorization
      const isStudent = userRole === 'STUDENT' && evaluation.internship.studentId === userId;
      const isTeacher =
        userRole === 'TEACHER' && evaluation.internship.application.project.teacherId === userId;
      const isAdmin = userRole === 'ADMIN';

      if (!isStudent && !isTeacher && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to view this evaluation',
          },
        });
      }

      res.json({
        success: true,
        data: evaluation,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const evaluationController = new EvaluationController();
