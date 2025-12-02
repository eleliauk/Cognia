import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useAuthStore } from '@/stores';

export default function StudentDashboard() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">欢迎回来，{user?.name || '同学'}</h1>
        <p className="text-muted-foreground">
          这是您的学生仪表盘，您可以在这里查看推荐项目和管理申请。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">推荐项目</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">为您匹配的项目</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">我的申请</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">已提交的申请</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">进行中实习</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">正在进行的实习</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">档案完整度</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">请完善您的档案</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">推荐项目</h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">完善档案后将为您推荐匹配的项目</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">申请状态</h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">暂无申请记录</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
