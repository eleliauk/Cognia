import { PrismaClient, UserRole } from '@prisma/client';
import { NotFoundError, ValidationError } from '../types/index.js';

const prisma = new PrismaClient();

/**
 * User list query parameters
 */
export interface UserListParams {
  page?: number;
  pageSize?: number;
  role?: UserRole;
  isActive?: boolean;
  search?: string;
  sortBy?: 'createdAt' | 'name' | 'email';
  sortOrder?: 'asc' | 'desc';
}

/**
 * User list response
 */
export interface UserListResponse {
  users: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    phone: string | null;
    avatar: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * System monitoring data
 */
export interface SystemMonitoringData {
  llmApiStats: {
    totalCalls: number;
    successRate: number;
    avgResponseTime: number;
    fallbackUsage: number;
  };
  databaseStats: {
    totalUsers: number;
    totalProjects: number;
    totalApplications: number;
    totalInternships: number;
    totalNotifications: number;
  };
  cacheStats: {
    totalCacheEntries: number;
    expiredEntries: number;
  };
  errorLogs: {
    id: string;
    userId: string;
    action: string;
    resource: string;
    details: any;
    createdAt: Date;
  }[];
  auditLogs: {
    id: string;
    userId: string;
    userName: string;
    action: string;
    resource: string;
    details: any;
    ipAddress: string | null;
    createdAt: Date;
  }[];
}

/**
 * Admin Service - Provides admin functionality
 */
export class AdminService {
  /**
   * Get paginated user list with filtering and sorting
   */
  async getUserList(params: UserListParams): Promise<UserListResponse> {
    const {
      page = 1,
      pageSize = 20,
      role,
      isActive,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    // Build where clause
    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.user.count({ where });

    // Get users with pagination
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      users,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Get user by ID with detailed information
   */
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        teacherProfile: true,
        studentProfile: {
          include: {
            projectExperiences: true,
          },
        },
        _count: {
          select: {
            projects: true,
            applications: true,
            notifications: true,
            auditLogs: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    return user;
  }

  /**
   * Update user role
   */
  async updateUserRole(userId: string, newRole: UserRole, adminId: string, ipAddress?: string) {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, name: true },
    });

    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    // Prevent changing own role
    if (userId === adminId) {
      throw new ValidationError('不能修改自己的角色');
    }

    const oldRole = user.role;

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    // Create audit log
    await this.createAuditLog({
      userId: adminId,
      action: 'UPDATE_USER_ROLE',
      resource: 'User',
      details: {
        targetUserId: userId,
        targetUserName: user.name,
        oldRole,
        newRole,
      },
      ipAddress,
    });

    return updatedUser;
  }

