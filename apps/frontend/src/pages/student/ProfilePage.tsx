import { useEffect, useState, useCallback } from 'react';
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
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui';
import { useAuthStore } from '@/stores';
import {
  studentService,
  type CreateProfileDTO,
  type UpdateProfileDTO,
  type CreateExperienceDTO,
} from '@/services';
import type { StudentProfile, ProjectExperience } from '@/types';
import { useToast } from '@/hooks/useToast';
import {
  User,
  GraduationCap,
  Code,
  Lightbulb,
  Briefcase,
  Plus,
  Trash2,
  Save,
  X,
  Edit2,
  CheckCircle,
} from 'lucide-react';

// Validation schemas
const profileSchema = z.object({
  studentNumber: z.string().min(1, '学号不能为空'),
  major: z.string().min(1, '专业不能为空'),
  grade: z.coerce.number().min(1, '年级必须大于0').max(10, '年级不能超过10'),
  gpa: z.coerce.number().min(0, 'GPA不能为负').max(5, 'GPA不能超过5'),
  skills: z.array(z.string()).min(1, '至少添加一个技能'),
  researchInterests: z.array(z.string()).min(1, '至少添加一个研究兴趣'),
  academicBackground: z.string().optional(),
  selfIntroduction: z.string().optional(),
});

