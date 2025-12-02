import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

/**
 * Middleware to validate request body or query against a Zod schema
 */
export function validateRequest(schema: ZodSchema, source: 'body' | 'query' = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const data = source === 'query' ? req.query : req.body;
      const validated = schema.parse(data);

      // Replace the original data with validated data
      if (source === 'query') {
        req.query = validated as any;
      } else {
        req.body = validated;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to validate request query parameters against a Zod schema
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated as any;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to validate request params against a Zod schema
 */
export function validateParams(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated as any;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to validate request body against a Zod schema
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      next(error);
    }
  };
}
