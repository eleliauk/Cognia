import {
  PrismaClient,
  type StudentProfile,
  type Project,
  type ProjectExperience,
} from '@prisma/client';
import { createLLM } from '../langchain/llmConfig.js';
import { matchingPromptTemplate } from '../langchain/prompts/matchingPrompt.js';
import { createMatchingParser, type MatchingOutput } from '../langchain/parsers/matchingParser.js';
import { AppError } from '../types/index.js';
import { matchingCache } from './matchingCache.js';

/**
 * Match score result interface
 */
export interface MatchScore {
  overall: number;
  skillMatch: number;
  interestMatch: number;
  experienceMatch: number;
  reasoning: string;
  matchedSkills: string[];
  suggestions: string;
}

/**
 * Match result interface for student-project matching
 */
export interface MatchResult {
  projectId: string;
  studentId: string;
  score: number;
  reasoning: string;
  matchedSkills: string[];
  suggestions: string;
  timestamp: Date;
}

/**
 * Project recommendation interface for frontend
 */
export interface ProjectRecommendation {
  project: Project & {
    teacher: {
      id: string;
      name: string;
      email: string;
      teacherProfile?: {
        department: string;
        title: string;
      } | null;
    };
  };
  score: number;
  reasoning: string;
  matchedSkills: string[];
}

/**
 * LangChain-based matching engine for intelligent student-project matching
 */
