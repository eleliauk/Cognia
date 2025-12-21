import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, Button, Loading, ErrorMessage } from '@/components/ui';
import { useAuthStore } from '@/stores';
import {
  studentService,
  type StudentStats,
  type ProjectRecommendation,
  type ApplicationWithProject,
} from '@/services';
import {
  Lightbulb,
  FileText,
  Briefcase,
  User,
  ChevronRight,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [recommendations, setRecommendations] = useState<ProjectRecommendation[]>([]);
  const [recentApplications, setRecentApplications] = useState<ApplicationWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsData, recsData, appsData] = await Promise.all([
          studentService.getDashboardStats(),
          studentService.getRecommendations(3),
          studentService.getMyApplications(),
        ]);
        setStats(statsData);
        setRecommendations(recsData);
        setRecentApplications(appsData.slice(0, 5));
        setError(null);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('获取数据失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <Loading text="加载仪表盘数据..." />;
  }

  if (error) {
    return <ErrorMessage title="加载失败" message={error} />;
  }

  const showProfileWarning = stats && stats.profileCompleteness < 60;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">欢迎回来，{user?.name || '同学'}</h1>
          <p className="text-muted-foreground">
            这是您的学生仪表盘，您可以在这里查看推荐项目和管理申请。
          </p>
        </div>
        <Link to="/student/recommendations">
          <Button>
            <Lightbulb className="h-4 w-4 mr-2" />
            查看推荐项目
          </Button>
        </Link>
      </div>

      {/* Profile Completeness Warning */}
      {showProfileWarning && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <AlertCircle className="h-8 w-8 text-amber-500" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                  档案完整度较低 ({stats?.profileCompleteness || 0}%)
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  完善您的个人档案可以获得更精准的项目推荐，提高申请成功率。
                </p>
              </div>
              <Link to="/student/profile">
                <Button
                  variant="outline"
                  className="border-amber-500 text-amber-700 hover:bg-amber-100"
                >
                  完善档案
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="推荐项目"
          value={stats?.recommendedProjects || 0}
          description="为您匹配的项目"
          icon={<Lightbulb className="h-4 w-4 text-blue-500" />}
          linkTo="/student/recommendations"
        />
        <StatsCard
          title="我的申请"
          value={stats?.totalApplications || 0}
          description="已提交的申请"
          icon={<FileText className="h-4 w-4 text-amber-500" />}
          trend={stats?.pendingApplications ? `${stats.pendingApplications} 个待审核` : undefined}
          linkTo="/student/applications"
        />
        <StatsCard
          title="进行中实习"
          value={stats?.activeInternships || 0}
          description="正在进行的实习"
          icon={<Briefcase className="h-4 w-4 text-green-500" />}
          trend={
            stats?.completedInternships ? `已完成 ${stats.completedInternships} 个` : undefined
          }
          linkTo="/student/internships"
        />
        <StatsCard
          title="档案完整度"
          value={`${stats?.profileCompleteness || 0}%`}
          description={
            stats?.profileCompleteness && stats.profileCompleteness >= 80
              ? '档案已完善'
              : '请完善您的档案'
          }
          icon={<User className="h-4 w-4 text-purple-500" />}
          linkTo="/student/profile"
        />
      </div>

      {/* Main Content */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recommended Projects */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">推荐项目</h2>
              <Link
                to="/student/recommendations"
                className="text-sm text-primary hover:underline flex items-center"
              >
                查看全部 <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recommendations.length > 0 ? (
              <div className="space-y-3">
                {recommendations
                  .filter((rec) => rec?.project?.id)
                  .map((rec) => (
                    <RecommendationCard key={rec.project.id} recommendation={rec} />
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>完善档案后将为您推荐匹配的项目</p>
                <Link to="/student/profile">
                  <Button variant="link" className="mt-2">
                    去完善档案
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">申请状态</h2>
              <Link
                to="/student/applications"
                className="text-sm text-primary hover:underline flex items-center"
              >
                查看全部 <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentApplications.length > 0 ? (
              <div className="space-y-3">
                {recentApplications
                  .filter((app) => app?.id)
                  .map((app) => (
                    <ApplicationCard key={app.id} application={app} />
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>暂无申请记录</p>
                <Link to="/student/recommendations">
                  <Button variant="link" className="mt-2">
                    浏览推荐项目
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">快捷操作</h2>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <QuickActionCard
            title="个人档案"
            description="编辑您的能力档案"
            icon={<User className="h-5 w-5 text-purple-500" />}
            linkTo="/student/profile"
          />
          <QuickActionCard
            title="推荐项目"
            description="查看为您匹配的项目"
            icon={<Lightbulb className="h-5 w-5 text-blue-500" />}
            linkTo="/student/recommendations"
          />
          <QuickActionCard
            title="我的申请"
            description="查看申请状态"
            icon={<FileText className="h-5 w-5 text-amber-500" />}
            linkTo="/student/applications"
          />
          <QuickActionCard
            title="我的实习"
            description="管理实习进度"
            icon={<Briefcase className="h-5 w-5 text-green-500" />}
            linkTo="/student/internships"
          />
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
  trend?: string;
  linkTo?: string;
}

function StatsCard({ title, value, description, icon, trend, linkTo }: StatsCardProps) {
  const content = (
    <Card className={linkTo ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}>
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

  if (linkTo) {
    return <Link to={linkTo}>{content}</Link>;
  }
  return content;
}

// Recommendation Card Component
interface RecommendationCardProps {
  recommendation: ProjectRecommendation;
}

function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const { project, score, matchedSkills } = recommendation;

  return (
    <Link to={`/student/recommendations`} className="block">
      <div className="p-3 rounded-lg border hover:bg-accent transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium truncate">{project.title}</h4>
            <p className="text-sm text-muted-foreground truncate">
              {project.teacher?.name || '未知教师'} · {project.researchField}
            </p>
          </div>
          <div className="flex items-center gap-1 text-amber-500 ml-2">
            <Star className="h-4 w-4 fill-current" />
            <span className="text-sm font-medium">{score}</span>
          </div>
        </div>
        {matchedSkills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {matchedSkills.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full"
              >
                {skill}
              </span>
            ))}
            {matchedSkills.length > 3 && (
              <span className="px-2 py-0.5 text-xs text-muted-foreground">
                +{matchedSkills.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

// Application Card Component
interface ApplicationCardProps {
  application: ApplicationWithProject;
}

function ApplicationCard({ application }: ApplicationCardProps) {
  const statusConfig = {
    PENDING: { icon: Clock, color: 'text-amber-500', label: '待审核' },
    REVIEWING: { icon: Clock, color: 'text-blue-500', label: '审核中' },
    ACCEPTED: { icon: CheckCircle, color: 'text-green-500', label: '已录取' },
    REJECTED: { icon: XCircle, color: 'text-red-500', label: '已拒绝' },
    WITHDRAWN: { icon: XCircle, color: 'text-gray-500', label: '已撤回' },
  };

  const config = statusConfig[application.status] || statusConfig.PENDING;
  const StatusIcon = config.icon;

  return (
    <Link to="/student/applications" className="block">
      <div className="p-3 rounded-lg border hover:bg-accent transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium truncate">{application.project?.title || '未知项目'}</h4>
            <p className="text-sm text-muted-foreground">
              {new Date(application.appliedAt).toLocaleDateString('zh-CN')}
            </p>
          </div>
          <div className={`flex items-center gap-1 ${config.color}`}>
            <StatusIcon className="h-4 w-4" />
            <span className="text-sm">{config.label}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Quick Action Card Component
interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  linkTo: string;
}

function QuickActionCard({ title, description, icon, linkTo }: QuickActionCardProps) {
  return (
    <Link to={linkTo} className="block">
      <div className="flex items-center p-3 rounded-lg border hover:bg-accent transition-colors">
        {icon}
        <div className="ml-3">
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto" />
      </div>
    </Link>
  );
}
