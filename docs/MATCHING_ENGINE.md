# LangChain 智能匹配引擎文档

## 概述

智能匹配引擎是系统的核心功能，使用 LangChain 框架集成大语言模型（LLM）API，实现学生与科研项目之间的智能语义匹配。

## 架构设计

### 核心组件

1. **LLM 配置层** (`langchain/llmConfig.ts`)
   - 支持多个 LLM 提供商（Deepseek、OpenRouter、OpenAI）
   - 环境变量配置
   - 提供商选择逻辑

2. **提示词模板** (`langchain/prompts/matchingPrompt.ts`)
   - 结构化的匹配分析提示词
   - 包含学生信息和项目信息的完整上下文

3. **输出解析器** (`langchain/parsers/matchingParser.ts`)
   - 使用 Zod 定义输出结构
   - 结构化输出解析
   - 类型安全的结果验证

4. **匹配引擎** (`services/matchingEngine.ts`)
   - 核心匹配逻辑
   - LLM 调用和降级策略
   - 批量匹配处理

5. **缓存服务** (`services/matchingCache.ts`)
   - Redis 缓存实现
   - 缓存失效策略
   - 性能优化

## 配置说明

### 环境变量

在 `.env` 文件中配置以下变量：

```bash
# LLM 提供商选择 (deepseek, openrouter, openai)
LLM_PROVIDER="deepseek"

# API 密钥
LLM_API_KEY="your-api-key-here"

# 可选：自定义 API 端点和模型
LLM_BASE_URL="https://api.deepseek.com/v1"
LLM_MODEL="deepseek-chat"

# 超时设置（毫秒）
LLM_TIMEOUT="3000"
```

### 支持的 LLM 提供商

#### 1. Deepseek

```bash
LLM_PROVIDER="deepseek"
LLM_API_KEY="sk-..."
```

#### 2. OpenRouter

```bash
LLM_PROVIDER="openrouter"
LLM_API_KEY="sk-or-..."
```

#### 3. OpenAI

```bash
LLM_PROVIDER="openai"
LLM_API_KEY="sk-..."
```

#### 4. 自定义提供商

```bash
LLM_PROVIDER="custom"
LLM_BASE_URL="https://your-api-endpoint.com/v1"
LLM_MODEL="your-model-name"
LLM_API_KEY="your-api-key"
```

## 匹配算法

### 评分维度

匹配引擎从三个维度评估学生与项目的匹配度：

1. **技能匹配度** (0-100分)
   - 学生技能与项目要求的匹配程度
   - 权重：50%

2. **兴趣匹配度** (0-100分)
   - 学生研究兴趣与项目领域的契合度
   - 权重：30%

3. **经验匹配度** (0-100分)
   - 学生项目经验与项目需求的相关性
   - 权重：20%

### 总体评分

```
总分 = 技能匹配度 × 0.5 + 兴趣匹配度 × 0.3 + 经验匹配度 × 0.2
```

### 降级策略

当 LLM API 不可用时，系统自动切换到关键词匹配算法：

1. **技能匹配**：计算技能交集比例
2. **兴趣匹配**：检查研究兴趣是否包含项目领域
3. **经验匹配**：基于项目经验数量评分

## API 接口

### 1. 获取学生推荐项目

```http
GET /api/matching/recommendations?limit=10
Authorization: Bearer <student_token>
```

**响应示例：**

