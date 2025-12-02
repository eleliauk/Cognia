import type { Response } from 'express';
import { adminService } from '../services/adminService.js';
import type { AuthRequest } from '../types/index.js';
import {
  userListQuerySchema,
  updateUserRoleSchema,
  setUserActiveStatusSchema,
  auditLogQuerySchema,
} from '../validators/adminValidators.js';

/**
 * Get client IP address from request
 */
function getClientIp(req: AuthRequest): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0]?.trim();
  }
  return req.socket?.remoteAddress;
}

/**
 * Get paginated user list
 * GET /api/admin/users
 */
export async function getUserList(req: AuthRequest, res: Response) {
  try {
    // Validate query parameters
    const validationResult = userListQuerySchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '查询参数验证失败',
          details: validationResult.error.flatten().fieldErrors,
        },
        timestamp: new Date().toISOString(),
      });
    }

    const params = validationResult.data;
    const result = await adminService.getUserList(params);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error getting user list:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: {
        code: error.code || 'INTERNAL_SERVER_ERROR',
        message: error.message || '获取用户列表失败',
      },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Get user by ID
 * GET /api/admin/users/:id
 */
export async function getUserById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '用户ID不能为空',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const user = await adminService.getUserById(id);

    res.json({
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error getting user by ID:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: {
        code: error.code || 'INTERNAL_SERVER_ERROR',
        message: error.message || '获取用户详情失败',
      },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Update user role
 * PUT /api/admin/users/:id/role
 */
export async function updateUserRole(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const adminId = req.user?.userId;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未授权访问',
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '用户ID不能为空',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Validate request body
    const validationResult = updateUserRoleSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '请求数据验证失败',
          details: validationResult.error.flatten().fieldErrors,
        },
        timestamp: new Date().toISOString(),
      });
    }

    const { role } = validationResult.data;
    const ipAddress = getClientIp(req);

    const updatedUser = await adminService.updateUserRole(id, role, adminId, ipAddress);

    res.json({
      success: true,
      data: updatedUser,
      message: '用户角色更新成功',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error updating user role:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: {
        code: error.code || 'INTERNAL_SERVER_ERROR',
        message: error.message || '更新用户角色失败',
      },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Enable or disable user
 * PUT /api/admin/users/:id/status
 */
export async function setUserActiveStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const adminId = req.user?.userId;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未授权访问',
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '用户ID不能为空',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Validate request body
    const validationResult = setUserActiveStatusSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '请求数据验证失败',
          details: validationResult.error.flatten().fieldErrors,
        },
        timestamp: new Date().toISOString(),
      });
    }

    const { isActive } = validationResult.data;
    const ipAddress = getClientIp(req);

    const updatedUser = await adminService.setUserActiveStatus(id, isActive, adminId, ipAddress);

    res.json({
      success: true,
      data: updatedUser,
      message: isActive ? '用户已启用' : '用户已禁用',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error setting user active status:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: {
        code: error.code || 'INTERNAL_SERVER_ERROR',
        message: error.message || '更新用户状态失败',
      },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Delete user (soft delete)
 * DELETE /api/admin/users/:id
 */
export async function deleteUser(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const adminId = req.user?.userId;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未授权访问',
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '用户ID不能为空',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const ipAddress = getClientIp(req);
    const deletedUser = await adminService.deleteUser(id, adminId, ipAddress);

    res.json({
      success: true,
      data: deletedUser,
      message: '用户已删除',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: {
        code: error.code || 'INTERNAL_SERVER_ERROR',
        message: error.message || '删除用户失败',
      },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Get audit logs
 * GET /api/admin/audit-logs
 */
export async function getAuditLogs(req: AuthRequest, res: Response) {
  try {
    // Validate query parameters
    const validationResult = auditLogQuerySchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '查询参数验证失败',
          details: validationResult.error.flatten().fieldErrors,
        },
        timestamp: new Date().toISOString(),
      });
    }

    const params = validationResult.data;
    const result = await adminService.getAuditLogs(params);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error getting audit logs:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: {
        code: error.code || 'INTERNAL_SERVER_ERROR',
        message: error.message || '获取审计日志失败',
      },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Get system monitoring data
 * GET /api/admin/monitoring
 */
export async function getSystemMonitoring(req: AuthRequest, res: Response) {
  try {
    const monitoringData = await adminService.getSystemMonitoring();

    res.json({
      success: true,
      data: monitoringData,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error getting system monitoring data:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: {
        code: error.code || 'INTERNAL_SERVER_ERROR',
        message: error.message || '获取系统监控数据失败',
      },
      timestamp: new Date().toISOString(),
    });
  }
}
