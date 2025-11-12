# Docker 配置说明

本项目使用 Docker Compose 管理开发环境的数据库服务。

## 服务列表

### PostgreSQL

- **镜像**: postgres:16-alpine
- **容器名**: research-internship-postgres
- **端口**: 5432
- **默认配置**:
  - 用户名: postgres
  - 密码: postgres
  - 数据库: research_internship

### Redis

- **镜像**: redis:7-alpine
- **容器名**: research-internship-redis
- **端口**: 6379
- **默认密码**: redis

## 常用命令

### 启动服务

```bash
# 启动所有服务（后台运行）
docker-compose up -d

# 或使用 npm 脚本
bun run docker:up
```

### 停止服务

```bash
# 停止并删除容器
docker-compose down

# 或使用 npm 脚本
bun run docker:down
```

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f postgres
docker-compose logs -f redis

# 或使用 npm 脚本
bun run docker:logs
```

### 重启服务

```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart postgres
docker-compose restart redis

# 或使用 npm 脚本
bun run docker:restart
```

### 查看服务状态

```bash
docker-compose ps
```

### 进入容器

```bash
# 进入 PostgreSQL 容器
docker exec -it research-internship-postgres psql -U postgres -d research_internship

# 进入 Redis 容器
docker exec -it research-internship-redis redis-cli -a redis
```

## 数据持久化

数据存储在 Docker volumes 中：

- `postgres-data`: PostgreSQL 数据
- `redis-data`: Redis 数据

即使删除容器，数据也会保留。如需完全清理：

```bash
# 停止服务并删除 volumes
docker-compose down -v
```

## 自定义配置

可以通过环境变量自定义配置，在 `.env` 文件中设置：

```bash
# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=research_internship
POSTGRES_PORT=5432

# Redis
REDIS_PASSWORD=redis
REDIS_PORT=6379
```

## 健康检查

两个服务都配置了健康检查：

- PostgreSQL: 每 10 秒检查一次，使用 `pg_isready`
- Redis: 每 10 秒检查一次，使用 `redis-cli ping`

查看健康状态：

```bash
docker-compose ps
```

## 故障排除

### 端口冲突

如果端口已被占用，可以在 `.env` 文件中修改端口：

```bash
POSTGRES_PORT=5433
REDIS_PORT=6380
```

### 连接失败

1. 确认服务已启动：`docker-compose ps`
2. 查看日志：`docker-compose logs`
3. 检查健康状态：`docker-compose ps`

### 重置数据

```bash
# 停止服务并删除数据
docker-compose down -v

# 重新启动
docker-compose up -d
```
