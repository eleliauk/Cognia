import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useAuthStore } from '@/stores';

export default function TeacherDashboard() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">欢迎回来，{user?.name || '教师'}</h1>
        <p className="text-muted-foreground">
          这是您的教师仪表盘，您可以在这里管理科研项目和学生申请。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">活跃项目</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">当前发布中的项目</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">待审核申请</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">等待您审核的申请</p>
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
            <h3 className="text-sm font-medium text-muted-foreground">录取率</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">申请录取比例</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">最近申请</h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">暂无申请记录</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">项目概览</h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">暂无项目数据</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
