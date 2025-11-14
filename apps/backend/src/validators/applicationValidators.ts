import { z } from 'zod';
import { ApplicationStatus } from '@prisma/client';

/**
 * 创建申请的验证模式
 */
export const createApplicationSchema = z.object({
  projectId: z.string().uuid('项目ID格式不正确'),
  coverLetter: z.string().min(50, '申请信至少需要50个字符').max(2000, '申请信不能超过2000个字符'),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;

/**
 * 更新申请状态的验证模式
 */
export const updateApplicationStatusSchema = z.object({
  status: z.nativeEnum(ApplicationStatus, {
    errorMap: () => ({ message: '无效的申请状态' }),
  }),
  reviewNote: z.string().max(500, '审核备注不能超过500个字符').optional(),
});

export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;

/**
 * 查询申请列表的验证模式
 */
export const queryApplicationsSchema = z.object({
  status: z.nativeEnum(ApplicationStatus).optional(),
  projectId: z.string().uuid().optional(),
  studentId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['appliedAt', 'matchScore', 'status']).default('appliedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type QueryApplicationsInput = z.infer<typeof queryApplicationsSchema>;
