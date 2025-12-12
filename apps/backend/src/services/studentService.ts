import { PrismaClient } from '@prisma/client';
import type { StudentProfile, ProjectExperience } from '@prisma/client';
import type {
  CreateStudentProfileDTO,
  UpdateStudentProfileDTO,
  CreateProjectExperienceDTO,
  UpdateProjectExperienceDTO,
} from '../validators/studentValidators';
import { matchingCache } from './matchingCache.js';

const prisma = new PrismaClient();

export class StudentService {
  /**
   * 计算档案完整度
   * 基于各个字段的填写情况计算百分比
   */
  private calculateCompleteness(profile: any): number {
    let score = 0;
    const weights = {
      studentNumber: 10,
      major: 10,
      grade: 5,
      gpa: 5,
      skills: 20, // 技能很重要
      researchInterests: 20, // 研究兴趣很重要
      academicBackground: 15,
      selfIntroduction: 10,
      projectExperiences: 5, // 基础分
    };

    // 必填字段
    if (profile.studentNumber) score += weights.studentNumber;
    if (profile.major) score += weights.major;
    if (profile.grade) score += weights.grade;
    if (profile.gpa) score += weights.gpa;

    // 技能（至少3个为满分）
    if (profile.skills && profile.skills.length > 0) {
      score += Math.min(profile.skills.length / 3, 1) * weights.skills;
    }

    // 研究兴趣（至少2个为满分）
    if (profile.researchInterests && profile.researchInterests.length > 0) {
      score += Math.min(profile.researchInterests.length / 2, 1) * weights.researchInterests;
    }

    // 学术背景
    if (profile.academicBackground && profile.academicBackground.length > 50) {
      score += weights.academicBackground;
    }

    // 自我介绍
    if (profile.selfIntroduction && profile.selfIntroduction.length > 50) {
      score += weights.selfIntroduction;
    }

    // 项目经验（每个项目加分，最多3个）
    if (profile.projectExperiences) {
      const expCount = Array.isArray(profile.projectExperiences)
        ? profile.projectExperiences.length
        : 0;
      score += Math.min(expCount, 3) * weights.projectExperiences;
    }

    return Math.round(score);
  }

  /**
   * 创建学生档案
   */
  async createProfile(userId: string, data: CreateStudentProfileDTO): Promise<StudentProfile> {
    // 检查用户是否存在且角色为学生
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    if (user.role !== 'STUDENT') {
      throw new Error('只有学生用户可以创建学生档案');
    }

    // 检查是否已存在档案
    const existingProfile = await prisma.studentProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      throw new Error('学生档案已存在');
    }

    // 检查学号是否已被使用
    const existingStudentNumber = await prisma.studentProfile.findUnique({
      where: { studentNumber: data.studentNumber },
    });

    if (existingStudentNumber) {
      throw new Error('学号已被使用');
    }

    // 计算完整度
    const completeness = this.calculateCompleteness(data);

    // 创建档案
    const profile = await prisma.studentProfile.create({
      data: {
        userId,
        studentNumber: data.studentNumber,
        major: data.major,
        grade: data.grade,
        gpa: data.gpa,
        skills: data.skills,
        researchInterests: data.researchInterests,
        academicBackground: data.academicBackground,
        selfIntroduction: data.selfIntroduction,
        completeness,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        projectExperiences: true,
      },
    });

