import apiClient from './apiClient';
import type { Internship, Evaluation, ApiResponse } from '@/types';

// Milestone type
export interface Milestone {
  id: string;
  internshipId: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  completedAt?: string;
}

// Document type
export interface InternshipDocument {
  id: string;
  internshipId: string;
  filename: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: string;
  fileSize: number;
  mimeType: string;
}

// Internship with full details
export interface InternshipDetails extends Internship {
  student?: {
    id: string;
    name: string;
    email: string;
    studentProfile?: {
      major: string;
      grade: number;
      skills: string[];
    };
  };
  project?: {
    id: string;
    title: string;
    description: string;
    researchField: string;
    teacher?: {
      id: string;
      name: string;
      email: string;
    };
  };
  milestones: Milestone[];
  documents: InternshipDocument[];
  evaluation?: Evaluation;
}

// DTOs
export interface CreateMilestoneDTO {
  title: string;
  description: string;
  dueDate: string;
}

export interface UpdateMilestoneDTO {
  title?: string;
  description?: string;
  dueDate?: string;
}

export interface UpdateProgressDTO {
  progress: number;
}

export interface UpdateStatusDTO {
  status: 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'TERMINATED';
}

// Internship Service - shared operations for both teachers and students
export const internshipService = {
  /**
   * Get internship by ID with full details
   */
  async getInternshipById(id: string): Promise<InternshipDetails> {
    const response = await apiClient.get<ApiResponse<InternshipDetails>>(`/api/internships/${id}`);
    return response.data.data!;
  },

  /**
   * Get all internships for current user (filtered by role on backend)
   */
  async getMyInternships(): Promise<InternshipDetails[]> {
    const response = await apiClient.get<ApiResponse<InternshipDetails[]>>('/api/internships');
    return response.data.data || [];
  },

  /**
   * Update internship progress
   */
  async updateProgress(id: string, progress: number): Promise<Internship> {
    const response = await apiClient.put<ApiResponse<Internship>>(
      `/api/internships/${id}/progress`,
      { progress }
    );
    return response.data.data!;
  },

  /**
   * Update internship status
   */
  async updateStatus(
    id: string,
    status: 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'TERMINATED'
  ): Promise<Internship> {
    const response = await apiClient.put<ApiResponse<Internship>>(`/api/internships/${id}/status`, {
      status,
    });
    return response.data.data!;
  },

  // Milestone operations
  /**
   * Create a new milestone
   */
  async createMilestone(internshipId: string, data: CreateMilestoneDTO): Promise<Milestone> {
    const response = await apiClient.post<ApiResponse<Milestone>>(
      `/api/internships/${internshipId}/milestones`,
      data
    );
    return response.data.data!;
  },

  /**
   * Update a milestone
   */
  async updateMilestone(
    internshipId: string,
    milestoneId: string,
    data: UpdateMilestoneDTO
  ): Promise<Milestone> {
    const response = await apiClient.put<ApiResponse<Milestone>>(
      `/api/internships/${internshipId}/milestones/${milestoneId}`,
      data
    );
    return response.data.data!;
  },

  /**
   * Mark milestone as complete
   */
  async completeMilestone(internshipId: string, milestoneId: string): Promise<Milestone> {
    const response = await apiClient.put<ApiResponse<Milestone>>(
      `/api/internships/${internshipId}/milestones/${milestoneId}/complete`
    );
    return response.data.data!;
  },

  /**
   * Delete a milestone
   */
  async deleteMilestone(internshipId: string, milestoneId: string): Promise<void> {
    await apiClient.delete(`/api/internships/${internshipId}/milestones/${milestoneId}`);
  },

  // Document operations
  /**
   * Upload a document
   */
  async uploadDocument(internshipId: string, file: File): Promise<InternshipDocument> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ApiResponse<InternshipDocument>>(
      `/api/internships/${internshipId}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data!;
  },

  /**
   * Get all documents for an internship
   */
  async getDocuments(internshipId: string): Promise<InternshipDocument[]> {
    const response = await apiClient.get<ApiResponse<InternshipDocument[]>>(
      `/api/internships/${internshipId}/documents`
    );
    return response.data.data || [];
  },

  /**
   * Delete a document
   */
  async deleteDocument(internshipId: string, documentId: string): Promise<void> {
    await apiClient.delete(`/api/internships/${internshipId}/documents/${documentId}`);
  },

  /**
   * Download a document (returns blob URL)
   */
  async downloadDocument(internshipId: string, documentId: string): Promise<string> {
    const response = await apiClient.get(
      `/api/internships/${internshipId}/documents/${documentId}/download`,
      { responseType: 'blob' }
    );
    return URL.createObjectURL(response.data);
  },
};

export default internshipService;
