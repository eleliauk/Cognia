// API Client and Error Handling
export {
  apiClient,
  ApiErrorCode,
  ApiRequestError,
  isApiError,
  getErrorMessage,
  isErrorCode,
} from './apiClient';
export type { ApiError } from './apiClient';

// Services
export { authService } from './authService';
export { teacherService } from './teacherService';
export { studentService } from './studentService';
export { adminService } from './adminService';
export { socketService } from './socketService';
export { notificationService } from './notificationService';
export { projectService } from './projectService';
export { internshipService } from './internshipService';
export { evaluationService } from './evaluationService';
export { matchingService } from './matchingService';
export { applicationService } from './applicationService';

// Notification Types
export type { NotificationListResponse, NotificationListParams } from './notificationService';

// Teacher Service Types
export type {
  TeacherStats,
  CreateProjectDTO,
  UpdateProjectDTO,
  ApplicationWithStudent,
  InternshipWithDetails,
  Milestone,
  CreateMilestoneDTO,
  CreateEvaluationDTO,
} from './teacherService';

// Student Service Types
export type {
  StudentStats,
  ProjectRecommendation,
  ApplicationWithProject,
  StudentInternshipDetails,
  CreateProfileDTO,
  UpdateProfileDTO,
  CreateExperienceDTO,
  UpdateExperienceDTO,
  CreateApplicationDTO,
} from './studentService';

// Admin Service Types
export type {
  AdminStats,
  MatchingMetrics as AdminMatchingMetrics,
  SystemMonitoringData,
  ErrorLog,
  AuditLog,
  UserListParams,
  UserInfo,
  UserListResponse,
  AuditLogListParams,
  AuditLogListResponse,
} from './adminService';

// Project Service Types
export type { ProjectSearchParams, ProjectWithTeacher } from './projectService';

// Internship Service Types
export type {
  Milestone as InternshipMilestone,
  InternshipDocument,
  InternshipDetails,
  CreateMilestoneDTO as CreateInternshipMilestoneDTO,
  UpdateMilestoneDTO,
  UpdateProgressDTO,
  UpdateStatusDTO,
} from './internshipService';

// Evaluation Service Types
export type {
  CreateEvaluationDTO as CreateEvalDTO,
  UpdateEvaluationDTO,
  EvaluationWithDetails,
} from './evaluationService';

// Matching Service Types
export type {
  MatchResult,
  MatchScore,
  ProjectRecommendation as MatchingProjectRecommendation,
  StudentRecommendation,
  CalculateMatchRequest,
  MatchingMetrics,
} from './matchingService';

// Application Service Types
export type {
  ApplicationWithStudent as AppWithStudent,
  ApplicationWithProject as AppWithProject,
  CreateApplicationDTO,
  UpdateApplicationStatusDTO,
  ApplicationListParams,
} from './applicationService';
