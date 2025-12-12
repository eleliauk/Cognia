import apiClient from './apiClient';
import type { Project, Application, Internship, Evaluation, ApiResponse } from '@/types';

// Teacher Statistics Types
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

// Project Types
export interface CreateProjectDTO {
  title: string;
  description: string;
  requirements: string;
  requiredSkills: string[];
  researchField: string;
  duration: number;
  positions: number;
  startDate: string;
}

export interface UpdateProjectDTO extends Partial<CreateProjectDTO> {
  status?: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'COMPLETED';
}

// Application with student info
export interface ApplicationWithStudent extends Application {
  student: {
    id: string;
    name: string;
    email: string;
    studentProfile?: {
      major: string;
      grade: number;
      gpa: number;
      skills: string[];
    };
  };
  project?: {
    id: string;
    title: string;
  };
  matchReasoning?: string;
}

// Internship with details
export interface InternshipWithDetails extends Internship {
  student?: {
    id: string;
    name: string;
    email: string;
  };
  project?: {
    id: string;
    title: string;
  };
  milestones?: Milestone[];
  evaluation?: Evaluation;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  completedAt?: string;
}

export interface CreateMilestoneDTO {
  title: string;
  description: string;
  dueDate: string;
}

export interface CreateEvaluationDTO {
  internshipId: string;
  overallScore: number;
  technicalSkills: number;
  communication: number;
  initiative: number;
  reliability: number;
  feedback: string;
  strengths?: string;
  improvements?: string;
}

// Teacher Service
export const teacherService = {
  // Analytics
  async getDashboardStats(teacherId: string): Promise<TeacherStats> {
    const response = await apiClient.get<ApiResponse<TeacherStats>>(
      `/api/analytics/teacher/${teacherId}`
    );
    return response.data.data!;
  },

  // Projects
  async getMyProjects(): Promise<Project[]> {
    const response = await apiClient.get<ApiResponse<Project[]>>(
      '/api/projects/teacher/my-projects'
    );
    return response.data.data || [];
  },

  async createProject(data: CreateProjectDTO): Promise<Project> {
    const response = await apiClient.post<ApiResponse<Project>>('/api/projects', data);
    return response.data.data!;
  },

  async updateProject(id: string, data: UpdateProjectDTO): Promise<Project> {
    const response = await apiClient.put<ApiResponse<Project>>(`/api/projects/${id}`, data);
    return response.data.data!;
  },

  async deleteProject(id: string): Promise<void> {
    await apiClient.delete(`/api/projects/${id}`);
  },

  async updateProjectStatus(id: string, status: string): Promise<Project> {
    const response = await apiClient.patch<ApiResponse<Project>>(`/api/projects/${id}/status`, {
      status,
    });
    return response.data.data!;
  },

  // Applications
  async getProjectApplications(projectId: string): Promise<ApplicationWithStudent[]> {
    const response = await apiClient.get<ApiResponse<ApplicationWithStudent[]>>(
      `/api/applications/project/${projectId}`
    );
    return response.data.data || [];
  },

  async updateApplicationStatus(
    applicationId: string,
    status: 'REVIEWING' | 'ACCEPTED' | 'REJECTED',
    feedback?: string
  ): Promise<Application> {
    const response = await apiClient.put<ApiResponse<Application>>(
      `/api/applications/${applicationId}/status`,
      { status, feedback }
    );
    return response.data.data!;
  },

  // Internships
  async getTeacherInternships(): Promise<InternshipWithDetails[]> {
    const response = await apiClient.get<ApiResponse<InternshipWithDetails[]>>('/api/internships');
    return response.data.data || [];
  },

  async getInternshipById(id: string): Promise<InternshipWithDetails> {
    const response = await apiClient.get<ApiResponse<InternshipWithDetails>>(
      `/api/internships/${id}`
    );
    return response.data.data!;
  },

  async updateInternshipProgress(id: string, progress: number): Promise<Internship> {
    const response = await apiClient.put<ApiResponse<Internship>>(
      `/api/internships/${id}/progress`,
      { progress }
    );
    return response.data.data!;
  },

  async updateInternshipStatus(
    id: string,
    status: 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'TERMINATED'
  ): Promise<Internship> {
    const response = await apiClient.put<ApiResponse<Internship>>(`/api/internships/${id}/status`, {
      status,
    });
    return response.data.data!;
  },

  // Milestones
  async createMilestone(internshipId: string, data: CreateMilestoneDTO): Promise<Milestone> {
    const response = await apiClient.post<ApiResponse<Milestone>>(
      `/api/internships/${internshipId}/milestones`,
      data
    );
    return response.data.data!;
  },

  async updateMilestone(
    internshipId: string,
    milestoneId: string,
    data: Partial<CreateMilestoneDTO>
  ): Promise<Milestone> {
    const response = await apiClient.put<ApiResponse<Milestone>>(
      `/api/internships/${internshipId}/milestones/${milestoneId}`,
      data
    );
    return response.data.data!;
  },

  async completeMilestone(internshipId: string, milestoneId: string): Promise<Milestone> {
    const response = await apiClient.put<ApiResponse<Milestone>>(
      `/api/internships/${internshipId}/milestones/${milestoneId}/complete`
    );
    return response.data.data!;
  },

  async deleteMilestone(internshipId: string, milestoneId: string): Promise<void> {
    await apiClient.delete(`/api/internships/${internshipId}/milestones/${milestoneId}`);
  },

  // Evaluations
  async createEvaluation(data: CreateEvaluationDTO): Promise<Evaluation> {
    const response = await apiClient.post<ApiResponse<Evaluation>>('/api/evaluations', data);
    return response.data.data!;
  },

  async getEvaluation(internshipId: string): Promise<Evaluation | null> {
    try {
      const response = await apiClient.get<ApiResponse<Evaluation>>(
        `/api/evaluations/${internshipId}`
      );
      return response.data.data || null;
    } catch {
      return null;
    }
  },
};

export default teacherService;
