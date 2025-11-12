# 基础架构说明

本文档描述项目的基础架构配置和组件。

## 项目架构

### Monorepo 结构

项目采用 monorepo 架构，使用 Bun workspaces 管理多个包：

```
research-internship-system/
├── apps/
│   ├── backend/          # 后端应用（Node.js + Express + TypeScript）
│   └── frontend/         # 前端应用（React + TypeScript + Vite）
├── packages/
│   └── shared/           # 共享代码和类型定义
├── scripts/              # 构建和部署脚本
└── docker-compose.yml    # Docker 服务配置
```

### 技术栈

#### 前端技术栈

- **框架**: React 18
- **语言**: TypeScript
- **构建工具**: Vite
- **样式**: TailwindCSS
- **状态管理**: Zustand
- **数据获取**: React Query
- **路由**: React Router
- **图表**: Recharts
- **实时通信**: Socket.io-client

#### 后端技术栈

- **运行时**: Node.js (Bun)
- **框架**: Express
- **语言**: TypeScript
- **ORM**: Prisma
- **数据库**: PostgreSQL
- **缓存**: Redis
- **认证**: JWT
- **验证**: Zod
- **AI**: LangChain
- **实时通信**: Socket.io

#### 开发工具

- **包管理器**: Bun
- **代码检查**: ESLint
- **代码格式化**: Prettier
- **容器化**: Docker + Docker Compose
- **版本控制**: Git

## 配置文件说明

### TypeScript 配置

#### 根配置 (tsconfig.json)

- 使用 ESNext 特性
- 启用严格模式
- 配置路径映射支持 workspace 包引用
- Bundler 模式解析

#### 应用配置

- `apps/backend/tsconfig.json`: 继承根配置，针对后端优化
- `apps/frontend/tsconfig.json`: 继承根配置，支持 JSX
- `packages/shared/tsconfig.json`: 继承根配置，用于共享代码

### ESLint 配置 (.eslintrc.json)

- TypeScript 支持
- React 规则
- React Hooks 规则
- Prettier 集成（避免冲突）

### Prettier 配置 (.prettierrc.json)

- 使用分号
- 单引号
- 行宽 100
- 2 空格缩进
- LF 换行符

### EditorConfig (.editorconfig)

- 统一编辑器设置
- UTF-8 编码
- LF 换行符
- 自动删除尾随空格

## Docker 服务

### PostgreSQL

- **版本**: 16 (Alpine)
- **端口**: 5432
- **数据库**: research_internship
- **用户**: postgres
- **持久化**: Docker volume (postgres-data)
- **健康检查**: pg_isready

### Redis

- **版本**: 7 (Alpine)
- **端口**: 6379
- **密码**: redis (可配置)
- **持久化**: Docker volume (redis-data)
- **健康检查**: redis-cli ping

### 服务管理

```bash
# 启动服务
bun run docker:up

# 停止服务
bun run docker:down

# 查看日志
bun run docker:logs

# 重启服务
bun run docker:restart
```

## 环境变量

### 必需的环境变量

```bash
# 数据库
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/research_internship

# Redis
REDIS_URL=redis://:redis@localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# LLM API
LLM_PROVIDER=deepseek
LLM_API_KEY=your-api-key
LLM_BASE_URL=https://api.deepseek.com/v1
```

### 可选的环境变量

```bash
# 服务端口
BACKEND_PORT=3000
FRONTEND_PORT=8080

# 数据库配置
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=research_internship

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis

# JWT 配置
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# LLM 配置
LLM_MODEL=deepseek-chat
LLM_TIMEOUT=3000

# 文件上传
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

## 网络架构

### 开发环境

```
┌─────────────┐
│   浏览器     │
│ :8080       │
└──────┬──────┘
       │ HTTP
       ▼
┌─────────────┐
│  前端服务    │
│  Vite Dev   │
│  :8080      │
└──────┬──────┘
       │ HTTP/WS
       ▼
