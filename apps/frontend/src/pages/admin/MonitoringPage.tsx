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
import {
  adminService,
  type SystemMonitoringData,
  type AuditLog,
  type AuditLogListParams,
} from '@/services/adminService';
import {
  Activity,
  Server,
  Database,
  Zap,
  AlertTriangle,
  FileText,
  Search,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';

type TabType = 'overview' | 'audit' | 'errors';

export default function MonitoringPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [monitoring, setMonitoring] = useState<SystemMonitoringData | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Audit log pagination and filters
  const [auditPagination, setAuditPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const [auditSearch, setAuditSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');

  const fetchMonitoring = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getSystemMonitoring();
      setMonitoring(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch monitoring data:', err);
      setError('获取监控数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    try {
      const params: AuditLogListParams = {
        page: auditPagination.page,
        pageSize: auditPagination.pageSize,
      };
      if (actionFilter) params.action = actionFilter;
      if (resourceFilter) params.resource = resourceFilter;

      const response = await adminService.getAuditLogs(params);
      setAuditLogs(response.logs);
      setAuditPagination(response.pagination);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    }
  }, [auditPagination.page, auditPagination.pageSize, actionFilter, resourceFilter]);

  useEffect(() => {
    fetchMonitoring();
  }, [fetchMonitoring]);

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab, fetchAuditLogs]);

  const handleAuditPageChange = (page: number) => {
    setAuditPagination((prev) => ({ ...prev, page }));
  };

  const handleAuditSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAuditPagination((prev) => ({ ...prev, page: 1 }));
    fetchAuditLogs();
  };

  if (loading && !monitoring) {
    return <Loading text="加载系统监控数据..." />;
  }

  if (error && !monitoring) {
    return <ErrorMessage title="加载失败" message={error} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">系统监控</h1>
          <p className="text-muted-foreground">监控系统性能、API 调用和日志</p>
        </div>
        <Button variant="outline" onClick={fetchMonitoring}>
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-4">
          {[
            { id: 'overview', label: '系统概览', icon: Activity },
            { id: 'audit', label: '审计日志', icon: FileText },
            { id: 'errors', label: '错误日志', icon: AlertTriangle },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && monitoring && <OverviewTab monitoring={monitoring} />}
      {activeTab === 'audit' && (
        <AuditTab
          logs={auditLogs}
          pagination={auditPagination}
          search={auditSearch}
          actionFilter={actionFilter}
          resourceFilter={resourceFilter}
          onSearchChange={setAuditSearch}
          onActionFilterChange={setActionFilter}
          onResourceFilterChange={setResourceFilter}
          onSearch={handleAuditSearch}
          onPageChange={handleAuditPageChange}
          onRefresh={fetchAuditLogs}
        />
      )}
      {activeTab === 'errors' && monitoring && <ErrorsTab errorLogs={monitoring.errorLogs} />}
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ monitoring }: { monitoring: SystemMonitoringData }) {
  return (
    <div className="space-y-6">
      {/* LLM API Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="API 调用总数"
          value={monitoring.llmApiStats.totalCalls}
          description="LLM API 调用次数"
          icon={<Zap className="h-4 w-4 text-yellow-500" />}
        />
        <StatsCard
          title="API 成功率"
          value={`${monitoring.llmApiStats.successRate}%`}
          description="调用成功比例"
          icon={
            monitoring.llmApiStats.successRate >= 90 ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            )
          }
          status={monitoring.llmApiStats.successRate >= 90 ? 'success' : 'warning'}
        />
        <StatsCard
          title="平均响应时间"
          value={`${monitoring.llmApiStats.avgResponseTime}ms`}
          description="API 平均响应时间"
          icon={<Clock className="h-4 w-4 text-blue-500" />}
        />
        <StatsCard
          title="降级使用率"
          value={`${monitoring.llmApiStats.fallbackUsage}%`}
          description="关键词匹配降级比例"
          icon={<Server className="h-4 w-4 text-orange-500" />}
          status={monitoring.llmApiStats.fallbackUsage <= 20 ? 'success' : 'warning'}
        />
      </div>

      {/* Database Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold">数据库统计</h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{monitoring.databaseStats.totalUsers}</div>
              <div className="text-sm text-muted-foreground">用户总数</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{monitoring.databaseStats.totalProjects}</div>
              <div className="text-sm text-muted-foreground">项目总数</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{monitoring.databaseStats.totalApplications}</div>
              <div className="text-sm text-muted-foreground">申请总数</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{monitoring.databaseStats.totalInternships}</div>
              <div className="text-sm text-muted-foreground">实习总数</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">
                {monitoring.databaseStats.totalNotifications}
              </div>
              <div className="text-sm text-muted-foreground">通知总数</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cache Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-cyan-500" />
            <h2 className="text-lg font-semibold">缓存统计</h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{monitoring.cacheStats.totalCacheEntries}</div>
              <div className="text-sm text-muted-foreground">缓存条目总数</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{monitoring.cacheStats.expiredEntries}</div>
              <div className="text-sm text-muted-foreground">已过期条目</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Audit Logs Preview */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">最近审计日志</h2>
        </CardHeader>
        <CardContent>
          {monitoring.auditLogs.length > 0 ? (
            <div className="space-y-2">
              {monitoring.auditLogs.slice(0, 10).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{getActionLabel(log.action)}</p>
                      <p className="text-sm text-muted-foreground">
                        {log.userName} · {log.resource}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">{formatDate(log.createdAt)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">暂无审计日志</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Audit Tab Component
interface AuditTabProps {
  logs: AuditLog[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  search: string;
  actionFilter: string;
  resourceFilter: string;
  onSearchChange: (value: string) => void;
  onActionFilterChange: (value: string) => void;
  onResourceFilterChange: (value: string) => void;
  onSearch: (e: React.FormEvent) => void;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

function AuditTab({
  logs,
  pagination,
  actionFilter,
  resourceFilter,
  onActionFilterChange,
  onResourceFilterChange,
  onSearch,
  onPageChange,
  onRefresh,
}: AuditTabProps) {
  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={onSearch} className="flex flex-wrap gap-4">
            <select
              value={actionFilter}
              onChange={(e) => onActionFilterChange(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">全部操作</option>
              <option value="UPDATE_USER_ROLE">修改角色</option>
              <option value="ENABLE_USER">启用用户</option>
              <option value="DISABLE_USER">禁用用户</option>
              <option value="DELETE_USER">删除用户</option>
              <option value="LOGIN">登录</option>
              <option value="LOGOUT">登出</option>
            </select>
            <select
              value={resourceFilter}
              onChange={(e) => onResourceFilterChange(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">全部资源</option>
              <option value="User">用户</option>
              <option value="Project">项目</option>
              <option value="Application">申请</option>
              <option value="Internship">实习</option>
            </select>
            <Button type="submit" variant="outline">
              <Search className="h-4 w-4 mr-2" />
              筛选
            </Button>
            <Button type="button" variant="ghost" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">审计日志</h2>
            <span className="text-sm text-muted-foreground">共 {pagination.total} 条记录</span>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>操作</TableHead>
                <TableHead>用户</TableHead>
                <TableHead>资源</TableHead>
                <TableHead>详情</TableHead>
                <TableHead>IP 地址</TableHead>
                <TableHead>时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {getActionLabel(log.action)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{log.userName}</p>
                      {log.userEmail && (
                        <p className="text-xs text-muted-foreground">{log.userEmail}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{log.resource}</TableCell>
                  <TableCell className="max-w-[200px]">
                    <p className="text-sm text-muted-foreground truncate">
                      {log.details ? JSON.stringify(log.details).slice(0, 50) + '...' : '-'}
                    </p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{log.ipAddress || '-'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(log.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    暂无审计日志
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={onPageChange}
              pageSize={pagination.pageSize}
              totalItems={pagination.total}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Errors Tab Component
function ErrorsTab({ errorLogs }: { errorLogs: SystemMonitoringData['errorLogs'] }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-semibold">错误日志</h2>
          </div>
        </CardHeader>
        <CardContent>
          {errorLogs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>操作</TableHead>
                  <TableHead>资源</TableHead>
                  <TableHead>详情</TableHead>
                  <TableHead>时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {errorLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        <XCircle className="h-3 w-3" />
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell>{log.resource}</TableCell>
                    <TableCell className="max-w-[300px]">
                      <p className="text-sm text-muted-foreground truncate">
                        {log.details ? JSON.stringify(log.details) : '-'}
                      </p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(log.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium">系统运行正常</p>
              <p className="text-muted-foreground">暂无错误日志记录</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Stats Card Component
interface StatsCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  status?: 'success' | 'warning' | 'error';
}

function StatsCard({ title, value, description, icon, status }: StatsCardProps) {
  const statusColors = {
    success: 'border-green-500/50',
    warning: 'border-amber-500/50',
    error: 'border-red-500/50',
  };

  return (
    <Card className={status ? statusColors[status] : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

// Helper functions
function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    UPDATE_USER_ROLE: '修改角色',
    ENABLE_USER: '启用用户',
    DISABLE_USER: '禁用用户',
    DELETE_USER: '删除用户',
    LOGIN: '用户登录',
    LOGOUT: '用户登出',
    CREATE_PROJECT: '创建项目',
    UPDATE_PROJECT: '更新项目',
    DELETE_PROJECT: '删除项目',
    SUBMIT_APPLICATION: '提交申请',
    UPDATE_APPLICATION: '更新申请',
  };
  return labels[action] || action;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;
  return date.toLocaleString('zh-CN');
}
