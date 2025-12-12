import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import { Card, CardContent, CardHeader, Loading, ErrorMessage } from '@/components/ui';
import { useAuthStore } from '@/stores';
import { adminService, type AdminStats, type MatchingMetrics } from '@/services/adminService';
import {
  Users,
  FolderOpen,
  FileText,
  TrendingUp,
  ChevronRight,
  Activity,
  Server,
  Zap,
  UserCheck,
  GraduationCap,
  Briefcase,
  Shield,
} from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  REVIEWING: '#3b82f6',
  ACCEPTED: '#10b981',
  REJECTED: '#ef4444',
  WITHDRAWN: '#6b7280',
};

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [matchingMetrics, setMatchingMetrics] = useState<MatchingMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [adminStats, metrics] = await Promise.all([
          adminService.getAdminDashboard(),
          adminService.getMatchingMetrics(),
        ]);
        setStats(adminStats);
        setMatchingMetrics(metrics);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch admin dashboard data:', err);
        setError('获取统计数据失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <Loading text="加载管理员仪表盘数据..." />;
  }

  if (error) {
    return <ErrorMessage title="加载失败" message={error} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">管理员控制台</h1>
        <p className="text-muted-foreground">
          欢迎，{user?.name || '管理员'}。在这里您可以监控系统运行状态和管理用户。
        </p>
      </div>

      {/* User Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="总用户数"
          value={stats?.totalUsers || 0}
          description="注册用户总数"
          icon={<Users className="h-4 w-4 text-blue-500" />}
          trend={`活跃用户 ${stats?.activeUsers || 0} 人`}
        />
        <StatsCard
          title="教师用户"
          value={stats?.totalTeachers || 0}
          description="注册教师数量"
          icon={<GraduationCap className="h-4 w-4 text-purple-500" />}
        />
        <StatsCard
          title="学生用户"
          value={stats?.totalStudents || 0}
          description="注册学生数量"
          icon={<UserCheck className="h-4 w-4 text-green-500" />}
        />
        <StatsCard
          title="管理员"
          value={stats?.totalAdmins || 0}
          description="管理员数量"
          icon={<Shield className="h-4 w-4 text-amber-500" />}
        />
      </div>

      {/* Project & Application Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="活跃项目"
          value={stats?.activeProjects || 0}
          description="当前发布中的项目"
          icon={<FolderOpen className="h-4 w-4 text-blue-500" />}
          trend={`共 ${stats?.totalProjects || 0} 个项目`}
        />
        <StatsCard
          title="总申请数"
          value={stats?.totalApplications || 0}
          description="累计申请数量"
          icon={<FileText className="h-4 w-4 text-amber-500" />}
        />
        <StatsCard
          title="匹配成功率"
          value={`${stats?.matchSuccessRate || 0}%`}
          description="申请录取比例"
          icon={<TrendingUp className="h-4 w-4 text-green-500" />}
        />
        <StatsCard
          title="进行中实习"
          value={stats?.totalInternships || 0}
          description="实习记录总数"
          icon={<Briefcase className="h-4 w-4 text-purple-500" />}
        />
      </div>

      {/* System Performance Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="LLM API 成功率"
          value={`${stats?.systemPerformance?.llmApiSuccessRate || 0}%`}
          description="大模型调用成功率"
          icon={<Zap className="h-4 w-4 text-yellow-500" />}
        />
        <StatsCard
          title="平均匹配分数"
          value={stats?.systemPerformance?.avgMatchScore?.toFixed(1) || '0'}
          description="匹配度平均分"
          icon={<Activity className="h-4 w-4 text-blue-500" />}
        />
        <StatsCard
          title="降级使用率"
          value={`${stats?.systemPerformance?.llmFallbackRate || 0}%`}
          description="关键词匹配降级比例"
          icon={<Server className="h-4 w-4 text-orange-500" />}
        />
        <StatsCard
          title="缓存条目"
          value={stats?.systemPerformance?.totalMatchCacheEntries || 0}
          description="匹配结果缓存数"
          icon={<Server className="h-4 w-4 text-cyan-500" />}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* User Growth Trend */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">用户增长趋势</h2>
              <span className="text-sm text-muted-foreground">最近30天</span>
            </div>
          </CardHeader>
          <CardContent>
            {stats?.userGrowth && stats.userGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={stats.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => value.slice(5)}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelFormatter={(label) => `日期: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="teachers"
                    stackId="1"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.6}
                    name="教师"
                  />
                  <Area
                    type="monotone"
                    dataKey="students"
                    stackId="1"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.6}
                    name="学生"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                暂无用户增长数据
              </div>
            )}
          </CardContent>
        </Card>

        {/* Application Status Distribution */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">申请状态分布</h2>
          </CardHeader>
          <CardContent>
            {stats?.applicationStatusDistribution &&
            stats.applicationStatusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.applicationStatusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="status"
                    label={({ status, percent }) =>
                      `${getStatusLabel(status)} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {stats.applicationStatusDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.status] || COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number, name: string) => [
                      `${value} 个`,
                      getStatusLabel(name),
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                暂无申请数据
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 - Matching Analysis */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Match Score Distribution */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">匹配分数分布</h2>
          </CardHeader>
          <CardContent>
            {matchingMetrics?.scoreDistribution && matchingMetrics.scoreDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={matchingMetrics.scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value} 次`, '匹配数']}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                暂无匹配数据
              </div>
            )}
          </CardContent>
        </Card>

        {/* Match Trend */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">匹配趋势</h2>
          </CardHeader>
          <CardContent>
            {matchingMetrics?.matchTrend && matchingMetrics.matchTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={matchingMetrics.matchTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />

                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => value.slice(5)}
                  />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelFormatter={(label) => `日期: ${label}`}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="匹配数"
                    dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgScore"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="平均分"
                    dot={{ fill: '#10b981', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                暂无匹配趋势数据
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Research Fields */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">热门研究领域</h2>
          </CardHeader>
          <CardContent>
            {stats?.topResearchFields && stats.topResearchFields.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.topResearchFields.slice(0, 6)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="field"
                    tick={{ fontSize: 12 }}
                    width={100}
                    tickFormatter={(value) =>
                      value.length > 10 ? `${value.slice(0, 10)}...` : value
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number, name: string) => {
                      const labels: Record<string, string> = {
                        projectCount: '项目数',
                        applicationCount: '申请数',
                      };
                      return [value, labels[name] || name];
                    }}
                  />
                  <Bar dataKey="projectCount" fill="#8b5cf6" name="项目数" />
                  <Bar dataKey="applicationCount" fill="#3b82f6" name="申请数" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                暂无研究领域数据
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Matched Skills */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">热门匹配技能</h2>
          </CardHeader>
          <CardContent>
            {matchingMetrics?.topMatchedSkills && matchingMetrics.topMatchedSkills.length > 0 ? (
              <div className="space-y-3">
                {matchingMetrics.topMatchedSkills.slice(0, 8).map((skill, index) => (
                  <div key={skill.skill} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-6 text-muted-foreground">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{skill.skill}</span>
                        <span className="text-sm text-muted-foreground">{skill.count} 次</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{
                            width: `${(skill.count / (matchingMetrics.topMatchedSkills[0]?.count || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                暂无技能匹配数据
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Audit Logs */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">快捷操作</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/admin/users" className="block">
              <div className="flex items-center p-3 rounded-lg border hover:bg-accent transition-colors">
                <Users className="h-5 w-5 text-blue-500 mr-3" />
                <div className="flex-1">
                  <p className="font-medium">用户管理</p>
                  <p className="text-sm text-muted-foreground">管理用户账户、角色和权限</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
            <Link to="/admin/monitoring" className="block">
              <div className="flex items-center p-3 rounded-lg border hover:bg-accent transition-colors">
                <Activity className="h-5 w-5 text-green-500 mr-3" />
                <div className="flex-1">
                  <p className="font-medium">系统监控</p>
                  <p className="text-sm text-muted-foreground">查看系统性能和错误日志</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Audit Logs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">最近审计日志</h2>
              <Link
                to="/admin/monitoring"
                className="text-sm text-primary hover:underline flex items-center"
              >
                查看全部 <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {stats?.recentAuditLogs && stats.recentAuditLogs.length > 0 ? (
              <div className="space-y-3">
                {stats.recentAuditLogs.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{getActionLabel(log.action)}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.resource} · {formatDate(log.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-8">暂无审计日志</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Stats Card Component
interface StatsCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: string;
}

function StatsCard({ title, value, description, icon, trend }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && <p className="text-xs text-primary mt-1">{trend}</p>}
      </CardContent>
    </Card>
  );
}

// Helper functions
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: '待审核',
    REVIEWING: '审核中',
    ACCEPTED: '已录取',
    REJECTED: '已拒绝',
    WITHDRAWN: '已撤回',
  };
  return labels[status] || status;
}

function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    UPDATE_USER_ROLE: '修改用户角色',
    ENABLE_USER: '启用用户',
    DISABLE_USER: '禁用用户',
    DELETE_USER: '删除用户',
    LOGIN: '用户登录',
    LOGOUT: '用户登出',
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
  return date.toLocaleDateString('zh-CN');
}
