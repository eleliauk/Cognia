// Re-export store types
export type { User, UserRole, AuthTokens } from '@/stores/authStore';
export type { Notification, NotificationType } from '@/stores/notificationStore';

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Project types
export type ProjectStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'COMPLETED';

export interface Project {
  id: string;
  teacherId: string;
  title: string;
  description: string;
  requirements: string;
  requiredSkills: string[];
  researchField: string;
  duration: number;
  positions: number;
  startDate: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

// Application types
export type ApplicationStatus = 'PENDING' | 'REVIEWING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export interface Application {
  id: string;
  studentId: string;
  projectId: string;
  coverLetter: string;
  status: ApplicationStatus;
  matchScore?: number;
  appliedAt: string;
  reviewedAt?: string;
}

// Internship types
export type InternshipStatus = 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'TERMINATED';

export interface Internship {
  id: string;
  applicationId: string;
  studentId: string;
  projectId: string;
  status: InternshipStatus;
  progress: number;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Student profile types
export interface ProjectExperience {
  id: string;
  title: string;
  description: string;
  role: string;
  duration: string;
  achievements?: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  studentNumber: string;
  major: string;
  grade: number;
  gpa: number;
  skills: string[];
  researchInterests: string[];
  academicBackground?: string;
  selfIntroduction?: string;
  completeness: number;
  projectExperiences: ProjectExperience[];
}

// Teacher profile types
export interface TeacherProfile {
  id: string;
  userId: string;
  department: string;
  title: string;
  researchFields: string[];
  bio?: string;
}

// Matching types
export interface MatchResult {
  projectId: string;
  studentId: string;
  score: number;
  reasoning: string;
  matchedSkills: string[];
  timestamp: string;
}

// Evaluation types
export interface Evaluation {
  id: string;
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
  createdAt: string;
}
