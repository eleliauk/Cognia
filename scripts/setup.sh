#!/bin/bash

# 项目初始化脚本
# 用于快速设置开发环境

set -e

echo "🚀 开始设置开发环境..."

# 检查 Bun 是否安装
if ! command -v bun &> /dev/null; then
    echo "❌ 错误: 未找到 Bun"
    echo "请访问 https://bun.sh 安装 Bun"
    exit 1
fi

echo "✅ Bun 已安装: $(bun --version)"

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ 错误: 未找到 Docker"
    echo "请访问 https://www.docker.com/products/docker-desktop 安装 Docker Desktop"
    exit 1
fi

echo "✅ Docker 已安装: $(docker --version)"

# 安装依赖
echo "📦 安装项目依赖..."
bun install

# 复制环境变量文件
if [ ! -f .env ]; then
    echo "📝 创建 .env 文件..."
    cp .env.example .env
    echo "⚠️  请编辑 .env 文件，配置必要的环境变量（特别是 LLM_API_KEY）"
else
    echo "✅ .env 文件已存在"
fi

# 启动 Docker 服务
echo "🐳 启动 Docker 服务..."
docker compose up -d

# 等待服务启动
echo "⏳ 等待数据库服务启动..."
sleep 5

# 检查服务状态
echo "📊 检查服务状态..."
docker compose ps

# 初始化数据库
echo "🗄️  初始化数据库..."
bun run --filter backend db:generate
bun run --filter backend db:push

echo ""
echo "✨ 开发环境设置完成！"
echo ""
echo "下一步："
echo "1. 编辑 .env 文件，配置 LLM_API_KEY"
echo "2. 运行 'bun run dev' 启动开发服务器"
echo "3. 访问 http://localhost:8080 查看前端"
echo "4. 访问 http://localhost:3000 查看后端 API"
echo ""
echo "有用的命令："
echo "  bun run dev          - 启动开发服务器"
echo "  bun run docker:logs  - 查看 Docker 日志"
echo "  bun run lint         - 检查代码规范"
echo "  bun run format       - 格式化代码"
echo ""
