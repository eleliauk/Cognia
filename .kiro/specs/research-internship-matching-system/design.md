# 设计文档

## 概述

校内科研实习供需智能匹配与跟踪管理系统是一个基于 Web 的全栈应用，采用前后端分离架构。系统核心特性是通过集成大模型 API 实现智能语义匹配，为学生和教师提供高效的科研实习对接平台。

### 技术栈选型

**前端:**

- React 18 + TypeScript - 类型安全的组件化开发
- Vite - 快速的构建工具
- TailwindCSS - 响应式样式框架
- React Router - 客户端路由
- Zustand - 轻量级状态管理
- React Query - 服务端状态管理和缓存
- Recharts - 数据可视化图表库
- Socket.io-client - 实时通信

**后端:**

- Node.js + Express - RESTful API 服务
- TypeScript - 类型安全
- Prisma - 类型安全的 ORM
- PostgreSQL - 关系型数据库
- Socket.io - WebSocket 实时通信
- JWT - 身份认证
- Zod - 运行时数据验证
- LangChain - LLM 调用和提示词管理

**大模型集成:**

- LangChain - 统一的 LLM 调用框架
- 支持多提供商（Deepseek、文心一言、OpenAI 等）
- StructuredOutputParser - 结构化输出解析
- 提示词模板管理和链式调用

## 架构设计

### 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        客户端层                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  教师界面    │  │  学生界面    │  │  管理员界面  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│           React + TypeScript + TailwindCSS                  │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────┐
│                        API 网关层                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Express Router + JWT 认证中间件                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                        业务逻辑层                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ 用户服务 │  │ 项目服务 │  │ 匹配服务 │  │ 通知服务 │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                        数据访问层                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Prisma ORM + Repository Pattern                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                      PostgreSQL 数据库                       │
└─────────────────────────────────────────────────────────────┘

                    外部服务集成
┌─────────────────────────────────────────────────────────────┐
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Deepseek API │  │ 文心一言 API │  │  其他 LLM    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 分层架构说明

**客户端层 (Presentation Layer):**

- 角色特定的 UI 组件和页面
- 响应式布局适配不同设备
- 本地状态管理和缓存

**API 网关层 (API Gateway):**

- 统一的请求入口
- JWT 令牌验证
- 请求日志和错误处理
- 速率限制

**业务逻辑层 (Business Logic Layer):**

- 核心业务规则实现
- 服务间协调
- 数据验证和转换

**数据访问层 (Data Access Layer):**

- 数据库操作抽象
- 查询优化
- 事务管理

## 核心组件设计

### 1. 认证与授权模块

**组件职责:**

- 用户登录/登出
- JWT 令牌生成和验证
- 基于角色的访问控制 (RBAC)

**接口设计:**

```typescript
interface AuthService {
  login(credentials: LoginCredentials): Promise<AuthResponse>;
  logout(userId: string): Promise<void>;
  verifyToken(token: string): Promise<TokenPayload>;
  refreshToken(refreshToken: string): Promise<AuthResponse>;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

interface TokenPayload {
  userId: string;
  role: UserRole;
  exp: number;
}

enum UserRole {
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN',
}
```

**实现要点:**

- 使用 bcrypt 进行密码哈希
- JWT 访问令牌有效期 15 分钟
- 刷新令牌有效期 7 天
- 中间件拦截未授权请求

### 2. 项目管理模块

**组件职责:**

- 科研项目 CRUD 操作
- 项目状态管理
- 项目搜索和过滤

**接口设计:**

```typescript
interface ProjectService {
  createProject(data: CreateProjectDTO): Promise<Project>;
  updateProject(id: string, data: UpdateProjectDTO): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  getProjectById(id: string): Promise<Project>;
  getProjectsByTeacher(teacherId: string): Promise<Project[]>;
  getAllActiveProjects(): Promise<Project[]>;
  searchProjects(criteria: SearchCriteria): Promise<Project[]>;
}

interface CreateProjectDTO {
  title: string;
  description: string;
  requirements: string;
  requiredSkills: string[];
  researchField: string;
  duration: number; // 月数
  positions: number; // 招收人数
  startDate: Date;
}

interface Project extends CreateProjectDTO {
  id: string;
  teacherId: string;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
}

enum ProjectStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  COMPLETED = 'COMPLETED',
}
```

### 3. 学生档案模块

**组件职责:**

- 学生能力档案管理
- 技能标签管理
- 档案完整度评估

**接口设计:**

```typescript
interface StudentProfileService {
  createProfile(studentId: string, data: CreateProfileDTO): Promise<StudentProfile>;
  updateProfile(studentId: string, data: UpdateProfileDTO): Promise<StudentProfile>;
  getProfile(studentId: string): Promise<StudentProfile>;
  calculateCompleteness(profile: StudentProfile): number;
}

interface CreateProfileDTO {
  major: string;
  grade: number;
  gpa: number;
  skills: string[];
  researchInterests: string[];
  projectExperience: ProjectExperience[];
  academicBackground: string;
  selfIntroduction: string;
}

interface StudentProfile extends CreateProfileDTO {
  id: string;
  studentId: string;
  completeness: number; // 0-100
  createdAt: Date;
  updatedAt: Date;
}

interface ProjectExperience {
  title: string;
  description: string;
  role: string;
  duration: string;
  achievements: string;
}
```

### 4. 智能匹配引擎

**组件职责:**

- 调用大模型 API 进行语义匹配
- 计算匹配度评分
- 生成推荐理由
- 降级策略处理

**接口设计:**

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { z } from 'zod';

interface MatchingEngine {
  matchStudentToProjects(studentId: string): Promise<MatchResult[]>;
  matchProjectToStudents(projectId: string): Promise<MatchResult[]>;
  calculateMatchScore(student: StudentProfile, project: Project): Promise<MatchScore>;
}

