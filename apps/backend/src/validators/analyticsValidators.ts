import { z } from 'zod';

/**
 * Time range query parameters validation schema
 */
export const timeRangeQuerySchema = z
  .object({
    startDate: z
      .string()
      .datetime({ message: '开始日期格式不正确，请使用 ISO 8601 格式' })
      .optional(),
    endDate: z
      .string()
      .datetime({ message: '结束日期格式不正确，请使用 ISO 8601 格式' })
      .optional(),
  })
  .refine(
    (data) => {
      // If one date is provided, both must be provided
      if ((data.startDate && !data.endDate) || (!data.startDate && data.endDate)) {
        return false;
      }
      // If both dates are provided, startDate must be before endDate
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    {
      message: '开始日期必须早于或等于结束日期，且两个日期必须同时提供或同时省略',
    }
  );

/**
 * Teacher ID parameter validation schema
 */
export const teacherIdParamSchema = z.object({
  id: z.string().uuid({ message: '教师 ID 格式不正确' }),
});
