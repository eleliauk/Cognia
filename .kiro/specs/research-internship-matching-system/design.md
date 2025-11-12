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
- MySQL - 关系型数据库
- Socket.io - WebSocket 实时通信
- JWT - 身份认证
- Zod - 运行时数据验证

**大模型集成:**

- Axios - HTTP 客户端
- 支持多提供商适配器模式（Deepseek、文心一言等）

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

// LLM 适配器接口
interface LLMAdapter {
  analyze(prompt: string): Promise<LLMResponse>;
  isAvailable(): Promise<boolean>;
}

interface LLMResponse {
  score: number;
  reasoning: string;
  confidence: number;
}

// 具体实现
class DeepseekAdapter implements LLMAdapter {
  async analyze(prompt: string): Promise<LLMResponse> {
    // Deepseek API 调用实现
  }
}

class WenxinAdapter implements LLMAdapter {
  async analyze(prompt: string): Promise<LLMResponse> {
    // 文心一言 API 调用实现
  }
}

// 降级策略
class KeywordMatchingFallback {
  calculateScore(student: StudentProfile, project: Project): MatchScore {
    // 基于关键词的简单匹配算法
  }
}
```

**匹配算法流程:**

1. 构造提示词模板
2. 调用主 LLM API（带超时 3 秒）
3. 如果失败，尝试备用 LLM
4. 如果都失败，使用关键词匹配降级
5. 解析响应并标准化评分
6. 缓存结果（有效期 1 小时）

**提示词模板:**

```
你是一个科研实习匹配专家。请分析以下学生和项目的匹配程度：

学生信息：
- 专业：{major}
- 技能：{skills}
- 研究兴趣：{interests}
- 项目经验：{experience}

项目信息：
- 标题：{title}
- 要求：{requirements}
- 所需技能：{requiredSkills}
- 研究领域：{researchField}

请以 JSON 格式返回：
{
  "score": 0-100 的匹配度评分,
  "reasoning": "详细的匹配理由",
  "matchedSkills": ["匹配的技能列表"],
  "suggestions": "给学生的建议"
}
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
