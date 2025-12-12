import { useEffect, useState, useRef } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
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
  Label,
} from '@/components/ui';
import { studentService, type StudentInternshipDetails, type Milestone } from '@/services';
import type { Evaluation } from '@/types';
import { useToast } from '@/hooks/useToast';
import {
  Briefcase,
  Calendar,
  Clock,
  CheckCircle,
  Circle,
  Upload,
  FileText,
  Trash2,
  Star,
  AlertCircle,
  Download,
  Eye,
} from 'lucide-react';

type InternshipStatus = 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'TERMINATED';

const statusConfig: Record<InternshipStatus, { color: string; bgColor: string; label: string }> = {
  IN_PROGRESS: {
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900',
    label: '进行中',
  },
  PAUSED: { color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900', label: '已暂停' },
  COMPLETED: { color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900', label: '已完成' },
  TERMINATED: { color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900', label: '已终止' },
};

export default function InternshipsPage() {
  const { toast } = useToast();
  const [internships, setInternships] = useState<StudentInternshipDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInternship, setSelectedInternship] = useState<StudentInternshipDetails | null>(
    null
  );
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [newProgress, setNewProgress] = useState(0);
  const [updating, setUpdating] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchInternships();
  }, []);

  const fetchInternships = async () => {
    try {
      setLoading(true);
      const data = await studentService.getMyInternships();
      setInternships(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch internships:', err);
      setError('获取实习列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProgress = async () => {
    if (!selectedInternship) return;

    try {
      setUpdating(true);
      await studentService.updateInternshipProgress(selectedInternship.id, newProgress);
      toast({
        title: '更新成功',
        description: '实习进度已更新',
      });
      setShowProgressModal(false);
      await fetchInternships();
    } catch (err: unknown) {
      console.error('Failed to update progress:', err);
      const errorMessage =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data
              ?.error?.message
          : undefined;
      toast({
        title: '更新失败',
        description: errorMessage || '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedInternship) return;

    try {
      setLoading(true);
      await studentService.uploadDocument(selectedInternship.id, file);
      toast({
        title: '上传成功',
        description: '文档已上传',
      });
      setShowUploadModal(false);
      // Refresh internship details
      const updated = await studentService.getInternshipById(selectedInternship.id);
      setSelectedInternship(updated);
      await fetchInternships();
    } catch (err: unknown) {
      console.error('Failed to upload document:', err);
      const errorMessage =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data
              ?.error?.message
          : undefined;
      toast({
        title: '上传失败',
        description: errorMessage || '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!selectedInternship || !confirm('确定要删除这个文档吗？')) return;

    try {
      await studentService.deleteDocument(selectedInternship.id, documentId);
      toast({
        title: '删除成功',
        description: '文档已删除',
      });
      // Refresh internship details
      const updated = await studentService.getInternshipById(selectedInternship.id);
      setSelectedInternship(updated);
    } catch (err: unknown) {
      console.error('Failed to delete document:', err);
      const errorMessage =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data
              ?.error?.message
          : undefined;
      toast({
        title: '删除失败',
        description: errorMessage || '请稍后重试',
        variant: 'destructive',
      });
    }
  };

  const handleViewEvaluation = async (internship: StudentInternshipDetails) => {
    try {
      const evalData = await studentService.getEvaluationByInternship(internship.id);
      setEvaluation(evalData);
      setSelectedInternship(internship);
      setShowEvaluationModal(true);
    } catch (err) {
      console.error('Failed to fetch evaluation:', err);
      toast({
        title: '获取评价失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    }
  };

  const openInternshipDetail = async (internship: StudentInternshipDetails) => {
    try {
      const detailed = await studentService.getInternshipById(internship.id);
      setSelectedInternship(detailed);
    } catch (err) {
      console.error('Failed to fetch internship details:', err);
      setSelectedInternship(internship);
    }
  };

  const activeInternships = internships.filter(
    (i) => i.status === 'IN_PROGRESS' || i.status === 'PAUSED'
  );
  const completedInternships = internships.filter(
    (i) => i.status === 'COMPLETED' || i.status === 'TERMINATED'
  );

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
        <h1 className="text-2xl font-bold tracking-tight">我的实习</h1>
        <p className="text-muted-foreground">管理您的实习进度和成果文档</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">进行中</p>
                <p className="text-2xl font-bold">{activeInternships.length}</p>
              </div>
              <Briefcase className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">已完成</p>
                <p className="text-2xl font-bold">{completedInternships.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">总计</p>
                <p className="text-2xl font-bold">{internships.length}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Internships */}
      {activeInternships.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">进行中的实习</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {activeInternships.map((internship) => (
              <InternshipCard
                key={internship.id}
                internship={internship}
                onView={() => openInternshipDetail(internship)}
                onUpdateProgress={() => {
                  setSelectedInternship(internship);
                  setNewProgress(internship.progress);
                  setShowProgressModal(true);
                }}
                onUpload={() => {
                  setSelectedInternship(internship);
                  setShowUploadModal(true);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Internships */}
      {completedInternships.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">已完成的实习</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {completedInternships.map((internship) => (
              <InternshipCard
                key={internship.id}
                internship={internship}
                onView={() => openInternshipDetail(internship)}
                onViewEvaluation={() => handleViewEvaluation(internship)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {internships.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">暂无实习记录</h3>
            <p className="text-muted-foreground">申请通过后，您的实习将显示在这里</p>
          </CardContent>
        </Card>
      )}

      {/* Internship Detail Modal */}
      {selectedInternship && !showProgressModal && !showUploadModal && !showEvaluationModal && (
        <Modal open={true} onOpenChange={() => setSelectedInternship(null)}>
          <ModalContent className="max-w-3xl">
            <ModalHeader>
              <ModalTitle>{selectedInternship.project?.title || '实习详情'}</ModalTitle>
              <ModalDescription>
                {selectedInternship.project?.teacher?.name || '未知教师'}
              </ModalDescription>
            </ModalHeader>
            <div className="px-6 py-4 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">实习进度</span>
                  <span className="text-sm font-bold">{selectedInternship.progress}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${selectedInternship.progress}%` }}
                  />
                </div>
              </div>

              {/* Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    开始时间：{new Date(selectedInternship.startDate).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                {selectedInternship.endDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      结束时间：{new Date(selectedInternship.endDate).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${statusConfig[selectedInternship.status as InternshipStatus].bgColor} ${statusConfig[selectedInternship.status as InternshipStatus].color}`}
                  >
                    {statusConfig[selectedInternship.status as InternshipStatus].label}
                  </span>
                </div>
              </div>

              {/* Milestones */}
              {selectedInternship.milestones && selectedInternship.milestones.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">里程碑</h4>
                  <div className="space-y-3">
                    {selectedInternship.milestones.map((milestone) => (
                      <MilestoneItem key={milestone.id} milestone={milestone} />
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">成果文档</h4>
                  {selectedInternship.status === 'IN_PROGRESS' && (
                    <Button variant="outline" size="sm" onClick={() => setShowUploadModal(true)}>
                      <Upload className="h-4 w-4 mr-2" />
                      上传文档
                    </Button>
                  )}
                </div>
                {selectedInternship.documents && selectedInternship.documents.length > 0 ? (
                  <div className="space-y-2">
                    {selectedInternship.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{doc.filename}</p>
                            <p className="text-xs text-muted-foreground">
                              {(doc.fileSize / 1024).toFixed(1)} KB ·{' '}
                              {new Date(doc.uploadedAt).toLocaleDateString('zh-CN')}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                          {selectedInternship.status === 'IN_PROGRESS' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDocument(doc.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">暂无上传的文档</p>
                )}
              </div>
            </div>
            <ModalFooter>
              <ModalClose asChild>
                <Button variant="outline">关闭</Button>
              </ModalClose>
              {selectedInternship.status === 'IN_PROGRESS' && (
                <Button
                  onClick={() => {
                    setNewProgress(selectedInternship.progress);
                    setShowProgressModal(true);
                  }}
                >
                  更新进度
                </Button>
              )}
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Progress Update Modal */}
      {showProgressModal && selectedInternship && (
        <Modal open={true} onOpenChange={() => setShowProgressModal(false)}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>更新实习进度</ModalTitle>
              <ModalDescription>{selectedInternship.project?.title}</ModalDescription>
            </ModalHeader>
            <div className="px-6 py-4 space-y-4">
              <div>
                <Label>当前进度: {newProgress}%</Label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={newProgress}
                  onChange={(e) => setNewProgress(parseInt(e.target.value))}
                  className="w-full mt-2"
                />
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${newProgress}%` }}
                />
              </div>
            </div>
            <ModalFooter>
              <Button variant="outline" onClick={() => setShowProgressModal(false)}>
                取消
              </Button>
              <Button onClick={handleUpdateProgress} disabled={updating}>
                {updating ? '更新中...' : '确认更新'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Upload Modal */}
      {showUploadModal && selectedInternship && (
        <Modal open={true} onOpenChange={() => setShowUploadModal(false)}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>上传成果文档</ModalTitle>
              <ModalDescription>支持 PDF、Word、图片等格式</ModalDescription>
            </ModalHeader>
            <div className="px-6 py-4">
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="font-medium">点击选择文件</p>
                <p className="text-sm text-muted-foreground mt-1">或拖拽文件到此处</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              />
            </div>
            <ModalFooter>
              <Button variant="outline" onClick={() => setShowUploadModal(false)}>
                取消
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Evaluation Modal */}
      {showEvaluationModal && selectedInternship && (
        <Modal
          open={true}
          onOpenChange={() => {
            setShowEvaluationModal(false);
            setEvaluation(null);
          }}
        >
          <ModalContent className="max-w-lg">
            <ModalHeader>
              <ModalTitle>教师评价</ModalTitle>
              <ModalDescription>{selectedInternship.project?.title}</ModalDescription>
            </ModalHeader>
            <div className="px-6 py-4 space-y-4">
              {evaluation ? (
                <>
                  {/* Overall Score */}
                  <div className="flex items-center justify-center gap-2 p-4 bg-primary/5 rounded-lg">
                    <Star className="h-8 w-8 text-amber-500 fill-current" />
                    <span className="text-3xl font-bold">{evaluation.overallScore}</span>
                    <span className="text-muted-foreground">/ 5</span>
                  </div>

                  {/* Detailed Scores */}
                  <div className="grid grid-cols-2 gap-4">
                    <ScoreItem label="技术能力" score={evaluation.technicalSkills} />
                    <ScoreItem label="沟通能力" score={evaluation.communication} />
                    <ScoreItem label="主动性" score={evaluation.initiative} />
                    <ScoreItem label="可靠性" score={evaluation.reliability} />
                  </div>

                  {/* Feedback */}
                  <div>
                    <h4 className="font-medium mb-2">评价内容</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {evaluation.feedback}
                    </p>
                  </div>

                  {/* Strengths */}
                  {evaluation.strengths && (
                    <div>
                      <h4 className="font-medium mb-2 text-green-600">优点</h4>
                      <p className="text-sm text-muted-foreground">{evaluation.strengths}</p>
                    </div>
                  )}

                  {/* Improvements */}
                  {evaluation.improvements && (
                    <div>
                      <h4 className="font-medium mb-2 text-amber-600">改进建议</h4>
                      <p className="text-sm text-muted-foreground">{evaluation.improvements}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">暂无评价</p>
                </div>
              )}
            </div>
            <ModalFooter>
              <ModalClose asChild>
                <Button variant="outline">关闭</Button>
              </ModalClose>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}

// Internship Card Component
interface InternshipCardProps {
  internship: StudentInternshipDetails;
  onView: () => void;
  onUpdateProgress?: () => void;
  onUpload?: () => void;
  onViewEvaluation?: () => void;
}

function InternshipCard({
  internship,
  onView,
  onUpdateProgress,
  onUpload,
  onViewEvaluation,
}: InternshipCardProps) {
  const config = statusConfig[internship.status as InternshipStatus] || statusConfig.IN_PROGRESS;
  const isActive = internship.status === 'IN_PROGRESS';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{internship.project?.title || '未知项目'}</h3>
            <p className="text-sm text-muted-foreground">
              {internship.project?.teacher?.name || '未知教师'}
            </p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs ${config.bgColor} ${config.color}`}>
            {config.label}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-muted-foreground">进度</span>
            <span className="text-sm font-medium">{internship.progress}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${internship.progress}%` }}
            />
          </div>
        </div>

        {/* Dates */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{new Date(internship.startDate).toLocaleDateString('zh-CN')}</span>
          {internship.endDate && (
            <>
              <span>-</span>
              <span>{new Date(internship.endDate).toLocaleDateString('zh-CN')}</span>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onView}>
            <Eye className="h-4 w-4 mr-1" />
            详情
          </Button>
          {isActive && onUpdateProgress && (
            <Button variant="outline" size="sm" onClick={onUpdateProgress}>
              <Clock className="h-4 w-4" />
            </Button>
          )}
          {isActive && onUpload && (
            <Button variant="outline" size="sm" onClick={onUpload}>
              <Upload className="h-4 w-4" />
            </Button>
          )}
          {!isActive && onViewEvaluation && (
            <Button variant="outline" size="sm" onClick={onViewEvaluation}>
              <Star className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Milestone Item Component
interface MilestoneItemProps {
  milestone: Milestone;
}

function MilestoneItem({ milestone }: MilestoneItemProps) {
  const isOverdue = !milestone.completed && new Date(milestone.dueDate) < new Date();

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg ${milestone.completed ? 'bg-green-50 dark:bg-green-950' : isOverdue ? 'bg-red-50 dark:bg-red-950' : 'bg-muted'}`}
    >
      {milestone.completed ? (
        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
      ) : (
        <Circle
          className={`h-5 w-5 mt-0.5 ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}
        />
      )}
      <div className="flex-1">
        <p
          className={`font-medium ${milestone.completed ? 'line-through text-muted-foreground' : ''}`}
        >
          {milestone.title}
        </p>
        <p className="text-sm text-muted-foreground">{milestone.description}</p>
        <p
          className={`text-xs mt-1 ${isOverdue && !milestone.completed ? 'text-red-500' : 'text-muted-foreground'}`}
        >
          截止日期：{new Date(milestone.dueDate).toLocaleDateString('zh-CN')}
          {milestone.completedAt &&
            ` · 完成于 ${new Date(milestone.completedAt).toLocaleDateString('zh-CN')}`}
        </p>
      </div>
    </div>
  );
}

// Score Item Component
interface ScoreItemProps {
  label: string;
  score: number;
}

function ScoreItem({ label, score }: ScoreItemProps) {
  return (
    <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i <= score ? 'text-amber-500 fill-current' : 'text-muted-foreground'}`}
          />
        ))}
      </div>
    </div>
  );
}
