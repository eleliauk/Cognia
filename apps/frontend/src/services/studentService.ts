import apiClient from './apiClient';
import type {
  Project,
  Application,
  Internship,
  Evaluation,
  StudentProfile,
  ProjectExperience,
  ApiResponse,
} from '@/types';

// Student Statistics Types
export interface StudentStats {
  recommendedProjects: number;
  totalApplications: number;
  pendingApplications: number;
  acceptedApplications: number;
  rejectedApplications: number;
  activeInternships: number;
  completedInternships: number;
  profileCompleteness: number;
}

// Recommendation Types
export interface ProjectRecommendation {
  project: Project & {
    teacher?: {
      id: string;
      name: string;
      email: string;
      teacherProfile?: {
        department: string;
        title: string;
      };
    };
  };
  score: number;
  reasoning: string;
  matchedSkills: string[];
}

// Application with project info
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
    };
  };
  matchReasoning?: string;
}

// Internship with details for student
export interface StudentInternshipDetails extends Internship {
  project?: {
    id: string;
    title: string;
    description: string;
    teacher?: {
      id: string;
      name: string;
    };
  };
  milestones?: Milestone[];
  documents?: Document[];
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

export interface Document {
  id: string;
  filename: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: string;
  fileSize: number;
  mimeType: string;
}

// Profile DTOs
export interface CreateProfileDTO {
  studentNumber: string;
  major: string;
  grade: number;
  gpa: number;
  skills: string[];
  researchInterests: string[];
  academicBackground?: string;
  selfIntroduction?: string;
}

export interface UpdateProfileDTO {
  major?: string;
  grade?: number;
  gpa?: number;
  skills?: string[];
  researchInterests?: string[];
  academicBackground?: string;
  selfIntroduction?: string;
}

export interface CreateExperienceDTO {
  title: string;
  description: string;
  role: string;
  duration: string;
  achievements?: string;
}

export interface UpdateExperienceDTO extends Partial<CreateExperienceDTO> {}

// Application DTO
export interface CreateApplicationDTO {
  projectId: string;
  coverLetter: string;
}

// Student Service
export const studentService = {
  // Profile
  async getMyProfile(): Promise<StudentProfile | null> {
    try {
      const response = await apiClient.get<ApiResponse<StudentProfile>>('/api/students/profile');
      return response.data.data || null;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 404) {
          return null;
        }
      }
      throw error;
    }
  },

  async createProfile(data: CreateProfileDTO): Promise<StudentProfile> {
    const response = await apiClient.post<ApiResponse<StudentProfile>>(
      '/api/students/profile',
      data
    );
    return response.data.data!;
  },

  async updateProfile(data: UpdateProfileDTO): Promise<StudentProfile> {
    const response = await apiClient.put<ApiResponse<StudentProfile>>(
      '/api/students/profile',
      data
    );
    return response.data.data!;
  },

  // Project Experiences
  async addExperience(data: CreateExperienceDTO): Promise<ProjectExperience> {
    const response = await apiClient.post<ApiResponse<ProjectExperience>>(
      '/api/students/profile/experiences',
      data
    );
    return response.data.data!;
  },

  async updateExperience(
    experienceId: string,
    data: UpdateExperienceDTO
  ): Promise<ProjectExperience> {
    const response = await apiClient.put<ApiResponse<ProjectExperience>>(
      `/api/students/profile/experiences/${experienceId}`,
      data
    );
    return response.data.data!;
  },

  async deleteExperience(experienceId: string): Promise<void> {
    await apiClient.delete(`/api/students/profile/experiences/${experienceId}`);
  },

  // Recommendations
  async getRecommendations(limit: number = 10): Promise<ProjectRecommendation[]> {
    const response = await apiClient.get<ApiResponse<ProjectRecommendation[]>>(
      `/api/matching/recommendations?limit=${limit}`
    );
    return response.data.data || [];
  },

  // Applications
  async getMyApplications(): Promise<ApplicationWithProject[]> {
    const response = await apiClient.get<ApiResponse<ApplicationWithProject[]>>(
      '/api/applications/student/my'
    );
    return response.data.data || [];
  },

  async submitApplication(data: CreateApplicationDTO): Promise<Application> {
    const response = await apiClient.post<ApiResponse<Application>>('/api/applications', data);
    return response.data.data!;
  },

  async withdrawApplication(applicationId: string): Promise<Application> {
    const response = await apiClient.delete<ApiResponse<Application>>(
      `/api/applications/${applicationId}`
    );
    return response.data.data!;
  },

  // Internships
  async getMyInternships(): Promise<StudentInternshipDetails[]> {
    const response =
      await apiClient.get<ApiResponse<StudentInternshipDetails[]>>('/api/internships');
    return response.data.data || [];
  },

  async getInternshipById(id: string): Promise<StudentInternshipDetails> {
    const response = await apiClient.get<ApiResponse<StudentInternshipDetails>>(
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

  // Documents
  async uploadDocument(internshipId: string, file: File): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<ApiResponse<Document>>(
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

  async getDocuments(internshipId: string): Promise<Document[]> {
    const response = await apiClient.get<ApiResponse<Document[]>>(
      `/api/internships/${internshipId}/documents`
    );
    return response.data.data || [];
  },

  async deleteDocument(internshipId: string, documentId: string): Promise<void> {
    await apiClient.delete(`/api/internships/${internshipId}/documents/${documentId}`);
  },

  // Evaluations
  async getMyEvaluations(studentId: string): Promise<Evaluation[]> {
    const response = await apiClient.get<ApiResponse<Evaluation[]>>(
      `/api/students/${studentId}/evaluations`
    );
    return response.data.data || [];
  },

  async getEvaluationByInternship(internshipId: string): Promise<Evaluation | null> {
    try {
      const response = await apiClient.get<ApiResponse<Evaluation>>(
        `/api/evaluations/internship/${internshipId}`
      );
      return response.data.data || null;
    } catch {
      return null;
    }
  },

  // Dashboard Stats
  async getDashboardStats(): Promise<StudentStats> {
    // Aggregate stats from multiple endpoints
    const [profile, applications, internships, recommendations] = await Promise.all([
      this.getMyProfile().catch(() => null),
      this.getMyApplications().catch(() => []),
      this.getMyInternships().catch(() => []),
      this.getRecommendations(10).catch(() => []),
    ]);

    const pendingApps = applications.filter(
      (a) => a.status === 'PENDING' || a.status === 'REVIEWING'
    );
    const acceptedApps = applications.filter((a) => a.status === 'ACCEPTED');
    const rejectedApps = applications.filter((a) => a.status === 'REJECTED');
    const activeInterns = internships.filter((i) => i.status === 'IN_PROGRESS');
    const completedInterns = internships.filter((i) => i.status === 'COMPLETED');

    return {
      recommendedProjects: recommendations.length,
      totalApplications: applications.length,
      pendingApplications: pendingApps.length,
      acceptedApplications: acceptedApps.length,
      rejectedApplications: rejectedApps.length,
      activeInternships: activeInterns.length,
      completedInternships: completedInterns.length,
      profileCompleteness: profile?.completeness || 0,
    };
  },
};

export default studentService;
