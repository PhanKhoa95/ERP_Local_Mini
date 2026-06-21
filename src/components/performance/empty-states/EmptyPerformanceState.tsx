import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, ArrowRight, Sparkles } from "lucide-react";

interface EmptyPerformanceStateProps {
  onSetup?: () => void;
}

export const EmptyPerformanceState = React.forwardRef<HTMLDivElement, EmptyPerformanceStateProps>(
  ({ onSetup }, ref) => {
  return (
    <Card ref={ref} className="border-dashed">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto p-4 rounded-full bg-primary/10 w-fit mb-4">
          <Trophy className="h-12 w-12 text-primary" />
        </div>
        <CardTitle className="text-2xl">Chưa có hồ sơ hiệu suất</CardTitle>
        <CardDescription className="max-w-md mx-auto">
          Hồ sơ hiệu suất của bạn chưa được thiết lập. Liên hệ quản trị viên 
          để được thêm vào hệ thống đánh giá hiệu suất.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              <span>Nhận XP từ KPI</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-purple-500" />
              <span>Mở khóa huy hiệu</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-green-500" />
              <span>Thăng tiến sự nghiệp</span>
            </div>
          </div>
          {onSetup && (
            <Button onClick={onSetup} className="mt-4">
              Thiết lập ngay
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

EmptyPerformanceState.displayName = "EmptyPerformanceState";
