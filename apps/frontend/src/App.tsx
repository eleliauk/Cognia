import "./index.css";
import { APITester } from "./APITester";
import { TodoApp } from "./components/TodoApp";
import { Card, CardContent } from "@/components/ui/card";


export function App() {
  return (
    <div className="container mx-auto p-8 relative z-10">
      <div className="flex justify-center items-center gap-8 mb-8">
        <h1 className="text-4xl font-bold">Cognia - Bun Monorepo Demo</h1>
      </div>

      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
        {/* Todo 管理应用 */}
        <div>
          <TodoApp />
        </div>

        {/* API 测试器 */}
        <div>
          <Card className="bg-card/50 backdrop-blur-sm border-muted">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold mb-4">API 测试器</h2>
              <APITester />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default App;
