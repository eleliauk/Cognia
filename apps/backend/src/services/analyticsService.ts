import { PrismaClient, ApplicationStatus, ProjectStatus, InternshipStatus } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Helper function to extract date string from Date object
 */
function getDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Time range interface for filtering statistics
 */
export interface TimeRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Teacher statistics dashboard data
 */
export interface TeacherStats {
  totalProjects: number;
  activeProjects: number;
  closedProjects: number;
  completedProjects: number;
  totalApplications: number;
  pendingApplications: number;
  acceptedApplications: number;
  rejectedApplications: number;
  acceptanceRate: number;
  totalInternships: number;
  activeInternships: number;
  completedInternships: number;
  studentDistribution: {
    major: string;
    count: number;
  }[];
  applicationTrend: {
    date: string;
    count: number;
  }[];
  projectPerformance: {
    projectId: string;
    projectTitle: string;
    applicationCount: number;
    acceptedCount: number;
    avgMatchScore: number;
  }[];
}

/**
 * Admin statistics dashboard data
 */
export interface AdminStats {
  totalUsers: number;
  totalTeachers: number;
  totalStudents: number;
  totalAdmins: number;
  activeUsers: number;
  totalProjects: number;
  activeProjects: number;
  totalApplications: number;
  totalInternships: number;
  matchSuccessRate: number;
  systemPerformance: {
    avgMatchScore: number;
    totalMatchCacheEntries: number;
    llmFallbackRate: number;
    llmApiSuccessRate: number;
    avgResponseTime: number;
  };
  userGrowth: {
    date: string;
    teachers: number;
    students: number;
  }[];
  applicationStatusDistribution: {
    status: string;
    count: number;
  }[];
  topResearchFields: {
    field: string;
    projectCount: number;
    applicationCount: number;
  }[];
  recentAuditLogs: {
    id: string;
    userId: string;
    action: string;
    resource: string;
    createdAt: Date;
  }[];
}

/**
 * Matching metrics for admin dashboard
 */
export interface MatchingMetrics {
  totalMatches: number;
  avgMatchScore: number;
  scoreDistribution: {
    range: string;
    count: number;
  }[];
  topMatchedSkills: {
    skill: string;
    count: number;
  }[];
  matchTrend: {
    date: string;
    count: number;
    avgScore: number;
  }[];
}

/**
 * Analytics Service - Provides statistics and analytics data
 */
