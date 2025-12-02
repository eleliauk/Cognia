import { PrismaClient } from '@prisma/client';
import type { Application, ApplicationStatus } from '@prisma/client';
import type {
  CreateApplicationInput,
  UpdateApplicationStatusInput,
  QueryApplicationsInput,
} from '../validators/applicationValidators';
import { MatchingEngine } from './matchingEngine';
import { notificationService } from './notificationService';

export class ApplicationService {
  private matchingEngine: MatchingEngine;

  constructor(private prisma: PrismaClient) {
    this.matchingEngine = new MatchingEngine(prisma);
  }

  /**
   * 提交申请
   */
  async submitApplication(
    studentId: string,
    data: CreateApplicationInput,
    calculateMatch: boolean = true
  ): Promise<Application> {
    // 检查学生档案是否存在
    const studentProfile = await this.prisma.studentProfile.findUnique({
      where: { userId: studentId },
      include: {
        projectExperiences: true,
      },
    });

    if (!studentProfile) {
      throw new Error('请先完善学生档案后再申请');
    }

    // 检查项目是否存在且状态为活跃
    const project = await this.prisma.project.findUnique({
      where: { id: data.projectId },
    });

    if (!project) {
      throw new Error('项目不存在');
    }

    if (project.status !== 'ACTIVE') {
      throw new Error('该项目当前不接受申请');
    }

    // 检查是否已经申请过（防重复申请）
    const existingApplication = await this.checkDuplicateApplication(studentId, data.projectId);

    if (existingApplication) {
      throw new Error('您已经申请过该项目');
    }

    // 计算匹配度评分（如果需要）
    let matchScore: number | null = null;
    if (calculateMatch) {
      try {
        const matchResult = await this.matchingEngine.calculateMatchScore(studentProfile, project);
        matchScore = matchResult.overall;
      } catch (error) {
        console.error('Failed to calculate match score:', error);
        // 匹配度计算失败不影响申请提交
        matchScore = null;
      }
    }

    // 检查项目是否还有名额
    const acceptedCount = await this.prisma.application.count({
      where: {
        projectId: data.projectId,
        status: 'ACCEPTED',
      },
    });

    if (acceptedCount >= project.positions) {
      throw new Error('该项目名额已满');
    }

    // 创建申请记录
    const application = await this.prisma.application.create({
      data: {
        studentId,
        projectId: data.projectId,
        coverLetter: data.coverLetter,
        status: 'PENDING',
        matchScore,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            studentProfile: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
            description: true,
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // 发送通知给教师
    try {
      await notificationService.notifyApplicationSubmitted(
        application.project.teacher.id,
        application.student.name,
        application.project.title,
        application.id
      );
    } catch (error) {
      console.error('Failed to send notification:', error);
      // 通知发送失败不影响申请提交
    }

    return application;
  }

  /**
   * 检查重复申请
   */
  async checkDuplicateApplication(
    studentId: string,
    projectId: string
  ): Promise<Application | null> {
    const application = await this.prisma.application.findUnique({
      where: {
        studentId_projectId: {
          studentId,
          projectId,
        },
      },
    });

    return application;
  }

  /**
   * 更新申请状态
   */
  async updateApplicationStatus(
    applicationId: string,
    teacherId: string,
    data: UpdateApplicationStatusInput
  ): Promise<Application> {
    // 获取申请信息
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        project: true,
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!application) {
      throw new Error('申请不存在');
    }

    // 验证教师权限（只有项目所属教师可以更新申请状态）
    if (application.project.teacherId !== teacherId) {
      throw new Error('无权限修改此申请状态');
    }

    // 如果要接受申请，检查项目名额
    if (data.status === 'ACCEPTED') {
      const acceptedCount = await this.prisma.application.count({
        where: {
          projectId: application.projectId,
          status: 'ACCEPTED',
        },
      });

      if (acceptedCount >= application.project.positions) {
        throw new Error('项目名额已满，无法接受更多申请');
      }
    }

    // 更新申请状态
    const updatedApplication = await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        status: data.status,
        reviewedAt: new Date(),
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            studentProfile: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
            description: true,
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // 发送通知给学生
    if (data.status === 'ACCEPTED' || data.status === 'REJECTED') {
      try {
        await notificationService.notifyApplicationReviewed(
          updatedApplication.student.id,
          updatedApplication.project.title,
          data.status as 'ACCEPTED' | 'REJECTED',
          updatedApplication.id
        );
      } catch (error) {
        console.error('Failed to send notification:', error);
        // 通知发送失败不影响状态更新
      }
    }

    return updatedApplication;
  }

  /**
   * 获取申请详情
   */
  async getApplicationById(applicationId: string): Promise<Application | null> {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            studentProfile: true,
          },
        },
        project: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
                teacherProfile: true,
              },
            },
          },
        },
      },
    });

    return application;
  }

  /**
   * 获取学生的申请列表
   */
  async getApplicationsByStudent(
    studentId: string,
    query: QueryApplicationsInput
  ): Promise<{
    applications: Application[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { status, page, limit, sortBy, sortOrder } = query;

    const where: any = {
      studentId,
    };

    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        include: {
          project: {
            include: {
              teacher: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      this.prisma.application.count({ where }),
    ]);

    return {
      applications,
      total,
      page,
      limit,
    };
  }

  /**
   * 获取项目的申请列表（教师查看）
   */
  async getApplicationsByProject(
    projectId: string,
    teacherId: string,
    query: QueryApplicationsInput
  ): Promise<{
    applications: Application[];
    total: number;
    page: number;
    limit: number;
  }> {
    // 验证项目是否存在且属于该教师
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error('项目不存在');
    }

    if (project.teacherId !== teacherId) {
      throw new Error('无权限查看此项目的申请');
    }

    const { status, page, limit, sortBy, sortOrder } = query;

    const where: any = {
      projectId,
    };

    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              studentProfile: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      this.prisma.application.count({ where }),
    ]);

    return {
      applications,
      total,
      page,
      limit,
    };
  }

  /**
   * 撤回申请（学生）
   */
  async withdrawApplication(applicationId: string, studentId: string): Promise<Application> {
    // 获取申请信息
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new Error('申请不存在');
    }

    // 验证申请是否属于该学生
    if (application.studentId !== studentId) {
      throw new Error('无权限撤回此申请');
    }

    // 只有待审核和审核中的申请可以撤回
    if (application.status !== 'PENDING' && application.status !== 'REVIEWING') {
      throw new Error('当前状态的申请无法撤回');
    }

    // 更新申请状态为已撤回
    const updatedApplication = await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        status: 'WITHDRAWN',
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return updatedApplication;
  }

  /**
   * 获取所有申请列表（管理员）
   */
  async getAllApplications(query: QueryApplicationsInput): Promise<{
    applications: Application[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { status, projectId, studentId, page, limit, sortBy, sortOrder } = query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    if (studentId) {
      where.studentId = studentId;
    }

    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              studentProfile: {
                select: {
                  major: true,
                  grade: true,
                  gpa: true,
                },
              },
            },
          },
          project: {
            select: {
              id: true,
              title: true,
              researchField: true,
              teacher: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      this.prisma.application.count({ where }),
    ]);

    return {
      applications,
      total,
      page,
      limit,
    };
  }
}