    return profile;
  }

  /**
   * 获取学生档案
   */
  async getProfile(userId: string): Promise<StudentProfile | null> {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            role: true,
          },
        },
        projectExperiences: {
          orderBy: {
            id: 'desc',
          },
        },
      },
    });

    return profile;
  }

  /**
   * 更新学生档案
   */
  async updateProfile(userId: string, data: UpdateStudentProfileDTO): Promise<StudentProfile> {
    // 检查档案是否存在
    const existingProfile = await prisma.studentProfile.findUnique({
      where: { userId },
      include: {
        projectExperiences: true,
      },
    });

    if (!existingProfile) {
      throw new Error('学生档案不存在');
    }

    // 如果更新学号，检查是否已被使用
    if (data.studentNumber && data.studentNumber !== existingProfile.studentNumber) {
      const existingStudentNumber = await prisma.studentProfile.findUnique({
        where: { studentNumber: data.studentNumber },
      });

      if (existingStudentNumber) {
        throw new Error('学号已被使用');
      }
    }

    // 合并数据用于计算完整度
    const mergedData = {
      ...existingProfile,
      ...data,
    };

    // 重新计算完整度
    const completeness = this.calculateCompleteness(mergedData);

    // 更新档案
    const profile = await prisma.studentProfile.update({
      where: { userId },
      data: {
        ...(data.studentNumber && { studentNumber: data.studentNumber }),
        ...(data.major && { major: data.major }),
        ...(data.grade !== undefined && { grade: data.grade }),
        ...(data.gpa !== undefined && { gpa: data.gpa }),
        ...(data.skills && { skills: data.skills }),
        ...(data.researchInterests && { researchInterests: data.researchInterests }),
        ...(data.academicBackground !== undefined && {
          academicBackground: data.academicBackground,
        }),
        ...(data.selfIntroduction !== undefined && { selfIntroduction: data.selfIntroduction }),
        completeness,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            role: true,
          },
        },
        projectExperiences: {
          orderBy: {
            id: 'desc',
          },
        },
      },
    });

    // Invalidate matching cache when profile is updated
    await matchingCache.invalidateStudentCache(userId);

    return profile;
  }

  /**
   * 添加项目经验
   */
  async addProjectExperience(
    userId: string,
    data: CreateProjectExperienceDTO
  ): Promise<ProjectExperience> {
    // 检查档案是否存在
    const profile = await prisma.studentProfile.findUnique({
      where: { userId },
      include: {
        projectExperiences: true,
      },
    });

    if (!profile) {
      throw new Error('学生档案不存在');
    }

    // 创建项目经验
    const experience = await prisma.projectExperience.create({
      data: {
        profileId: profile.id,
        title: data.title,
        description: data.description,
        role: data.role,
        duration: data.duration,
        achievements: data.achievements,
      },
    });

    // 重新计算完整度
    const updatedProfile = await prisma.studentProfile.findUnique({
      where: { id: profile.id },
      include: {
        projectExperiences: true,
      },
    });

    if (updatedProfile) {
      const completeness = this.calculateCompleteness(updatedProfile);
      await prisma.studentProfile.update({
        where: { id: profile.id },
        data: { completeness },
      });
    }

    // Invalidate matching cache when project experience is added
    await matchingCache.invalidateStudentCache(userId);

    return experience;
  }

  /**
   * 更新项目经验
   */
  async updateProjectExperience(
    userId: string,
    experienceId: string,
    data: UpdateProjectExperienceDTO
  ): Promise<ProjectExperience> {
    // 检查档案是否存在
    const profile = await prisma.studentProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('学生档案不存在');
    }

    // 检查项目经验是否存在且属于该学生
    const experience = await prisma.projectExperience.findUnique({
      where: { id: experienceId },
    });

    if (!experience) {
      throw new Error('项目经验不存在');
    }

    if (experience.profileId !== profile.id) {
      throw new Error('无权限修改此项目经验');
    }

    // 更新项目经验
    const updatedExperience = await prisma.projectExperience.update({
      where: { id: experienceId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.role && { role: data.role }),
        ...(data.duration && { duration: data.duration }),
        ...(data.achievements !== undefined && { achievements: data.achievements }),
      },
    });

    // Invalidate matching cache when project experience is updated
    await matchingCache.invalidateStudentCache(userId);

    return updatedExperience;
  }

  /**
   * 删除项目经验
   */
  async deleteProjectExperience(userId: string, experienceId: string): Promise<void> {
    // 检查档案是否存在
    const profile = await prisma.studentProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('学生档案不存在');
    }

    // 检查项目经验是否存在且属于该学生
    const experience = await prisma.projectExperience.findUnique({
      where: { id: experienceId },
    });

    if (!experience) {
      throw new Error('项目经验不存在');
    }

    if (experience.profileId !== profile.id) {
      throw new Error('无权限删除此项目经验');
    }

    // 删除项目经验
    await prisma.projectExperience.delete({
      where: { id: experienceId },
    });

    // 重新计算完整度
    const updatedProfile = await prisma.studentProfile.findUnique({
      where: { id: profile.id },
      include: {
        projectExperiences: true,
      },
    });

    if (updatedProfile) {
      const completeness = this.calculateCompleteness(updatedProfile);
      await prisma.studentProfile.update({
        where: { id: profile.id },
        data: { completeness },
      });
    }

    // Invalidate matching cache when project experience is deleted
    await matchingCache.invalidateStudentCache(userId);
  }

  /**
   * 根据ID获取学生档案（公开信息）
   */
  async getProfileById(profileId: string): Promise<StudentProfile | null> {
    const profile = await prisma.studentProfile.findUnique({
      where: { id: profileId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        projectExperiences: {
          orderBy: {
            id: 'desc',
          },
        },
      },
    });

    return profile;
  }

  /**
   * 获取所有学生档案列表
   */
  async getAllProfiles(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [profiles, total] = await Promise.all([
      prisma.studentProfile.findMany({
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
          projectExperiences: true,
        },
        orderBy: {
          completeness: 'desc',
        },
      }),
      prisma.studentProfile.count(),
    ]);

    return {
      profiles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const studentService = new StudentService();
