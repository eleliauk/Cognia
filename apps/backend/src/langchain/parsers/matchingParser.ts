import { z } from 'zod';
import { StructuredOutputParser } from 'langchain/output_parsers';

/**
 * Zod schema for matching result output
 * Defines the structure of LLM response for student-project matching
 */
export const matchingOutputSchema = z.object({
  score: z.number().min(0).max(100).describe('总体匹配度评分（0-100分）'),

  skillMatch: z.number().min(0).max(100).describe('技能匹配度评分（0-100分）'),

  interestMatch: z.number().min(0).max(100).describe('兴趣匹配度评分（0-100分）'),

  experienceMatch: z.number().min(0).max(100).describe('经验匹配度评分（0-100分）'),

  reasoning: z.string().describe('详细的匹配理由，解释为什么给出这个评分'),

  matchedSkills: z.array(z.string()).describe('学生具备的与项目要求匹配的技能列表'),

  suggestions: z.string().describe('给学生的建议，如何提升匹配度或准备申请'),
});

/**
 * Type inference from Zod schema
 */
export type MatchingOutput = z.infer<typeof matchingOutputSchema>;

/**
 * Create structured output parser for matching results
 */
export function createMatchingParser() {
  return StructuredOutputParser.fromZodSchema(matchingOutputSchema);
}

/**
 * Validate matching output manually (for fallback scenarios)
 */
export function validateMatchingOutput(data: unknown): MatchingOutput {
  return matchingOutputSchema.parse(data);
}

/**
 * Safe parse matching output (returns error instead of throwing)
 */
export function safeParseMatchingOutput(data: unknown): {
  success: boolean;
  data?: MatchingOutput;
  error?: z.ZodError;
} {
  const result = matchingOutputSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, error: result.error };
  }
}
