import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Input,
  Loading,
  ErrorMessage,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { teacherService, type ApplicationWithStudent } from '@/services/teacherService';
import type { Project, ApplicationStatus } from '@/types';
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  Star,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  PENDING: '待审核',
  REVIEWING: '审核中',
  ACCEPTED: '已录取',
  REJECTED: '已拒绝',
  WITHDRAWN: '已撤回',
};

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  REVIEWING: 'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  WITHDRAWN: 'bg-gray-100 text-gray-800',
};

export default function ApplicationsPage() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [applications, setApplications] = useState<ApplicationWithStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingApps, setLoadingApps] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithStudent | null>(
    null
  );
  const [actionModal, setActionModal] = useState<{
    type: 'accept' | 'reject';
    application: ApplicationWithStudent;
  } | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const data = await teacherService.getMyProjects();
        setProjects(data);
        if (data && data.length > 0 && data[0]) {
          setSelectedProjectId(data[0].id);
        }
        setError(null);
      } catch (err) {
        console.error('Failed to fetch projects:', err);
        setError('获取项目列表失败');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Fetch applications when project changes
  useEffect(() => {
    const fetchApplications = async () => {
      if (!selectedProjectId) {
        setApplications([]);
        return;
      }

      try {
        setLoadingApps(true);
        const data = await teacherService.getProjectApplications(selectedProjectId);
        setApplications(data);
      } catch (err) {
        console.error('Failed to fetch applications:', err);
        toast({ title: '错误', description: '获取申请列表失败', variant: 'destructive' });
      } finally {
        setLoadingApps(false);
      }
    };

    fetchApplications();
  }, [selectedProjectId, toast]);

  // Handle status update
  const handleStatusUpdate = async (status: 'ACCEPTED' | 'REJECTED') => {
    if (!actionModal) return;

    try {
      setSubmitting(true);
      await teacherService.updateApplicationStatus(
        actionModal.application.id,
        status,
        feedback || undefined
      );
      toast({
        title: '成功',
        description: status === 'ACCEPTED' ? '已录取该申请' : '已拒绝该申请',
      });
      setActionModal(null);
      setFeedback('');

      // Refresh applications
      const data = await teacherService.getProjectApplications(selectedProjectId);
      setApplications(data);
    } catch (err) {
      console.error('Failed to update application status:', err);
      toast({ title: '错误', description: '操作失败，请重试', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  // Filter and sort applications
  const filteredApplications = applications
    .filter((app) => {
      const matchesSearch =
        app.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.student.studentProfile?.major || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.appliedAt).getTime();
        const dateB = new Date(b.appliedAt).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } else {
        const scoreA = a.matchScore || 0;
        const scoreB = b.matchScore || 0;
        return sortOrder === 'asc' ? scoreA - scoreB : scoreB - scoreA;
      }
    });

  // Toggle sort
  const toggleSort = (field: 'date' | 'score') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Get match score color
  const getScoreColor = (score: number | undefined) => {
    if (!score) return 'text-gray-400';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  if (loading) {
    return <Loading text="加载数据..." />;
  }

  if (error) {
    return <ErrorMessage title="加载失败" message={error} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">申请管理</h1>
        <p className="text-muted-foreground">查看和处理学生的实习申请</p>
      </div>

      {/* Project Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">选择项目</label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择一个项目" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      {selectedProjectId && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索学生姓名、邮箱或专业..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="筛选状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="PENDING">待审核</SelectItem>
                  <SelectItem value="REVIEWING">审核中</SelectItem>
                  <SelectItem value="ACCEPTED">已录取</SelectItem>
                  <SelectItem value="REJECTED">已拒绝</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">申请列表 ({filteredApplications.length})</h2>
        </CardHeader>
        <CardContent>
          {!selectedProjectId ? (
            <div className="text-center py-12 text-muted-foreground">请先选择一个项目</div>
          ) : loadingApps ? (
            <Loading text="加载申请列表..." />
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {applications.length === 0 ? '该项目暂无申请' : '没有找到匹配的申请'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>学生信息</TableHead>
                  <TableHead>专业/年级</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleSort('score')}
                  >
                    <div className="flex items-center">
                      匹配度
                      {sortBy === 'score' &&
                        (sortOrder === 'desc' ? (
                          <ChevronDown className="h-4 w-4 ml-1" />
                        ) : (
                          <ChevronUp className="h-4 w-4 ml-1" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleSort('date')}
                  >
                    <div className="flex items-center">
                      申请时间
                      {sortBy === 'date' &&
                        (sortOrder === 'desc' ? (
                          <ChevronDown className="h-4 w-4 ml-1" />
                        ) : (
                          <ChevronUp className="h-4 w-4 ml-1" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{app.student.name}</p>
                        <p className="text-sm text-muted-foreground">{app.student.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{app.student.studentProfile?.major || '未填写'}</p>
                        <p className="text-sm text-muted-foreground">
                          {app.student.studentProfile?.grade
                            ? `${app.student.studentProfile.grade}年级`
                            : ''}
                          {app.student.studentProfile?.gpa
                            ? ` · GPA ${app.student.studentProfile.gpa}`
                            : ''}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Star className={`h-4 w-4 mr-1 ${getScoreColor(app.matchScore)}`} />
                        <span className={`font-medium ${getScoreColor(app.matchScore)}`}>
                          {app.matchScore ? `${app.matchScore}%` : '未计算'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          STATUS_COLORS[app.status]
                        }`}
                      >
                        {STATUS_LABELS[app.status]}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(app.appliedAt).toLocaleDateString('zh-CN')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedApplication(app)}
                          title="查看详情"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {(app.status === 'PENDING' || app.status === 'REVIEWING') && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setActionModal({ type: 'accept', application: app })}
                              title="录取"
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setActionModal({ type: 'reject', application: app })}
                              title="拒绝"
                            >
                              <XCircle className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Application Detail Modal */}
      <Modal open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
        <ModalContent className="max-w-2xl">
          <ModalHeader>
            <ModalTitle>申请详情</ModalTitle>
          </ModalHeader>
          {selectedApplication && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">学生姓名</label>
                  <p className="font-medium">{selectedApplication.student.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">邮箱</label>
                  <p>{selectedApplication.student.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">专业</label>
                  <p>{selectedApplication.student.studentProfile?.major || '未填写'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">年级/GPA</label>
                  <p>
                    {selectedApplication.student.studentProfile?.grade
                      ? `${selectedApplication.student.studentProfile.grade}年级`
                      : '未填写'}
                    {selectedApplication.student.studentProfile?.gpa
                      ? ` · GPA ${selectedApplication.student.studentProfile.gpa}`
                      : ''}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">技能</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedApplication.student.studentProfile?.skills?.map((skill, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-primary/10 text-primary rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  )) || <p className="text-muted-foreground">未填写</p>}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">匹配度评分</label>
                <div className="flex items-center mt-1">
                  <Star
                    className={`h-5 w-5 mr-2 ${getScoreColor(selectedApplication.matchScore)}`}
                  />
                  <span
                    className={`text-lg font-bold ${getScoreColor(selectedApplication.matchScore)}`}
                  >
                    {selectedApplication.matchScore
                      ? `${selectedApplication.matchScore}%`
                      : '未计算'}
                  </span>
                </div>
              </div>

              {selectedApplication.matchReasoning && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">匹配理由</label>
                  <p className="mt-1 text-sm bg-muted p-3 rounded-lg">
                    {selectedApplication.matchReasoning}
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">申请信</label>
                <p className="mt-1 text-sm bg-muted p-3 rounded-lg whitespace-pre-wrap">
                  {selectedApplication.coverLetter || '无'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      STATUS_COLORS[selectedApplication.status]
                    }`}
                  >
                    {STATUS_LABELS[selectedApplication.status]}
                  </span>
                  <span className="text-sm text-muted-foreground ml-2">
                    申请于 {new Date(selectedApplication.appliedAt).toLocaleString('zh-CN')}
                  </span>
                </div>
                {(selectedApplication.status === 'PENDING' ||
                  selectedApplication.status === 'REVIEWING') && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedApplication(null);
                        setActionModal({
                          type: 'reject',
                          application: selectedApplication,
                        });
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      拒绝
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedApplication(null);
                        setActionModal({
                          type: 'accept',
                          application: selectedApplication,
                        });
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      录取
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </ModalContent>
      </Modal>

      {/* Action Confirmation Modal */}
      <Modal open={!!actionModal} onOpenChange={() => setActionModal(null)}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>{actionModal?.type === 'accept' ? '确认录取' : '确认拒绝'}</ModalTitle>
            <ModalDescription>
              {actionModal?.type === 'accept'
                ? `您确定要录取 ${actionModal?.application.student.name} 吗？录取后将自动创建实习记录。`
                : `您确定要拒绝 ${actionModal?.application.student.name} 的申请吗？`}
            </ModalDescription>
          </ModalHeader>
          <div className="py-4">
            <label className="text-sm font-medium">反馈信息（可选）</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-2"
              placeholder={
                actionModal?.type === 'accept' ? '给学生的录取通知...' : '给学生的拒绝理由...'
              }
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>
          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActionModal(null);
                setFeedback('');
              }}
            >
              取消
            </Button>
            <Button
              variant={actionModal?.type === 'accept' ? 'default' : 'destructive'}
              onClick={() =>
                handleStatusUpdate(actionModal?.type === 'accept' ? 'ACCEPTED' : 'REJECTED')
              }
              disabled={submitting}
            >
              {submitting ? '处理中...' : actionModal?.type === 'accept' ? '确认录取' : '确认拒绝'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
