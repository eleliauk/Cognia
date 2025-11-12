# 开发指南

本文档提供项目开发的详细指南和最佳实践。

## 开发环境设置

### 1. 安装依赖

确保已安装以下工具：

- [Bun](https://bun.sh) >= 1.0.0
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Git](https://git-scm.com/)

### 2. 克隆项目

```bash
git clone <repository-url>
cd research-internship-system
```

### 3. 安装项目依赖

```bash
bun install
```

### 4. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，配置必要的环境变量
# 特别注意配置 LLM_API_KEY
```

### 5. 启动数据库

```bash
bun run docker:up
```

## 开发工作流

### 启动开发服务器

```bash
# 同时启动前后端
bun run dev

# 或分别启动
bun run dev:backend  # 后端: http://localhost:3000
bun run dev:frontend # 前端: http://localhost:8080
```

### 代码规范

#### 运行 Linter

```bash
# 检查代码
bun run lint

# 自动修复问题
bun run lint:fix
```

#### 格式化代码

```bash
# 格式化所有文件
bun run format

# 检查格式
bun run format:check
```

#### 提交前检查

在提交代码前，建议运行：

```bash
bun run lint:fix
bun run format
```

## 项目结构说明

### Monorepo 架构

项目采用 monorepo 架构，使用 Bun workspaces 管理：

```
.
├── apps/
│   ├── backend/      # 后端应用
│   └── frontend/     # 前端应用
└── packages/
    └── shared/       # 共享代码
```

### 后端结构

```
apps/backend/
├── src/
│   ├── index.ts           # 入口文件
│   ├── config/            # 配置文件
│   ├── controllers/       # 控制器
│   ├── services/          # 业务逻辑
│   ├── models/            # 数据模型
│   ├── middleware/        # 中间件
│   ├── routes/            # 路由定义
│   └── utils/             # 工具函数
├── package.json
└── tsconfig.json
```

### 前端结构

```
apps/frontend/
├── src/
│   ├── components/        # React 组件
│   │   ├── ui/           # 基础 UI 组件
│   │   ├── teacher/      # 教师端组件
│   │   ├── student/      # 学生端组件
│   │   └── admin/        # 管理员组件
│   ├── pages/            # 页面组件
│   ├── lib/              # 工具函数
│   ├── hooks/            # 自定义 Hooks
│   ├── stores/           # Zustand 状态管理
│   ├── services/         # API 服务
│   └── index.tsx         # 入口文件
├── package.json
└── tsconfig.json
```

### 共享包结构

```
packages/shared/
├── src/
│   ├── types/            # TypeScript 类型定义
│   │   ├── user.ts
│   │   ├── project.ts
│   │   └── index.ts
│   └── utils/            # 共享工具函数
│       └── index.ts
└── package.json
```

## 编码规范

### TypeScript

- 使用严格模式 (`strict: true`)
- 避免使用 `any`，优先使用具体类型
- 为函数参数和返回值添加类型注解
- 使用接口 (interface) 定义对象结构

### React

- 使用函数组件和 Hooks
- 组件文件使用 PascalCase 命名
- 使用 TypeScript 定义 Props 类型
- 避免在组件内定义复杂逻辑，提取到自定义 Hooks

### 命名规范

- 文件名：kebab-case (例如：`user-profile.ts`)
- 组件名：PascalCase (例如：`UserProfile.tsx`)
- 函数名：camelCase (例如：`getUserProfile`)
- 常量名：UPPER_SNAKE_CASE (例如：`API_BASE_URL`)
- 类型/接口名：PascalCase (例如：`UserProfile`)

### 注释规范

```typescript
/**
 * 获取用户档案
 * @param userId - 用户 ID
 * @returns 用户档案对象
 */
async function getUserProfile(userId: string): Promise<UserProfile> {
  // 实现逻辑
}
```

## Git 工作流

### 分支命名

- `main` - 主分支
- `develop` - 开发分支
- `feature/xxx` - 功能分支
- `fix/xxx` - 修复分支
- `hotfix/xxx` - 紧急修复分支

### 提交信息规范

使用语义化提交信息：

```
<type>(<scope>): <subject>

<body>

<footer>
```

类型 (type)：

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

示例：

```
feat(auth): 实现用户登录功能

- 添加 JWT 令牌生成
- 实现密码哈希验证
- 添加登录 API 端点

Closes #123
```

## 调试技巧

### 后端调试

使用 Bun 的内置调试器：

```bash
bun --inspect src/index.ts
```

### 前端调试

使用浏览器开发者工具：

- Chrome DevTools
- React Developer Tools

### 数据库调试

```bash
# 连接到 PostgreSQL
docker exec -it research-internship-postgres psql -U postgres -d research_internship

# 查看表
\dt

# 查询数据
SELECT * FROM users;
```

### Redis 调试

```bash
# 连接到 Redis
docker exec -it research-internship-redis redis-cli -a redis

# 查看所有键
KEYS *

# 获取值
GET key_name
```

## 常见问题

### 端口冲突

如果端口被占用，修改 `.env` 文件中的端口配置：

```bash
BACKEND_PORT=3001
FRONTEND_PORT=8081
POSTGRES_PORT=5433
REDIS_PORT=6380
```

### 依赖安装失败

```bash
# 清理缓存
bun run clean

# 重新安装
bun install
```

### Docker 服务启动失败

```bash
# 查看日志
bun run docker:logs

# 重启服务
bun run docker:restart

# 完全重置
bun run docker:down
bun run docker:up
```

## 性能优化建议

### 前端

- 使用 React.memo 避免不必要的重渲染
- 使用 useMemo 和 useCallback 优化计算和回调
- 实现代码分割和懒加载
- 优化图片和资源加载

### 后端

- 使用数据库索引优化查询
- 实现 Redis 缓存减少数据库访问
- 使用连接池管理数据库连接
- 实现 API 响应压缩

## 测试

### 运行测试

```bash
# 运行所有测试
bun test

# 运行特定测试
bun test path/to/test.ts
```

### 编写测试

```typescript
import { describe, it, expect } from 'bun:test';

describe('UserService', () => {
  it('should create a user', async () => {
    const user = await createUser({ email: 'test@example.com' });
    expect(user.email).toBe('test@example.com');
  });
});
```

## 部署

### 构建生产版本

```bash
# 构建前端
bun run build

# 启动生产服务器
bun run start
```

### 环境变量

确保在生产环境中设置正确的环境变量：

- `NODE_ENV=production`
- `DATABASE_URL` - 生产数据库连接
- `JWT_SECRET` - 强密码
- `LLM_API_KEY` - 生产 API 密钥

## 资源链接

- [Bun 文档](https://bun.sh/docs)
- [React 文档](https://react.dev/)
- [TypeScript 文档](https://www.typescriptlang.org/docs/)
- [Prisma 文档](https://www.prisma.io/docs)
- [LangChain 文档](https://js.langchain.com/docs/)
