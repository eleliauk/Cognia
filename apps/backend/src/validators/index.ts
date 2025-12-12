/**
 * 验证器模块索引
 * 导出所有 Zod 验证模式和类型
 */

// 认证相关验证
export * from './authValidators';

// 管理员相关验证
export * from './adminValidators';

// 分析相关验证
export * from './analyticsValidators';

// 申请相关验证
export * from './applicationValidators';

// 评价相关验证
export * from './evaluationValidators';

// 实习相关验证
export * from './internshipValidators';

// 匹配相关验证
export * from './matchingValidators';

// 通知相关验证
export * from './notificationValidators';

// 项目相关验证
export * from './projectValidators';

// 学生相关验证
export * from './studentValidators';

// 教师相关验证
export * from './teacherValidators';

// 通用验证模式
import { z } from 'zod';

/**
 * UUID 参数验证
 */
export const uuidParamSchema = z.object({
  id: z.string().uuid({ message: 'ID格式不正确' }),
});

export type UuidParam = z.infer<typeof uuidParamSchema>;

/**
 * 分页查询参数验证
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/**
 * 排序查询参数验证
 */
export const sortQuerySchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type SortQuery = z.infer<typeof sortQuerySchema>;

/**
 * 日期范围查询参数验证
 */
export const dateRangeQuerySchema = z
  .object({
    startDate: z.string().datetime({ message: '开始日期格式不正确' }).optional(),
    endDate: z.string().datetime({ message: '结束日期格式不正确' }).optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    { message: '开始日期必须早于或等于结束日期' }
  );

export type DateRangeQuery = z.infer<typeof dateRangeQuerySchema>;
