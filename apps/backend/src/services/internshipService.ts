import { PrismaClient, InternshipStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { notificationService } from './notificationService';

export interface CreateInternshipDTO {
  applicationId: string;
}

export interface UpdateProgressDTO {
  progress: number;
  status?: InternshipStatus;
}

export class InternshipService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prisma) {
    this.prisma = prismaClient;
  }

  /**
   * Create internship record (automatically when application is accepted)
   */
  async createInternship(data: CreateInternshipDTO) {
    // Get application details
    const application = await this.prisma.application.findUnique({
      where: { id: data.applicationId },
      include: {
        project: true,
        student: true,
      },
    });

    if (!application) {
      throw new Error('Application not found');
    }

    if (application.status !== 'ACCEPTED') {
      throw new Error('Application must be accepted before creating internship');
    }

    // Check if internship already exists
    const existing = await this.prisma.internship.findUnique({
      where: { applicationId: data.applicationId },
    });

    if (existing) {
      throw new Error('Internship already exists for this application');
    }

    // Create internship
    const internship = await this.prisma.internship.create({
      data: {
        applicationId: data.applicationId,
        studentId: application.studentId,
        projectId: application.projectId,
        status: InternshipStatus.IN_PROGRESS,
        progress: 0,
        startDate: new Date(),
      },
      include: {
        application: {
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
                teacherId: true,
              },
            },
          },
        },
        milestones: true,
        documents: true,
      },
    });

    return internship;
  }

  /**
   * Update internship progress
   */
  async updateProgress(internshipId: string, data: UpdateProgressDTO) {
    // Validate progress range
    if (data.progress < 0 || data.progress > 100) {
      throw new Error('Progress must be between 0 and 100');
    }

    const updateData: Prisma.InternshipUpdateInput = {
      progress: data.progress,
      updatedAt: new Date(),
    };

    if (data.status) {
      updateData.status = data.status;

      // Set end date if completed or terminated
      if (
        data.status === InternshipStatus.COMPLETED ||
        data.status === InternshipStatus.TERMINATED
      ) {
        updateData.endDate = new Date();
      }
    }

    const internship = await this.prisma.internship.update({
      where: { id: internshipId },
      data: updateData,
      include: {
        application: {
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
                teacherId: true,
              },
            },
          },
        },
        milestones: true,
        documents: true,
      },
    });

    // Send notification about progress update to the teacher
    try {
      await notificationService.notifyProgressUpdated(
        internship.application.project.teacherId,
        internship.application.project.title,
        data.progress,
        internship.id
      );
    } catch (error) {
      console.error('Failed to send progress notification:', error);
      // 通知发送失败不影响进度更新
    }

    return internship;
  }

  /**
   * Get internship by ID
   */
  async getInternshipById(internshipId: string) {
    const internship = await this.prisma.internship.findUnique({
      where: { id: internshipId },
      include: {
        application: {
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
                description: true,
                teacherId: true,
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
        },
        milestones: {
          orderBy: {
            dueDate: 'asc',
          },
        },
        documents: {
          orderBy: {
            uploadedAt: 'desc',
          },
        },
        evaluation: true,
      },
    });

    if (!internship) {
      throw new Error('Internship not found');
    }

    return internship;
  }

  /**
   * Get internships by student
   */
  async getInternshipsByStudent(studentId: string) {
    const internships = await this.prisma.internship.findMany({
      where: { studentId },
      include: {
        application: {
          include: {
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
        },
        milestones: {
          orderBy: {
            dueDate: 'asc',
          },
        },
        documents: true,
        evaluation: true,
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    return internships;
  }

  /**
   * Get internships by teacher (through projects)
   */
  async getInternshipsByTeacher(teacherId: string) {
    const internships = await this.prisma.internship.findMany({
      where: {
        application: {
          project: {
            teacherId,
          },
        },
      },
      include: {
        application: {
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
                description: true,
              },
            },
          },
        },
        milestones: {
          orderBy: {
            dueDate: 'asc',
          },
        },
        documents: true,
        evaluation: true,
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    return internships;
  }

  /**
   * Get internships by project
   */
  async getInternshipsByProject(projectId: string) {
    const internships = await this.prisma.internship.findMany({
      where: { projectId },
      include: {
        application: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        milestones: true,
        documents: true,
        evaluation: true,
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    return internships;
  }

  /**
   * Get all internships (admin only)
   */
  async getAllInternships() {
    const internships = await this.prisma.internship.findMany({
      include: {
        application: {
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
        },
        milestones: {
          orderBy: {
            dueDate: 'asc',
          },
        },
        documents: true,
        evaluation: true,
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    return internships;
  }

  /**
   * Update internship status
   */
  async updateStatus(internshipId: string, status: InternshipStatus) {
    const updateData: Prisma.InternshipUpdateInput = {
      status,
      updatedAt: new Date(),
    };

    // Set end date if completed or terminated
    if (status === InternshipStatus.COMPLETED || status === InternshipStatus.TERMINATED) {
      updateData.endDate = new Date();
    }

    const internship = await this.prisma.internship.update({
      where: { id: internshipId },
      data: updateData,
      include: {
        application: {
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
                teacherId: true,
              },
            },
          },
        },
        milestones: true,
        documents: true,
      },
    });

    return internship;
  }

  // ==================== Milestone Management ====================

  /**
   * Create milestone for internship
   */
  async createMilestone(
    internshipId: string,
    data: {
      title: string;
      description: string;
      dueDate: Date;
    }
  ) {
    // Verify internship exists
    const internship = await this.prisma.internship.findUnique({
      where: { id: internshipId },
    });

    if (!internship) {
      throw new Error('Internship not found');
    }

    const milestone = await this.prisma.milestone.create({
      data: {
        internshipId,
        title: data.title,
        description: data.description,
        dueDate: data.dueDate,
        completed: false,
      },
    });

    return milestone;
  }

  /**
   * Get milestones for internship
   */
  async getMilestones(internshipId: string) {
    const milestones = await this.prisma.milestone.findMany({
      where: { internshipId },
      orderBy: {
        dueDate: 'asc',
      },
    });

    return milestones;
  }

  /**
   * Get milestone by ID
   */
  async getMilestoneById(milestoneId: string) {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        internship: {
          select: {
            id: true,
            studentId: true,
            application: {
              select: {
                project: {
                  select: {
                    teacherId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!milestone) {
      throw new Error('Milestone not found');
    }

    return milestone;
  }

  /**
   * Update milestone
   */
  async updateMilestone(
    milestoneId: string,
    data: {
      title?: string;
      description?: string;
      dueDate?: Date;
      completed?: boolean;
    }
  ) {
    const updateData: Prisma.MilestoneUpdateInput = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
    if (data.completed !== undefined) {
      updateData.completed = data.completed;
      if (data.completed) {
        updateData.completedAt = new Date();
      } else {
        updateData.completedAt = null;
      }
    }

    const milestone = await this.prisma.milestone.update({
      where: { id: milestoneId },
      data: updateData,
    });

    return milestone;
  }

  /**
   * Delete milestone
   */
  async deleteMilestone(milestoneId: string) {
    await this.prisma.milestone.delete({
      where: { id: milestoneId },
    });
  }

  /**
   * Mark milestone as completed
   */
  async completeMilestone(milestoneId: string) {
    const milestone = await this.prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        completed: true,
        completedAt: new Date(),
      },
    });

    return milestone;
  }

  // ==================== Document Management ====================

  /**
   * Upload document for internship
   */
  async uploadDocument(
    internshipId: string,
    data: {
      filename: string;
      fileUrl: string;
      uploadedBy: string;
      fileSize: number;
      mimeType: string;
    }
  ) {
    // Verify internship exists
    const internship = await this.prisma.internship.findUnique({
      where: { id: internshipId },
    });

    if (!internship) {
      throw new Error('Internship not found');
    }

    const document = await this.prisma.document.create({
      data: {
        internshipId,
        filename: data.filename,
        fileUrl: data.fileUrl,
        uploadedBy: data.uploadedBy,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
      },
    });

    return document;
  }

  /**
   * Get documents for internship
   */
  async getDocuments(internshipId: string) {
    const documents = await this.prisma.document.findMany({
      where: { internshipId },
      orderBy: {
        uploadedAt: 'desc',
      },
    });

    return documents;
  }

  /**
   * Get document by ID
   */
  async getDocumentById(documentId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        internship: {
          select: {
            id: true,
            studentId: true,
            application: {
              select: {
                project: {
                  select: {
                    teacherId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    return document;
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId: string) {
    const document = await this.prisma.document.delete({
      where: { id: documentId },
    });

    return document;
  }
}

export const internshipService = new InternshipService();
