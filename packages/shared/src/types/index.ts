// API 请求/响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 用户相关类型
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

// 示例数据类型
export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateTodoInput = Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateTodoInput = Partial<CreateTodoInput>;