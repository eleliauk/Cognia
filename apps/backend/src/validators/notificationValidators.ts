import { z } from 'zod';

export const getNotificationsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().positive()),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().min(1).max(100)),
  unreadOnly: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

export const markAsReadParamsSchema = z.object({
  id: z.string().uuid('Invalid notification ID'),
});

export type GetNotificationsQuery = z.infer<typeof getNotificationsQuerySchema>;
export type MarkAsReadParams = z.infer<typeof markAsReadParamsSchema>;
