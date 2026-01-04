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
import { useAuthStore } from '@/stores';
import { authService } from '@/services';
import { getDashboardPath } from '@/router';
import { toast } from '@/hooks/useToast';
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';

// Login form validation schema
const loginSchema = z.object({
  email: z.string().min(1, '请输入邮箱地址').email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码').min(6, '密码长度至少为6位'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, setLoading } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    setLoading(true);

    try {
      const response = await authService.login(data);

      if (response.success && response.data) {
        const { user, accessToken, refreshToken } = response.data;

        // Update auth store
        login(user, { accessToken, refreshToken });

        toast.success({
          title: '登录成功',
          description: `欢迎回来，${user.name}！`,
        });

        // Navigate to appropriate dashboard
        const dashboardPath = getDashboardPath(user.role);
        navigate(dashboardPath, { replace: true });
      } else {
        // Handle error response
        const errorMessage = response.error?.message || '登录失败，请重试';
        toast.error({
          title: '登录失败',
          description: errorMessage,
        });
      }
    } catch (error: unknown) {
      // Handle network or unexpected errors
      let errorMessage = '网络错误，请检查网络连接后重试';

      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: { message?: string } } } };
        errorMessage = axiosError.response?.data?.error?.message || errorMessage;
      }

      toast.error({
        title: '登录失败',
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat font-serif">
      <div className="absolute inset-0 bg-black/30 w-screen h-screen" />

      <div className="relative z-10 w-full max-w-md">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">登录</h1>
          <p className="text-white/90 text-lg drop-shadow">校内科研实习供需智能匹配系统</p>
        </div>

        {/* Form Card */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70" />
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="密码"
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

                <Button
                  type="submit"
                  className="w-full h-12 bg-orange-300/90 hover:bg-orange-300 text-gray-800 font-semibold text-base shadow-lg transition-all"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      登录中...
                    </>
                  ) : (
                    '登录'
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm">
              <span className="text-white/80">还没有账号？</span>{' '}
              <Link
                to="/register"
                className="text-orange-300 hover:text-orange-200 font-medium underline"
              >
                立即注册
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
