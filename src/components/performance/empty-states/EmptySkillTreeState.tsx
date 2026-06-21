import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GitBranch, Sparkles } from "lucide-react";

export function EmptySkillTreeState() {
  return (
    <Card className="border-dashed">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto p-4 rounded-full bg-primary/10 w-fit mb-4">
          <GitBranch className="h-12 w-12 text-primary" />
        </div>
        <CardTitle className="text-2xl">Chưa có Cây Kỹ năng</CardTitle>
        <CardDescription className="max-w-md mx-auto">
          Hệ thống cây kỹ năng chưa được thiết lập. Quản trị viên cần cấu hình 
          các nhóm kỹ năng và kỹ năng cụ thể cho công ty.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-yellow-500" />
          <span>Kỹ năng sẽ được mở khóa khi bạn tích lũy đủ XP</span>
        </div>
      </CardContent>
    </Card>
  );
}