const experienceSchema = z.object({
  title: z.string().min(1, '项目名称不能为空'),
  description: z.string().min(1, '项目描述不能为空'),
  role: z.string().min(1, '担任角色不能为空'),
  duration: z.string().min(1, '项目时长不能为空'),
  achievements: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type ExperienceFormData = z.infer<typeof experienceSchema>;

export default function ProfilePage() {
  useAuthStore();
  const { toast } = useToast();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showExperienceForm, setShowExperienceForm] = useState(false);
  const [editingExperience, setEditingExperience] = useState<ProjectExperience | null>(null);

  // Skills and interests input state
  const [skillInput, setSkillInput] = useState('');
  const [interestInput, setInterestInput] = useState('');

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      studentNumber: '',
      major: '',
      grade: 1,
      gpa: 0,
      skills: [],
      researchInterests: [],
      academicBackground: '',
      selfIntroduction: '',
    },
  });

  const experienceForm = useForm<ExperienceFormData>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      title: '',
      description: '',
      role: '',
      duration: '',
      achievements: '',
    },
  });

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await studentService.getMyProfile();
      setProfile(data);
      if (data) {
        form.reset({
          studentNumber: data.studentNumber,
          major: data.major,
          grade: data.grade,
          gpa: data.gpa,
          skills: data.skills,
          researchInterests: data.researchInterests,
          academicBackground: data.academicBackground || '',
          selfIntroduction: data.selfIntroduction || '',
        });
      } else {
        setIsEditing(true);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError('获取档案失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onSubmitProfile = async (data: ProfileFormData) => {
    try {
      setSaving(true);
      let updatedProfile: StudentProfile;

      if (profile) {
        const updateData: UpdateProfileDTO = {
          major: data.major,
          grade: data.grade,
          gpa: data.gpa,
          skills: data.skills,
          researchInterests: data.researchInterests,
          academicBackground: data.academicBackground,
          selfIntroduction: data.selfIntroduction,
        };
        updatedProfile = await studentService.updateProfile(updateData);
      } else {
        const createData: CreateProfileDTO = {
          studentNumber: data.studentNumber,
          major: data.major,
          grade: data.grade,
          gpa: data.gpa,
          skills: data.skills,
          researchInterests: data.researchInterests,
          academicBackground: data.academicBackground,
          selfIntroduction: data.selfIntroduction,
        };
        updatedProfile = await studentService.createProfile(createData);
      }

      setProfile(updatedProfile);
      setIsEditing(false);
      toast({
        title: '保存成功',
        description: '您的档案已更新',
      });
    } catch (err: unknown) {
      console.error('Failed to save profile:', err);
      const errorMessage =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data
              ?.error?.message
          : undefined;
      toast({
        title: '保存失败',
        description: errorMessage || '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const onSubmitExperience = async (data: ExperienceFormData) => {
    try {
      setSaving(true);
      if (editingExperience) {
        await studentService.updateExperience(editingExperience.id, data);
        toast({ title: '更新成功', description: '项目经验已更新' });
      } else {
        await studentService.addExperience(data as CreateExperienceDTO);
        toast({ title: '添加成功', description: '项目经验已添加' });
      }
      setShowExperienceForm(false);
      setEditingExperience(null);
      experienceForm.reset();
      await fetchProfile();
    } catch (err: unknown) {
      console.error('Failed to save experience:', err);
      const errorMessage =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data
              ?.error?.message
          : undefined;
      toast({
        title: '保存失败',
        description: errorMessage || '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExperience = async (experienceId: string) => {
    if (!confirm('确定要删除这个项目经验吗？')) return;

    try {
      await studentService.deleteExperience(experienceId);
      toast({ title: '删除成功', description: '项目经验已删除' });
      await fetchProfile();
    } catch (err: unknown) {
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

  const handleEditExperience = (experience: ProjectExperience) => {
    setEditingExperience(experience);
    experienceForm.reset({
      title: experience.title,
      description: experience.description,
      role: experience.role,
      duration: experience.duration,
      achievements: experience.achievements || '',
    });
    setShowExperienceForm(true);
  };

  const addSkill = () => {
    if (skillInput.trim()) {
      const currentSkills = form.getValues('skills');
      if (!currentSkills.includes(skillInput.trim())) {
        form.setValue('skills', [...currentSkills, skillInput.trim()]);
      }
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    const currentSkills = form.getValues('skills');
    form.setValue(
      'skills',
      currentSkills.filter((s) => s !== skill)
    );
  };

  const addInterest = () => {
    if (interestInput.trim()) {
      const currentInterests = form.getValues('researchInterests');
      if (!currentInterests.includes(interestInput.trim())) {
        form.setValue('researchInterests', [...currentInterests, interestInput.trim()]);
      }
      setInterestInput('');
    }
  };

  const removeInterest = (interest: string) => {
    const currentInterests = form.getValues('researchInterests');
    form.setValue(
      'researchInterests',
      currentInterests.filter((i) => i !== interest)
    );
  };

  if (loading) {
    return <Loading text="加载档案数据..." />;
  }

  if (error) {
    return <ErrorMessage title="加载失败" message={error} />;
  }

  const completeness = profile?.completeness || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">个人档案</h1>
          <p className="text-muted-foreground">完善您的能力档案，获得更精准的项目推荐</p>
        </div>
        {profile && !isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Edit2 className="h-4 w-4 mr-2" />
            编辑档案
          </Button>
        )}
      </div>

      {/* Completeness Card */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">档案完整度</span>
                <span className="text-sm font-bold">{completeness}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    completeness >= 80
                      ? 'bg-green-500'
                      : completeness >= 50
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${completeness}%` }}
                />
              </div>
            </div>
            {completeness >= 80 && <CheckCircle className="h-8 w-8 text-green-500" />}
          </div>
          {completeness < 80 && (
            <p className="text-sm text-muted-foreground mt-2">
              {completeness < 50
                ? '请填写基本信息、技能和研究兴趣以提高完整度'
                : '添加项目经验和自我介绍可以进一步提高完整度'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitProfile)} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">基本信息</h2>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="studentNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>学号</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={!!profile || !isEditing}
                        placeholder="请输入学号"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="major"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>专业</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!isEditing} placeholder="请输入专业" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>年级</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        disabled={!isEditing}
                        placeholder="请输入年级"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gpa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GPA</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        disabled={!isEditing}
                        placeholder="请输入GPA"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Code className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">技能标签</h2>
              </div>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {field.value.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                        >
                          {skill}
                          {isEditing && (
                            <button
                              type="button"
                              onClick={() => removeSkill(skill)}
                              className="hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                    {isEditing && (
                      <div className="flex gap-2">
                        <Input
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          placeholder="输入技能，如 Python、机器学习"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                        />
                        <Button type="button" variant="outline" onClick={addSkill}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Research Interests */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">研究兴趣</h2>
              </div>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="researchInterests"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {field.value.map((interest) => (
                        <span
                          key={interest}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 rounded-full text-sm"
                        >
                          {interest}
                          {isEditing && (
                            <button
                              type="button"
                              onClick={() => removeInterest(interest)}
                              className="hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                    {isEditing && (
                      <div className="flex gap-2">
                        <Input
                          value={interestInput}
                          onChange={(e) => setInterestInput(e.target.value)}
                          placeholder="输入研究兴趣，如 自然语言处理、计算机视觉"
                          onKeyPress={(e) =>
                            e.key === 'Enter' && (e.preventDefault(), addInterest())
                          }
                        />
                        <Button type="button" variant="outline" onClick={addInterest}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Academic Background & Self Introduction */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">个人介绍</h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="academicBackground"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>学术背景</FormLabel>
                    <FormControl>
                      <textarea
                        {...field}
                        disabled={!isEditing}
                        className="w-full min-h-[100px] px-3 py-2 border rounded-md resize-none disabled:opacity-50"
                        placeholder="描述您的学术背景，如课程学习、获奖经历等"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="selfIntroduction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>自我介绍</FormLabel>
                    <FormControl>
                      <textarea
                        {...field}
                        disabled={!isEditing}
                        className="w-full min-h-[100px] px-3 py-2 border rounded-md resize-none disabled:opacity-50"
                        placeholder="简要介绍自己，包括个人特点、职业规划等"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Save Button */}
          {isEditing && (
            <div className="flex justify-end gap-3">
              {profile && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    form.reset({
                      studentNumber: profile.studentNumber,
                      major: profile.major,
                      grade: profile.grade,
                      gpa: profile.gpa,
                      skills: profile.skills,
                      researchInterests: profile.researchInterests,
                      academicBackground: profile.academicBackground || '',
                      selfIntroduction: profile.selfIntroduction || '',
                    });
                  }}
                >
                  取消
                </Button>
              )}
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>保存中...</>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    保存档案
                  </>
                )}
              </Button>
            </div>
          )}
        </form>
      </Form>

      {/* Project Experiences */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">项目经验</h2>
            </div>
            {profile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingExperience(null);
                  experienceForm.reset();
                  setShowExperienceForm(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                添加经验
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!profile ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              请先保存基本档案信息后再添加项目经验
            </p>
          ) : profile.projectExperiences.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              暂无项目经验，点击上方按钮添加
            </p>
          ) : (
            <div className="space-y-4">
              {profile.projectExperiences.map((exp) => (
                <div key={exp.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{exp.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {exp.role} · {exp.duration}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditExperience(exp)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteExperience(exp.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm mt-2">{exp.description}</p>
                  {exp.achievements && (
                    <p className="text-sm text-muted-foreground mt-1">成果：{exp.achievements}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Experience Form Modal */}
      {showExperienceForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader>
              <h3 className="text-lg font-semibold">
                {editingExperience ? '编辑项目经验' : '添加项目经验'}
              </h3>
            </CardHeader>
            <CardContent>
              <Form {...experienceForm}>
                <form
                  onSubmit={experienceForm.handleSubmit(onSubmitExperience)}
                  className="space-y-4"
                >
                  <FormField
                    control={experienceForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>项目名称</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="请输入项目名称" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={experienceForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>担任角色</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="如：项目负责人" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={experienceForm.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>项目时长</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="如：2023.09-2024.01" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={experienceForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>项目描述</FormLabel>
                        <FormControl>
                          <textarea
                            {...field}
                            className="w-full min-h-[80px] px-3 py-2 border rounded-md resize-none"
                            placeholder="描述项目内容和您的工作"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={experienceForm.control}
                    name="achievements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>项目成果（可选）</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="如：发表论文、获得奖项等" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowExperienceForm(false);
                        setEditingExperience(null);
                      }}
                    >
                      取消
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? '保存中...' : '保存'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
