import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../types';
import { UnauthorizedError, ForbiddenError, UserRole } from '../types';
import { verifyAccessToken } from '../utils/jwt';

/**
 * Middleware to verify JWT token and attach user to request
 */
export function authMiddleware(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('缺少认证令牌');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const payload = verifyAccessToken(token);

    // Attach user to request
    req.user = {
      id: payload.userId,
      userId: payload.userId,
      email: payload.email,
      role: payload.role as UserRole,
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to check if user has required role(s)
 */
export function requireRole(...roles: UserRole[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('用户未认证');
      }

      if (!roles.includes(req.user.role)) {
        throw new ForbiddenError('权限不足，需要角色: ' + roles.join(', '));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to check if user has any of the required permissions
 */
export function requirePermission(...permissions: string[]) {
  // Permission matrix
  const rolePermissions: Record<UserRole, string[]> = {
    [UserRole.TEACHER]: [
      'project:create',
      'project:update',
      'project:delete',
      'application:view',
      'application:review',
      'internship:manage',
      'evaluation:create',
    ],
    [UserRole.STUDENT]: [
      'profile:update',
      'application:create',
      'application:view',
      'internship:view',
      'internship:update',
    ],
    [UserRole.ADMIN]: ['user:manage', 'system:monitor', 'data:export'],
  };

  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('用户未认证');
      }

      const userPermissions = rolePermissions[req.user.role] || [];
      const hasPermission = permissions.some((permission) => userPermissions.includes(permission));

      if (!hasPermission) {
        throw new ForbiddenError('权限不足，需要权限: ' + permissions.join(', '));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
