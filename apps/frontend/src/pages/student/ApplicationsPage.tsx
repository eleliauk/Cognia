import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  Button,
  Loading,
  ErrorMessage,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalClose,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui';
import { studentService, type ApplicationWithProject } from '@/services';
import { useToast } from '@/hooks/useToast';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Calendar,
  ChevronRight,
  Trash2,
  Eye,
} from 'lucide-react';

type ApplicationStatus = 'PENDING' | 'REVIEWING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

const statusConfig: Record<
  ApplicationStatus,
  { icon: typeof Clock; color: string; bgColor: string; label: string }
> = {
  PENDING: {
    icon: Clock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900',
    label: '待审核',
  },
  REVIEWING: {
    icon: AlertCircle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
    label: '审核中',
  },
  ACCEPTED: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900',
    label: '已录取',
  },
  REJECTED: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900',
    label: '已拒绝',
  },
  WITHDRAWN: {
    icon: XCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    label: '已撤回',
  },
};

export default function ApplicationsPage() {
  const { toast } = useToast();
  const [applications, setApplications] = useState<ApplicationWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithProject | null>(
    null
  );
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [filter, setFilter] = useState<ApplicationStatus | 'ALL'>('ALL');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const data = await studentService.getMyApplications();
      setApplications(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
      setError('获取申请列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!selectedApplication) return;

    try {
      setWithdrawing(true);
      await studentService.withdrawApplication(selectedApplication.id);
      toast({
        title: '撤回成功',
        description: '您的申请已撤回',
      });
      setShowWithdrawConfirm(false);
      setSelectedApplication(null);
      await fetchApplications();
    } catch (err: unknown) {
      console.error('Failed to withdraw application:', err);
      const errorMessage =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data
              ?.error?.message
          : undefined;
      toast({
        title: '撤回失败',
        description: errorMessage || '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setWithdrawing(false);
    }
  };

  const filteredApplications =
    filter === 'ALL' ? applications : applications.filter((app) => app.status === filter);

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === 'PENDING' || a.status === 'REVIEWING').length,
    accepted: applications.filter((a) => a.status === 'ACCEPTED').length,
    rejected: applications.filter((a) => a.status === 'REJECTED').length,
  };

  if (loading) {
    return <Loading text="加载申请列表..." />;
  }

  if (error) {
    return <ErrorMessage title="加载失败" message={error} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">我的申请</h1>
          <p className="text-muted-foreground">查看和管理您提交的所有申请</p>
        </div>
        <Link to="/student/recommendations">
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            浏览项目
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="全部申请"
          value={stats.total}
          icon={<FileText className="h-4 w-4 text-blue-500" />}
          active={filter === 'ALL'}
          onClick={() => setFilter('ALL')}
        />
        <StatsCard
          title="待审核"
          value={stats.pending}
          icon={<Clock className="h-4 w-4 text-amber-500" />}
          active={filter === 'PENDING' || filter === 'REVIEWING'}
          onClick={() => setFilter('PENDING')}
        />
        <StatsCard
          title="已录取"
          value={stats.accepted}
          icon={<CheckCircle className="h-4 w-4 text-green-500" />}
          active={filter === 'ACCEPTED'}
          onClick={() => setFilter('ACCEPTED')}
        />
        <StatsCard
          title="已拒绝"
          value={stats.rejected}
          icon={<XCircle className="h-4 w-4 text-red-500" />}
          active={filter === 'REJECTED'}
          onClick={() => setFilter('REJECTED')}
        />
      </div>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">
              {filter === 'ALL' ? '暂无申请记录' : '没有符合条件的申请'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {filter === 'ALL'
                ? '浏览推荐项目，找到感兴趣的项目后提交申请'
                : '尝试切换筛选条件查看其他申请'}
            </p>
            {filter === 'ALL' && (
              <Link to="/student/recommendations">
                <Button>浏览推荐项目</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>项目名称</TableHead>
                  <TableHead>教师</TableHead>
                  <TableHead>匹配度</TableHead>
                  <TableHead>申请时间</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((app) => (
                  <ApplicationRow
                    key={app.id}
                    application={app}
                    onView={() => setSelectedApplication(app)}
                    onWithdraw={() => {
                      setSelectedApplication(app);
                      setShowWithdrawConfirm(true);
                    }}
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Application Detail Modal */}
      {selectedApplication && !showWithdrawConfirm && (
        <Modal open={true} onOpenChange={() => setSelectedApplication(null)}>
          <ModalContent className="max-w-2xl">
            <ModalHeader>
              <ModalTitle>申请详情</ModalTitle>
              <ModalDescription>
                {selectedApplication.project?.title || '未知项目'}
              </ModalDescription>
            </ModalHeader>
            <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Status Timeline */}
              <ApplicationTimeline application={selectedApplication} />

              {/* Match Score */}
              {selectedApplication.matchScore && (
                <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Star className="h-6 w-6 text-amber-500 fill-current" />
                    <span className="text-2xl font-bold">{selectedApplication.matchScore}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">匹配度评分</p>
                    {selectedApplication.matchReasoning && (
                      <p className="text-sm text-muted-foreground">
                        {selectedApplication.matchReasoning}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Project Info */}
              <div>
                <h4 className="font-medium mb-2">项目信息</h4>
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <p className="font-medium">{selectedApplication.project?.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedApplication.project?.teacher?.name || '未知教师'} ·{' '}
                    {selectedApplication.project?.researchField}
                  </p>
                  <p className="text-sm">{selectedApplication.project?.description}</p>
                </div>
              </div>

              {/* Cover Letter */}
              <div>
                <h4 className="font-medium mb-2">申请信</h4>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{selectedApplication.coverLetter}</p>
                </div>
              </div>

              {/* Feedback (if rejected) */}
              {selectedApplication.status === 'REJECTED' && (
                <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                  <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">审核反馈</h4>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    很遗憾，您的申请未通过审核。建议您完善个人档案后申请其他项目。
                  </p>
                </div>
              )}

              {/* Success Message (if accepted) */}
              {selectedApplication.status === 'ACCEPTED' && (
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">恭喜您！</h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    您的申请已通过，请前往&ldquo;我的实习&rdquo;页面查看实习详情。
                  </p>
                  <Link to="/student/internships" className="inline-block mt-2">
                    <Button size="sm" variant="outline" className="border-green-500 text-green-700">
                      查看实习 <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
            <ModalFooter>
              <ModalClose asChild>
                <Button variant="outline">关闭</Button>
              </ModalClose>
              {(selectedApplication.status === 'PENDING' ||
                selectedApplication.status === 'REVIEWING') && (
                <Button variant="destructive" onClick={() => setShowWithdrawConfirm(true)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  撤回申请
                </Button>
              )}
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Withdraw Confirmation Modal */}
      {showWithdrawConfirm && selectedApplication && (
        <Modal open={true} onOpenChange={() => setShowWithdrawConfirm(false)}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>确认撤回申请</ModalTitle>
              <ModalDescription>
                您确定要撤回对&ldquo;{selectedApplication.project?.title}&rdquo;的申请吗？
              </ModalDescription>
            </ModalHeader>
            <div className="px-6 py-4">
              <p className="text-sm text-muted-foreground">
                撤回后，您可以重新申请该项目，但之前的申请记录将被标记为已撤回。
              </p>
            </div>
            <ModalFooter>
              <Button variant="outline" onClick={() => setShowWithdrawConfirm(false)}>
                取消
              </Button>
              <Button variant="destructive" onClick={handleWithdraw} disabled={withdrawing}>
                {withdrawing ? '撤回中...' : '确认撤回'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}

// Stats Card Component
interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

function StatsCard({ title, value, icon, active, onClick }: StatsCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-all ${
        active ? 'ring-2 ring-primary' : 'hover:shadow-md'
      }`}
      onClick={onClick}
    >
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

// Application Row Component
interface ApplicationRowProps {
  application: ApplicationWithProject;
  onView: () => void;
  onWithdraw: () => void;
}

function ApplicationRow({ application, onView, onWithdraw }: ApplicationRowProps) {
  const config = statusConfig[application.status as ApplicationStatus] || statusConfig.PENDING;
  const StatusIcon = config.icon;
  const canWithdraw = application.status === 'PENDING' || application.status === 'REVIEWING';

  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">{application.project?.title || '未知项目'}</div>
        <div className="text-sm text-muted-foreground">{application.project?.researchField}</div>
      </TableCell>
      <TableCell>{application.project?.teacher?.name || '未知'}</TableCell>
      <TableCell>
        {application.matchScore ? (
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-amber-500 fill-current" />
            <span>{application.matchScore}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {new Date(application.appliedAt).toLocaleDateString('zh-CN')}
        </div>
      </TableCell>
      <TableCell>
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${config.bgColor} ${config.color}`}
        >
          <StatusIcon className="h-3 w-3" />
          {config.label}
        </span>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onView}>
            <Eye className="h-4 w-4" />
          </Button>
          {canWithdraw && (
            <Button variant="ghost" size="sm" onClick={onWithdraw}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

// Application Timeline Component
interface ApplicationTimelineProps {
  application: ApplicationWithProject;
}

function ApplicationTimeline({ application }: ApplicationTimelineProps) {
  const steps = [
    { status: 'PENDING', label: '已提交', date: application.appliedAt },
    {
      status: 'REVIEWING',
      label: '审核中',
      date: application.status === 'REVIEWING' ? application.reviewedAt : null,
    },
    {
      status: 'ACCEPTED',
      label: '已录取',
      date: application.status === 'ACCEPTED' ? application.reviewedAt : null,
    },
    {
      status: 'REJECTED',
      label: '已拒绝',
      date: application.status === 'REJECTED' ? application.reviewedAt : null,
    },
  ];

  const currentIndex = steps.findIndex((s) => s.status === application.status);
  const isWithdrawn = application.status === 'WITHDRAWN';

  if (isWithdrawn) {
    return (
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <XCircle className="h-5 w-5" />
          <span className="font-medium">申请已撤回</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex justify-between">
        {steps.slice(0, application.status === 'REJECTED' ? 4 : 3).map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const isRejected = step.status === 'REJECTED' && application.status === 'REJECTED';

          return (
            <div key={step.status} className="flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isRejected
                    ? 'bg-red-500 text-white'
                    : isCompleted
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {isRejected ? (
                  <XCircle className="h-4 w-4" />
                ) : isCompleted ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <span className="text-xs">{index + 1}</span>
                )}
              </div>
              <p className={`text-xs mt-2 ${isCurrent ? 'font-medium' : 'text-muted-foreground'}`}>
                {step.label}
              </p>
              {step.date && (
                <p className="text-xs text-muted-foreground">
                  {new Date(step.date).toLocaleDateString('zh-CN')}
                </p>
              )}
            </div>
          );
        })}
      </div>
      {/* Progress Line */}
      <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted -z-10">
        <div
          className={`h-full ${application.status === 'REJECTED' ? 'bg-red-500' : 'bg-primary'}`}
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
}
