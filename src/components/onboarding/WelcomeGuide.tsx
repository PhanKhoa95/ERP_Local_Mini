import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Sparkles, ListTodo, FileText, Target, X } from "lucide-react";
import { Link } from "react-router-dom";
import { usePerformanceEmployee } from "@/hooks/usePerformanceEmployee";

const STORAGE_KEY = "welcome-guide-dismissed";

interface Step {
  id: string;
  title: string;
  description: string;
  icon: any;
  link: string;
  checkFn?: () => boolean;
}

export function WelcomeGuide() {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(STORAGE_KEY) === "true");
  const { employee } = usePerformanceEmployee();

  if (dismissed) return null;
  
  // Only show for new users (no XP yet)
  if (employee && employee.total_xp > 0) return null;

  const steps: Step[] = [
    { id: "overview", title: "Xem tổng quan", description: "Khám phá hiệu suất cá nhân", icon: Sparkles, link: "/performance" },
    { id: "task", title: "Tạo task đầu tiên", description: "Quản lý công việc hàng ngày", icon: ListTodo, link: "/performance" },
    { id: "report", title: "Gửi báo cáo đầu tiên", description: "Ghi nhận công việc bằng AI", icon: FileText, link: "/work-report" },
    { id: "kpi", title: "Khám phá KPI", description: "Hiểu chỉ số đánh giá", icon: Target, link: "/performance/kpi" },
  ];

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setDismissed(true);
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5 animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Chào mừng bạn! 🎉
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Bắt đầu hành trình với 4 bước đơn giản
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {steps.map((step, i) => (
          <Link
            key={step.id}
            to={step.link}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary shrink-0 group-hover:bg-primary/20 transition-colors">
              <step.icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{step.title}</p>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>
            <Badge variant="outline" className="text-xs shrink-0">
              {i + 1}/4
            </Badge>
          </Link>
        ))}
        <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={handleDismiss}>
          Bỏ qua hướng dẫn
        </Button>
      </CardContent>
    </Card>
  );
}
