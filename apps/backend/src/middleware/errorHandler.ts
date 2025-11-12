import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../types';
import type { ApiResponse } from '../types';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  // Log error
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '输入数据验证失败',
        details: err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
      timestamp: new Date().toISOString(),
    };
    return res.status(400).json(response);
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      timestamp: new Date().toISOString(),
    };
    return res.status(err.statusCode).json(response);
  }

  // Handle JWT errors
  if (err.message === 'TOKEN_EXPIRED') {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: '令牌已过期',
      },
      timestamp: new Date().toISOString(),
    };
    return res.status(401).json(response);
  }

  if (err.message === 'INVALID_TOKEN') {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: '无效的令牌',
      },
      timestamp: new Date().toISOString(),
    };
    return res.status(401).json(response);
  }

  // Default error response
  const response: ApiResponse = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message,
    },
    timestamp: new Date().toISOString(),
  };

  res.status(500).json(response);
}
