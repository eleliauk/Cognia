import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores';

// API base URL from environment or default
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Error codes for typed error handling
export enum ApiErrorCode {
  // Authentication errors (1xxx)
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // Validation errors (2xxx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',

  // Business logic errors (3xxx)
  DUPLICATE_APPLICATION = 'DUPLICATE_APPLICATION',
  PROJECT_NOT_ACTIVE = 'PROJECT_NOT_ACTIVE',
  PROFILE_INCOMPLETE = 'PROFILE_INCOMPLETE',
  POSITIONS_FULL = 'POSITIONS_FULL',

  // Resource errors (4xxx)
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',

  // External service errors (5xxx)
  LLM_API_ERROR = 'LLM_API_ERROR',
  LLM_API_TIMEOUT = 'LLM_API_TIMEOUT',

  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// Typed API error response
export interface ApiError {
  code: ApiErrorCode | string;
  message: string;
  details?: Record<string, string>;
}

// Custom error class for API errors
export class ApiRequestError extends Error {
  public readonly code: ApiErrorCode | string;
  public readonly status: number;
  public readonly details?: Record<string, string>;

  constructor(
    message: string,
    code: ApiErrorCode | string = ApiErrorCode.UNKNOWN_ERROR,
    status: number = 500,
    details?: Record<string, string>
  ) {
    super(message);
    this.name = 'ApiRequestError';
    this.code = code;
    this.status = status;
    this.details = details;
  }

  static fromAxiosError(error: AxiosError<{ error?: ApiError }>): ApiRequestError {
    if (error.response) {
      const { status, data } = error.response;
      const apiError = data?.error;
      return new ApiRequestError(
        apiError?.message || error.message || 'Request failed',
        apiError?.code || ApiErrorCode.UNKNOWN_ERROR,
        status,
        apiError?.details
      );
    }

    if (error.code === 'ECONNABORTED') {
      return new ApiRequestError('Request timeout', ApiErrorCode.TIMEOUT_ERROR, 0);
    }

    if (!error.response) {
      return new ApiRequestError(
        'Network error - please check your connection',
        ApiErrorCode.NETWORK_ERROR,
        0
      );
    }

    return new ApiRequestError(
      error.message || 'Unknown error occurred',
      ApiErrorCode.UNKNOWN_ERROR,
      0
    );
  }
}

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// Subscribe to token refresh
const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

// Notify all subscribers with new token
const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

// Create axios instance with configuration
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Request interceptor - add auth token and update last activity
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { tokens, updateLastActivity } = useAuthStore.getState();

    // Add authorization header if token exists
    if (tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }

    // Update last activity timestamp for session management
    updateLastActivity();

    return config;
  },
  (error) => {
    return Promise.reject(ApiRequestError.fromAxiosError(error));
  }
);

// Response interceptor - handle errors and token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Return successful response as-is
    return response;
  },
  async (error: AxiosError<{ error?: ApiError }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 Unauthorized - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      const authStore = useAuthStore.getState();
      const { tokens, setTokens, logout, setRefreshing } = authStore;

      // Check if we have a refresh token
      if (!tokens?.refreshToken) {
        logout();
        window.location.href = '/login';
        return Promise.reject(
          new ApiRequestError(
            'Session expired. Please login again.',
            ApiErrorCode.TOKEN_EXPIRED,
            401
          )
        );
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken: string) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      setRefreshing(true);

      try {
        // Attempt to refresh the token
        const response = await axios.post(
          `${API_BASE_URL}/api/auth/refresh`,
          { refreshToken: tokens.refreshToken },
          { timeout: 10000 }
        );

        const { accessToken, refreshToken } = response.data.data;

        // Update tokens in store
        setTokens({ accessToken, refreshToken });

        // Notify all queued requests
        onTokenRefreshed(accessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        refreshSubscribers = [];
        logout();
        window.location.href = '/login';
        return Promise.reject(
          new ApiRequestError(
            'Session expired. Please login again.',
            ApiErrorCode.TOKEN_EXPIRED,
            401
          )
        );
      } finally {
        isRefreshing = false;
        setRefreshing(false);
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      return Promise.reject(
        new ApiRequestError(
          'You do not have permission to perform this action.',
          ApiErrorCode.INSUFFICIENT_PERMISSIONS,
          403
        )
      );
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      return Promise.reject(
        new ApiRequestError(
          'The requested resource was not found.',
          ApiErrorCode.RESOURCE_NOT_FOUND,
          404
        )
      );
    }

    // Handle 422 Validation Error
    if (error.response?.status === 422) {
      const apiError = error.response.data?.error;
      return Promise.reject(
        new ApiRequestError(
          apiError?.message || 'Validation failed',
          ApiErrorCode.VALIDATION_ERROR,
          422,
          apiError?.details
        )
      );
    }

    // Handle 429 Rate Limit
    if (error.response?.status === 429) {
      return Promise.reject(
        new ApiRequestError(
          'Too many requests. Please try again later.',
          'RATE_LIMIT_EXCEEDED',
          429
        )
      );
    }

    // Handle 500+ Server Errors
    if (error.response && error.response.status >= 500) {
      return Promise.reject(
        new ApiRequestError(
          'Server error. Please try again later.',
          'SERVER_ERROR',
          error.response.status
        )
      );
    }

    // Default error handling
    return Promise.reject(ApiRequestError.fromAxiosError(error));
  }
);

// Helper function to check if error is an ApiRequestError
export const isApiError = (error: unknown): error is ApiRequestError => {
  return error instanceof ApiRequestError;
};

// Helper function to get user-friendly error message
export const getErrorMessage = (error: unknown): string => {
  if (isApiError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// Helper function to check if error is a specific type
export const isErrorCode = (error: unknown, code: ApiErrorCode | string): boolean => {
  return isApiError(error) && error.code === code;
};

export default apiClient;