interface MatchResult {
  projectId: string;
  studentId: string;
  score: number; // 0-100
  reasoning: string;
  matchedSkills: string[];
  timestamp: Date;
}

interface MatchScore {
  overall: number;
  skillMatch: number;
  interestMatch: number;
  experienceMatch: number;
  reasoning: string;
}

// LangChain 匹配引擎实现
class LangChainMatchingEngine implements MatchingEngine {
  private llm: ChatOpenAI;
  private promptTemplate: PromptTemplate;
  private outputParser: StructuredOutputParser;

  constructor() {
    // 初始化 LLM（支持多个提供商）
    this.llm = new ChatOpenAI({
      modelName: process.env.LLM_MODEL || 'gpt-3.5-turbo',
      temperature: 0.3,
      timeout: 3000,
      maxRetries: 2,
      configuration: {
        baseURL: process.env.LLM_BASE_URL, // 支持 Deepseek、文心一言等
        apiKey: process.env.LLM_API_KEY,
      },
    });

    // 定义输出结构
    const outputSchema = z.object({
      score: z.number().min(0).max(100).describe('匹配度评分'),
      reasoning: z.string().describe('详细的匹配理由'),
      matchedSkills: z.array(z.string()).describe('匹配的技能列表'),
      skillMatch: z.number().min(0).max(100).describe('技能匹配度'),
      interestMatch: z.number().min(0).max(100).describe('兴趣匹配度'),
      experienceMatch: z.number().min(0).max(100).describe('经验匹配度'),
      suggestions: z.string().describe('给学生的建议'),
    });

    this.outputParser = StructuredOutputParser.fromZodSchema(outputSchema);

    // 创建提示词模板
    this.promptTemplate = PromptTemplate.fromTemplate(`
你是一个科研实习匹配专家。请分析以下学生和项目的匹配程度。

学生信息：
- 专业：{major}
- 年级：{grade}
- GPA：{gpa}
- 技能：{skills}
- 研究兴趣：{interests}
- 项目经验：{experience}
- 学术背景：{academicBackground}

项目信息：
- 标题：{projectTitle}
- 描述：{projectDescription}
- 要求：{requirements}
- 所需技能：{requiredSkills}
- 研究领域：{researchField}
- 时长：{duration}个月

请从以下维度进行评估：
1. 技能匹配度：学生的技能与项目要求的匹配程度
2. 兴趣匹配度：学生的研究兴趣与项目领域的契合度
3. 经验匹配度：学生的项目经验与项目需求的相关性

{format_instructions}
    `);
  }

  async calculateMatchScore(student: StudentProfile, project: Project): Promise<MatchScore> {
    try {
      // 构建输入
      const input = await this.promptTemplate.format({
        major: student.major,
        grade: student.grade,
        gpa: student.gpa,
        skills: student.skills.join(', '),
        interests: student.researchInterests.join(', '),
        experience: this.formatExperience(student.projectExperience),
        academicBackground: student.academicBackground || '无',
        projectTitle: project.title,
        projectDescription: project.description,
        requirements: project.requirements,
        requiredSkills: project.requiredSkills.join(', '),
        researchField: project.researchField,
        duration: project.duration,
        format_instructions: this.outputParser.getFormatInstructions(),
      });

      // 调用 LLM
      const response = await this.llm.invoke(input);

      // 解析输出
      const parsed = await this.outputParser.parse(response.content as string);

      return {
        overall: parsed.score,
        skillMatch: parsed.skillMatch,
        interestMatch: parsed.interestMatch,
        experienceMatch: parsed.experienceMatch,
        reasoning: parsed.reasoning,
      };
    } catch (error) {
      console.error('LLM matching failed, using fallback:', error);
      // 降级到关键词匹配
      return this.fallbackMatching(student, project);
    }
  }

  private formatExperience(experiences: ProjectExperience[]): string {
    if (!experiences || experiences.length === 0) return '无';
    return experiences.map((exp) => `${exp.title} (${exp.role}, ${exp.duration})`).join('; ');
  }

  // 降级策略：基于关键词的简单匹配
  private fallbackMatching(student: StudentProfile, project: Project): MatchScore {
    const studentSkills = new Set(student.skills.map((s) => s.toLowerCase()));
    const requiredSkills = new Set(project.requiredSkills.map((s) => s.toLowerCase()));

    // 计算技能交集
    const matchedSkills = [...studentSkills].filter((s) => requiredSkills.has(s));
    const skillMatch = (matchedSkills.length / requiredSkills.size) * 100;

    // 简单的兴趣匹配
    const interestMatch = student.researchInterests.some((interest) =>
      project.researchField.toLowerCase().includes(interest.toLowerCase())
    )
      ? 70
      : 30;

    // 经验匹配（基于是否有项目经验）
    const experienceMatch = student.projectExperience.length > 0 ? 60 : 30;

    const overall = skillMatch * 0.5 + interestMatch * 0.3 + experienceMatch * 0.2;

    return {
      overall: Math.round(overall),
      skillMatch: Math.round(skillMatch),
      interestMatch,
      experienceMatch,
      reasoning: '使用关键词匹配算法（LLM 服务暂时不可用）',
    };
  }

