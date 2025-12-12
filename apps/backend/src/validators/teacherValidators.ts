import { z } from 'zod';

// 创建教师档案验证
export const createTeacherProfileSchema = z.object({
  department: z.string().min(2, '院系名称至少2个字符').max(100, '院系名称最多100个字符'),
  title: z.string().min(2, '职称至少2个字符').max(50, '职称最多50个字符'),
  researchFields: z
    .array(z.string().min(1, '研究领域不能为空'))
    .min(1, '至少需要一个研究领域')
    .max(10, '最多10个研究领域'),
  bio: z.string().max(1000, '个人简介最多1000个字符').optional(),
});

// 更新教师档案验证
export const updateTeacherProfileSchema = z.object({
  department: z.string().min(2, '院系名称至少2个字符').max(100, '院系名称最多100个字符').optional(),
  title: z.string().min(2, '职称至少2个字符').max(50, '职称最多50个字符').optional(),
  researchFields: z
    .array(z.string().min(1, '研究领域不能为空'))
    .min(1, '至少需要一个研究领域')
    .max(10, '最多10个研究领域')
    .optional(),
  bio: z.string().max(1000, '个人简介最多1000个字符').optional(),
});

export type CreateTeacherProfileDTO = z.infer<typeof createTeacherProfileSchema>;
export type UpdateTeacherProfileDTO = z.infer<typeof updateTeacherProfileSchema>;
