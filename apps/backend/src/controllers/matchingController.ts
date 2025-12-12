import type { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { MatchingEngine } from '../services/matchingEngine.js';
import { matchingCache } from '../services/matchingCache.js';
import type { AuthRequest } from '../types/index.js';

const prisma = new PrismaClient();
const matchingEngine = new MatchingEngine(prisma);

/**
 * Get recommended projects for a student
 */
export async function getStudentRecommendations(req: AuthRequest, res: Response) {
  try {
    const studentId = req.user?.userId;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未授权访问',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Check if user is a student
    if (req.user?.role !== 'STUDENT') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '只有学生可以获取推荐项目',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const recommendations = await matchingEngine.matchStudentToProjects(studentId, limit);

    res.json({
      success: true,
      data: recommendations,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error getting student recommendations:', error);
    res.status(500).json({
      success: false,
      error: {
        code: error.code || 'INTERNAL_SERVER_ERROR',
        message: error.message || '获取推荐项目失败',
      },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Get matched students for a project (teacher view)
 */
export async function getProjectMatches(req: AuthRequest, res: Response) {
  try {
    const { projectId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const teacherId = req.user?.userId;

    if (!teacherId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未授权访问',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Check if user is a teacher
    if (req.user?.role !== 'TEACHER') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '只有教师可以查看项目匹配的学生',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Verify project belongs to teacher
    const project = await prisma.project.findUnique({
      where: { id: projectId || '' },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '项目不存在',
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (project.teacherId !== teacherId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '无权限查看此项目的匹配学生',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const matches = await matchingEngine.matchProjectToStudents(projectId || '', limit);

    res.json({
      success: true,
      data: matches,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error getting project matches:', error);
    res.status(500).json({
      success: false,
      error: {
        code: error.code || 'INTERNAL_SERVER_ERROR',
        message: error.message || '获取匹配学生失败',
      },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Get cache statistics (admin only)
 */
export async function getCacheStats(req: AuthRequest, res: Response) {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '只有管理员可以查看缓存统计',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const stats = await matchingCache.getCacheStats();

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '获取缓存统计失败',
      },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Clear all matching caches (admin only)
 */
export async function clearCaches(req: AuthRequest, res: Response) {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '只有管理员可以清除缓存',
        },
        timestamp: new Date().toISOString(),
      });
    }

    await matchingCache.clearAllCaches();

    res.json({
      success: true,
      data: { message: '缓存已清除' },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error clearing caches:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '清除缓存失败',
      },
      timestamp: new Date().toISOString(),
    });
  }
}
