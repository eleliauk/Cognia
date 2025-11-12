import type { Request } from 'express';

export enum UserRole {
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN',
}

export interface AuthUser {
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

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super('VALIDATION_ERROR', message, 400, details);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = '未授权访问') {
    super('UNAUTHORIZED', message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = '权限不足') {
    super('FORBIDDEN', message, 403);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = '资源不存在') {
    super('NOT_FOUND', message, 404);
    this.name = 'NotFoundError';
  }
}
