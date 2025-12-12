import apiClient from './apiClient';
import type { ApiResponse } from '@/types';

// Admin Statistics Types
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
    createdAt: string;
  }[];
}

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

export interface SystemMonitoringData {
  llmApiStats: {
    totalCalls: number;
    successRate: number;
    avgResponseTime: number;
    fallbackUsage: number;
  };
  databaseStats: {
    totalUsers: number;
    totalProjects: number;
    totalApplications: number;
    totalInternships: number;
    totalNotifications: number;
  };
  cacheStats: {
    totalCacheEntries: number;
    expiredEntries: number;
  };
  errorLogs: ErrorLog[];
  auditLogs: AuditLog[];
}

export interface ErrorLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  details: unknown;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userRole?: string;
  action: string;
  resource: string;
  details: unknown;
  ipAddress: string | null;
  createdAt: string;
}

// User Management Types
export interface UserListParams {
  page?: number;
  pageSize?: number;
  role?: 'TEACHER' | 'STUDENT' | 'ADMIN';
  isActive?: boolean;
  search?: string;
  sortBy?: 'createdAt' | 'name' | 'email';
  sortOrder?: 'asc' | 'desc';
}

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: 'TEACHER' | 'STUDENT' | 'ADMIN';
  phone: string | null;
  avatar: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserListResponse {
  users: UserInfo[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface AuditLogListParams {
  page?: number;
  pageSize?: number;
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: string;
  endDate?: string;
}

export interface AuditLogListResponse {
  logs: AuditLog[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Admin Service
export const adminService = {
  // Analytics
  async getAdminDashboard(startDate?: string, endDate?: string): Promise<AdminStats> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const url = `/api/analytics/admin${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await apiClient.get<ApiResponse<AdminStats>>(url);
    return response.data.data!;
  },

  async getMatchingMetrics(startDate?: string, endDate?: string): Promise<MatchingMetrics> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const url = `/api/analytics/matching${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await apiClient.get<ApiResponse<MatchingMetrics>>(url);
    return response.data.data!;
  },

  // System Monitoring
  async getSystemMonitoring(): Promise<SystemMonitoringData> {
    const response =
      await apiClient.get<ApiResponse<SystemMonitoringData>>('/api/admin/monitoring');
    return response.data.data!;
  },

  // User Management
  async getUserList(params: UserListParams = {}): Promise<UserListResponse> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.role) queryParams.append('role', params.role);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const url = `/api/admin/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<ApiResponse<UserListResponse>>(url);
    return response.data.data!;
  },

  async getUserById(userId: string): Promise<UserInfo> {
    const response = await apiClient.get<ApiResponse<UserInfo>>(`/api/admin/users/${userId}`);
    return response.data.data!;
  },

  async updateUserRole(userId: string, role: 'TEACHER' | 'STUDENT' | 'ADMIN'): Promise<UserInfo> {
    const response = await apiClient.put<ApiResponse<UserInfo>>(`/api/admin/users/${userId}/role`, {
      role,
    });
    return response.data.data!;
  },

  async setUserActiveStatus(userId: string, isActive: boolean): Promise<UserInfo> {
    const response = await apiClient.put<ApiResponse<UserInfo>>(
      `/api/admin/users/${userId}/status`,
      { isActive }
    );
    return response.data.data!;
  },

  async deleteUser(userId: string): Promise<void> {
    await apiClient.delete(`/api/admin/users/${userId}`);
  },

  // Audit Logs
  async getAuditLogs(params: AuditLogListParams = {}): Promise<AuditLogListResponse> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.userId) queryParams.append('userId', params.userId);
    if (params.action) queryParams.append('action', params.action);
    if (params.resource) queryParams.append('resource', params.resource);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    const url = `/api/admin/audit-logs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<ApiResponse<AuditLogListResponse>>(url);
    return response.data.data!;
  },
};

export default adminService;
