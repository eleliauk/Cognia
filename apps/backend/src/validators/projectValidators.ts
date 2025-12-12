import { z } from 'zod';

export const createProjectSchema = z.object({
  title: z.string().min(5, '项目标题至少5个字符').max(100, '项目标题最多100个字符'),
  description: z.string().min(20, '项目描述至少20个字符').max(2000, '项目描述最多2000个字符'),
  requirements: z.string().min(10, '项目要求至少10个字符'),
  requiredSkills: z.array(z.string()).min(1, '至少需要一个技能要求').max(20, '技能要求最多20个'),
  researchField: z.string().min(2, '研究领域不能为空'),
  duration: z.number().int('时长必须是整数').min(1, '时长至少1个月').max(24, '时长最多24个月'),
  positions: z.number().int('招收人数必须是整数').min(1, '至少招收1人').max(10, '最多招收10人'),
  startDate: z.string().datetime('开始日期格式不正确'),
});

export const updateProjectSchema = z.object({
  title: z.string().min(5, '项目标题至少5个字符').max(100, '项目标题最多100个字符').optional(),
  description: z
    .string()
    .min(20, '项目描述至少20个字符')
    .max(2000, '项目描述最多2000个字符')
    .optional(),
  requirements: z.string().min(10, '项目要求至少10个字符').optional(),
  requiredSkills: z
    .array(z.string())
    .min(1, '至少需要一个技能要求')
    .max(20, '技能要求最多20个')
    .optional(),
  researchField: z.string().min(2, '研究领域不能为空').optional(),
  duration: z
    .number()
    .int('时长必须是整数')
    .min(1, '时长至少1个月')
    .max(24, '时长最多24个月')
    .optional(),
  positions: z
    .number()
    .int('招收人数必须是整数')
    .min(1, '至少招收1人')
    .max(10, '最多招收10人')
    .optional(),
  startDate: z.string().datetime('开始日期格式不正确').optional(),
  status: z
    .enum(['DRAFT', 'ACTIVE', 'CLOSED', 'COMPLETED'], {
      errorMap: () => ({ message: '状态必须是DRAFT、ACTIVE、CLOSED或COMPLETED' }),
    })
    .optional(),
});

export const searchProjectsSchema = z.object({
  keyword: z.string().optional(),
  researchField: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'CLOSED', 'COMPLETED']).optional(),
  requiredSkills: z.array(z.string()).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export const updateProjectStatusSchema = z.object({
  status: z.enum(['DRAFT', 'ACTIVE', 'CLOSED', 'COMPLETED'], {
    errorMap: () => ({ message: '状态必须是DRAFT、ACTIVE、CLOSED或COMPLETED' }),
  }),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type SearchProjectsInput = z.infer<typeof searchProjectsSchema>;
export type UpdateProjectStatusInput = z.infer<typeof updateProjectStatusSchema>;
