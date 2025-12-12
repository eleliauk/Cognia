import { z } from 'zod';

// 项目经验验证
export const projectExperienceSchema = z.object({
  title: z.string().min(2, '项目标题至少2个字符').max(100, '项目标题最多100个字符'),
  description: z.string().min(10, '项目描述至少10个字符').max(1000, '项目描述最多1000个字符'),
  role: z.string().min(2, '角色至少2个字符').max(50, '角色最多50个字符'),
  duration: z.string().min(1, '时长不能为空').max(50, '时长最多50个字符'),
  achievements: z.string().max(500, '成果最多500个字符').optional(),
});

// 创建学生档案验证
export const createStudentProfileSchema = z.object({
  studentNumber: z.string().min(5, '学号至少5个字符').max(20, '学号最多20个字符'),
  major: z.string().min(2, '专业名称至少2个字符').max(100, '专业名称最多100个字符'),
  grade: z.number().int().min(1, '年级至少为1').max(6, '年级最多为6'),
  gpa: z.number().min(0, 'GPA不能小于0').max(5, 'GPA不能大于5'),
  skills: z
    .array(z.string().min(1, '技能不能为空'))
    .min(1, '至少需要一个技能')
    .max(30, '最多30个技能'),
  researchInterests: z
    .array(z.string().min(1, '研究兴趣不能为空'))
    .min(1, '至少需要一个研究兴趣')
    .max(10, '最多10个研究兴趣'),
  academicBackground: z.string().max(1000, '学术背景最多1000个字符').optional(),
  selfIntroduction: z.string().max(1000, '自我介绍最多1000个字符').optional(),
});

// 更新学生档案验证
export const updateStudentProfileSchema = z.object({
  studentNumber: z.string().min(5, '学号至少5个字符').max(20, '学号最多20个字符').optional(),
  major: z.string().min(2, '专业名称至少2个字符').max(100, '专业名称最多100个字符').optional(),
  grade: z.number().int().min(1, '年级至少为1').max(6, '年级最多为6').optional(),
  gpa: z.number().min(0, 'GPA不能小于0').max(5, 'GPA不能大于5').optional(),
  skills: z
    .array(z.string().min(1, '技能不能为空'))
    .min(1, '至少需要一个技能')
    .max(30, '最多30个技能')
    .optional(),
  researchInterests: z
    .array(z.string().min(1, '研究兴趣不能为空'))
    .min(1, '至少需要一个研究兴趣')
    .max(10, '最多10个研究兴趣')
    .optional(),
  academicBackground: z.string().max(1000, '学术背景最多1000个字符').optional(),
  selfIntroduction: z.string().max(1000, '自我介绍最多1000个字符').optional(),
});

// 创建项目经验验证
export const createProjectExperienceSchema = projectExperienceSchema;

// 更新项目经验验证
export const updateProjectExperienceSchema = z.object({
  title: z.string().min(2, '项目标题至少2个字符').max(100, '项目标题最多100个字符').optional(),
  description: z
    .string()
    .min(10, '项目描述至少10个字符')
    .max(1000, '项目描述最多1000个字符')
    .optional(),
  role: z.string().min(2, '角色至少2个字符').max(50, '角色最多50个字符').optional(),
  duration: z.string().min(1, '时长不能为空').max(50, '时长最多50个字符').optional(),
  achievements: z.string().max(500, '成果最多500个字符').optional(),
});

export type CreateStudentProfileDTO = z.infer<typeof createStudentProfileSchema>;
export type UpdateStudentProfileDTO = z.infer<typeof updateStudentProfileSchema>;
export type CreateProjectExperienceDTO = z.infer<typeof createProjectExperienceSchema>;
export type UpdateProjectExperienceDTO = z.infer<typeof updateProjectExperienceSchema>;
