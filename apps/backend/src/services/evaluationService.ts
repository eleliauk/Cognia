import { PrismaClient } from '@prisma/client';
import { prisma } from '../config/database';
import { notificationService } from './notificationService';

export interface CreateEvaluationDTO {
  internshipId: string;
  teacherId: string;
  overallScore: number;
  technicalSkills: number;
  communication: number;
  initiative: number;
  reliability: number;
  feedback: string;
  strengths?: string;
  improvements?: string;
}

export class EvaluationService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prisma) {
    this.prisma = prismaClient;
  }

  /**
   * Create evaluation for an internship
   */
  async createEvaluation(data: CreateEvaluationDTO) {
    // Verify internship exists
    const internship = await this.prisma.internship.findUnique({
      where: { id: data.internshipId },
      include: {
        application: {
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
        },
        evaluation: true,
      },
    });

    if (!internship) {
      throw new Error('Internship not found');
    }

    // Check if evaluation already exists
    if (internship.evaluation) {
      throw new Error('Evaluation already exists for this internship');
    }

    // Verify teacher owns the project
    if (internship.application.project.teacherId !== data.teacherId) {
      throw new Error('Only the project teacher can create an evaluation');
    }

    // Create evaluation
    const evaluation = await this.prisma.evaluation.create({
      data: {
        internshipId: data.internshipId,
        teacherId: data.teacherId,
        overallScore: data.overallScore,
        technicalSkills: data.technicalSkills,
        communication: data.communication,
        initiative: data.initiative,
        reliability: data.reliability,
        feedback: data.feedback,
        strengths: data.strengths,
        improvements: data.improvements,
      },
      include: {
        internship: {
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
          },
        },
      },
    });

    // Create notification for student
    await this.createEvaluationNotification(
      internship.studentId,
      internship.application.project.title,
      evaluation.id
    );

    return evaluation;
  }

  /**
   * Get evaluation by internship ID
   */
  async getEvaluationByInternship(internshipId: string) {
    const evaluation = await this.prisma.evaluation.findUnique({
      where: { internshipId },
      include: {
        internship: {
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
          },
        },
      },
    });

    return evaluation;
  }

  /**
   * Get all evaluations for a student
   */
  async getEvaluationsByStudent(studentId: string) {
    const evaluations = await this.prisma.evaluation.findMany({
      where: {
        internship: {
          studentId,
        },
      },
      include: {
        internship: {
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
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return evaluations;
  }

  /**
   * Get all evaluations created by a teacher
   */
  async getEvaluationsByTeacher(teacherId: string) {
    const evaluations = await this.prisma.evaluation.findMany({
      where: {
        teacherId,
      },
      include: {
        internship: {
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
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return evaluations;
  }

  /**
   * Get evaluation by ID
   */
  async getEvaluationById(evaluationId: string) {
    const evaluation = await this.prisma.evaluation.findUnique({
      where: { id: evaluationId },
      include: {
        internship: {
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
          },
        },
      },
    });

    if (!evaluation) {
      throw new Error('Evaluation not found');
    }

    return evaluation;
  }

  /**
   * Create notification when evaluation is submitted
   */
  private async createEvaluationNotification(
    studentId: string,
    projectTitle: string,
    evaluationId: string
  ) {
    try {
      await notificationService.notifyEvaluationReceived(studentId, projectTitle, evaluationId);
    } catch (error) {
      console.error('Failed to send evaluation notification:', error);
      // 通知发送失败不影响评价创建
    }
  }
}

export const evaluationService = new EvaluationService();
