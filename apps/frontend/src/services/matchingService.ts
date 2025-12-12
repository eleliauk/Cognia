import apiClient from './apiClient';
import type { ApiResponse } from '@/types';

// Match result type
export interface MatchResult {
  projectId: string;
  studentId: string;
  score: number;
  reasoning: string;
  matchedSkills: string[];
  timestamp: string;
}

// Match score breakdown
export interface MatchScore {
  overall: number;
  skillMatch: number;
  interestMatch: number;
  experienceMatch: number;
  reasoning: string;
  suggestions?: string;
}

// Project recommendation with full project data
export interface ProjectRecommendation {
  project: {
    id: string;
    title: string;
    description: string;
    requirements: string;
    requiredSkills: string[];
    researchField: string;
    duration: number;
    positions: number;
    startDate: string;
    status: string;
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
  };
  score: number;
  reasoning: string;
  matchedSkills: string[];
}

// Student recommendation for a project
export interface StudentRecommendation {
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
  score: number;
  reasoning: string;
  matchedSkills: string[];
}

// Calculate match request
export interface CalculateMatchRequest {
  studentId: string;
  projectId: string;
}

// Matching metrics for analytics
export interface MatchingMetrics {
  totalMatches: number;
  avgMatchScore: number;
  llmApiCalls: number;
  llmSuccessRate: number;
  fallbackUsage: number;
  scoreDistribution: {
    range: string;
    count: number;
  }[];
  topMatchedSkills: {
    skill: string;
    count: number;
  }[];
}

// Matching Service
export const matchingService = {
  /**
   * Get project recommendations for a student
   */
  async getRecommendations(limit: number = 10): Promise<ProjectRecommendation[]> {
    const response = await apiClient.get<ApiResponse<ProjectRecommendation[]>>(
      `/api/matching/recommendations?limit=${limit}`
    );
    return response.data.data || [];
  },

  /**
   * Get student recommendations for a project (for teachers)
   */
  async getStudentRecommendations(
    projectId: string,
    limit: number = 10
  ): Promise<StudentRecommendation[]> {
    const response = await apiClient.get<ApiResponse<StudentRecommendation[]>>(
      `/api/matching/project/${projectId}/students?limit=${limit}`
    );
    return response.data.data || [];
  },

  /**
   * Calculate match score between a student and project
   */
  async calculateMatchScore(studentId: string, projectId: string): Promise<MatchScore> {
    const response = await apiClient.post<ApiResponse<MatchScore>>('/api/matching/calculate', {
      studentId,
      projectId,
    });
    return response.data.data!;
  },

  /**
   * Get matching metrics (for admin analytics)
   */
  async getMatchingMetrics(startDate?: string, endDate?: string): Promise<MatchingMetrics> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const url = `/api/analytics/matching${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await apiClient.get<ApiResponse<MatchingMetrics>>(url);
    return response.data.data!;
  },

  /**
   * Refresh recommendations (invalidate cache and recalculate)
   */
  async refreshRecommendations(): Promise<ProjectRecommendation[]> {
    const response = await apiClient.post<ApiResponse<ProjectRecommendation[]>>(
      '/api/matching/recommendations/refresh'
    );
    return response.data.data || [];
  },

  /**
   * Get cached match result if available
   */
  async getCachedMatch(studentId: string, projectId: string): Promise<MatchResult | null> {
    try {
      const response = await apiClient.get<ApiResponse<MatchResult>>(
        `/api/matching/cache?studentId=${studentId}&projectId=${projectId}`
      );
      return response.data.data || null;
    } catch {
      return null;
    }
  },
};

export default matchingService;
