import apiClient from './apiClient';
import type { Application, ApiResponse, PaginationParams } from '@/types';

// Application with student info (for teachers)
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
      researchInterests: string[];
    };
  };
  project?: {
    id: string;
    title: string;
  };
  matchReasoning?: string;
}

// Application with project info (for students)
export interface ApplicationWithProject extends Application {
  project: {
    id: string;
    title: string;
    description: string;
    requiredSkills: string[];
    researchField: string;
    status: string;
    teacher?: {
      id: string;
      name: string;
      email: string;
    };
  };
  matchReasoning?: string;
}

// Create application DTO
export interface CreateApplicationDTO {
  projectId: string;
  coverLetter: string;
}

// Update application status DTO
export interface UpdateApplicationStatusDTO {
  status: 'REVIEWING' | 'ACCEPTED' | 'REJECTED';
  feedback?: string;
}

// Application list params
export interface ApplicationListParams extends PaginationParams {
  status?: 'PENDING' | 'REVIEWING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  projectId?: string;
  studentId?: string;
}

// Application Service
export const applicationService = {
  /**
   * Submit a new application
   */
  async submitApplication(data: CreateApplicationDTO): Promise<Application> {
    const response = await apiClient.post<ApiResponse<Application>>('/api/applications', data);
    return response.data.data!;
  },

  /**
   * Get application by ID
   */
  async getApplicationById(id: string): Promise<ApplicationWithStudent | ApplicationWithProject> {
    const response = await apiClient.get<
      ApiResponse<ApplicationWithStudent | ApplicationWithProject>
    >(`/api/applications/${id}`);
    return response.data.data!;
  },

  /**
   * Get applications for current student
   */
  async getMyApplications(): Promise<ApplicationWithProject[]> {
    const response = await apiClient.get<ApiResponse<ApplicationWithProject[]>>(
      '/api/applications/student/my'
    );
    return response.data.data || [];
  },

  /**
   * Get applications for a specific project (for teachers)
   */
  async getProjectApplications(projectId: string): Promise<ApplicationWithStudent[]> {
    const response = await apiClient.get<ApiResponse<ApplicationWithStudent[]>>(
      `/api/applications/project/${projectId}`
    );
    return response.data.data || [];
  },

  /**
   * Update application status (for teachers)
   */
  async updateApplicationStatus(
    applicationId: string,
    data: UpdateApplicationStatusDTO
  ): Promise<Application> {
    const response = await apiClient.put<ApiResponse<Application>>(
      `/api/applications/${applicationId}/status`,
      data
    );
    return response.data.data!;
  },

  /**
   * Withdraw an application (for students)
   */
  async withdrawApplication(applicationId: string): Promise<Application> {
    const response = await apiClient.delete<ApiResponse<Application>>(
      `/api/applications/${applicationId}`
    );
    return response.data.data!;
  },

  /**
   * Check if student has already applied to a project
   */
  async checkDuplicateApplication(projectId: string): Promise<boolean> {
    try {
      const response = await apiClient.get<ApiResponse<{ exists: boolean }>>(
        `/api/applications/check?projectId=${projectId}`
      );
      return response.data.data?.exists || false;
    } catch {
      return false;
    }
  },

  /**
   * Get application statistics for a project
   */
  async getProjectApplicationStats(projectId: string): Promise<{
    total: number;
    pending: number;
    reviewing: number;
    accepted: number;
    rejected: number;
    withdrawn: number;
  }> {
    const response = await apiClient.get<
      ApiResponse<{
        total: number;
        pending: number;
        reviewing: number;
        accepted: number;
        rejected: number;
        withdrawn: number;
      }>
    >(`/api/applications/project/${projectId}/stats`);
    return response.data.data!;
  },
};

export default applicationService;