```json
{
  "success": true,
  "data": [
    {
      "projectId": "uuid",
      "studentId": "uuid",
      "score": 85,
      "reasoning": "该学生具备项目所需的主要技能...",
      "matchedSkills": ["Python", "机器学习", "数据分析"],
      "suggestions": "建议加强深度学习相关知识...",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 2. 获取项目匹配的学生

```http
GET /api/matching/projects/:projectId/students?limit=20
Authorization: Bearer <teacher_token>
```

**响应示例：**

```json
{
  "success": true,
  "data": [
    {
      "projectId": "uuid",
      "studentId": "uuid",
      "score": 92,
      "reasoning": "该学生的研究兴趣与项目高度契合...",
      "matchedSkills": ["Python", "TensorFlow", "NLP"],
      "suggestions": "该学生非常适合此项目",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 3. 获取缓存统计（管理员）

```http
GET /api/matching/cache/stats
Authorization: Bearer <admin_token>
```

**响应示例：**

```json
{
  "success": true,
  "data": {
    "matchScoreCount": 150,
    "studentMatchesCount": 25,
    "projectMatchesCount": 10
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 4. 清除缓存（管理员）

```http
DELETE /api/matching/cache
Authorization: Bearer <admin_token>
```

## 缓存策略

### 缓存层级

1. **匹配评分缓存** (`match:score:{studentId}:{projectId}`)
   - 单个学生-项目匹配结果
   - TTL: 1小时

2. **学生推荐缓存** (`match:student:{studentId}`)
   - 学生的所有推荐项目
   - TTL: 1小时

3. **项目匹配缓存** (`match:project:{projectId}`)
   - 项目的所有匹配学生
   - TTL: 1小时

### 缓存失效

缓存在以下情况下自动失效：

1. **学生档案更新**
   - 更新个人信息
   - 添加/修改/删除项目经验
   - 触发：`invalidateStudentCache(studentId)`

2. **项目信息更新**
   - 更新项目详情
   - 修改项目状态
   - 触发：`invalidateProjectCache(projectId)`

## 性能优化

### 1. 并行处理

匹配引擎使用 `Promise.all` 并行计算多个匹配评分：

```typescript
const matches = await Promise.all(
  projects.map(async (project) => {
    const score = await calculateMatchScore(student, project);
    return { projectId: project.id, score, ... };
  })
);
```

### 2. 缓存优先

每次匹配请求首先检查 Redis 缓存：

```typescript
const cached = await matchingCache.getCachedMatchScore(studentId, projectId);
if (cached) {
  return cached; // 直接返回缓存结果
}
```

### 3. 超时控制

LLM 调用设置 3 秒超时，超时后自动降级：

```typescript
const llm = new ChatOpenAI({
  timeout: 3000,
  maxRetries: 2,
});
```

## 监控和日志

### 日志输出

系统会记录以下关键事件：

- ✅ 缓存命中
- ⚠️ LLM API 调用失败（降级到关键词匹配）
- ✅ 缓存失效操作
- ❌ 错误和异常

### 监控指标

建议监控以下指标：

1. **LLM API 成功率**
2. **平均响应时间**
3. **缓存命中率**
4. **降级策略使用频率**

## 故障排查

### 问题：LLM API 调用失败

**可能原因：**

- API 密钥无效
- 网络连接问题
- API 配额用尽
- 超时

**解决方案：**

1. 检查 `LLM_API_KEY` 配置
2. 验证网络连接
3. 查看 API 提供商控制台
4. 系统会自动降级到关键词匹配

### 问题：匹配结果不准确

**可能原因：**

- 学生档案信息不完整
- 项目描述不清晰
- 提示词需要优化

**解决方案：**

1. 提醒学生完善档案
2. 优化项目描述
3. 调整提示词模板

### 问题：性能慢

**可能原因：**

- Redis 未启动
- 缓存未命中
- 并发请求过多

**解决方案：**

1. 确保 Redis 正常运行
2. 检查缓存配置
3. 实现请求队列

## 最佳实践

### 1. 档案完整性

鼓励学生填写完整的档案信息：

- 详细的技能列表
- 明确的研究兴趣
- 丰富的项目经验
- 清晰的自我介绍

### 2. 项目描述

教师应提供清晰的项目信息：

- 具体的技能要求
- 详细的项目描述
- 明确的研究领域
- 合理的时长设置

### 3. 定期更新

- 学生应定期更新档案
- 教师应及时更新项目状态
- 管理员应监控系统性能

## 扩展开发

### 添加新的 LLM 提供商

1. 在 `llmProviderConfigs` 中添加配置：

```typescript
export const llmProviderConfigs = {
  // ... 现有配置
  newProvider: {
    baseURL: 'https://api.newprovider.com/v1',
    modelName: 'model-name',
  },
};
```

2. 设置环境变量：

```bash
LLM_PROVIDER="newProvider"
LLM_API_KEY="your-key"
```

### 自定义匹配算法

修改 `fallbackMatching` 方法实现自定义降级策略：

```typescript
private fallbackMatching(student, project): MatchScore {
  // 实现自定义匹配逻辑
  return {
    overall: score,
    skillMatch: skillScore,
    interestMatch: interestScore,
    experienceMatch: expScore,
    reasoning: '自定义匹配算法',
    matchedSkills: [...],
    suggestions: '...',
  };
}
```

## 相关文档

- [LangChain 官方文档](https://js.langchain.com/)
- [Deepseek API 文档](https://platform.deepseek.com/docs)
- [OpenRouter API 文档](https://openrouter.ai/docs)
- [Redis 缓存最佳实践](https://redis.io/docs/manual/patterns/)
