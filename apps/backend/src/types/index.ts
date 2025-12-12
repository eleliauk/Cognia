import type { Request } from 'express';

export enum UserRole {
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN',
}

export interface AuthUser {
  id: string;
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

/**
 * 错误代码枚举 - 统一的错误代码定义
 */
export enum ErrorCode {
  // 认证错误
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // 验证错误
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',

  // 业务逻辑错误
  DUPLICATE_APPLICATION = 'DUPLICATE_APPLICATION',
  PROJECT_NOT_ACTIVE = 'PROJECT_NOT_ACTIVE',
  PROFILE_INCOMPLETE = 'PROFILE_INCOMPLETE',
  POSITIONS_FULL = 'POSITIONS_FULL',
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',

  // 资源错误
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  PROJECT_NOT_FOUND = 'PROJECT_NOT_FOUND',
  APPLICATION_NOT_FOUND = 'APPLICATION_NOT_FOUND',
  INTERNSHIP_NOT_FOUND = 'INTERNSHIP_NOT_FOUND',

  // 外部服务错误
  LLM_API_ERROR = 'LLM_API_ERROR',
  LLM_API_TIMEOUT = 'LLM_API_TIMEOUT',
  DATABASE_ERROR = 'DATABASE_ERROR',

  // 系统错误
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

/**
 * 基础应用错误类
 */
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 验证错误 - 用于输入数据验证失败
 */
export class ValidationError extends AppError {
  constructor(message: string = '输入数据验证失败', details?: any) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * 未授权错误 - 用于未登录或令牌无效
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = '未授权访问', code: string = ErrorCode.UNAUTHORIZED) {
    super(code, message, 401);
    this.name = 'UnauthorizedError';
  }
}

/**
 * 禁止访问错误 - 用于权限不足
 */
export class ForbiddenError extends AppError {
  constructor(message: string = '权限不足') {
    super(ErrorCode.INSUFFICIENT_PERMISSIONS, message, 403);
    this.name = 'ForbiddenError';
  }
}

/**
 * 资源不存在错误
 */
export class NotFoundError extends AppError {
  constructor(message: string = '资源不存在', code: string = ErrorCode.RESOURCE_NOT_FOUND) {
    super(code, message, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * 重复资源错误 - 用于资源已存在的情况
 */
export class ConflictError extends AppError {
  constructor(message: string = '资源已存在', code: string = ErrorCode.RESOURCE_ALREADY_EXISTS) {
    super(code, message, 409);
    this.name = 'ConflictError';
  }
}

/**
 * 业务逻辑错误 - 用于业务规则违反
 */
export class BusinessError extends AppError {
  constructor(code: string, message: string, details?: any) {
    super(code, message, 400, details);
    this.name = 'BusinessError';
  }
}

/**
 * 外部服务错误 - 用于第三方服务调用失败
 */
export class ExternalServiceError extends AppError {
  constructor(
    message: string = '外部服务调用失败',
    code: string = ErrorCode.SERVICE_UNAVAILABLE,
    details?: any
  ) {
    super(code, message, 503, details);
    this.name = 'ExternalServiceError';
  }
}

/**
 * 速率限制错误
 */
export class RateLimitError extends AppError {
  constructor(message: string = '请求过于频繁，请稍后再试') {
    super(ErrorCode.RATE_LIMIT_EXCEEDED, message, 429);
    this.name = 'RateLimitError';
  }
}
