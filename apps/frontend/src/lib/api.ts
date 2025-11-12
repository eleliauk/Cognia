import type { ApiResponse, Todo, CreateTodoInput, UpdateTodoInput } from '@cognia/shared';

// 在浏览器环境中，直接使用后端 API 地址
// 可以通过配置文件或环境变量注入来修改
const API_BASE_URL = (globalThis as any).__API_BASE_URL__ || 'http://localhost:3000';

/**
 * 通用 API 请求函数
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const data = await response.json();
    return data as ApiResponse<T>;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * API 客户端
 */
export const api = {
  // 健康检查
  async health() {
    return fetchApi<{ uptime: number; timestamp: string }>('/api/health');
  },

  // 获取所有 todos
  async getTodos() {
    return fetchApi<Todo[]>('/api/todos');
  },

  // 获取单个 todo
  async getTodo(id: string) {
    return fetchApi<Todo>(`/api/todos/${id}`);
  },

  // 创建 todo
  async createTodo(input: CreateTodoInput) {
    return fetchApi<Todo>('/api/todos', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  // 更新 todo
  async updateTodo(id: string, input: UpdateTodoInput) {
    return fetchApi<Todo>(`/api/todos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  // 删除 todo
  async deleteTodo(id: string) {
    return fetchApi<void>(`/api/todos/${id}`, {
      method: 'DELETE',
    });
  },
};