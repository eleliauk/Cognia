import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui';
import {
  teacherService,
  type InternshipWithDetails,
  type Milestone,
  type CreateEvaluationDTO,
} from '@/services/teacherService';
import type { InternshipStatus, Evaluation } from '@/types';
import {
  Search,
  Filter,
  Eye,
  Plus,
  CheckCircle,
  Clock,
  Trash2,
  Star,
  FileText,
  Calendar,
  User,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';

const STATUS_LABELS: Record<InternshipStatus, string> = {
  IN_PROGRESS: '进行中',
  PAUSED: '已暂停',
  COMPLETED: '已完成',
  TERMINATED: '已终止',
};

const STATUS_COLORS: Record<InternshipStatus, string> = {
  IN_PROGRESS: 'bg-green-100 text-green-800',
  PAUSED: 'bg-amber-100 text-amber-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  TERMINATED: 'bg-red-100 text-red-800',
};

// Milestone form schema
const milestoneSchema = z.object({
  title: z.string().min(2, '标题至少2个字符').max(100, '标题最多100个字符'),
  description: z.string().min(5, '描述至少5个字符').max(500, '描述最多500个字符'),
  dueDate: z.string().min(1, '请选择截止日期'),
});

type MilestoneFormData = z.infer<typeof milestoneSchema>;

// Evaluation form schema
const evaluationSchema = z.object({
  overallScore: z.coerce.number().min(1).max(5),
  technicalSkills: z.coerce.number().min(1).max(5),
  communication: z.coerce.number().min(1).max(5),
  initiative: z.coerce.number().min(1).max(5),
  reliability: z.coerce.number().min(1).max(5),
  feedback: z.string().min(10, '反馈至少10个字符').max(1000, '反馈最多1000个字符'),
  strengths: z.string().max(500, '最多500个字符').optional(),
  improvements: z.string().max(500, '最多500个字符').optional(),
});

type EvaluationFormData = z.infer<typeof evaluationSchema>;

export default function InternshipsPage() {
  const { toast } = useToast();
  const [internships, setInternships] = useState<InternshipWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInternship, setSelectedInternship] = useState<InternshipWithDetails | null>(null);
  const [milestoneModal, setMilestoneModal] = useState<{
    internshipId: string;
    milestone?: Milestone;
  } | null>(null);
  const [evaluationModal, setEvaluationModal] = useState<InternshipWithDetails | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const milestoneForm = useForm<MilestoneFormData>({
    resolver: zodResolver(milestoneSchema),
    defaultValues: { title: '', description: '', dueDate: '' },
  });

  const evaluationForm = useForm<EvaluationFormData>({
    resolver: zodResolver(evaluationSchema),
    defaultValues: {
      overallScore: 3,
      technicalSkills: 3,
      communication: 3,
      initiative: 3,
      reliability: 3,
      feedback: '',
      strengths: '',
      improvements: '',
    },
  });

  // Fetch internships
  const fetchInternships = async () => {
    try {
      setLoading(true);
      const data = await teacherService.getTeacherInternships();
      setInternships(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch internships:', err);
      setError('获取实习列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInternships();
  }, []);

  // Handle milestone submit
  const onMilestoneSubmit = async (data: MilestoneFormData) => {
    if (!milestoneModal) return;

    try {
      setSubmitting(true);
      if (milestoneModal.milestone) {
        await teacherService.updateMilestone(
          milestoneModal.internshipId,
          milestoneModal.milestone.id,
          data
        );
        toast({ title: '成功', description: '里程碑更新成功' });
      } else {
        await teacherService.createMilestone(milestoneModal.internshipId, data);
        toast({ title: '成功', description: '里程碑创建成功' });
      }
      setMilestoneModal(null);
      milestoneForm.reset();
      fetchInternships();
    } catch (err) {
      console.error('Failed to save milestone:', err);
      toast({ title: '错误', description: '操作失败', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle milestone complete
  const handleCompleteMilestone = async (internshipId: string, milestoneId: string) => {
    try {
      await teacherService.completeMilestone(internshipId, milestoneId);
      toast({ title: '成功', description: '里程碑已完成' });
      fetchInternships();
    } catch (err) {
      console.error('Failed to complete milestone:', err);
      toast({ title: '错误', description: '操作失败', variant: 'destructive' });
    }
  };

  // Handle milestone delete
  const handleDeleteMilestone = async (internshipId: string, milestoneId: string) => {
    try {
      await teacherService.deleteMilestone(internshipId, milestoneId);
      toast({ title: '成功', description: '里程碑已删除' });
      fetchInternships();
    } catch (err) {
      console.error('Failed to delete milestone:', err);
      toast({ title: '错误', description: '操作失败', variant: 'destructive' });
    }
  };

  // Handle evaluation submit
  const onEvaluationSubmit = async (data: EvaluationFormData) => {
    if (!evaluationModal) return;

    try {
      setSubmitting(true);
      const evaluationData: CreateEvaluationDTO = {
        internshipId: evaluationModal.id,
        ...data,
      };
      await teacherService.createEvaluation(evaluationData);
      toast({ title: '成功', description: '评价提交成功' });
      setEvaluationModal(null);
      evaluationForm.reset();
      fetchInternships();
    } catch (err) {
      console.error('Failed to submit evaluation:', err);
      toast({ title: '错误', description: '提交评价失败', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (id: string, status: InternshipStatus) => {
    try {
      await teacherService.updateInternshipStatus(id, status);
      toast({ title: '成功', description: '状态更新成功' });
      fetchInternships();
    } catch (err) {
      console.error('Failed to update status:', err);
      toast({ title: '错误', description: '状态更新失败', variant: 'destructive' });
    }
  };

  // Filter internships
  const filteredInternships = internships.filter((internship) => {
    const matchesSearch =
      internship.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      internship.project?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || internship.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <Loading text="加载实习列表..." />;
  }

  if (error) {
    return <ErrorMessage title="加载失败" message={error} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">实习跟踪</h1>
        <p className="text-muted-foreground">跟踪实习进度和提交评价</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索学生姓名或项目名称..."
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
                <SelectItem value="IN_PROGRESS">进行中</SelectItem>
                <SelectItem value="PAUSED">已暂停</SelectItem>
                <SelectItem value="COMPLETED">已完成</SelectItem>
                <SelectItem value="TERMINATED">已终止</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Internships Grid */}
      {filteredInternships.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {internships.length === 0 ? '暂无实习记录' : '没有找到匹配的实习'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredInternships.map((internship) => (
            <InternshipCard
              key={internship.id}
              internship={internship}
              onViewDetails={() => setSelectedInternship(internship)}
              onAddMilestone={() => setMilestoneModal({ internshipId: internship.id })}
              onEvaluate={() => setEvaluationModal(internship)}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {/* Internship Detail Modal */}
      <Modal open={!!selectedInternship} onOpenChange={() => setSelectedInternship(null)}>
        <ModalContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <ModalHeader>
            <ModalTitle>实习详情</ModalTitle>
          </ModalHeader>
          {selectedInternship && (
            <InternshipDetail
              internship={selectedInternship}
              onCompleteMilestone={handleCompleteMilestone}
              onDeleteMilestone={handleDeleteMilestone}
              onEditMilestone={(milestone) =>
                setMilestoneModal({
                  internshipId: selectedInternship.id,
                  milestone,
                })
              }
            />
          )}
        </ModalContent>
      </Modal>

      {/* Milestone Modal */}
      <Modal
        open={!!milestoneModal}
        onOpenChange={() => {
          setMilestoneModal(null);
          milestoneForm.reset();
        }}
      >
        <ModalContent>
          <ModalHeader>
            <ModalTitle>{milestoneModal?.milestone ? '编辑里程碑' : '添加里程碑'}</ModalTitle>
          </ModalHeader>
          <Form {...milestoneForm}>
            <form onSubmit={milestoneForm.handleSubmit(onMilestoneSubmit)} className="space-y-4">
              <FormField
                control={milestoneForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>标题 *</FormLabel>
                    <FormControl>
                      <Input placeholder="里程碑标题" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={milestoneForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>描述 *</FormLabel>
                    <FormControl>
                      <textarea
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="里程碑描述"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={milestoneForm.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>截止日期 *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <ModalFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setMilestoneModal(null);
                    milestoneForm.reset();
                  }}
                >
                  取消
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? '保存中...' : '保存'}
                </Button>
              </ModalFooter>
            </form>
          </Form>
        </ModalContent>
      </Modal>

      {/* Evaluation Modal */}
      <Modal
        open={!!evaluationModal}
        onOpenChange={() => {
          setEvaluationModal(null);
          evaluationForm.reset();
        }}
      >
        <ModalContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <ModalHeader>
            <ModalTitle>提交评价</ModalTitle>
            <ModalDescription>
              为 {evaluationModal?.student?.name} 的实习表现提交评价
            </ModalDescription>
          </ModalHeader>
          <Form {...evaluationForm}>
            <form onSubmit={evaluationForm.handleSubmit(onEvaluationSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <ScoreField form={evaluationForm} name="overallScore" label="综合评分" />
                <ScoreField form={evaluationForm} name="technicalSkills" label="技术能力" />
                <ScoreField form={evaluationForm} name="communication" label="沟通能力" />
                <ScoreField form={evaluationForm} name="initiative" label="主动性" />
                <ScoreField form={evaluationForm} name="reliability" label="可靠性" />
              </div>
              <FormField
                control={evaluationForm.control}
                name="feedback"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>总体反馈 *</FormLabel>
                    <FormControl>
                      <textarea
                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="对学生实习表现的总体评价"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={evaluationForm.control}
                name="strengths"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>优点</FormLabel>
                    <FormControl>
                      <textarea
                        className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="学生的优点和亮点"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={evaluationForm.control}
                name="improvements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>改进建议</FormLabel>
                    <FormControl>
                      <textarea
                        className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="需要改进的方面"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <ModalFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEvaluationModal(null);
                    evaluationForm.reset();
                  }}
                >
                  取消
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? '提交中...' : '提交评价'}
                </Button>
              </ModalFooter>
            </form>
          </Form>
        </ModalContent>
      </Modal>
    </div>
  );
}

// Internship Card Component
interface InternshipCardProps {
  internship: InternshipWithDetails;
  onViewDetails: () => void;
  onAddMilestone: () => void;
  onEvaluate: () => void;
  onStatusChange: (id: string, status: InternshipStatus) => void;
}

function InternshipCard({
  internship,
  onViewDetails,
  onAddMilestone,
  onEvaluate,
}: InternshipCardProps) {
  const completedMilestones = internship.milestones?.filter((m) => m.completed).length || 0;
  const totalMilestones = internship.milestones?.length || 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{internship.project?.title || '未知项目'}</h3>
            <p className="text-sm text-muted-foreground flex items-center mt-1">
              <User className="h-3 w-3 mr-1" />
              {internship.student?.name || '未知学生'}
            </p>
          </div>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              STATUS_COLORS[internship.status]
            }`}
          >
            {STATUS_LABELS[internship.status]}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">进度</span>
            <span className="font-medium">{internship.progress}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${internship.progress}%` }}
            />
          </div>
        </div>

        {/* Milestones */}
        <div className="flex items-center text-sm text-muted-foreground">
          <CheckCircle className="h-4 w-4 mr-1" />
          里程碑: {completedMilestones}/{totalMilestones}
        </div>

        {/* Dates */}
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 mr-1" />
          开始: {new Date(internship.startDate).toLocaleDateString('zh-CN')}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={onViewDetails}>
            <Eye className="h-3 w-3 mr-1" />
            详情
          </Button>
          {internship.status === 'IN_PROGRESS' && (
            <>
              <Button variant="outline" size="sm" onClick={onAddMilestone}>
                <Plus className="h-3 w-3 mr-1" />
                里程碑
              </Button>
              {!internship.evaluation && (
                <Button variant="outline" size="sm" onClick={onEvaluate}>
                  <Star className="h-3 w-3 mr-1" />
                  评价
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Internship Detail Component
interface InternshipDetailProps {
  internship: InternshipWithDetails;
  onCompleteMilestone: (internshipId: string, milestoneId: string) => void;
  onDeleteMilestone: (internshipId: string, milestoneId: string) => void;
  onEditMilestone: (milestone: Milestone) => void;
}

function InternshipDetail({
  internship,
  onCompleteMilestone,
  onDeleteMilestone,
  onEditMilestone,
}: InternshipDetailProps) {
  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">项目</label>
          <p className="font-medium">{internship.project?.title || '未知'}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">学生</label>
          <p className="font-medium">{internship.student?.name || '未知'}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">状态</label>
          <p>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                STATUS_COLORS[internship.status]
              }`}
            >
              {STATUS_LABELS[internship.status]}
            </span>
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">进度</label>
          <p className="font-medium">{internship.progress}%</p>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">开始日期</label>
          <p>{new Date(internship.startDate).toLocaleDateString('zh-CN')}</p>
        </div>
        {internship.endDate && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">结束日期</label>
            <p>{new Date(internship.endDate).toLocaleDateString('zh-CN')}</p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div>
        <label className="text-sm font-medium text-muted-foreground">完成进度</label>
        <div className="h-3 bg-muted rounded-full overflow-hidden mt-2">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${internship.progress}%` }}
          />
        </div>
      </div>

      {/* Milestones */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center">
          <CheckCircle className="h-4 w-4 mr-2" />
          里程碑
        </h3>
        {internship.milestones && internship.milestones.length > 0 ? (
          <div className="space-y-2">
            {internship.milestones.map((milestone) => (
              <div
                key={milestone.id}
                className={`p-3 rounded-lg border ${
                  milestone.completed ? 'bg-green-50 border-green-200' : 'bg-muted/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      {milestone.completed ? (
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                      ) : (
                        <Clock className="h-4 w-4 text-amber-600 mr-2" />
                      )}
                      <span className="font-medium">{milestone.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 ml-6">
                      {milestone.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 ml-6">
                      截止: {new Date(milestone.dueDate).toLocaleDateString('zh-CN')}
                      {milestone.completedAt &&
                        ` · 完成于: ${new Date(milestone.completedAt).toLocaleDateString('zh-CN')}`}
                    </p>
                  </div>
                  {!milestone.completed && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onCompleteMilestone(internship.id, milestone.id)}
                        title="标记完成"
                      >
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditMilestone(milestone)}
                        title="编辑"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteMilestone(internship.id, milestone.id)}
                        title="删除"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">暂无里程碑</p>
        )}
      </div>

      {/* Evaluation */}
      {internship.evaluation && (
        <div>
          <h3 className="font-semibold mb-3 flex items-center">
            <Star className="h-4 w-4 mr-2" />
            评价
          </h3>
          <EvaluationDisplay evaluation={internship.evaluation} />
        </div>
      )}
    </div>
  );
}

// Evaluation Display Component
function EvaluationDisplay({ evaluation }: { evaluation: Evaluation }) {
  const scores = [
    { label: '综合评分', value: evaluation.overallScore },
    { label: '技术能力', value: evaluation.technicalSkills },
    { label: '沟通能力', value: evaluation.communication },
    { label: '主动性', value: evaluation.initiative },
    { label: '可靠性', value: evaluation.reliability },
  ];

  return (
    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
      <div className="grid grid-cols-5 gap-4">
        {scores.map((score) => (
          <div key={score.label} className="text-center">
            <div className="text-2xl font-bold text-primary">{score.value}</div>
            <div className="text-xs text-muted-foreground">{score.label}</div>
          </div>
        ))}
      </div>
      <div>
        <label className="text-sm font-medium">总体反馈</label>
        <p className="text-sm mt-1">{evaluation.feedback}</p>
      </div>
      {evaluation.strengths && (
        <div>
          <label className="text-sm font-medium">优点</label>
          <p className="text-sm mt-1">{evaluation.strengths}</p>
        </div>
      )}
      {evaluation.improvements && (
        <div>
          <label className="text-sm font-medium">改进建议</label>
          <p className="text-sm mt-1">{evaluation.improvements}</p>
        </div>
      )}
    </div>
  );
}

// Score Field Component
function ScoreField({
  form,
  name,
  label,
}: {
  form: ReturnType<typeof useForm<EvaluationFormData>>;
  name: keyof EvaluationFormData;
  label: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((score) => (
                  <SelectItem key={score} value={String(score)}>
                    {score} 分
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
