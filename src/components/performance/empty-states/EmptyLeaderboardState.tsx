import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Sparkles } from "lucide-react";

export function EmptyLeaderboardState() {
  return (
    <Card className="border-dashed">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto p-4 rounded-full bg-primary/10 w-fit mb-4">
          <Trophy className="h-12 w-12 text-primary" />
        </div>
        <CardTitle className="text-2xl">Chưa có Bảng xếp hạng</CardTitle>
        <CardDescription className="max-w-md mx-auto">
          Bảng xếp hạng sẽ hiển thị khi có đủ dữ liệu XP từ các nhân viên. 
          Hoàn thành KPI và nhiệm vụ để tích lũy XP.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-yellow-500" />
          <span>Xếp hạng cập nhật theo thời gian thực</span>
        </div>
      </CardContent>
    </Card>
  );
}
