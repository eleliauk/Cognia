import type { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCode } from '../types';
import type { ApiResponse } from '../types';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

/**
 * 创建标准化的错误响应
 */
function createErrorResponse(code: string, message: string, details?: any): ApiResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * 处理 Zod 验证错误
 */
function handleZodError(err: ZodError): { response: ApiResponse; statusCode: number } {
  const details = err.errors.map((e) => ({
    field: e.path.join('.'),
    message: e.message,
    code: e.code,
  }));

  return {
    response: createErrorResponse(ErrorCode.VALIDATION_ERROR, '输入数据验证失败', details),
    statusCode: 400,
  };
}

/**
 * 处理 Prisma 数据库错误
 */
function handlePrismaError(err: Prisma.PrismaClientKnownRequestError): {
  response: ApiResponse;
  statusCode: number;
} {
  switch (err.code) {
    case 'P2002': {
      // 唯一约束违反
      const target = (err.meta?.target as string[])?.join(', ') || '字段';
      return {
        response: createErrorResponse(
          ErrorCode.RESOURCE_ALREADY_EXISTS,
          `${target} 已存在，请使用其他值`,
          { constraint: target }
        ),
        statusCode: 409,
      };
    }
    case 'P2003': {
      // 外键约束违反
      return {
        response: createErrorResponse(ErrorCode.VALIDATION_ERROR, '关联的资源不存在', {
          field: err.meta?.field_name,
        }),
        statusCode: 400,
      };
    }
    case 'P2025': {
      // 记录不存在
      return {
        response: createErrorResponse(ErrorCode.RESOURCE_NOT_FOUND, '请求的资源不存在'),
        statusCode: 404,
      };
    }
    case 'P2014': {
      // 关系违反
      return {
        response: createErrorResponse(ErrorCode.VALIDATION_ERROR, '操作违反了数据关系约束'),
        statusCode: 400,
      };
    }
    default:
      return {
        response: createErrorResponse(ErrorCode.DATABASE_ERROR, '数据库操作失败，请稍后重试'),
        statusCode: 500,
      };
  }
}

/**
 * 处理 JWT 相关错误
 */
function handleJwtError(err: Error): { response: ApiResponse; statusCode: number } | null {
  if (err.name === 'JsonWebTokenError' || err.message === 'INVALID_TOKEN') {
    return {
      response: createErrorResponse(ErrorCode.INVALID_TOKEN, '无效的令牌'),
      statusCode: 401,
    };
  }

  if (err.name === 'TokenExpiredError' || err.message === 'TOKEN_EXPIRED') {
    return {
      response: createErrorResponse(ErrorCode.TOKEN_EXPIRED, '令牌已过期，请重新登录'),
      statusCode: 401,
    };
  }

  return null;
}

/**
 * 处理语法错误（如 JSON 解析错误）
 */
function handleSyntaxError(err: SyntaxError): { response: ApiResponse; statusCode: number } | null {
  if ('body' in err) {
    return {
      response: createErrorResponse(ErrorCode.VALIDATION_ERROR, '请求体格式错误，请检查 JSON 格式'),
      statusCode: 400,
    };
  }
  return null;
}

/**
 * 全局错误处理中间件
 * 统一处理所有类型的错误并返回标准化的错误响应
 */
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  // 记录错误日志
  logger.error('Error occurred:', {
    error: err.message,
    name: err.name,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
    userId: (req as any).user?.userId,
  });

  // 1. 处理 Zod 验证错误
  if (err instanceof ZodError) {
    const { response, statusCode } = handleZodError(err);
    return res.status(statusCode).json(response);
  }

  // 2. 处理自定义 AppError
  if (err instanceof AppError) {
    const response = createErrorResponse(err.code, err.message, err.details);
    return res.status(err.statusCode).json(response);
  }

  // 3. 处理 Prisma 已知请求错误
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const { response, statusCode } = handlePrismaError(err);
    return res.status(statusCode).json(response);
  }

  // 4. 处理 Prisma 验证错误
  if (err instanceof Prisma.PrismaClientValidationError) {
    const response = createErrorResponse(
      ErrorCode.VALIDATION_ERROR,
      '数据验证失败，请检查输入数据'
    );
    return res.status(400).json(response);
  }

  // 5. 处理 Prisma 初始化错误
  if (err instanceof Prisma.PrismaClientInitializationError) {
    const response = createErrorResponse(ErrorCode.DATABASE_ERROR, '数据库连接失败，请稍后重试');
    return res.status(503).json(response);
  }

  // 6. 处理 JWT 错误
  const jwtResult = handleJwtError(err);
  if (jwtResult) {
    return res.status(jwtResult.statusCode).json(jwtResult.response);
  }

  // 7. 处理 JSON 语法错误
  if (err instanceof SyntaxError) {
    const syntaxResult = handleSyntaxError(err);
    if (syntaxResult) {
      return res.status(syntaxResult.statusCode).json(syntaxResult.response);
    }
  }

  // 8. 处理类型错误
  if (err instanceof TypeError) {
    const response = createErrorResponse(
      ErrorCode.INTERNAL_SERVER_ERROR,
      process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message
    );
    return res.status(500).json(response);
  }

  // 9. 默认错误响应
  const response = createErrorResponse(
    ErrorCode.INTERNAL_SERVER_ERROR,
    process.env.NODE_ENV === 'production' ? '服务器内部错误，请稍后重试' : err.message
  );

  res.status(500).json(response);
}

/**
 * 404 路由未找到处理器
 */
export function notFoundHandler(req: Request, res: Response) {
  const response = createErrorResponse(
    ErrorCode.RESOURCE_NOT_FOUND,
    `路由 ${req.method} ${req.path} 不存在`
  );
  res.status(404).json(response);
}

/**
 * 异步错误包装器 - 用于包装异步路由处理函数
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
