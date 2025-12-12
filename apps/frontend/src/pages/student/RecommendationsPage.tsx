import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
import { useAuthStore } from '@/stores';
import { studentService, type ProjectRecommendation, type CreateApplicationDTO } from '@/services';
import { useToast } from '@/hooks/useToast';
import {
  Star,
  Calendar,
  Users,
  Clock,
  MapPin,
  Send,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  User,
} from 'lucide-react';

export default function RecommendationsPage() {
  useAuthStore();
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<ProjectRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectRecommendation | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [profileCompleteness, setProfileCompleteness] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [recsData, profile] = await Promise.all([
          studentService.getRecommendations(20),
          studentService.getMyProfile(),
        ]);
        setRecommendations(recsData);
        setProfileCompleteness(profile?.completeness || 0);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch recommendations:', err);
        setError('获取推荐项目失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleApply = async () => {
    if (!selectedProject || !coverLetter.trim()) {
      toast({
        title: '请填写申请信',
        description: '申请信不能为空',
        variant: 'destructive',
      });
      return;
    }

    try {
      setApplying(true);
      const applicationData: CreateApplicationDTO = {
        projectId: selectedProject.project.id,
        coverLetter: coverLetter.trim(),
      };
      await studentService.submitApplication(applicationData);
      toast({
        title: '申请成功',
        description: '您的申请已提交，请等待教师审核',
      });
      setShowApplyModal(false);
      setCoverLetter('');
      setSelectedProject(null);
      // Refresh recommendations to update applied status
      const recsData = await studentService.getRecommendations(20);
      setRecommendations(recsData);
    } catch (err: unknown) {
      console.error('Failed to submit application:', err);
      const errorMessage =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data
              ?.error?.message
          : undefined;
      toast({
        title: '申请失败',
        description: errorMessage || '申请提交失败，请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setApplying(false);
    }
  };

  const openApplyModal = (rec: ProjectRecommendation) => {
    setSelectedProject(rec);
    setCoverLetter('');
    setShowApplyModal(true);
  };

  if (loading) {
    return <Loading text="加载推荐项目..." />;
  }

  if (error) {
    return <ErrorMessage title="加载失败" message={error} />;
  }

  const showProfileWarning = profileCompleteness < 60;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">推荐项目</h1>
        <p className="text-muted-foreground">根据您的能力档案，为您智能匹配的科研项目</p>
      </div>

      {/* Profile Warning */}
      {showProfileWarning && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <AlertCircle className="h-8 w-8 text-amber-500" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                  档案完整度较低 ({profileCompleteness}%)
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  完善您的个人档案可以获得更精准的项目推荐
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

      {/* Recommendations List */}
      {recommendations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Lightbulb className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">暂无推荐项目</h3>
            <p className="text-muted-foreground mb-4">
              {profileCompleteness < 50
                ? '请先完善您的个人档案，系统将为您推荐匹配的项目'
                : '当前没有与您匹配的活跃项目，请稍后再来查看'}
            </p>
            {profileCompleteness < 50 && (
              <Link to="/student/profile">
                <Button>完善档案</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((rec) => (
            <ProjectCard
              key={rec.project.id}
              recommendation={rec}
              onApply={() => openApplyModal(rec)}
              onViewDetails={() => setSelectedProject(rec)}
            />
          ))}
        </div>
      )}

      {/* Project Detail Modal */}
      {selectedProject && !showApplyModal && (
        <Modal open={true} onOpenChange={() => setSelectedProject(null)}>
          <ModalContent className="max-w-2xl">
            <ModalHeader>
              <ModalTitle>{selectedProject.project.title}</ModalTitle>
              <ModalDescription>
                {selectedProject.project.teacher?.name || '未知教师'} ·{' '}
                {selectedProject.project.researchField}
              </ModalDescription>
            </ModalHeader>
            <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Match Score */}
              <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-lg">
                <div className="flex items-center gap-2">
                  <Star className="h-6 w-6 text-amber-500 fill-current" />
                  <span className="text-2xl font-bold">{selectedProject.score}</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">匹配度评分</p>
                  <p className="text-sm text-muted-foreground">{selectedProject.reasoning}</p>
                </div>
              </div>

              {/* Matched Skills */}
              {selectedProject.matchedSkills.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">匹配的技能</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.matchedSkills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-sm"
                      >
                        <CheckCircle className="h-3 w-3 inline mr-1" />
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Project Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    开始时间：
                    {new Date(selectedProject.project.startDate).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>时长：{selectedProject.project.duration} 个月</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>招收人数：{selectedProject.project.positions} 人</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {selectedProject.project.teacher?.teacherProfile?.title || '教师'} ·
                    {selectedProject.project.teacher?.teacherProfile?.department || ''}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-medium mb-2">项目描述</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedProject.project.description}
                </p>
              </div>

              {/* Requirements */}
              <div>
                <h4 className="font-medium mb-2">项目要求</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedProject.project.requirements}
                </p>
              </div>

              {/* Required Skills */}
              <div>
                <h4 className="font-medium mb-2">所需技能</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.project.requiredSkills.map((skill) => {
                    const isMatched = selectedProject.matchedSkills.includes(skill);
                    return (
                      <span
                        key={skill}
                        className={`px-3 py-1 rounded-full text-sm ${
                          isMatched
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {isMatched && <CheckCircle className="h-3 w-3 inline mr-1" />}
                        {skill}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
            <ModalFooter>
              <ModalClose asChild>
                <Button variant="outline">关闭</Button>
              </ModalClose>
              <Button
                onClick={() => {
                  setShowApplyModal(true);
                }}
              >
                <Send className="h-4 w-4 mr-2" />
                申请项目
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Apply Modal */}
      {showApplyModal && selectedProject && (
        <Modal open={true} onOpenChange={() => setShowApplyModal(false)}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>申请项目</ModalTitle>
              <ModalDescription>{selectedProject.project.title}</ModalDescription>
            </ModalHeader>
            <div className="px-6 py-4 space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="h-4 w-4 text-amber-500 fill-current" />
                  <span className="font-medium">匹配度：{selectedProject.score}分</span>
                </div>
                <p className="text-sm text-muted-foreground">{selectedProject.reasoning}</p>
              </div>
              <div>
                <Label htmlFor="coverLetter">申请信</Label>
                <textarea
                  id="coverLetter"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="w-full min-h-[150px] mt-2 px-3 py-2 border rounded-md resize-none"
                  placeholder="请简要介绍您申请这个项目的原因，以及您能为项目带来的价值..."
                />
              </div>
            </div>
            <ModalFooter>
              <Button variant="outline" onClick={() => setShowApplyModal(false)}>
                取消
              </Button>
              <Button onClick={handleApply} disabled={applying || !coverLetter.trim()}>
                {applying ? '提交中...' : '提交申请'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}

// Project Card Component
interface ProjectCardProps {
  recommendation: ProjectRecommendation;
  onApply: () => void;
  onViewDetails: () => void;
}

function ProjectCard({ recommendation, onApply, onViewDetails }: ProjectCardProps) {
  const { project, score, reasoning, matchedSkills } = recommendation;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{project.title}</h3>
            <p className="text-sm text-muted-foreground">{project.teacher?.name || '未知教师'}</p>
          </div>
          <div className="flex items-center gap-1 text-amber-500 ml-2">
            <Star className="h-5 w-5 fill-current" />
            <span className="font-bold">{score}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Research Field */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{project.researchField}</span>
        </div>

        {/* Project Info */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{project.duration}个月</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{project.positions}人</span>
          </div>
        </div>

        {/* Matched Skills */}
        {matchedSkills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {matchedSkills.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="px-2 py-0.5 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full"
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

        {/* Reasoning */}
        <p className="text-sm text-muted-foreground line-clamp-2">{reasoning}</p>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onViewDetails}>
            查看详情
          </Button>
          <Button size="sm" className="flex-1" onClick={onApply}>
            <Send className="h-4 w-4 mr-1" />
            申请
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