  async matchStudentToProjects(studentId: string): Promise<MatchResult[]> {
    // 获取学生档案和活跃项目
    const student = await this.getStudentProfile(studentId);
    const projects = await this.getActiveProjects();

    // 并行计算匹配度
    const matches = await Promise.all(
      projects.map(async (project) => {
        const score = await this.calculateMatchScore(student, project);
        return {
          projectId: project.id,
          studentId,
          score: score.overall,
          reasoning: score.reasoning,
          matchedSkills: this.getMatchedSkills(student, project),
          timestamp: new Date(),
        };
      })
    );

    // 按匹配度排序并返回前 10 个
    return matches.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  private getMatchedSkills(student: StudentProfile, project: Project): string[] {
    const studentSkills = new Set(student.skills.map((s) => s.toLowerCase()));
    return project.requiredSkills.filter((skill) => studentSkills.has(skill.toLowerCase()));
  }
}
```

**匹配算法流程:**

1. 使用 LangChain PromptTemplate 构造结构化提示词
2. 通过 LangChain 调用 LLM（支持 Deepseek、文心一言等，超时 3 秒）
3. 使用 StructuredOutputParser 解析 JSON 响应
4. 如果 LLM 调用失败，自动降级到关键词匹配算法
5. 标准化评分并返回结果
6. 缓存结果到 Redis（有效期 1 小时）

**LangChain 配置示例:**

```typescript
// 支持多个 LLM 提供商
const llmConfigs = {
  deepseek: {
    baseURL: 'https://api.deepseek.com/v1',
    modelName: 'deepseek-chat',
    apiKey: process.env.DEEPSEEK_API_KEY,
  },
  wenxin: {
    baseURL: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop',
    modelName: 'ernie-bot-turbo',
    apiKey: process.env.WENXIN_API_KEY,
  },
  openai: {
    baseURL: 'https://api.openai.com/v1',
    modelName: 'gpt-3.5-turbo',
    apiKey: process.env.OPENAI_API_KEY,
  },
};

// 根据配置选择 LLM
const selectedProvider = process.env.LLM_PROVIDER || 'deepseek';
const config = llmConfigs[selectedProvider];

const llm = new ChatOpenAI({
  ...config,
  temperature: 0.3,
  timeout: 3000,
  maxRetries: 2,
});
```

**LangChain 链式调用示例:**

```typescript
import { RunnableSequence } from '@langchain/core/runnables';

// 创建匹配链
const matchingChain = RunnableSequence.from([promptTemplate, llm, outputParser]);

// 执行链
const result = await matchingChain.invoke({
  major: student.major,
  skills: student.skills.join(', '),
  // ... 其他参数
});
```

### 5. 申请管理模块

**组件职责:**

- 申请提交和状态管理
- 防重复申请
- 申请筛选和排序

**接口设计:**

```typescript
interface ApplicationService {
  submitApplication(data: CreateApplicationDTO): Promise<Application>;
  updateApplicationStatus(id: string, status: ApplicationStatus): Promise<Application>;
  getApplicationsByStudent(studentId: string): Promise<Application[]>;
  getApplicationsByProject(projectId: string): Promise<Application[]>;
  checkDuplicateApplication(studentId: string, projectId: string): Promise<boolean>;
}

interface CreateApplicationDTO {
  studentId: string;
  projectId: string;
  coverLetter: string;
}

interface Application {
  id: string;
  studentId: string;
  projectId: string;
  coverLetter: string;
  status: ApplicationStatus;
  matchScore: number;
  appliedAt: Date;
  reviewedAt?: Date;
}

enum ApplicationStatus {
  PENDING = 'PENDING',
  REVIEWING = 'REVIEWING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}
```

### 6. 实习跟踪模块

**组件职责:**

- 实习进度管理
- 里程碑跟踪
- 成果文档管理

**接口设计:**

```typescript
interface InternshipService {
  createInternship(applicationId: string): Promise<Internship>;
  updateProgress(id: string, data: ProgressUpdateDTO): Promise<Internship>;
  uploadDocument(id: string, file: File): Promise<Document>;
  getInternshipById(id: string): Promise<Internship>;
  getInternshipsByStudent(studentId: string): Promise<Internship[]>;
  getInternshipsByTeacher(teacherId: string): Promise<Internship[]>;
}

interface Internship {
  id: string;
  applicationId: string;
  studentId: string;
  projectId: string;
  status: InternshipStatus;
  progress: number; // 0-100
  milestones: Milestone[];
  documents: Document[];
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  completed: boolean;
  completedAt?: Date;
}

interface Document {
  id: string;
  filename: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: Date;
  fileSize: number;
  mimeType: string;
}

enum InternshipStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  TERMINATED = 'TERMINATED',
}
```

### 7. 评价反馈模块

**组件职责:**

- 教师评价管理
- 评分统计
- 反馈通知

**接口设计:**

```typescript
interface EvaluationService {
  createEvaluation(data: CreateEvaluationDTO): Promise<Evaluation>;
  getEvaluationByInternship(internshipId: string): Promise<Evaluation>;
  getEvaluationsByStudent(studentId: string): Promise<Evaluation[]>;
}

interface CreateEvaluationDTO {
  internshipId: string;
  teacherId: string;
  overallScore: number; // 1-5
  technicalSkills: number;
  communication: number;
  initiative: number;
  reliability: number;
  feedback: string;
  strengths: string;
  improvements: string;
}

interface Evaluation extends CreateEvaluationDTO {
  id: string;
  createdAt: Date;
}
```

### 8. 通知系统

**组件职责:**

- 实时消息推送
- 通知历史管理
- 已读/未读状态

**接口设计:**

```typescript
interface NotificationService {
  sendNotification(data: CreateNotificationDTO): Promise<Notification>;
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  markAsRead(id: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  getUnreadCount(userId: string): Promise<number>;
}

interface CreateNotificationDTO {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string; // 关联的实体 ID
}

interface Notification extends CreateNotificationDTO {
  id: string;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
}

enum NotificationType {
  APPLICATION_SUBMITTED = 'APPLICATION_SUBMITTED',
  APPLICATION_REVIEWED = 'APPLICATION_REVIEWED',
  PROGRESS_UPDATED = 'PROGRESS_UPDATED',
  EVALUATION_RECEIVED = 'EVALUATION_RECEIVED',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
}

// WebSocket 事件
interface SocketEvents {
  'notification:new': (notification: Notification) => void;
  'notification:read': (notificationId: string) => void;
}
```

### 9. 统计分析模块

**组件职责:**

- 数据聚合计算
- 图表数据生成
- 性能指标监控

**接口设计:**

```typescript
interface AnalyticsService {
  getTeacherDashboard(teacherId: string, timeRange: TimeRange): Promise<TeacherStats>;
  getAdminDashboard(timeRange: TimeRange): Promise<AdminStats>;
  getMatchingMetrics(): Promise<MatchingMetrics>;
}

interface TeacherStats {
  totalProjects: number;
  activeProjects: number;
  totalApplications: number;
  acceptanceRate: number;
  studentDistribution: {
    major: string;
    count: number;
  }[];
  applicationTrend: {
    date: string;
    count: number;
  }[];
}

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalProjects: number;
  totalApplications: number;
  matchSuccessRate: number;
  systemPerformance: {
    avgResponseTime: number;
    apiSuccessRate: number;
    errorRate: number;
  };
  userGrowth: {
    date: string;
    teachers: number;
    students: number;
  }[];
}

interface MatchingMetrics {
  totalMatches: number;
  avgMatchScore: number;
  llmApiCalls: number;
  llmSuccessRate: number;
  fallbackUsage: number;
}

interface TimeRange {
  startDate: Date;
  endDate: Date;
}
```

## 数据模型设计

### Prisma Schema

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 用户表
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  role          UserRole
  name          String
  phone         String?
  avatar        String?
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // 关系
  teacherProfile   TeacherProfile?
  studentProfile   StudentProfile?
  projects         Project[]
  applications     Application[]
  notifications    Notification[]
  auditLogs        AuditLog[]

  @@index([email])
  @@index([role])
}

enum UserRole {
  TEACHER
  STUDENT
  ADMIN
}

// 教师档案表
model TeacherProfile {
  id              String   @id @default(uuid())
  userId          String   @unique
  department      String
  title           String   // 职称
  researchFields  String[]
  bio             String?

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

// 学生档案表
model StudentProfile {
  id                  String              @id @default(uuid())
  userId              String              @unique
  studentNumber       String              @unique
  major               String
  grade               Int
  gpa                 Float
  skills              String[]
  researchInterests   String[]
  academicBackground  String?
  selfIntroduction    String?
  completeness        Int                 @default(0)

  user                User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  projectExperiences  ProjectExperience[]

  @@index([userId])
  @@index([studentNumber])
}

// 项目经验表
model ProjectExperience {
  id          String   @id @default(uuid())
  profileId   String
  title       String
  description String
  role        String
  duration    String
  achievements String?

  profile     StudentProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)

  @@index([profileId])
}

// 科研项目表
model Project {
  id              String        @id @default(uuid())
  teacherId       String
  title           String
  description     String
  requirements    String
  requiredSkills  String[]
  researchField   String
  duration        Int           // 月数
  positions       Int           // 招收人数
  startDate       DateTime
  status          ProjectStatus @default(DRAFT)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  teacher         User          @relation(fields: [teacherId], references: [id])
  applications    Application[]
  internships     Internship[]

  @@index([teacherId])
  @@index([status])
  @@index([researchField])
}

enum ProjectStatus {
  DRAFT
  ACTIVE
  CLOSED
  COMPLETED
}

// 申请记录表
model Application {
  id          String            @id @default(uuid())
  studentId   String
  projectId   String
  coverLetter String
  status      ApplicationStatus @default(PENDING)
  matchScore  Float?
  appliedAt   DateTime          @default(now())
  reviewedAt  DateTime?

  student     User              @relation(fields: [studentId], references: [id])
  project     Project           @relation(fields: [projectId], references: [id], onDelete: Cascade)
  internship  Internship?

  @@unique([studentId, projectId])
  @@index([studentId])
  @@index([projectId])
  @@index([status])
}

enum ApplicationStatus {
  PENDING
  REVIEWING
  ACCEPTED
  REJECTED
  WITHDRAWN
}

// 实习跟踪表
model Internship {
  id            String            @id @default(uuid())
  applicationId String            @unique
  studentId     String
  projectId     String
  status        InternshipStatus  @default(IN_PROGRESS)
  progress      Int               @default(0)
  startDate     DateTime          @default(now())
  endDate       DateTime?
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  application   Application       @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  project       Project           @relation(fields: [projectId], references: [id])
  milestones    Milestone[]
  documents     Document[]
  evaluation    Evaluation?

  @@index([studentId])
  @@index([projectId])
  @@index([status])
}

enum InternshipStatus {
  IN_PROGRESS
  PAUSED
  COMPLETED
  TERMINATED
}

// 里程碑表
model Milestone {
  id           String      @id @default(uuid())
  internshipId String
  title        String
  description  String
  dueDate      DateTime
  completed    Boolean     @default(false)
  completedAt  DateTime?

  internship   Internship  @relation(fields: [internshipId], references: [id], onDelete: Cascade)

  @@index([internshipId])
}

// 文档表
model Document {
  id           String      @id @default(uuid())
  internshipId String
  filename     String
  fileUrl      String
  uploadedBy   String
  uploadedAt   DateTime    @default(now())
  fileSize     Int
  mimeType     String

  internship   Internship  @relation(fields: [internshipId], references: [id], onDelete: Cascade)

  @@index([internshipId])
}

// 评价表
model Evaluation {
  id              String      @id @default(uuid())
  internshipId    String      @unique
  teacherId       String
  overallScore    Int         // 1-5
  technicalSkills Int
  communication   Int
  initiative      Int
  reliability     Int
  feedback        String
  strengths       String?
  improvements    String?
  createdAt       DateTime    @default(now())

  internship      Internship  @relation(fields: [internshipId], references: [id], onDelete: Cascade)

  @@index([internshipId])
  @@index([teacherId])
}

// 通知表
model Notification {
  id        String           @id @default(uuid())
  userId    String
  type      NotificationType
  title     String
  message   String
  relatedId String?
  isRead    Boolean          @default(false)
  createdAt DateTime         @default(now())
  readAt    DateTime?

  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([isRead])
  @@index([createdAt])
}

enum NotificationType {
  APPLICATION_SUBMITTED
  APPLICATION_REVIEWED
  PROGRESS_UPDATED
  EVALUATION_RECEIVED
  SYSTEM_ANNOUNCEMENT
}

// 匹配缓存表
model MatchCache {
  id         String   @id @default(uuid())
  studentId  String
  projectId  String
  score      Float
  reasoning  String
  cachedAt   DateTime @default(now())
  expiresAt  DateTime

  @@unique([studentId, projectId])
  @@index([studentId])
  @@index([projectId])
  @@index([expiresAt])
}

// 审计日志表
model AuditLog {
  id        String   @id @default(uuid())
  userId    String
  action    String
  resource  String
  details   Json?
  ipAddress String?
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([action])
  @@index([createdAt])
}
```

### 数据关系说明

**一对一关系:**

- User ↔ TeacherProfile
- User ↔ StudentProfile
- Application ↔ Internship
- Internship ↔ Evaluation

**一对多关系:**

- User → Projects (教师发布多个项目)
- User → Applications (学生提交多个申请)
- Project → Applications (项目收到多个申请)
- StudentProfile → ProjectExperiences (学生有多个项目经验)
- Internship → Milestones (实习有多个里程碑)
- Internship → Documents (实习有多个文档)

**索引策略:**

- 外键字段自动创建索引
- 频繁查询的字段（email, status, role）创建索引
- 时间字段（createdAt）用于排序查询
- 唯一约束防止重复申请

## API 接口设计

### RESTful API 端点

#### 认证相关

```
POST   /api/auth/login              # 用户登录
POST   /api/auth/logout             # 用户登出
POST   /api/auth/refresh            # 刷新令牌
GET    /api/auth/me                 # 获取当前用户信息
```

#### 用户管理

```
GET    /api/users                   # 获取用户列表（管理员）
GET    /api/users/:id               # 获取用户详情
PUT    /api/users/:id               # 更新用户信息
DELETE /api/users/:id               # 删除用户（管理员）
PUT    /api/users/:id/role          # 修改用户角色（管理员）
```

#### 教师档案

```
GET    /api/teachers/:id/profile    # 获取教师档案
PUT    /api/teachers/:id/profile    # 更新教师档案
```

#### 学生档案

```
GET    /api/students/:id/profile    # 获取学生档案
POST   /api/students/:id/profile    # 创建学生档案
PUT    /api/students/:id/profile    # 更新学生档案
POST   /api/students/:id/experiences # 添加项目经验
PUT    /api/students/:id/experiences/:expId # 更新项目经验
DELETE /api/students/:id/experiences/:expId # 删除项目经验
```

#### 科研项目

```
GET    /api/projects                # 获取项目列表
POST   /api/projects                # 创建项目
GET    /api/projects/:id            # 获取项目详情
PUT    /api/projects/:id            # 更新项目
DELETE /api/projects/:id            # 删除项目
GET    /api/projects/:id/applications # 获取项目的申请列表
GET    /api/teachers/:id/projects   # 获取教师的项目列表
```

#### 智能匹配

```
GET    /api/matching/recommendations/:studentId  # 获取学生的推荐项目
POST   /api/matching/calculate                   # 计算匹配度
GET    /api/matching/metrics                     # 获取匹配指标
```

#### 申请管理

```
GET    /api/applications            # 获取申请列表
POST   /api/applications            # 提交申请
GET    /api/applications/:id        # 获取申请详情
PUT    /api/applications/:id/status # 更新申请状态
DELETE /api/applications/:id        # 撤回申请
GET    /api/students/:id/applications # 获取学生的申请列表
```

#### 实习跟踪

```
GET    /api/internships             # 获取实习列表
POST   /api/internships             # 创建实习记录
GET    /api/internships/:id         # 获取实习详情
PUT    /api/internships/:id/progress # 更新实习进度
POST   /api/internships/:id/milestones # 添加里程碑
PUT    /api/internships/:id/milestones/:milestoneId # 更新里程碑
POST   /api/internships/:id/documents # 上传文档
DELETE /api/internships/:id/documents/:docId # 删除文档
```

#### 评价反馈

```
POST   /api/evaluations             # 创建评价
GET    /api/evaluations/:internshipId # 获取实习评价
GET    /api/students/:id/evaluations # 获取学生的所有评价
```

#### 通知系统

```
GET    /api/notifications           # 获取通知列表
GET    /api/notifications/unread    # 获取未读通知
PUT    /api/notifications/:id/read  # 标记为已读
PUT    /api/notifications/read-all  # 全部标记为已读
```

#### 统计分析

```
GET    /api/analytics/teacher/:id   # 教师统计看板
GET    /api/analytics/admin         # 管理员统计看板
GET    /api/analytics/matching      # 匹配效果分析
```

### WebSocket 事件

```typescript
// 客户端监听
socket.on('notification:new', (notification: Notification) => {
  // 处理新通知
});

socket.on('application:status-changed', (data: { applicationId: string; status: string }) => {
  // 处理申请状态变更
});

socket.on('internship:progress-updated', (data: { internshipId: string; progress: number }) => {
  // 处理实习进度更新
});

// 客户端发送
socket.emit('notification:read', notificationId);
```

## 错误处理

### 错误响应格式

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

// 示例
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "输入数据验证失败",
    "details": {
      "email": "邮箱格式不正确"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 错误代码定义

```typescript
enum ErrorCode {
  // 认证错误 (1xxx)
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // 验证错误 (2xxx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',

  // 业务逻辑错误 (3xxx)
  DUPLICATE_APPLICATION = 'DUPLICATE_APPLICATION',
  PROJECT_NOT_ACTIVE = 'PROJECT_NOT_ACTIVE',
  PROFILE_INCOMPLETE = 'PROFILE_INCOMPLETE',
  POSITIONS_FULL = 'POSITIONS_FULL',

  // 资源错误 (4xxx)
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',

  // 外部服务错误 (5xxx)
  LLM_API_ERROR = 'LLM_API_ERROR',
  LLM_API_TIMEOUT = 'LLM_API_TIMEOUT',
  DATABASE_ERROR = 'DATABASE_ERROR',

  // 系统错误 (9xxx)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}
```

### 错误处理中间件

```typescript
// Express 错误处理中间件
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: err.name || 'INTERNAL_SERVER_ERROR',
      message: err.message,
      details: err instanceof ValidationError ? err.details : undefined,
    },
    timestamp: new Date().toISOString(),
  };

  // 记录错误日志
  logger.error({
    error: err,
    request: {
      method: req.method,
      url: req.url,
      body: req.body,
    },
  });

  // 根据错误类型返回适当的状态码
  const statusCode = getStatusCode(err);
  res.status(statusCode).json(errorResponse);
});
```

## 前端架构设计

### 目录结构

```
frontend/
├── src/
│   ├── components/          # 可复用组件
│   │   ├── common/          # 通用组件
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   └── Card.tsx
│   │   ├── layout/          # 布局组件
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   └── features/        # 功能组件
│   │       ├── ProjectCard.tsx
│   │       ├── ApplicationList.tsx
│   │       ├── MatchScore.tsx
│   │       └── NotificationBell.tsx
│   ├── pages/               # 页面组件
│   │   ├── auth/
│   │   │   └── LoginPage.tsx
│   │   ├── teacher/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── ProjectsPage.tsx
│   │   │   ├── ApplicationsPage.tsx
│   │   │   └── AnalyticsPage.tsx
│   │   ├── student/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── RecommendationsPage.tsx
│   │   │   ├── MyApplicationsPage.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   └── InternshipsPage.tsx
│   │   └── admin/
│   │       ├── DashboardPage.tsx
│   │       ├── UsersPage.tsx
│   │       └── MonitoringPage.tsx
│   ├── hooks/               # 自定义 Hooks
│   │   ├── useAuth.ts
│   │   ├── useNotifications.ts
│   │   ├── useWebSocket.ts
│   │   └── useMatchingEngine.ts
│   ├── stores/              # Zustand 状态管理
│   │   ├── authStore.ts
│   │   ├── notificationStore.ts
│   │   └── uiStore.ts
│   ├── services/            # API 服务
│   │   ├── api.ts           # Axios 配置
│   │   ├── authService.ts
│   │   ├── projectService.ts
│   │   ├── applicationService.ts
│   │   └── matchingService.ts
│   ├──              # TypeScript 类型定义
│   │   ├── user.ts
│   │   ├── project.ts
│   │   ├── application.ts
│   │   └── api.ts
│   ├── utils/               # 工具函数
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── constants.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── router.tsx
├── public/
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

### 路由设计

```typescript
// router.tsx
import { createBrowserRouter } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      // 教师路由
      {
        path: '/teacher',
        element: <TeacherLayout />,
        children: [
          { path: 'dashboard', element: <TeacherDashboard /> },
          { path: 'projects', element: <ProjectsPage /> },
          { path: 'projects/:id', element: <ProjectDetailPage /> },
          { path: 'applications', element: <ApplicationsPage /> },
          { path: 'analytics', element: <AnalyticsPage /> }
        ]
      },
      // 学生路由
      {
        path: '/student',
        element: <StudentLayout />,
        children: [
          { path: 'dashboard', element: <StudentDashboard /> },
          { path: 'recommendations', element: <RecommendationsPage /> },
          { path: 'applications', element: <MyApplicationsPage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'internships', element: <InternshipsPage /> }
        ]
      },
      // 管理员路由
      {
        path: '/admin',
        element: <AdminLayout />,
        children: [
          { path: 'dashboard', element: <AdminDashboard /> },
          { path: 'users', element: <UsersPage /> },
          { path: 'monitoring', element: <MonitoringPage /> }
        ]
      }
    ]
  }
]);
```

### 状态管理

```typescript
// authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: async (credentials) => {
        const response = await authService.login(credentials);
        set({
          user: response.user,
          token: response.accessToken,
          isAuthenticated: true,
        });
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },
      refreshToken: async () => {
        // 刷新令牌逻辑
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

### 响应式设计

使用 TailwindCSS 断点：

```typescript
// 移动端优先设计
<div className="
  w-full                    // 移动端全宽
  md:w-1/2                  // 平板半宽
  lg:w-1/3                  // 桌面 1/3 宽
  p-4                       // 移动端 padding
  md:p-6                    // 平板 padding
  lg:p-8                    // 桌面 padding
">
  {/* 内容 */}
</div>

// 断点定义
// sm: 640px
// md: 768px
// lg: 1024px
// xl: 1280px
// 2xl: 1536px
```

## 后端架构设计

### 目录结构

```
backend/
├── src/
│   ├── controllers/         # 控制器层
│   │   ├── authController.ts
│   │   ├── projectController.ts
│   │   ├── applicationController.ts
│   │   └── matchingController.ts
│   ├── services/            # 业务逻辑层
│   │   ├── authService.ts
│   │   ├── projectService.ts
│   │   ├── matchingEngine.ts
│   │   └── notificationService.ts
│   ├── repositories/        # 数据访问层
│   │   ├── userRepository.ts
│   │   ├── projectRepository.ts
│   │   └── applicationRepository.ts
│   ├── middleware/          # 中间件
│   │   ├── authMiddleware.ts
│   │   ├── validationMiddleware.ts
│   │   ├── errorHandler.ts
│   │   └── rateLimiter.ts
│   ├── validators/          # 数据验证
│   │   ├── authValidators.ts
│   │   ├── projectValidators.ts
│   │   └── applicationValidators.ts
│   ├── langchain/           # LangChain 配置和链
│   │   ├── chains/
│   │   │   └── matchingChain.ts
│   │   ├── prompts/
│   │   │   └── matchingPrompt.ts
│   │   ├── parsers/
│   │   │   └── matchingParser.ts
│   │   └── llmConfig.ts
│   ├── adapters/            # 外部服务适配器
│   │   └── storage/
│   │       └── FileStorageAdapter.ts
│   ├── utils/               # 工具函数
│   │   ├── jwt.ts
│   │   ├── bcrypt.ts
│   │   └── logger.ts
│   ├── types/               # 类型定义
│   │   └── index.ts
│   ├── config/              # 配置
│   │   ├── database.ts
│   │   ├── env.ts
│   │   └── llm.ts
│   ├── prisma/              # Prisma
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── app.ts               # Express 应用
│   └── server.ts            # 服务器入口
├── tests/
│   ├── unit/
│   └── integration/
├── package.json
└── tsconfig.json
```

### 中间件链

```typescript
// app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { authMiddleware } from './middleware/authMiddleware';

const app = express();

// 安全中间件
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

// 解析中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 速率限制
app.use('/api', rateLimiter);

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/projects', authMiddleware, projectRoutes);
app.use('/api/applications', authMiddleware, applicationRoutes);
app.use('/api/matching', authMiddleware, matchingRoutes);

// 错误处理
app.use(errorHandler);

export default app;
```

### 依赖注入

```typescript
// 使用简单的依赖注入模式
class Container {
  private services = new Map();

  register<T>(name: string, factory: () => T) {
    this.services.set(name, factory);
  }

  resolve<T>(name: string): T {
    const factory = this.services.get(name);
    if (!factory) throw new Error(`Service ${name} not found`);
    return factory();
  }
}

const container = new Container();

// 注册服务
container.register('prisma', () => new PrismaClient());
container.register(
  'matchingEngine',
  () => new MatchingEngine(container.resolve('prisma'), container.resolve('llmAdapter'))
);

// 使用服务
const matchingEngine = container.resolve<MatchingEngine>('matchingEngine');
```

## 安全设计

### 认证与授权

**JWT 令牌策略:**

- Access Token: 15 分钟有效期，存储在内存中
- Refresh Token: 7 天有效期，存储在 HttpOnly Cookie
- 令牌包含：userId, role, exp

**密码安全:**

- 使用 bcrypt 哈希，salt rounds = 10
- 密码强度要求：至少 8 位，包含字母和数字
- 登录失败限制：5 次失败后锁定 15 分钟

**RBAC 权限控制:**

```typescript
// 权限矩阵
const permissions = {
  TEACHER: [
    'project:create',
    'project:update',
    'project:delete',
    'application:view',
    'application:review',
    'internship:manage',
    'evaluation:create',
  ],
  STUDENT: [
    'profile:update',
    'application:create',
    'application:view',
    'internship:view',
    'internship:update',
  ],
  ADMIN: ['user:manage', 'system:monitor', 'data:export'],
};

// 权限检查中间件
const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user.role;
    if (permissions[userRole].includes(permission)) {
      next();
    } else {
      throw new ForbiddenError('Insufficient permissions');
    }
  };
};
```

### 数据验证

**输入验证使用 Zod:**

```typescript
import { z } from 'zod';

// 项目创建验证
const createProjectSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(20).max(2000),
  requirements: z.string().min(10),
  requiredSkills: z.array(z.string()).min(1).max(20),
  researchField: z.string(),
  duration: z.number().int().min(1).max(24),
  positions: z.number().int().min(1).max(10),
  startDate: z.string().datetime(),
});

// 使用验证
const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors);
      }
      throw error;
    }
  };
};
```

### XSS 防护

- 使用 helmet 设置安全头
- 对用户输入进行 HTML 转义
- Content Security Policy (CSP) 配置

```typescript
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);
```

### CSRF 防护

- 使用 SameSite Cookie 属性
- 对状态变更操作验证 CSRF Token

### SQL 注入防护

- 使用 Prisma ORM 参数化查询
- 避免原始 SQL 查询
- 输入验证和类型检查

### 速率限制

```typescript
import rateLimit from 'express-rate-limit';

// API 速率限制
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 最多 100 个请求
  message: '请求过于频繁，请稍后再试',
});

// 登录速率限制
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: '登录尝试次数过多，请 15 分钟后再试',
});

app.use('/api', apiLimiter);
app.use('/api/auth/login', loginLimiter);
```

## 性能优化

### 数据库优化

**查询优化:**

- 使用索引加速常见查询
- 避免 N+1 查询问题，使用 Prisma include
- 分页查询大数据集
- 使用数据库连接池

```typescript
// 连接池配置
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'error', 'warn'],
});

// 避免 N+1 查询
const projects = await prisma.project.findMany({
  include: {
    teacher: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
    applications: {
      where: { status: 'PENDING' },
      include: {
        student: true,
      },
    },
  },
});
```

**缓存策略:**

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// 缓存匹配结果
async function getCachedMatch(studentId: string, projectId: string) {
  const cacheKey = `match:${studentId}:${projectId}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const result = await calculateMatch(studentId, projectId);
  await redis.setex(cacheKey, 3600, JSON.stringify(result)); // 1 小时缓存

  return result;
}

// 缓存用户会话
async function cacheUserSession(userId: string, data: any) {
  await redis.setex(`session:${userId}`, 900, JSON.stringify(data)); // 15 分钟
}
```

### 前端优化

**代码分割:**

```typescript
// 路由级别代码分割
import { lazy, Suspense } from 'react';

const TeacherDashboard = lazy(() => import('./pages/teacher/DashboardPage'));
const StudentDashboard = lazy(() => import('./pages/student/DashboardPage'));

// 使用
<Suspense fallback={<LoadingSpinner />}>
  <TeacherDashboard />
</Suspense>
```

**React Query 缓存:**

```typescript
import { useQuery } from '@tanstack/react-query';

function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    staleTime: 5 * 60 * 1000, // 5 分钟内数据视为新鲜
    cacheTime: 10 * 60 * 1000, // 缓存 10 分钟
  });
}
```

**图片优化:**

- 使用 WebP 格式
- 懒加载图片
- 响应式图片

### LLM API 优化

**请求优化:**

- 批量处理匹配请求
- 使用流式响应减少等待时间
- 实现请求队列避免并发过高

```typescript
class MatchingQueue {
  private queue: MatchRequest[] = [];
  private processing = false;

  async add(request: MatchRequest): Promise<MatchResult> {
    return new Promise((resolve, reject) => {
      this.queue.push({ ...request, resolve, reject });
      this.process();
    });
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    const batch = this.queue.splice(0, 5); // 批量处理 5 个

    try {
      const results = await Promise.all(batch.map((req) => this.matchingEngine.calculate(req)));

      batch.forEach((req, i) => req.resolve(results[i]));
    } catch (error) {
      batch.forEach((req) => req.reject(error));
    }

    this.processing = false;
    this.process(); // 处理下一批
  }
}
```

## 测试策略

### 单元测试

使用 Jest + Testing Library

```typescript
// projectService.test.ts
describe('ProjectService', () => {
  let service: ProjectService;
  let mockRepository: jest.Mocked<ProjectRepository>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    } as any;

    service = new ProjectService(mockRepository);
  });

  it('should create a project', async () => {
    const projectData = {
      title: 'Test Project',
      description: 'Test Description',
      // ...
    };

    mockRepository.create.mockResolvedValue({ id: '1', ...projectData });

    const result = await service.createProject(projectData);

    expect(result.id).toBe('1');
    expect(mockRepository.create).toHaveBeenCalledWith(projectData);
  });
});
```

### 集成测试

```typescript
// application.integration.test.ts
describe('Application API', () => {
  let app: Express;
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
    app = createApp();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should submit an application', async () => {
    const response = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        projectId: 'test-project-id',
        coverLetter: 'I am interested...',
      });

    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe('PENDING');
  });
});
```

### E2E 测试

使用 Playwright

```typescript
// student-application.e2e.test.ts
test('student can apply to a project', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'student@test.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.goto('/student/recommendations');
  await page.click('.project-card:first-child .apply-button');

  await page.fill('[name="coverLetter"]', 'I am very interested...');
  await page.click('button:has-text("提交申请")');

  await expect(page.locator('.success-message')).toBeVisible();
});
```

## 部署架构

### 开发环境

```
Docker Compose:
- Frontend (Vite Dev Server) - Port 5173
- Backend (Node.js) - Port 3000
- PostgreSQL - Port 5432
- Redis - Port 6379
```

### 生产环境

```
云服务架构:
- 前端: Vercel / Netlify (静态托管 + CDN)
- 后端: AWS EC2 / 阿里云 ECS (容器化部署)
- 数据库: AWS RDS / 阿里云 RDS (PostgreSQL)
- 缓存: AWS ElastiCache / 阿里云 Redis
- 文件存储: AWS S3 / 阿里云 OSS
- 负载均衡: AWS ALB / 阿里云 SLB
```

### CI/CD 流程

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: docker build -t backend:latest .
      - name: Push to registry
        run: docker push backend:latest
      - name: Deploy to server
        run: ssh deploy@server 'docker pull backend:latest && docker-compose up -d'

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

## 监控与日志

### 日志系统

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// 结构化日志
logger.info('User logged in', {
  userId: user.id,
  role: user.role,
  timestamp: new Date().toISOString(),
});
```

### 性能监控

- 使用 APM 工具（如 New Relic, DataDog）
- 监控 API 响应时间
- 监控数据库查询性能
- 监控 LLM API 调用成功率

### 健康检查

```typescript
app.get('/health', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    database: 'unknown',
    redis: 'unknown',
    llmApi: 'unknown',
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    health.database = 'healthy';
  } catch (error) {
    health.database = 'unhealthy';
  }

  try {
    await redis.ping();
    health.redis = 'healthy';
  } catch (error) {
    health.redis = 'unhealthy';
  }

  res.json(health);
});
```

## 设计决策记录

### 为什么选择 PostgreSQL？

- 支持复杂的关系型数据模型
- ACID 事务保证数据一致性
- 强大的查询优化器
- 丰富的索引类型
- 成熟的生态系统

### 为什么使用 Prisma ORM？

- 类型安全的数据库访问
- 自动生成 TypeScript 类型
- 优秀的开发体验
- 内置迁移工具
- 避免 SQL 注入

### 为什么采用适配器模式集成 LLM？

- 支持多个 LLM 提供商
- 易于切换和测试
- 降低供应商锁定风险
- 便于实现降级策略

### 为什么使用 WebSocket？

- 实时通知推送
- 减少轮询开销
- 更好的用户体验
- 双向通信能力
