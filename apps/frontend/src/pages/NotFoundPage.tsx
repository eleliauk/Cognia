import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-8 pb-8">
          <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
          <h2 className="text-2xl font-semibold mb-4">页面未找到</h2>
          <p className="text-muted-foreground mb-8">抱歉，您访问的页面不存在或已被移除。</p>
          <Link to="/">
            <Button>返回首页</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
