# 校内科研实习供需智能匹配与跟踪管理系统

2025 软件构造综合实验（团队项目）  
基于大模型 Agent 的大学科研实习供需智能匹配与管理系统

## 项目简介

本系统是一个面向高校师生的综合性平台，旨在通过大模型 Agent 技术实现科研项目与学生能力的智能匹配，并提供全流程的实习管理功能。

### 核心功能

- 🎯 **智能匹配**: 基于 LangChain 和大模型 API 的语义匹配引擎
- 👨‍🏫 **教师端**: 项目发布、申请管理、实习跟踪、学生评价
- 👨‍🎓 **学生端**: 能力档案、项目推荐、申请提交、进度管理
- 👨‍💼 **管理员**: 用户管理、系统监控、数据统计
- 🔔 **实时通知**: WebSocket 实时消息推送
- 📊 **数据分析**: 可视化统计看板

### 技术栈

- **前端**: React 18 + TypeScript + Vite + TailwindCSS + Zustand + React Query
- **后端**: Node.js + Express + TypeScript + Prisma ORM
- **数据库**: PostgreSQL
- **缓存**: Redis
- **AI**: LangChain + 大模型 API (Deepseek/文心一言/OpenAI)
- **实时通信**: Socket.io
- **开发工具**: ESLint + Prettier + Docker Compose

## 🚀 快速开始

### 前置要求

- [Bun](https://bun.sh) >= 1.0.0
- [Docker](https://www.docker.com/) 和 Docker Compose (用于数据库)

### 1. 克隆项目

```bash
git clone <repository-url>
cd research-internship-system
```

### 2. 安装依赖

```bash
bun install
```

### 3. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，配置数据库、Redis 和 LLM API 密钥
```

### 4. 启动数据库服务

```bash
# 启动 PostgreSQL 和 Redis
bun run docker:up

# 查看日志
bun run docker:logs

# 停止服务
bun run docker:down
```

### 5. 启动开发服务器

```bash
# 同时启动前端和后端
bun run dev

# 或分别启动
bun run dev:backend  # 后端: http://localhost:3000
bun run dev:frontend # 前端: http://localhost:8080
```

## 📦 可用脚本

### 开发脚本

- `bun run dev` - 同时启动前后端开发服务器
- `bun run dev:backend` - 仅启动后端开发服务器
- `bun run dev:frontend` - 仅启动前端开发服务器

### 构建和生产

- `bun run build` - 构建前端应用
- `bun run start` - 同时启动前后端生产服务器
- `bun run start:backend` - 仅启动后端生产服务器
- `bun run start:frontend` - 仅启动前端生产服务器

### 代码质量

- `bun run lint` - 运行 ESLint 检查
- `bun run lint:fix` - 自动修复 ESLint 问题
- `bun run format` - 格式化代码
- `bun run format:check` - 检查代码格式

### Docker 管理

- `bun run docker:up` - 启动 PostgreSQL 和 Redis
- `bun run docker:down` - 停止并删除容器
- `bun run docker:logs` - 查看容器日志
- `bun run docker:restart` - 重启容器

### 其他

- `bun run clean` - 清理所有 node_modules
- `bun install` - 安装所有依赖

## 🏗️ 项目结构

```
.
├── apps/
│   ├── backend/              # 后端服务
│   │   ├── src/
│   │   │   └── index.ts      # 入口文件
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── frontend/             # 前端应用
│       ├── src/
│       │   ├── components/   # React 组件
│       │   ├── lib/          # 工具函数
│       │   └── index.tsx     # 入口文件
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   └── shared/               # 共享代码和类型定义
│       ├── src/
│       │   ├── types/        # TypeScript 类型
│       │   └── utils/        # 工具函数
│       └── package.json
├── .kiro/
│   └── specs/                # 项目规格文档
│       └── research-internship-matching-system/
│           ├── requirements.md  # 需求文档
│           ├── design.md        # 设计文档
│           └── tasks.md         # 任务列表
├── docker-compose.yml        # Docker 配置
├── .eslintrc.json            # ESLint 配置
├── .prettierrc.json          # Prettier 配置
├── tsconfig.json             # TypeScript 配置
└── package.json              # 根配置文件
```

## 🔧 配置说明

### 环境变量

主要环境变量说明（详见 `.env.example`）：

```bash
# 数据库配置
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/research_internship

# Redis 配置
REDIS_URL=redis://:redis@localhost:6379

# JWT 配置
JWT_SECRET=your-secret-key-change-in-production

# LLM API 配置
LLM_PROVIDER=deepseek
LLM_API_KEY=your-api-key
LLM_BASE_URL=https://api.deepseek.com/v1
```

### Docker 服务

- **PostgreSQL**: 端口 5432，数据库名 `research_internship`
- **Redis**: 端口 6379，密码 `redis`

数据持久化在 Docker volumes 中，停止容器不会丢失数据。
