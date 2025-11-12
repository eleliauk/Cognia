# Cognia 
2025 软件构造综合实验（团队项目）
基于大模型Agent的大学科研实习供需智能匹配与管理系统

## 🚀 快速开始

### 前置要求

- [Bun](https://bun.sh) >= 1.0.0

### 安装依赖

```bash
bun install
```

### 开发模式

同时启动前端和后端开发服务器：

```bash
bun run dev
```

或分别启动：

```bash
# 仅启动后端
bun run dev:backend

# 仅启动前端
bun run dev:frontend
```

### 生产模式

```bash
# 同时运行前后端
bun run start

# 或分别运行
bun run start:backend
bun run start:frontend
```

## 📦 可用脚本

### 根目录脚本

- `bun run dev` - 同时启动前后端开发服务器
- `bun run dev:backend` - 仅启动后端开发服务器
- `bun run dev:frontend` - 仅启动前端开发服务器
- `bun run start` - 同时启动前后端生产服务器
- `bun run build` - 构建前端应用
- `bun run clean` - 清理所有 node_modules
- `bun install` - 安装所有依赖

### 后端脚本 (apps/backend)

- `bun run dev` - 启动开发服务器（支持热重载）
- `bun run start` - 启动生产服务器

### 前端脚本 (apps/frontend)

- `bun run dev` - 启动开发服务器
- `bun run start` - 启动生产服务器
- `bun run build` - 构建生产版本

## 🔧 配置

### 环境变量

复制 `.env.example` 文件并根据需要修改：

```bash
# 根目录
cp .env.example .env

# 后端
cp apps/backend/.env.example apps/backend/.env

# 前端
cp apps/frontend/.env.example apps/frontend/.env
```