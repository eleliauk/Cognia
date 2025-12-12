import { z } from 'zod';

// Score validation helper (1-5 range)
const scoreSchema = z
  .number()
  .int('Score must be an integer')
  .min(1, 'Score must be at least 1')
  .max(5, 'Score cannot exceed 5');

export const createEvaluationSchema = z.object({
  internshipId: z.string().uuid('Invalid internship ID format'),
  overallScore: scoreSchema,
  technicalSkills: scoreSchema,
  communication: scoreSchema,
  initiative: scoreSchema,
  reliability: scoreSchema,
  feedback: z
    .string()
    .min(10, 'Feedback must be at least 10 characters')
    .max(2000, 'Feedback cannot exceed 2000 characters'),
  strengths: z.string().max(1000, 'Strengths cannot exceed 1000 characters').optional(),
  improvements: z.string().max(1000, 'Improvements cannot exceed 1000 characters').optional(),
});

export type CreateEvaluationInput = z.infer<typeof createEvaluationSchema>;
