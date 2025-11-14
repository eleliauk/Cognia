import { PrismaClient } from '@prisma/client';
import type { Project, ProjectStatus } from '@prisma/client';
import type {
  CreateProjectInput,
  UpdateProjectInput,
  SearchProjectsInput,
} from '../validators/projectValidators';

export class ProjectService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 创建新项目
   */
  async createProject(teacherId: string, data: CreateProjectInput): Promise<Project> {
    const project = await this.prisma.project.create({
      data: {
        ...data,
        teacherId,
        startDate: new Date(data.startDate),
      },
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
    });

    return project;
  }

  /**
   * 更新项目
   */
  async updateProject(
    projectId: string,
    teacherId: string,
    data: UpdateProjectInput
  ): Promise<Project> {
    // 验证项目是否存在且属于该教师
    const existingProject = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!existingProject) {
      throw new Error('项目不存在');
    }

    if (existingProject.teacherId !== teacherId) {
      throw new Error('无权限修改此项目');
    }

    const updateData: any = { ...data };
    if (data.startDate) {
      updateData.startDate = new Date(data.startDate);
    }

    const project = await this.prisma.project.update({
      where: { id: projectId },
      data: updateData,
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
    });

    return project;
  }

  /**
   * 删除项目
   */
  async deleteProject(projectId: string, teacherId: string): Promise<void> {
    // 验证项目是否存在且属于该教师
    const existingProject = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        applications: true,
      },
    });

    if (!existingProject) {
      throw new Error('项目不存在');
    }

    if (existingProject.teacherId !== teacherId) {
      throw new Error('无权限删除此项目');
    }

    // 检查是否有已接受的申请
    const hasAcceptedApplications = existingProject.applications.some(
      (app) => app.status === 'ACCEPTED'
    );

    if (hasAcceptedApplications) {
      throw new Error('项目有已接受的申请，无法删除');
    }

    await this.prisma.project.delete({
      where: { id: projectId },
    });
  }

  /**
   * 获取项目详情
   */
  async getProjectById(projectId: string): Promise<Project | null> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            teacherProfile: true,
          },
        },
        applications: {
          select: {
            id: true,
            status: true,
            appliedAt: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    return project;
  }

  /**
   * 获取教师的所有项目
   */
  async getProjectsByTeacher(teacherId: string): Promise<Project[]> {
    const projects = await this.prisma.project.findMany({
      where: { teacherId },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return projects;
  }

  /**
   * 获取所有活跃项目
   */
  async getAllActiveProjects(): Promise<Project[]> {
    const projects = await this.prisma.project.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            teacherProfile: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return projects;
  }

  /**
   * 搜索和过滤项目
   */
  async searchProjects(criteria: SearchProjectsInput): Promise<{
    projects: Project[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { keyword, researchField, status, requiredSkills, page = 1, limit = 10 } = criteria;

    // 构建查询条件
    const where: any = {};

    if (keyword) {
      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
        { requirements: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    if (researchField) {
      where.researchField = { contains: researchField, mode: 'insensitive' };
    }

    if (status) {
      where.status = status;
    }

    if (requiredSkills && requiredSkills.length > 0) {
      where.requiredSkills = {
        hasSome: requiredSkills,
      };
    }

    // 计算分页
    const skip = (page - 1) * limit;

    // 执行查询
    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              email: true,
              teacherProfile: true,
            },
          },
          _count: {
            select: {
              applications: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      projects,
      total,
      page,
      limit,
    };
  }

  /**
   * 更新项目状态
   */
  async updateProjectStatus(
    projectId: string,
    teacherId: string,
    status: ProjectStatus
  ): Promise<Project> {
    // 验证项目是否存在且属于该教师
    const existingProject = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!existingProject) {
      throw new Error('项目不存在');
    }

    if (existingProject.teacherId !== teacherId) {
      throw new Error('无权限修改此项目状态');
    }

    const project = await this.prisma.project.update({
      where: { id: projectId },
      data: { status },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return project;
  }

  /**
   * 获取项目的申请列表
   */
  async getProjectApplications(projectId: string, teacherId: string) {
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

    const applications = await this.prisma.application.findMany({
      where: { projectId },
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
        appliedAt: 'desc',
      },
    });

    return applications;
  }
}
