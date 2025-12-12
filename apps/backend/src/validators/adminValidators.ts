import { z } from 'zod';
import { UserRole } from '@prisma/client';

/**
 * User list query parameters validation
 */
export const userListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['createdAt', 'name', 'email']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type UserListQuery = z.infer<typeof userListQuerySchema>;

/**
 * Update user role validation
 */
export const updateUserRoleSchema = z.object({
  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: '无效的用户角色' }),
  }),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

/**
 * Set user active status validation
 */
export const setUserActiveStatusSchema = z.object({
  isActive: z.boolean({
    required_error: '请指定用户状态',
    invalid_type_error: '用户状态必须是布尔值',
  }),
});

export type SetUserActiveStatusInput = z.infer<typeof setUserActiveStatusSchema>;

/**
 * Audit log query parameters validation
 */
export const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(50),
  userId: z.string().uuid().optional(),
  action: z.string().max(100).optional(),
  resource: z.string().max(100).optional(),
  startDate: z
    .string()
    .datetime()
    .transform((val) => new Date(val))
    .optional(),
  endDate: z
    .string()
    .datetime()
    .transform((val) => new Date(val))
    .optional(),
});

export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;

/**
 * User ID parameter validation
 */
export const userIdParamSchema = z.object({
  id: z.string().uuid({
    message: '无效的用户ID格式',
  }),
});

export type UserIdParam = z.infer<typeof userIdParamSchema>;
