import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/stores';
import { authService } from '@/services';
import { getDashboardPath } from '@/router';
import { toast } from '@/hooks/useToast';
import { Loader2, Mail, Lock, Eye, EyeOff, User, Phone } from 'lucide-react';

// Register form validation schema
const registerSchema = z
  .object({
    email: z.string().min(1, '请输入邮箱地址').email('请输入有效的邮箱地址'),
    password: z
      .string()
      .min(8, '密码长度至少为8位')
      .regex(/[a-zA-Z]/, '密码必须包含字母')
      .regex(/[0-9]/, '密码必须包含数字'),
    confirmPassword: z.string().min(1, '请确认密码'),
    name: z.string().min(2, '姓名至少2个字符').max(50, '姓名最多50个字符'),
    role: z.enum(['TEACHER', 'STUDENT'], {
      errorMap: () => ({ message: '请选择角色' }),
    }),
    phone: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login, setLoading } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      role: undefined,
      phone: '',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true);
    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = data;
      const response = await authService.register(registerData);

      if (response.success && response.data) {
        const { user, accessToken, refreshToken } = response.data;

        // Update auth store
        login(user, { accessToken, refreshToken });

        toast.success({
          title: '注册成功',
          description: `欢迎，${user.name}！`,
        });

        // Navigate to appropriate dashboard
        const dashboardPath = getDashboardPath(user.role);
        navigate(dashboardPath, { replace: true });
      } else {
        const errorMessage = response.error?.message || '注册失败，请重试';
        toast.error({
          title: '注册失败',
          description: errorMessage,
        });
      }
    } catch (error: unknown) {
      let errorMessage = '网络错误，请检查网络连接后重试';

      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: { message?: string } } } };
        errorMessage = axiosError.response?.data?.error?.message || errorMessage;
      }

      toast.error({
        title: '注册失败',
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat font-serif">
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/30 w-screen h-screen" />

      <div className="relative z-10 w-full max-w-md">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">注册</h1>
          <p className="text-white/90 text-lg drop-shadow">创建您的账户</p>
        </div>

        {/* Form Card */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70" />
                          <Input
                            placeholder="姓名"
                            className="pl-11 h-12 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-transparent focus:border-white/50"
                            disabled={isSubmitting}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-200" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70" />
                          <Input
                            type="email"
                            placeholder="邮箱地址"
                            className="pl-11 h-12 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-transparent focus:border-white/50"
                            disabled={isSubmitting}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-200" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-transparent focus:border-white/50">
                            <SelectValue placeholder="选择角色" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="STUDENT">学生</SelectItem>
                          <SelectItem value="TEACHER">教师</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-200" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70" />
                          <Input
                            placeholder="手机号（可选）"
                            className="pl-11 h-12 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-transparent focus:border-white/50"
                            disabled={isSubmitting}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-200" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70" />
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="密码（至少8位，含字母和数字）"
                            className="pl-11 pr-11 h-12 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-transparent focus:border-white/50"
                            disabled={isSubmitting}
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-200" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70" />
                          <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="确认密码"
                            className="pl-11 pr-11 h-12 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-transparent focus:border-white/50"
                            disabled={isSubmitting}
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                            tabIndex={-1}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-200" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-12 bg-orange-300/90 hover:bg-orange-300 text-gray-800 font-semibold text-base shadow-lg transition-all"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      注册中...
                    </>
                  ) : (
                    '注册'
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm">
              <span className="text-white/80">已有账号？</span>{' '}
              <Link
                to="/login"
                className="text-orange-300 hover:text-orange-200 font-medium underline"
              >
                立即登录
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
