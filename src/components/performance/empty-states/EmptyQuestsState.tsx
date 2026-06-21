import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Swords, Sparkles } from "lucide-react";

export function EmptyQuestsState() {
  return (
    <Card className="border-dashed">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto p-4 rounded-full bg-primary/10 w-fit mb-4">
          <Swords className="h-12 w-12 text-primary" />
        </div>
        <CardTitle className="text-2xl">Chưa có Nhiệm vụ</CardTitle>
        <CardDescription className="max-w-md mx-auto">
          Hiện tại chưa có nhiệm vụ nào được giao. Quản trị viên sẽ tạo 
          các nhiệm vụ hàng ngày, hàng tuần để bạn hoàn thành.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-yellow-500" />
          <span>Nhiệm vụ sẽ xuất hiện khi được kích hoạt</span>
        </div>
      </CardContent>
    </Card>
  );
}
