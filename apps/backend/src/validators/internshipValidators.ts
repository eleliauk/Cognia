import { z } from 'zod';
import { InternshipStatus } from '@prisma/client';

export const createInternshipSchema = z.object({
  applicationId: z.string().uuid('Invalid application ID format'),
});

export const updateProgressSchema = z.object({
  progress: z
    .number()
    .int('Progress must be an integer')
    .min(0, 'Progress cannot be negative')
    .max(100, 'Progress cannot exceed 100'),
  status: z.nativeEnum(InternshipStatus).optional(),
});

export const updateStatusSchema = z.object({
  status: z.nativeEnum(InternshipStatus, {
    errorMap: () => ({ message: 'Invalid internship status' }),
  }),
});

export const createMilestoneSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title too long'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description too long'),
  dueDate: z.string().datetime('Invalid date format'),
});

export const updateMilestoneSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title too long')
    .optional(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description too long')
    .optional(),
  dueDate: z.string().datetime('Invalid date format').optional(),
  completed: z.boolean().optional(),
});
