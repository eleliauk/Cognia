import type { ApiResponse, Todo, CreateTodoInput, UpdateTodoInput } from '@cognia/shared';
import { generateId } from '@cognia/shared';

// 内存数据存储（示例）
const todos: Todo[] = [];

// 创建 Bun HTTP 服务器
const server = Bun.serve({
  port: process.env.PORT || 3000,
  
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // CORS 处理
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    };

    // 处理 OPTIONS 请求
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 路由处理
      // GET /api/health - 健康检查
      if (path === '/api/health' && method === 'GET') {
        const response: ApiResponse = {
          success: true,
          message: 'Server is running',
          data: { uptime: process.uptime(), timestamp: new Date().toISOString() },
        };
        return new Response(JSON.stringify(response), { headers: corsHeaders });
      }

      // GET /api/todos - 获取所有 todos
      if (path === '/api/todos' && method === 'GET') {
        const response: ApiResponse<Todo[]> = {
          success: true,
          data: todos,
        };
        return new Response(JSON.stringify(response), { headers: corsHeaders });
      }

      // POST /api/todos - 创建新 todo
      if (path === '/api/todos' && method === 'POST') {
        const body = await req.json() as CreateTodoInput;
        
        const newTodo: Todo = {
          id: generateId(),
          title: body.title,
          description: body.description,
          completed: body.completed || false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        todos.push(newTodo);
        
        const response: ApiResponse<Todo> = {
          success: true,
          data: newTodo,
          message: 'Todo created successfully',
        };
        return new Response(JSON.stringify(response), { headers: corsHeaders, status: 201 });
      }

      // GET /api/todos/:id - 获取单个 todo
      if (path.startsWith('/api/todos/') && method === 'GET') {
        const id = path.split('/')[3];
        const todo = todos.find(t => t.id === id);
        
        if (!todo) {
          const response: ApiResponse = {
            success: false,
            error: 'Todo not found',
          };
          return new Response(JSON.stringify(response), { headers: corsHeaders, status: 404 });
        }
        
        const response: ApiResponse<Todo> = {
          success: true,
          data: todo,
        };
        return new Response(JSON.stringify(response), { headers: corsHeaders });
      }

      // PUT /api/todos/:id - 更新 todo
      if (path.startsWith('/api/todos/') && method === 'PUT') {
        const id = path.split('/')[3];
        const todoIndex = todos.findIndex(t => t.id === id);
        
        if (todoIndex === -1) {
          const response: ApiResponse = {
            success: false,
            error: 'Todo not found',
          };
          return new Response(JSON.stringify(response), { headers: corsHeaders, status: 404 });
        }
        
        const body = await req.json() as UpdateTodoInput;
        const updatedTodo: Todo = {
          ...todos[todoIndex]!,
          ...body,
          updatedAt: new Date(),
        };
        
        todos[todoIndex] = updatedTodo;
        
        const response: ApiResponse<Todo> = {
          success: true,
          data: updatedTodo,
          message: 'Todo updated successfully',
        };
        return new Response(JSON.stringify(response), { headers: corsHeaders });
      }

      // DELETE /api/todos/:id - 删除 todo
      if (path.startsWith('/api/todos/') && method === 'DELETE') {
        const id = path.split('/')[3];
        const todoIndex = todos.findIndex(t => t.id === id);
        
        if (todoIndex === -1) {
          const response: ApiResponse = {
            success: false,
            error: 'Todo not found',
          };
          return new Response(JSON.stringify(response), { headers: corsHeaders, status: 404 });
        }
        
        todos.splice(todoIndex, 1);
        
        const response: ApiResponse = {
          success: true,
          message: 'Todo deleted successfully',
        };
        return new Response(JSON.stringify(response), { headers: corsHeaders });
      }

      // 404 处理
      const response: ApiResponse = {
        success: false,
        error: 'Not found',
      };
      return new Response(JSON.stringify(response), { headers: corsHeaders, status: 404 });

    } catch (error) {
      console.error('Server error:', error);
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      };
      return new Response(JSON.stringify(response), { headers: corsHeaders, status: 500 });
    }
  },
});

console.log(`🚀 Backend server running at http://localhost:${server.port}`);