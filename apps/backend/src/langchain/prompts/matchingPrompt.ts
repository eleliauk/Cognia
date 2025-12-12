import { PromptTemplate } from '@langchain/core/prompts';

/**
 * Matching prompt template for LLM-based student-project matching
 * This template provides structured input for semantic analysis
 */
export const matchingPromptTemplate = PromptTemplate.fromTemplate(`
你是一个科研实习匹配专家。请分析以下学生和项目的匹配程度。

学生信息：
- 专业：{major}
- 年级：{grade}
- GPA：{gpa}
- 技能：{skills}
- 研究兴趣：{interests}
- 项目经验：{experience}
- 学术背景：{academicBackground}
- 自我介绍：{selfIntroduction}

项目信息：
- 标题：{projectTitle}
- 描述：{projectDescription}
- 要求：{requirements}
- 所需技能：{requiredSkills}
- 研究领域：{researchField}
- 时长：{duration}个月

请从以下维度进行评估：
1. 技能匹配度：学生的技能与项目要求的匹配程度（0-100分）
2. 兴趣匹配度：学生的研究兴趣与项目领域的契合度（0-100分）
3. 经验匹配度：学生的项目经验与项目需求的相关性（0-100分）

请综合以上三个维度，给出总体匹配度评分（0-100分），并提供详细的匹配理由和建议。

{format_instructions}
`);

/**
 * Input variables for the matching prompt
 */
export interface MatchingPromptInput {
  major: string;
  grade: number;
  gpa: number;
  skills: string;
  interests: string;
  experience: string;
  academicBackground: string;
  selfIntroduction: string;
  projectTitle: string;
  projectDescription: string;
  requirements: string;
  requiredSkills: string;
  researchField: string;
  duration: number;
  format_instructions: string;
}
