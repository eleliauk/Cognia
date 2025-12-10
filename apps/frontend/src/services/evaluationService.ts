import apiClient from './apiClient';
import type { Evaluation, ApiResponse } from '@/types';

// Create evaluation DTO
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

// Update evaluation DTO
export interface UpdateEvaluationDTO {
  overallScore?: number;
  technicalSkills?: number;
  communication?: number;
  initiative?: number;
  reliability?: number;
  feedback?: string;
  strengths?: string;
  improvements?: string;
}

// Evaluation with related data
export interface EvaluationWithDetails extends Evaluation {
  internship?: {
    id: string;
    studentId: string;
    projectId: string;
    status: string;
    progress: number;
    student?: {
      id: string;
      name: string;
      email: string;
    };
    project?: {
      id: string;
      title: string;
    };
  };
  teacher?: {
    id: string;
    name: string;
    email: string;
  };
}

// Evaluation Service
export const evaluationService = {
  /**
   * Create a new evaluation for an internship
   */
  async createEvaluation(data: CreateEvaluationDTO): Promise<Evaluation> {
    const response = await apiClient.post<ApiResponse<Evaluation>>('/api/evaluations', data);
    return response.data.data!;
  },

  /**
   * Get evaluation by internship ID
   */
  async getEvaluationByInternship(internshipId: string): Promise<Evaluation | null> {
    try {
      const response = await apiClient.get<ApiResponse<Evaluation>>(
        `/api/evaluations/internship/${internshipId}`
      );
      return response.data.data || null;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Get all evaluations for a student
   */
  async getStudentEvaluations(studentId: string): Promise<EvaluationWithDetails[]> {
    const response = await apiClient.get<ApiResponse<EvaluationWithDetails[]>>(
      `/api/students/${studentId}/evaluations`
    );
    return response.data.data || [];
  },

  /**
   * Get all evaluations created by a teacher
   */
  async getTeacherEvaluations(teacherId: string): Promise<EvaluationWithDetails[]> {
    const response = await apiClient.get<ApiResponse<EvaluationWithDetails[]>>(
      `/api/teachers/${teacherId}/evaluations`
    );
    return response.data.data || [];
  },

  /**
   * Update an existing evaluation
   */
  async updateEvaluation(evaluationId: string, data: UpdateEvaluationDTO): Promise<Evaluation> {
    const response = await apiClient.put<ApiResponse<Evaluation>>(
      `/api/evaluations/${evaluationId}`,
      data
    );
    return response.data.data!;
  },

  /**
   * Delete an evaluation
   */
  async deleteEvaluation(evaluationId: string): Promise<void> {
    await apiClient.delete(`/api/evaluations/${evaluationId}`);
  },
};

export default evaluationService;
