import { useState, useEffect } from 'react';
import type { Todo, CreateTodoInput } from '@cognia/shared';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoDescription, setNewTodoDescription] = useState('');
  const [healthStatus, setHealthStatus] = useState<string>('检查中...');

  // 检查后端健康状态
  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const response = await api.health();
      if (response.success) {
        setHealthStatus(`✅ 后端运行正常 (运行时间: ${Math.floor(response.data?.uptime || 0)}秒)`);
      } else {
        setHealthStatus('❌ 后端连接失败');
      }
    } catch (err) {
      setHealthStatus('❌ 无法连接到后端');
    }
  };

  // 加载所有 todos
  const loadTodos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getTodos();
      if (response.success && response.data) {
        setTodos(response.data);
      } else {
        setError(response.error || '加载失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  // 创建新 todo
  const createTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const input: CreateTodoInput = {
        title: newTodoTitle,
        description: newTodoDescription || undefined,
        completed: false,
      };
      const response = await api.createTodo(input);
      if (response.success && response.data) {
        setTodos([...todos, response.data]);
        setNewTodoTitle('');
        setNewTodoDescription('');
      } else {
        setError(response.error || '创建失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setLoading(false);
    }
  };

  // 切换完成状态
  const toggleTodo = async (id: string, completed: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.updateTodo(id, { completed: !completed });
      if (response.success && response.data) {
        setTodos(todos.map(t => t.id === id ? response.data! : t));
      } else {
        setError(response.error || '更新失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除 todo
  const deleteTodo = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.deleteTodo(id);
      if (response.success) {
        setTodos(todos.filter(t => t.id !== id));
      } else {
        setError(response.error || '删除失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Todo 管理应用</CardTitle>
          <CardDescription>{healthStatus}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={loadTodos} disabled={loading}>
                {loading ? '加载中...' : '加载 Todos'}
              </Button>
              <Button onClick={checkHealth} variant="outline">
                检查后端状态
              </Button>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive rounded-lg text-destructive">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={createTodo} className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <div className="space-y-2">
                <Label htmlFor="title">标题</Label>
                <Input
                  id="title"
                  value={newTodoTitle}
                  onChange={(e) => setNewTodoTitle(e.target.value)}
                  placeholder="输入待办事项标题"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">描述（可选）</Label>
                <Input
                  id="description"
                  value={newTodoDescription}
                  onChange={(e) => setNewTodoDescription(e.target.value)}
                  placeholder="输入描述"
                  disabled={loading}
                />
              </div>
              <Button type="submit" disabled={loading || !newTodoTitle.trim()}>
                添加 Todo
              </Button>
            </form>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">待办事项列表 ({todos.length})</h3>
              {todos.length === 0 ? (
                <p className="text-muted-foreground">暂无待办事项，点击"加载 Todos"或添加新的</p>
              ) : (
                <div className="space-y-2">
                  {todos.map((todo) => (
                    <div
                      key={todo.id}
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => toggleTodo(todo.id, todo.completed)}
                        disabled={loading}
                        className="mt-1 h-4 w-4"
                      />
                      <div className="flex-1">
                        <h4 className={`font-medium ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {todo.title}
                        </h4>
                        {todo.description && (
                          <p className="text-sm text-muted-foreground">{todo.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          创建于: {new Date(todo.createdAt).toLocaleString('zh-CN')}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteTodo(todo.id)}
                        disabled={loading}
                      >
                        删除
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}