import apiClient from './apiClient';
import type { Project, ApiResponse, PaginationParams, PaginatedResponse } from '@/types';

// Project search/filter parameters
export interface ProjectSearchParams extends PaginationParams {
  status?: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'COMPLETED';
  researchField?: string;
  skills?: string[];
  search?: string;
  teacherId?: string;
}

// Project with teacher info
export interface ProjectWithTeacher extends Project {
  teacher?: {
    id: string;
    name: string;
    email: string;
    teacherProfile?: {
      department: string;
      title: string;
      researchFields: string[];
    };
  };
  _count?: {
    applications: number;
  };
}

// Project Service - for browsing and viewing projects
export const projectService = {
  /**
   * Get all active projects (for students to browse)
   */
  async getActiveProjects(params: ProjectSearchParams = {}): Promise<ProjectWithTeacher[]> {
    const queryParams = new URLSearchParams();

    // Always filter for active projects when browsing
    queryParams.append('status', params.status || 'ACTIVE');

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.researchField) queryParams.append('researchField', params.researchField);
    if (params.search) queryParams.append('search', params.search);
    if (params.teacherId) queryParams.append('teacherId', params.teacherId);
    if (params.skills?.length) {
      params.skills.forEach((skill) => queryParams.append('skills', skill));
    }
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const url = `/api/projects${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<ApiResponse<ProjectWithTeacher[]>>(url);
    return response.data.data || [];
  },

  /**
   * Get a single project by ID
   */
  async getProjectById(id: string): Promise<ProjectWithTeacher> {
    const response = await apiClient.get<ApiResponse<ProjectWithTeacher>>(`/api/projects/${id}`);
    return response.data.data!;
  },

  /**
   * Get projects by teacher ID
   */
  async getProjectsByTeacher(teacherId: string): Promise<ProjectWithTeacher[]> {
    const response = await apiClient.get<ApiResponse<ProjectWithTeacher[]>>(
      `/api/projects?teacherId=${teacherId}`
    );
    return response.data.data || [];
  },

  /**
   * Search projects with pagination
   */
  async searchProjects(
    params: ProjectSearchParams
  ): Promise<PaginatedResponse<ProjectWithTeacher>> {
    const queryParams = new URLSearchParams();

    if (params.status) queryParams.append('status', params.status);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.researchField) queryParams.append('researchField', params.researchField);
    if (params.search) queryParams.append('search', params.search);
    if (params.skills?.length) {
      params.skills.forEach((skill) => queryParams.append('skills', skill));
    }
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const url = `/api/projects/search${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<ApiResponse<PaginatedResponse<ProjectWithTeacher>>>(url);
    return response.data.data!;
  },

  /**
   * Get unique research fields for filtering
   */
  async getResearchFields(): Promise<string[]> {
    const response = await apiClient.get<ApiResponse<string[]>>('/api/projects/research-fields');
    return response.data.data || [];
  },

  /**
   * Get unique skills from all projects for filtering
   */
  async getProjectSkills(): Promise<string[]> {
    const response = await apiClient.get<ApiResponse<string[]>>('/api/projects/skills');
    return response.data.data || [];
  },
};

export default projectService;
