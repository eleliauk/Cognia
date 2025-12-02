import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-2xl font-bold text-center">注册</h1>
          <p className="text-muted-foreground text-center">创建您的账户</p>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">注册页面待实现</p>
        </CardContent>
      </Card>
    </div>
  );
}
