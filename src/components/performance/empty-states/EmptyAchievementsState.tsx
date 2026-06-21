import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Sparkles } from "lucide-react";

export function EmptyAchievementsState() {
  return (
    <Card className="border-dashed">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto p-4 rounded-full bg-primary/10 w-fit mb-4">
          <Award className="h-12 w-12 text-primary" />
        </div>
        <CardTitle className="text-2xl">Chưa có Thành tích</CardTitle>
        <CardDescription className="max-w-md mx-auto">
          Hệ thống thành tích chưa được thiết lập. Quản trị viên cần tạo 
          các huy hiệu và điều kiện đạt được.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-yellow-500" />
          <span>Huy hiệu sẽ được trao khi bạn đạt các mốc đặc biệt</span>
        </div>
      </CardContent>
    </Card>
  );
}
