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
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
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
import { teacherService, type CreateProjectDTO } from '@/services/teacherService';
import type { Project, ProjectStatus } from '@/types';
import { Plus, Pencil, Trash2, Search, Filter } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

// Form validation schema
const projectSchema = z.object({
  title: z.string().min(2, '标题至少2个字符').max(100, '标题最多100个字符'),
  description: z.string().min(10, '描述至少10个字符').max(2000, '描述最多2000个字符'),
  requirements: z.string().min(10, '要求至少10个字符').max(1000, '要求最多1000个字符'),
  requiredSkills: z.string().min(1, '请输入所需技能'),
  researchField: z.string().min(2, '研究领域至少2个字符'),
  duration: z.coerce.number().min(1, '时长至少1个月').max(24, '时长最多24个月'),
  positions: z.coerce.number().min(1, '至少招收1人').max(20, '最多招收20人'),
  startDate: z.string().min(1, '请选择开始日期'),
});

type ProjectFormData = z.infer<typeof projectSchema>;

const STATUS_LABELS: Record<ProjectStatus, string> = {
  DRAFT: '草稿',
  ACTIVE: '招募中',
  CLOSED: '已关闭',
  COMPLETED: '已完成',
};

const STATUS_COLORS: Record<ProjectStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  ACTIVE: 'bg-green-100 text-green-800',
  CLOSED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
};

export default function ProjectsPage() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: '',
      description: '',
      requirements: '',
      requiredSkills: '',
      researchField: '',
      duration: 3,
      positions: 1,
      startDate: new Date().toISOString().split('T')[0],
    },
  });

  // Fetch projects
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await teacherService.getMyProjects();
      setProjects(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      setError('获取项目列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Open modal for create/edit
  const openModal = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      form.reset({
        title: project.title,
        description: project.description,
        requirements: project.requirements,
        requiredSkills: project.requiredSkills.join(', '),
        researchField: project.researchField,
        duration: project.duration,
        positions: project.positions,
        startDate: project.startDate.split('T')[0],
      });
    } else {
      setEditingProject(null);
      form.reset({
        title: '',
        description: '',
        requirements: '',
        requiredSkills: '',
        researchField: '',
        duration: 3,
        positions: 1,
        startDate: new Date().toISOString().split('T')[0],
      });
    }
    setIsModalOpen(true);
  };

  // Handle form submit
  const onSubmit = async (data: ProjectFormData) => {
    try {
      setSubmitting(true);
      const projectData: CreateProjectDTO = {
        ...data,
        requiredSkills: data.requiredSkills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      };

      if (editingProject) {
        await teacherService.updateProject(editingProject.id, projectData);
        toast({ title: '成功', description: '项目更新成功' });
      } else {
        await teacherService.createProject(projectData);
        toast({ title: '成功', description: '项目创建成功' });
      }

      setIsModalOpen(false);
      fetchProjects();
    } catch (err) {
      console.error('Failed to save project:', err);
      toast({
        title: '错误',
        description: editingProject ? '更新项目失败' : '创建项目失败',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      await teacherService.deleteProject(id);
      toast({ title: '成功', description: '项目删除成功' });
      setDeleteConfirmId(null);
      fetchProjects();
    } catch (err) {
      console.error('Failed to delete project:', err);
      toast({ title: '错误', description: '删除项目失败', variant: 'destructive' });
    }
  };

  // Handle status change
  const handleStatusChange = async (id: string, status: ProjectStatus) => {
    try {
      await teacherService.updateProjectStatus(id, status);
      toast({ title: '成功', description: '状态更新成功' });
      fetchProjects();
    } catch (err) {
      console.error('Failed to update status:', err);
      toast({ title: '错误', description: '状态更新失败', variant: 'destructive' });
    }
  };

  // Filter projects
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.researchField.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <Loading text="加载项目列表..." />;
  }

  if (error) {
    return <ErrorMessage title="加载失败" message={error} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">项目管理</h1>
          <p className="text-muted-foreground">创建和管理您的科研项目</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="h-4 w-4 mr-2" />
          创建项目
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索项目标题或研究领域..."
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
                <SelectItem value="DRAFT">草稿</SelectItem>
                <SelectItem value="ACTIVE">招募中</SelectItem>
                <SelectItem value="CLOSED">已关闭</SelectItem>
                <SelectItem value="COMPLETED">已完成</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">项目列表 ({filteredProjects.length})</h2>
        </CardHeader>
        <CardContent>
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {projects.length === 0 ? (
                <>
                  <p>您还没有创建任何项目</p>
                  <Button className="mt-4" onClick={() => openModal()}>
                    <Plus className="h-4 w-4 mr-2" />
                    创建第一个项目
                  </Button>
                </>
              ) : (
                <p>没有找到匹配的项目</p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>项目标题</TableHead>
                  <TableHead>研究领域</TableHead>
                  <TableHead>招收人数</TableHead>
                  <TableHead>时长</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {project.title}
                    </TableCell>
                    <TableCell>{project.researchField}</TableCell>
                    <TableCell>{project.positions} 人</TableCell>
                    <TableCell>{project.duration} 个月</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          STATUS_COLORS[project.status]
                        }`}
                      >
                        {STATUS_LABELS[project.status]}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(project.createdAt).toLocaleDateString('zh-CN')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openModal(project)}
                          title="编辑"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {project.status === 'DRAFT' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(project.id, 'ACTIVE')}
                          >
                            发布
                          </Button>
                        )}
                        {project.status === 'ACTIVE' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(project.id, 'CLOSED')}
                          >
                            关闭
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirmId(project.id)}
                          title="删除"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
        <ModalContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <ModalHeader>
            <ModalTitle>{editingProject ? '编辑项目' : '创建新项目'}</ModalTitle>
            <ModalDescription>
              {editingProject ? '修改项目信息后点击保存' : '填写项目信息以创建新的科研项目'}
            </ModalDescription>
          </ModalHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>项目标题 *</FormLabel>
                    <FormControl>
                      <Input placeholder="输入项目标题" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="researchField"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>研究领域 *</FormLabel>
                    <FormControl>
                      <Input placeholder="如：人工智能、机器学习" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>项目描述 *</FormLabel>
                    <FormControl>
                      <textarea
                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="详细描述项目内容和目标"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>申请要求 *</FormLabel>
                    <FormControl>
                      <textarea
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="描述对申请者的要求"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requiredSkills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>所需技能 *</FormLabel>
                    <FormControl>
                      <Input placeholder="用逗号分隔，如：Python, 机器学习, 数据分析" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>时长（月）*</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={24} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="positions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>招收人数 *</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={20} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>开始日期 *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <ModalFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? '保存中...' : editingProject ? '保存修改' : '创建项目'}
                </Button>
              </ModalFooter>
            </form>
          </Form>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>确认删除</ModalTitle>
            <ModalDescription>您确定要删除这个项目吗？此操作无法撤销。</ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              确认删除
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
