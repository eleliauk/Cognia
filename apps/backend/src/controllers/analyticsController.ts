import type { Response } from 'express';
import { analyticsService, type TimeRange } from '../services/analyticsService.js';
import type { AuthRequest } from '../types/index.js';

/**
 * Parse time range from query parameters
 */
function parseTimeRange(query: any): TimeRange | undefined {
  const { startDate, endDate } = query;
  if (startDate && endDate) {
    return {
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string),
    };
  }
  return undefined;
}

/**
 * Get teacher dashboard statistics
 * GET /api/analytics/teacher/:id
 */
export async function getTeacherDashboard(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未授权访问',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Teachers can only view their own dashboard, admins can view any
    if (userRole !== 'ADMIN' && userId !== id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '无权限查看其他教师的统计数据',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Only teachers and admins can access teacher dashboard
    if (userRole !== 'TEACHER' && userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '只有教师或管理员可以访问教师统计看板',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const timeRange = parseTimeRange(req.query);
    const stats = await analyticsService.getTeacherDashboard(id || '', timeRange);

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error getting teacher dashboard:', error);
    res.status(500).json({
      success: false,
      error: {
        code: error.code || 'INTERNAL_SERVER_ERROR',
        message: error.message || '获取教师统计数据失败',
      },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Get admin dashboard statistics
 * GET /api/analytics/admin
 */
export async function getAdminDashboard(req: AuthRequest, res: Response) {
  try {
    const userRole = req.user?.role;

    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未授权访问',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Only admins can access admin dashboard
    if (userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '只有管理员可以访问管理员统计看板',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const timeRange = parseTimeRange(req.query);
    const stats = await analyticsService.getAdminDashboard(timeRange);

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error getting admin dashboard:', error);
    res.status(500).json({
      success: false,
      error: {
        code: error.code || 'INTERNAL_SERVER_ERROR',
        message: error.message || '获取管理员统计数据失败',
      },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Get matching metrics
 * GET /api/analytics/matching
 */
export async function getMatchingMetrics(req: AuthRequest, res: Response) {
  try {
    const userRole = req.user?.role;

    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未授权访问',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Only admins can access matching metrics
    if (userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '只有管理员可以访问匹配效果分析',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const timeRange = parseTimeRange(req.query);
    const metrics = await analyticsService.getMatchingMetrics(timeRange);

    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error getting matching metrics:', error);
    res.status(500).json({
      success: false,
      error: {
        code: error.code || 'INTERNAL_SERVER_ERROR',
        message: error.message || '获取匹配效果分析失败',
      },
      timestamp: new Date().toISOString(),
    });
  }
}
