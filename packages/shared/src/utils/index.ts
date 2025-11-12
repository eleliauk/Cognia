/**
 * 通用工具函数
 */

// 格式化日期
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// 生成唯一 ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// 延迟函数
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// API URL 构建器
export function buildApiUrl(path: string, baseUrl?: string): string {
  const base = baseUrl || process.env.API_BASE_URL || 'http://localhost:3000';
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

// 类型守卫：检查是否为错误对象
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

// 安全的 JSON 解析
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}