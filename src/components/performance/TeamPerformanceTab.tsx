import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, AlertTriangle, CheckCircle2, Zap, ArrowUpRight } from "lucide-react";
import { useTeamPerformance } from "@/hooks/useTeamPerformance";
import { EmployeeProfileCard } from "@/components/performance/EmployeeProfileCard";
import { PromotionDialog } from "@/components/performance/PromotionDialog";

export function TeamPerformanceTab() {
  const { teamMembers, teamStats, isLoading } = useTeamPerformance();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>("");
  const [promotionTarget, setPromotionTarget] = useState<any>(null);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-8 bg-muted rounded w-1/2 mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Hiệu suất Team</h2>
          <p className="text-muted-foreground">
            Theo dõi và quản lý hiệu suất của team
          </p>
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thành viên</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats?.totalMembers || 0}</div>
            <p className="text-xs text-muted-foreground">Nhân viên trong team</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">XP Trung bình</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamStats?.avgXP?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">Điểm kinh nghiệm</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoàn thành</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats?.completedQuests || 0}</div>
            <p className="text-xs text-muted-foreground">Nhiệm vụ hoàn thành</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cần chú ý</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats?.needsAttention || 0}</div>
            <p className="text-xs text-muted-foreground">Nhân viên cần hỗ trợ</p>
          </CardContent>
        </Card>
      </div>

      {/* Team Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách thành viên</CardTitle>
          <CardDescription>Theo dõi tiến độ của từng nhân viên</CardDescription>
        </CardHeader>
        <CardContent>
          {!teamMembers || teamMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>Chưa có thành viên nào trong team</p>
            </div>
          ) : (
            <div className="space-y-4">
              {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => { setSelectedEmployeeId(member.id); setSelectedEmployeeName(member.name || ""); }}
                  >
                    <Avatar>
                      <AvatarFallback>
                        {member.name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium truncate">{member.name || "Ẩn danh"}</p>
                        <Badge variant="secondary">
                          <Zap className="h-3 w-3 mr-1" />
                          {member.xp.toLocaleString()} XP
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={member.progressPercent} className="flex-1 h-2" />
                        <span className="text-xs text-muted-foreground w-10">
                          {member.progressPercent}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {member.title || "Nhân viên"} • {member.level || "Chưa có cấp bậc"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={(e) => { e.stopPropagation(); setPromotionTarget(member); }}
                        title="Đề xuất thăng chức/điều chuyển"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedEmployeeId && (
        <EmployeeProfileCard
          open={!!selectedEmployeeId}
          onOpenChange={(open) => { if (!open) setSelectedEmployeeId(null); }}
          employeeId={selectedEmployeeId}
          employeeName={selectedEmployeeName}
        />
      )}

      {promotionTarget && (
        <PromotionDialog
          open={!!promotionTarget}
          onOpenChange={(open) => { if (!open) setPromotionTarget(null); }}
          employeeId={promotionTarget.id}
          employeeName={promotionTarget.name || ""}
          currentTitle={promotionTarget.title}
        />
      )}
    </div>
  );
}
