import { useEffect, useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Loading,
  ErrorMessage,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Pagination,
} from '@/components/ui';
import { Input } from '@/components/ui/input';
import { adminService, type UserInfo, type UserListParams } from '@/services/adminService';
import {
  Search,
  UserCheck,
  UserX,
  Shield,
  GraduationCap,
  User,
  MoreVertical,
  RefreshCw,
} from 'lucide-react';

type UserRole = 'TEACHER' | 'STUDENT' | 'ADMIN';

export default function UsersPage() {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | ''>('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'email'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal states
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params: UserListParams = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        sortBy,
        sortOrder,
      };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.isActive = statusFilter === 'active';

      const response = await adminService.getUserList(params);
      setUsers(response.users);
      setPagination(response.pagination);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('获取用户列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, search, roleFilter, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchUsers();
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleSort = (field: 'createdAt' | 'name' | 'email') => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleRoleChange = async (newRole: UserRole) => {
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      await adminService.updateUserRole(selectedUser.id, newRole);
      setShowRoleModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      console.error('Failed to update user role:', err);
      alert('修改角色失败，请稍后重试');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (isActive: boolean) => {
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      await adminService.setUserActiveStatus(selectedUser.id, isActive);
      setShowStatusModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      console.error('Failed to update user status:', err);
      alert('修改状态失败，请稍后重试');
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Shield className="h-4 w-4 text-amber-500" />;
      case 'TEACHER':
        return <GraduationCap className="h-4 w-4 text-purple-500" />;
      case 'STUDENT':
        return <User className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      ADMIN: '管理员',
      TEACHER: '教师',
      STUDENT: '学生',
    };
    return labels[role] || role;
  };

  if (loading && users.length === 0) {
    return <Loading text="加载用户列表..." />;
  }

  if (error && users.length === 0) {
    return <ErrorMessage title="加载失败" message={error} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">用户管理</h1>
        <p className="text-muted-foreground">管理系统用户、角色和权限</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索用户名或邮箱..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as UserRole | '');
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">全部角色</option>
              <option value="ADMIN">管理员</option>
              <option value="TEACHER">教师</option>
              <option value="STUDENT">学生</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'active' | 'inactive' | '');
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">全部状态</option>
              <option value="active">已启用</option>
              <option value="inactive">已禁用</option>
            </select>
            <Button type="submit" variant="outline">
              <Search className="h-4 w-4 mr-2" />
              搜索
            </Button>
            <Button type="button" variant="ghost" onClick={fetchUsers}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">用户列表</h2>
            <span className="text-sm text-muted-foreground">共 {pagination.total} 个用户</span>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:text-foreground"
                  onClick={() => handleSort('name')}
                >
                  用户名 {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:text-foreground"
                  onClick={() => handleSort('email')}
                >
                  邮箱 {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead>角色</TableHead>
                <TableHead>状态</TableHead>
                <TableHead
                  className="cursor-pointer hover:text-foreground"
                  onClick={() => handleSort('createdAt')}
                >
                  注册时间 {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {getRoleIcon(user.role)}
                      <span>{getRoleLabel(user.role)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <UserCheck className="h-3 w-3" />
                        已启用
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        <UserX className="h-3 w-3" />
                        已禁用
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="relative inline-block">
                      <button
                        className="p-2 hover:bg-muted rounded-md"
                        onClick={() => {
                          setSelectedUser(user);
                          // Show dropdown menu
                          const menu = document.getElementById(`menu-${user.id}`);
                          if (menu) {
                            menu.classList.toggle('hidden');
                          }
                        }}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      <div
                        id={`menu-${user.id}`}
                        className="hidden absolute right-0 mt-1 w-40 bg-card border rounded-md shadow-lg z-10"
                      >
                        <button
                          className="w-full px-4 py-2 text-left text-sm hover:bg-muted"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowRoleModal(true);
                            document.getElementById(`menu-${user.id}`)?.classList.add('hidden');
                          }}
                        >
                          修改角色
                        </button>
                        <button
                          className="w-full px-4 py-2 text-left text-sm hover:bg-muted"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowStatusModal(true);
                            document.getElementById(`menu-${user.id}`)?.classList.add('hidden');
                          }}
                        >
                          {user.isActive ? '禁用用户' : '启用用户'}
                        </button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    暂无用户数据
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              pageSize={pagination.pageSize}
              totalItems={pagination.total}
            />
          )}
        </CardContent>
      </Card>

      {/* Role Change Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">修改用户角色</h3>
            <p className="text-muted-foreground mb-4">
              当前用户: <span className="font-medium text-foreground">{selectedUser.name}</span>
            </p>
            <p className="text-muted-foreground mb-4">
              当前角色:{' '}
              <span className="font-medium text-foreground">{getRoleLabel(selectedUser.role)}</span>
            </p>
            <div className="space-y-2 mb-6">
              <p className="text-sm font-medium">选择新角色:</p>
              <div className="grid grid-cols-3 gap-2">
                {(['STUDENT', 'TEACHER', 'ADMIN'] as UserRole[]).map((role) => (
                  <button
                    key={role}
                    disabled={role === selectedUser.role || actionLoading}
                    onClick={() => handleRoleChange(role)}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      role === selectedUser.role
                        ? 'bg-muted cursor-not-allowed'
                        : 'hover:bg-accent cursor-pointer'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      {getRoleIcon(role)}
                      <span className="text-sm">{getRoleLabel(role)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedUser(null);
                }}
                disabled={actionLoading}
              >
                取消
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {showStatusModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {selectedUser.isActive ? '禁用用户' : '启用用户'}
            </h3>
            <p className="text-muted-foreground mb-6">
              确定要{selectedUser.isActive ? '禁用' : '启用'}用户{' '}
              <span className="font-medium text-foreground">{selectedUser.name}</span> 吗？
              {selectedUser.isActive && (
                <span className="block mt-2 text-amber-600">禁用后该用户将无法登录系统。</span>
              )}
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedUser(null);
                }}
                disabled={actionLoading}
              >
                取消
              </Button>
              <Button
                variant={selectedUser.isActive ? 'destructive' : 'default'}
                onClick={() => handleStatusChange(!selectedUser.isActive)}
                disabled={actionLoading}
              >
                {actionLoading ? '处理中...' : selectedUser.isActive ? '确认禁用' : '确认启用'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