export class AnalyticsService {
  /**
   * Get teacher dashboard statistics
   */
  async getTeacherDashboard(teacherId: string, timeRange?: TimeRange): Promise<TeacherStats> {
    const dateFilter = timeRange ? { gte: timeRange.startDate, lte: timeRange.endDate } : undefined;

    // Get all projects for this teacher
    const projects = await prisma.project.findMany({
      where: { teacherId },
      include: {
        applications: {
          where: dateFilter ? { appliedAt: dateFilter } : undefined,
          include: {
            student: {
              include: {
                studentProfile: true,
              },
            },
          },
        },
        internships: true,
      },
    });

    // Calculate project statistics
    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) => p.status === ProjectStatus.ACTIVE).length;
    const closedProjects = projects.filter((p) => p.status === ProjectStatus.CLOSED).length;
    const completedProjects = projects.filter((p) => p.status === ProjectStatus.COMPLETED).length;

    // Flatten all applications
    const allApplications = projects.flatMap((p) => p.applications);
    const totalApplications = allApplications.length;
    const pendingApplications = allApplications.filter(
      (a) => a.status === ApplicationStatus.PENDING
    ).length;
    const acceptedApplications = allApplications.filter(
      (a) => a.status === ApplicationStatus.ACCEPTED
    ).length;
    const rejectedApplications = allApplications.filter(
      (a) => a.status === ApplicationStatus.REJECTED
    ).length;

    // Calculate acceptance rate
    const reviewedApplications = acceptedApplications + rejectedApplications;
    const acceptanceRate =
      reviewedApplications > 0
        ? Math.round((acceptedApplications / reviewedApplications) * 100)
        : 0;

    // Flatten all internships
    const allInternships = projects.flatMap((p) => p.internships);
    const totalInternships = allInternships.length;
    const activeInternships = allInternships.filter(
      (i) => i.status === InternshipStatus.IN_PROGRESS
    ).length;
    const completedInternships = allInternships.filter(
      (i) => i.status === InternshipStatus.COMPLETED
    ).length;

    // Calculate student distribution by major
    const majorCounts = new Map<string, number>();
    for (const app of allApplications) {
      const major = app.student.studentProfile?.major || '未知';
      majorCounts.set(major, (majorCounts.get(major) || 0) + 1);
    }
    const studentDistribution = Array.from(majorCounts.entries())
      .map(([major, count]) => ({ major, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate application trend (last 30 days by default)
    const applicationTrend = await this.calculateApplicationTrend(
      projects.map((p) => p.id),
      timeRange
    );

    // Calculate project performance
    const projectPerformance = projects.map((project) => {
      const apps = project.applications;
      const accepted = apps.filter((a) => a.status === ApplicationStatus.ACCEPTED).length;
      const scores = apps.filter((a) => a.matchScore !== null).map((a) => a.matchScore as number);
      const avgMatchScore =
        scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

      return {
        projectId: project.id,
        projectTitle: project.title,
        applicationCount: apps.length,
        acceptedCount: accepted,
        avgMatchScore: Math.round(avgMatchScore * 10) / 10,
      };
    });

    return {
      totalProjects,
      activeProjects,
      closedProjects,
      completedProjects,
      totalApplications,
      pendingApplications,
      acceptedApplications,
      rejectedApplications,
      acceptanceRate,
      totalInternships,
      activeInternships,
      completedInternships,
      studentDistribution,
      applicationTrend,
      projectPerformance,
    };
  }

  /**
   * Calculate application trend over time
   */
  private async calculateApplicationTrend(
    projectIds: string[],
    timeRange?: TimeRange
  ): Promise<{ date: string; count: number }[]> {
    const endDate = timeRange?.endDate || new Date();
    const startDate =
      timeRange?.startDate || new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const applications = await prisma.application.findMany({
      where: {
        projectId: { in: projectIds },
        appliedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        appliedAt: true,
      },
    });

    // Group by date
    const dateCounts = new Map<string, number>();
    for (const app of applications) {
      const dateStr = getDateString(app.appliedAt);
      dateCounts.set(dateStr, (dateCounts.get(dateStr) || 0) + 1);
    }

    // Fill in missing dates with 0
    const result: { date: string; count: number }[] = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = getDateString(currentDate);
      result.push({
        date: dateStr,
        count: dateCounts.get(dateStr) || 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }

  /**
   * Get admin dashboard statistics
   */
  async getAdminDashboard(timeRange?: TimeRange): Promise<AdminStats> {
    const dateFilter = timeRange ? { gte: timeRange.startDate, lte: timeRange.endDate } : undefined;

    // User statistics
    const users = await prisma.user.findMany({
      select: {
        id: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    const totalUsers = users.length;
    const totalTeachers = users.filter((u) => u.role === 'TEACHER').length;
    const totalStudents = users.filter((u) => u.role === 'STUDENT').length;
    const totalAdmins = users.filter((u) => u.role === 'ADMIN').length;
    const activeUsers = users.filter((u) => u.isActive).length;

    // Project statistics
    const projects = await prisma.project.findMany({
      where: dateFilter ? { createdAt: dateFilter } : undefined,
      select: {
        id: true,
        status: true,
        researchField: true,
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) => p.status === ProjectStatus.ACTIVE).length;

    // Application statistics
    const applications = await prisma.application.findMany({
      where: dateFilter ? { appliedAt: dateFilter } : undefined,
      select: {
        id: true,
        status: true,
        matchScore: true,
      },
    });

    const totalApplications = applications.length;
    const acceptedApplications = applications.filter(
      (a) => a.status === ApplicationStatus.ACCEPTED
    ).length;
    const reviewedApplications = applications.filter(
      (a) => a.status === ApplicationStatus.ACCEPTED || a.status === ApplicationStatus.REJECTED
    ).length;
    const matchSuccessRate =
      reviewedApplications > 0
        ? Math.round((acceptedApplications / reviewedApplications) * 100)
        : 0;

    // Internship statistics
    const totalInternships = await prisma.internship.count({
      where: dateFilter ? { createdAt: dateFilter } : undefined,
    });

    // System performance metrics
    const matchScores = applications
      .filter((a) => a.matchScore !== null)
      .map((a) => a.matchScore as number);
    const avgMatchScore =
      matchScores.length > 0
        ? Math.round((matchScores.reduce((a, b) => a + b, 0) / matchScores.length) * 10) / 10
        : 0;

    // Get match cache entries count
    const totalMatchCacheEntries = await prisma.matchCache.count();

    // Calculate LLM fallback rate (applications with low match scores or specific reasoning)
    const fallbackApplications = applications.filter(
      (a) => a.matchScore !== null && a.matchScore < 30
    ).length;
    const llmFallbackRate =
      matchScores.length > 0 ? Math.round((fallbackApplications / matchScores.length) * 100) : 0;

    // User growth trend
    const userGrowth = await this.calculateUserGrowth(timeRange);

    // Application status distribution
    const statusCounts = new Map<string, number>();
    for (const app of applications) {
      statusCounts.set(app.status, (statusCounts.get(app.status) || 0) + 1);
    }
    const applicationStatusDistribution = Array.from(statusCounts.entries()).map(
      ([status, count]) => ({ status, count })
    );

    // Top research fields
    const fieldStats = new Map<string, { projectCount: number; applicationCount: number }>();
    for (const project of projects) {
      const field = project.researchField;
      const existing = fieldStats.get(field) || { projectCount: 0, applicationCount: 0 };
      fieldStats.set(field, {
        projectCount: existing.projectCount + 1,
        applicationCount: existing.applicationCount + project._count.applications,
      });
    }
    const topResearchFields = Array.from(fieldStats.entries())
      .map(([field, stats]) => ({
        field,
        projectCount: stats.projectCount,
        applicationCount: stats.applicationCount,
      }))
      .sort((a, b) => b.applicationCount - a.applicationCount)
      .slice(0, 10);

    // LLM API success rate estimation (based on non-fallback matches)
    // Fallback matches typically have scores < 30 or specific reasoning patterns
    const successfulLlmCalls = matchScores.filter((s) => s >= 30).length;
    const llmApiSuccessRate =
      matchScores.length > 0 ? Math.round((successfulLlmCalls / matchScores.length) * 100) : 100;

    // Average response time estimation (placeholder - would need actual metrics collection)
    // In a real implementation, this would come from a metrics service
    const avgResponseTime = 1500; // milliseconds - placeholder value

    // Get recent audit logs
    const recentAuditLogs = await prisma.auditLog.findMany({
      where: dateFilter ? { createdAt: dateFilter } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        userId: true,
        action: true,
        resource: true,
        createdAt: true,
      },
    });

    return {
      totalUsers,
      totalTeachers,
      totalStudents,
      totalAdmins,
      activeUsers,
      totalProjects,
      activeProjects,
      totalApplications,
      totalInternships,
      matchSuccessRate,
      systemPerformance: {
        avgMatchScore,
        totalMatchCacheEntries,
        llmFallbackRate,
        llmApiSuccessRate,
        avgResponseTime,
      },
      userGrowth,
      applicationStatusDistribution,
      recentAuditLogs,
      topResearchFields,
    };
  }

  /**
   * Calculate user growth trend over time
   */
  private async calculateUserGrowth(
    timeRange?: TimeRange
  ): Promise<{ date: string; teachers: number; students: number }[]> {
    const endDate = timeRange?.endDate || new Date();
    const startDate =
      timeRange?.startDate || new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const users = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        role: true,
        createdAt: true,
      },
    });

    // Group by date and role
    const dateStats = new Map<string, { teachers: number; students: number }>();
    for (const user of users) {
      const dateStr = getDateString(user.createdAt);
      const existing = dateStats.get(dateStr) || { teachers: 0, students: 0 };
      if (user.role === 'TEACHER') {
        existing.teachers++;
      } else if (user.role === 'STUDENT') {
        existing.students++;
      }
      dateStats.set(dateStr, existing);
    }

    // Fill in missing dates with 0
    const result: { date: string; teachers: number; students: number }[] = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = getDateString(currentDate);
      const stats = dateStats.get(dateStr) || { teachers: 0, students: 0 };
      result.push({
        date: dateStr,
        teachers: stats.teachers,
        students: stats.students,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }

  /**
   * Get matching metrics for admin dashboard
   */
  async getMatchingMetrics(timeRange?: TimeRange): Promise<MatchingMetrics> {
    const dateFilter = timeRange ? { gte: timeRange.startDate, lte: timeRange.endDate } : undefined;

    // Get all applications with match scores
    const applications = await prisma.application.findMany({
      where: {
        matchScore: { not: null },
        ...(dateFilter ? { appliedAt: dateFilter } : {}),
      },
      select: {
        matchScore: true,
        appliedAt: true,
        project: {
          select: {
            requiredSkills: true,
          },
        },
      },
    });

    const totalMatches = applications.length;
    const scores = applications.map((a) => a.matchScore as number);
    const avgMatchScore =
      scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
        : 0;

    // Score distribution
    const scoreRanges = [
      { range: '0-20', min: 0, max: 20 },
      { range: '21-40', min: 21, max: 40 },
      { range: '41-60', min: 41, max: 60 },
      { range: '61-80', min: 61, max: 80 },
      { range: '81-100', min: 81, max: 100 },
    ];

    const scoreDistribution = scoreRanges.map(({ range, min, max }) => ({
      range,
      count: scores.filter((s) => s >= min && s <= max).length,
    }));

    // Top matched skills (from projects with high match scores)
    const skillCounts = new Map<string, number>();
    for (const app of applications) {
      if ((app.matchScore as number) >= 60) {
        for (const skill of app.project.requiredSkills) {
          skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1);
        }
      }
    }
    const topMatchedSkills = Array.from(skillCounts.entries())
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Match trend over time
    const matchTrend = this.calculateMatchTrend(applications);

    return {
      totalMatches,
      avgMatchScore,
      scoreDistribution,
      topMatchedSkills,
      matchTrend,
    };
  }

  /**
   * Calculate match trend over time
   */
  private calculateMatchTrend(
    applications: { matchScore: number | null; appliedAt: Date }[]
  ): { date: string; count: number; avgScore: number }[] {
    // Group by date
    const dateStats = new Map<string, { count: number; totalScore: number }>();
    for (const app of applications) {
      const dateStr = getDateString(app.appliedAt);
      const existing = dateStats.get(dateStr) || { count: 0, totalScore: 0 };
      dateStats.set(dateStr, {
        count: existing.count + 1,
        totalScore: existing.totalScore + (app.matchScore || 0),
      });
    }

    // Convert to array and calculate averages
    return Array.from(dateStats.entries())
      .map(([date, stats]) => ({
        date,
        count: stats.count,
        avgScore: Math.round((stats.totalScore / stats.count) * 10) / 10,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
