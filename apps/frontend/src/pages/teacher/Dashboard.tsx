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
} from 'recharts';
import { Card, CardContent, CardHeader, Button, Loading, ErrorMessage } from '@/components/ui';
import { useAuthStore } from '@/stores';
import { teacherService, type TeacherStats } from '@/services/teacherService';
import {
  FolderOpen,
  FileText,
  Users,
  TrendingUp,
  Plus,
  ChevronRight,
  Briefcase,
} from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function TeacherDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const data = await teacherService.getDashboardStats(user.id);
        setStats(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
        setError('获取统计数据失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user?.id]);

  if (loading) {
    return <Loading text="加载仪表盘数据..." />;
  }

  if (error) {
    return <ErrorMessage title="加载失败" message={error} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">欢迎回来，{user?.name || '教师'}</h1>
          <p className="text-muted-foreground">
            这是您的教师仪表盘，您可以在这里管理科研项目和学生申请。
          </p>
        </div>
        <Link to="/teacher/projects">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            发布新项目
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="活跃项目"
          value={stats?.activeProjects || 0}
          description="当前发布中的项目"
          icon={<FolderOpen className="h-4 w-4 text-blue-500" />}
          trend={stats?.totalProjects ? `共 ${stats.totalProjects} 个项目` : undefined}
        />
        <StatsCard
          title="待审核申请"
          value={stats?.pendingApplications || 0}
          description="等待您审核的申请"
          icon={<FileText className="h-4 w-4 text-amber-500" />}
          trend={stats?.totalApplications ? `共 ${stats.totalApplications} 个申请` : undefined}
        />
        <StatsCard
          title="进行中实习"
          value={stats?.activeInternships || 0}
          description="正在进行的实习"
          icon={<Briefcase className="h-4 w-4 text-green-500" />}
          trend={stats?.totalInternships ? `共 ${stats.totalInternships} 个实习` : undefined}
        />
        <StatsCard
          title="录取率"
          value={`${stats?.acceptanceRate || 0}%`}
          description="申请录取比例"
          icon={<TrendingUp className="h-4 w-4 text-purple-500" />}
          trend={
            stats?.acceptedApplications ? `已录取 ${stats.acceptedApplications} 人` : undefined
          }
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Application Trend Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">申请趋势</h2>
              <span className="text-sm text-muted-foreground">最近30天</span>
            </div>
          </CardHeader>
          <CardContent>
            {stats?.applicationTrend && stats.applicationTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={stats.applicationTrend}>
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
                    formatter={(value: number) => [`${value} 个申请`, '申请数']}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                暂无申请数据
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student Distribution Chart */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">学生专业分布</h2>
          </CardHeader>
          <CardContent>
            {stats?.studentDistribution && stats.studentDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.studentDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="major"
                    label={({ major, percent }) => `${major} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {stats.studentDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number, name: string) => [`${value} 人`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                暂无学生数据
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Project Performance & Recent Applications */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Project Performance */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">项目表现</h2>
              <Link
                to="/teacher/projects"
                className="text-sm text-primary hover:underline flex items-center"
              >
                查看全部 <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {stats?.projectPerformance && stats.projectPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.projectPerformance.slice(0, 5)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="projectTitle"
                    tick={{ fontSize: 12 }}
                    width={100}
                    tickFormatter={(value) =>
                      value.length > 12 ? `${value.slice(0, 12)}...` : value
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
                        applicationCount: '申请数',
                        acceptedCount: '录取数',
                      };
                      return [value, labels[name] || name];
                    }}
                  />
                  <Bar dataKey="applicationCount" fill="#3b82f6" name="申请数" />
                  <Bar dataKey="acceptedCount" fill="#10b981" name="录取数" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                暂无项目数据
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">快捷操作</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/teacher/projects" className="block">
              <div className="flex items-center p-3 rounded-lg border hover:bg-accent transition-colors">
                <FolderOpen className="h-5 w-5 text-blue-500 mr-3" />
                <div className="flex-1">
                  <p className="font-medium">项目管理</p>
                  <p className="text-sm text-muted-foreground">创建、编辑和管理您的科研项目</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
            <Link to="/teacher/applications" className="block">
              <div className="flex items-center p-3 rounded-lg border hover:bg-accent transition-colors">
                <FileText className="h-5 w-5 text-amber-500 mr-3" />
                <div className="flex-1">
                  <p className="font-medium">申请审核</p>
                  <p className="text-sm text-muted-foreground">查看和处理学生的实习申请</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
            <Link to="/teacher/internships" className="block">
              <div className="flex items-center p-3 rounded-lg border hover:bg-accent transition-colors">
                <Users className="h-5 w-5 text-green-500 mr-3" />
                <div className="flex-1">
                  <p className="font-medium">实习跟踪</p>
                  <p className="text-sm text-muted-foreground">跟踪实习进度和提交评价</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
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