┌─────────────┐
│  后端服务    │
│  Express    │
│  :3000      │
└──┬────┬─────┘
   │    │
   │    └──────────┐
   │               │
   ▼               ▼
┌──────────┐  ┌──────────┐
│PostgreSQL│  │  Redis   │
│  :5432   │  │  :6379   │
└──────────┘  └──────────┘
```

### 生产环境

```
┌─────────────┐
│   用户       │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────┐
│  Nginx/CDN  │
│  反向代理    │
└──────┬──────┘
       │
       ├──────────┐
       │          │
       ▼          ▼
┌──────────┐  ┌──────────┐
│  前端     │  │  后端     │
│  静态文件 │  │  API     │
└──────────┘  └──┬────┬───┘
                 │    │
                 │    └──────────┐
                 │               │
                 ▼               ▼
              ┌──────────┐  ┌──────────┐
              │PostgreSQL│  │  Redis   │
              └──────────┘  └──────────┘
```

## 数据持久化

### Docker Volumes

- `postgres-data`: PostgreSQL 数据目录
- `redis-data`: Redis 数据目录

### 本地存储

- `uploads/`: 用户上传的文件
- `logs/`: 应用日志文件

## 安全配置

### 开发环境

- 使用默认密码（不要在生产环境使用）
- 允许本地访问
- 启用详细日志

### 生产环境

- 使用强密码
- 配置防火墙规则
- 启用 HTTPS
- 配置 CORS
- 实现速率限制
- 启用 Helmet 安全头
- 配置 CSP 策略

## 性能优化

### 数据库

- 创建适当的索引
- 使用连接池
- 实现查询缓存
- 定期清理过期数据

### 缓存策略

- Redis 缓存热点数据
- 匹配结果缓存（1 小时）
- API 响应缓存
- 静态资源缓存

### 前端优化

- 代码分割
- 懒加载
- 图片优化
- CDN 加速

## 监控和日志

### 日志级别

- `error`: 错误信息
- `warn`: 警告信息
- `info`: 一般信息
- `debug`: 调试信息

### 监控指标

- API 响应时间
- 数据库查询性能
- LLM API 调用成功率
- 错误率
- 用户活跃度

## 备份策略

### 数据库备份

```bash
# 手动备份
docker exec research-internship-postgres pg_dump -U postgres research_internship > backup.sql

# 恢复
docker exec -i research-internship-postgres psql -U postgres research_internship < backup.sql
```

### 自动备份

建议配置定时任务（cron）进行自动备份：

```bash
# 每天凌晨 2 点备份
0 2 * * * /path/to/backup-script.sh
```

## 扩展性考虑

### 水平扩展

- 使用负载均衡器分发请求
- 多个后端实例
- 共享 Redis 会话存储
- 数据库读写分离

### 垂直扩展

- 增加服务器资源
- 优化数据库配置
- 调整连接池大小

## 故障恢复

### 数据库故障

1. 检查 Docker 容器状态
2. 查看日志
3. 尝试重启容器
4. 从备份恢复

### Redis 故障

1. 检查容器状态
2. 重启 Redis 服务
3. 清理缓存数据

### 应用故障

1. 查看应用日志
2. 检查环境变量
3. 验证依赖服务
4. 重启应用

## 升级指南

### 依赖升级

```bash
# 检查过期依赖
bun outdated

# 升级依赖
bun update
```

### 数据库迁移

使用 Prisma 管理数据库迁移：

```bash
# 创建迁移
bunx prisma migrate dev

# 应用迁移
bunx prisma migrate deploy
```

## 参考资源

- [Bun 文档](https://bun.sh/docs)
- [Docker 文档](https://docs.docker.com/)
- [PostgreSQL 文档](https://www.postgresql.org/docs/)
- [Redis 文档](https://redis.io/docs/)
- [Prisma 文档](https://www.prisma.io/docs)
