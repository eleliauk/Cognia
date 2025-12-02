import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useAuthStore } from '@/stores';

export default function AdminDashboard() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">管理员控制台</h1>
        <p className="text-muted-foreground">
          欢迎，{user?.name || '管理员'}。在这里您可以监控系统运行状态和管理用户。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">总用户数</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">注册用户总数</p>
          </CardContent>
        </Card>

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
            <h3 className="text-sm font-medium text-muted-foreground">匹配成功率</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">申请录取比例</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">API 成功率</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">LLM API 调用成功率</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">用户增长趋势</h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">暂无数据</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">系统性能</h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">暂无数据</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">最近审计日志</h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">暂无日志记录</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">错误日志</h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">暂无错误记录</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