export class MatchingEngine {
  private llm;
  private outputParser;
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.llm = createLLM();
    this.outputParser = createMatchingParser();
  }

  /**
   * Calculate match score between a student and a project using LLM
   * Uses Redis cache to avoid redundant LLM calls
   */
  async calculateMatchScore(
    student: StudentProfile & { projectExperiences: ProjectExperience[] },
    project: Project
  ): Promise<MatchScore> {
    // Check cache first
    const cached = await matchingCache.getCachedMatchScore(student.userId, project.id);
    if (cached) {
      console.log(`✅ Cache hit for student ${student.userId} and project ${project.id}`);
      return cached;
    }

    try {
      // Format the prompt input
      const input = await matchingPromptTemplate.format({
        major: student.major,
        grade: student.grade.toString(),
        gpa: student.gpa.toString(),
        skills: student.skills.join(', ') || '无',
        interests: student.researchInterests.join(', ') || '无',
        experience: this.formatExperience(student.projectExperiences),
        academicBackground: student.academicBackground || '无',
        selfIntroduction: student.selfIntroduction || '无',
        projectTitle: project.title,
        projectDescription: project.description,
        requirements: project.requirements,
        requiredSkills: project.requiredSkills.join(', '),
        researchField: project.researchField,
        duration: project.duration.toString(),
        format_instructions: this.outputParser.getFormatInstructions(),
      });

      // Call LLM with timeout
      const response = await this.llm.invoke(input);

      // Parse the structured output
      const parsed = await this.outputParser.parse(response.content as string);

      const result: MatchScore = {
        overall: parsed.score,
        skillMatch: parsed.skillMatch,
        interestMatch: parsed.interestMatch,
        experienceMatch: parsed.experienceMatch,
        reasoning: parsed.reasoning,
        matchedSkills: parsed.matchedSkills,
        suggestions: parsed.suggestions,
      };

      // Cache the result
      await matchingCache.cacheMatchScore(student.userId, project.id, result);

      return result;
    } catch (error) {
      console.error('LLM matching failed, using fallback strategy:', error);
      // Fallback to keyword-based matching
      const fallbackResult = this.fallbackMatching(student, project);

      // Cache fallback result as well (with shorter TTL implicitly)
      await matchingCache.cacheMatchScore(student.userId, project.id, fallbackResult);

      return fallbackResult;
    }
  }

  /**
   * Format project experiences for prompt
   */
  private formatExperience(experiences: ProjectExperience[]): string {
    if (!experiences || experiences.length === 0) return '无';
    return experiences.map((exp) => `${exp.title} (${exp.role}, ${exp.duration})`).join('; ');
  }

  /**
   * Fallback keyword-based matching when LLM is unavailable
   */
  private fallbackMatching(
    student: StudentProfile & { projectExperiences: ProjectExperience[] },
    project: Project
  ): MatchScore {
    const studentSkills = new Set(student.skills.map((s) => s.toLowerCase()));
    const requiredSkills = new Set(project.requiredSkills.map((s) => s.toLowerCase()));

    // Calculate skill intersection
    const matchedSkills = [...studentSkills].filter((s) => requiredSkills.has(s));
    const skillMatch =
      requiredSkills.size > 0 ? (matchedSkills.length / requiredSkills.size) * 100 : 0;

    // Simple interest matching
    const interestMatch = student.researchInterests.some((interest) =>
      project.researchField.toLowerCase().includes(interest.toLowerCase())
    )
      ? 70
      : 30;

    // Experience matching (based on whether student has project experience)
    const experienceMatch = student.projectExperiences.length > 0 ? 60 : 30;

    // Weighted overall score
    const overall = skillMatch * 0.5 + interestMatch * 0.3 + experienceMatch * 0.2;

    return {
      overall: Math.round(overall),
      skillMatch: Math.round(skillMatch),
      interestMatch,
      experienceMatch,
      reasoning: '使用关键词匹配算法（LLM 服务暂时不可用）',
      matchedSkills: project.requiredSkills.filter((skill) =>
        studentSkills.has(skill.toLowerCase())
      ),
      suggestions: '建议提升相关技能以提高匹配度',
    };
  }

  /**
   * Match a student to multiple projects and return ranked results
   * Uses cache to avoid recalculating matches
   */
  async matchStudentToProjects(
    studentId: string,
    limit: number = 10
  ): Promise<ProjectRecommendation[]> {
    // Get student profile with experiences
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId: studentId },
      include: { projectExperiences: true },
    });

    if (!student) {
      throw new AppError('NOT_FOUND', '学生档案不存在', 404);
    }

    // Get all active projects with teacher info
    const projects = await this.prisma.project.findMany({
      where: { status: 'ACTIVE' },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            teacherProfile: {
              select: {
                department: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (projects.length === 0) {
      return [];
    }

    // Calculate match scores for all projects in parallel
    const matches = await Promise.all(
      projects.map(async (project) => {
        const score = await this.calculateMatchScore(student, project);
        return {
          project,
          score: score.overall,
          reasoning: score.reasoning,
          matchedSkills: score.matchedSkills,
        };
      })
    );

    // Sort by score descending and return top N
    return matches.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * Match a project to multiple students and return ranked results
   * Uses cache to avoid recalculating matches
   */
  async matchProjectToStudents(projectId: string, limit: number = 20): Promise<MatchResult[]> {
    // Check cache first
    const cached = await matchingCache.getCachedProjectMatches(projectId);
    if (cached) {
      console.log(`✅ Cache hit for project matches: ${projectId}`);
      return cached.slice(0, limit);
    }

    // Get project details
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new AppError('NOT_FOUND', '项目不存在', 404);
    }

    // Get all student profiles with experiences
    const students = await this.prisma.studentProfile.findMany({
      include: { projectExperiences: true },
    });

    if (students.length === 0) {
      return [];
    }

    // Calculate match scores for all students in parallel
    const matches = await Promise.all(
      students.map(async (student) => {
        const score = await this.calculateMatchScore(student, project);
        return {
          projectId,
          studentId: student.userId,
          score: score.overall,
          reasoning: score.reasoning,
          matchedSkills: score.matchedSkills,
          suggestions: score.suggestions,
          timestamp: new Date(),
        };
      })
    );

    // Sort by score descending
    const sortedMatches = matches.sort((a, b) => b.score - a.score);

    // Cache the full results
    await matchingCache.cacheProjectMatches(projectId, sortedMatches);

    // Return top N
    return sortedMatches.slice(0, limit);
  }

  /**
   * Get matched skills between student and project
   */
  private getMatchedSkills(
    student: StudentProfile & { projectExperiences: ProjectExperience[] },
    project: Project
  ): string[] {
    const studentSkills = new Set(student.skills.map((s) => s.toLowerCase()));
    return project.requiredSkills.filter((skill) => studentSkills.has(skill.toLowerCase()));
  }
}
