import { z } from 'zod';

/**
 * 项目ID参数验证
 */
export const projectIdParamSchema = z.object({
  projectId: z.string().uuid({ message: '项目ID格式不正确' }),
});

export type ProjectIdParam = z.infer<typeof projectIdParamSchema>;

/**
 * 推荐查询参数验证
 */
export const recommendationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  forceRefresh: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

export type RecommendationsQuery = z.infer<typeof recommendationsQuerySchema>;

/**
 * 匹配计算请求体验证
 */
export const calculateMatchSchema = z.object({
  studentId: z.string().uuid({ message: '学生ID格式不正确' }),
  projectId: z.string().uuid({ message: '项目ID格式不正确' }),
});

export type CalculateMatchInput = z.infer<typeof calculateMatchSchema>;