  /**
   * Enable or disable user
   */
  async setUserActiveStatus(
    userId: string,
    isActive: boolean,
    adminId: string,
    ipAddress?: string
  ) {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true, name: true, role: true },
    });

    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    // Prevent disabling own account
    if (userId === adminId) {
      throw new ValidationError('不能禁用自己的账户');
    }

    // Prevent disabling other admins (optional security measure)
    if (user.role === UserRole.ADMIN && !isActive) {
      throw new ValidationError('不能禁用其他管理员账户');
    }

    const oldStatus = user.isActive;

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    // Create audit log
    await this.createAuditLog({
      userId: adminId,
      action: isActive ? 'ENABLE_USER' : 'DISABLE_USER',
      resource: 'User',
      details: {
        targetUserId: userId,
        targetUserName: user.name,
        oldStatus,
        newStatus: isActive,
      },
      ipAddress,
    });

    return updatedUser;
  }

  /**
   * Create audit log entry
   */
  async createAuditLog(data: {
    userId: string;
    action: string;
    resource: string;
    details?: any;
    ipAddress?: string;
  }) {
    return prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resource: data.resource,
        details: data.details,
        ipAddress: data.ipAddress,
      },
    });
  }

  /**
   * Get audit logs with filtering and pagination
   */
  async getAuditLogs(params: {
    page?: number;
    pageSize?: number;
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { page = 1, pageSize = 50, userId, action, resource, startDate, endDate } = params;

    // Build where clause
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (resource) {
      where.resource = resource;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    // Get total count
    const total = await prisma.auditLog.count({ where });

    // Get audit logs with user info
    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      logs: logs.map((log) => ({
        id: log.id,
        userId: log.userId,
        userName: log.user.name,
        userEmail: log.user.email,
        userRole: log.user.role,
        action: log.action,
        resource: log.resource,
        details: log.details,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Get system monitoring data
   */
  async getSystemMonitoring(): Promise<SystemMonitoringData> {
    // Database statistics
    const [totalUsers, totalProjects, totalApplications, totalInternships, totalNotifications] =
      await Promise.all([
        prisma.user.count(),
        prisma.project.count(),
        prisma.application.count(),
        prisma.internship.count(),
        prisma.notification.count(),
      ]);

    // Cache statistics
    const now = new Date();
    const [totalCacheEntries, expiredEntries] = await Promise.all([
      prisma.matchCache.count(),
      prisma.matchCache.count({
        where: { expiresAt: { lt: now } },
      }),
    ]);

    // LLM API statistics (estimated from match scores)
    const applications = await prisma.application.findMany({
      where: { matchScore: { not: null } },
      select: { matchScore: true },
    });

    const totalCalls = applications.length;
    // Estimate: scores >= 30 are likely from successful LLM calls
    const successfulCalls = applications.filter((a) => (a.matchScore as number) >= 30).length;
    const successRate = totalCalls > 0 ? Math.round((successfulCalls / totalCalls) * 100) : 100;
    const fallbackUsage =
      totalCalls > 0 ? Math.round(((totalCalls - successfulCalls) / totalCalls) * 100) : 0;

    // Get recent audit logs (last 50)
    const recentAuditLogs = await prisma.auditLog.findMany({
      include: {
        user: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Get error-related audit logs
    const errorLogs = await prisma.auditLog.findMany({
      where: {
        OR: [{ action: { contains: 'ERROR' } }, { action: { contains: 'FAIL' } }],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      llmApiStats: {
        totalCalls,
        successRate,
        avgResponseTime: 1500, // Placeholder - would need actual metrics
        fallbackUsage,
      },
      databaseStats: {
        totalUsers,
        totalProjects,
        totalApplications,
        totalInternships,
        totalNotifications,
      },
      cacheStats: {
        totalCacheEntries,
        expiredEntries,
      },
      errorLogs: errorLogs.map((log) => ({
        id: log.id,
        userId: log.userId,
        action: log.action,
        resource: log.resource,
        details: log.details,
        createdAt: log.createdAt,
      })),
      auditLogs: recentAuditLogs.map((log) => ({
        id: log.id,
        userId: log.userId,
        userName: log.user.name,
        action: log.action,
        resource: log.resource,
        details: log.details,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt,
      })),
    };
  }

  /**
   * Delete user (soft delete by disabling)
   */
  async deleteUser(userId: string, adminId: string, ipAddress?: string) {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, role: true },
    });

    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    // Prevent deleting own account
    if (userId === adminId) {
      throw new ValidationError('不能删除自己的账户');
    }

    // Prevent deleting other admins
    if (user.role === UserRole.ADMIN) {
      throw new ValidationError('不能删除管理员账户');
    }

    // Soft delete by disabling the user
    const deletedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    // Create audit log
    await this.createAuditLog({
      userId: adminId,
      action: 'DELETE_USER',
      resource: 'User',
      details: {
        targetUserId: userId,
        targetUserName: user.name,
        targetUserRole: user.role,
      },
      ipAddress,
    });

    return deletedUser;
  }
}

// Export singleton instance
export const adminService = new AdminService();
