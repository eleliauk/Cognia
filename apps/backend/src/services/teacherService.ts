import { PrismaClient } from '@prisma/client';
import type { TeacherProfile } from '@prisma/client';
import type {
  CreateTeacherProfileDTO,
  UpdateTeacherProfileDTO,
} from '../validators/teacherValidators';

const prisma = new PrismaClient();

export class TeacherService {
  /**
   * 创建教师档案
   */
  async createProfile(userId: string, data: CreateTeacherProfileDTO): Promise<TeacherProfile> {
    // 检查用户是否存在且角色为教师
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    if (user.role !== 'TEACHER') {
      throw new Error('只有教师用户可以创建教师档案');
    }

    // 检查是否已存在档案
    const existingProfile = await prisma.teacherProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      throw new Error('教师档案已存在');
    }

    // 创建档案
    const profile = await prisma.teacherProfile.create({
      data: {
        userId,
        department: data.department,
        title: data.title,
        researchFields: data.researchFields,
        bio: data.bio,
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
      },
    });

    return profile;
  }

  /**
   * 获取教师档案
   */
  async getProfile(userId: string): Promise<TeacherProfile | null> {
    const profile = await prisma.teacherProfile.findUnique({
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
      },
    });

    return profile;
  }

  /**
   * 更新教师档案
   */
  async updateProfile(userId: string, data: UpdateTeacherProfileDTO): Promise<TeacherProfile> {
    // 检查档案是否存在
    const existingProfile = await prisma.teacherProfile.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      throw new Error('教师档案不存在');
    }

    // 更新档案
    const profile = await prisma.teacherProfile.update({
      where: { userId },
      data: {
        ...(data.department && { department: data.department }),
        ...(data.title && { title: data.title }),
        ...(data.researchFields && { researchFields: data.researchFields }),
        ...(data.bio !== undefined && { bio: data.bio }),
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
      },
    });

    return profile;
  }

  /**
   * 根据ID获取教师档案（公开信息）
   */
  async getProfileById(profileId: string): Promise<TeacherProfile | null> {
    const profile = await prisma.teacherProfile.findUnique({
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
      },
    });

    return profile;
  }

  /**
   * 获取所有教师档案列表
   */
  async getAllProfiles(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [profiles, total] = await Promise.all([
      prisma.teacherProfile.findMany({
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
        },
        orderBy: {
          user: {
            createdAt: 'desc',
          },
        },
      }),
      prisma.teacherProfile.count(),
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

export const teacherService = new TeacherService();
