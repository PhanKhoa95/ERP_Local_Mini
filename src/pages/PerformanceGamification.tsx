import { MainLayout } from "@/components/layout/MainLayout";
import { usePerformanceOnboarding } from "@/hooks/usePerformanceOnboarding";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GitBranch, Swords, Award, BarChart3, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { SkillTreeTab } from "@/components/performance/SkillTreeTab";
import { QuestLogTab } from "@/components/performance/QuestLogTab";
import { AchievementsTab } from "@/components/performance/AchievementsTab";
import { LeaderboardTab } from "@/components/performance/LeaderboardTab";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const PerformanceGamification = () => {
  const { onboarding, isLoading, error } = usePerformanceOnboarding();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground animate-pulse">Đang tải...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md animate-fade-in">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-destructive/10">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <CardTitle>Lỗi tải dữ liệu</CardTitle>
                  <CardDescription>Không thể tải dữ liệu gamification</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {error.message || "Đã xảy ra lỗi. Vui lòng thử lại."}
              </p>
              <Button onClick={() => window.location.reload()} className="w-full gap-2">
                <RefreshCw className="h-4 w-4" />
                Thử lại
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (!onboarding?.is_completed) {
    return <Navigate to="/performance/setup" replace />;
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold tracking-tight">Gamification</h1>
          <p className="text-muted-foreground mt-1">
            Phát triển kỹ năng, hoàn thành nhiệm vụ và mở khóa thành tích
          </p>
        </div>

        <Tabs defaultValue="skills" className="w-full animate-slide-up">
          <TabsList className="h-11 flex-wrap gap-1">
            <TabsTrigger value="skills" className="gap-2 px-4">
              <GitBranch className="h-4 w-4" />
              Kỹ năng
            </TabsTrigger>
            <TabsTrigger value="quests" className="gap-2 px-4">
              <Swords className="h-4 w-4" />
              Quests
            </TabsTrigger>
            <TabsTrigger value="achievements" className="gap-2 px-4">
              <Award className="h-4 w-4" />
              Thành tích
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-2 px-4">
              <BarChart3 className="h-4 w-4" />
              Xếp hạng
            </TabsTrigger>
          </TabsList>

          <TabsContent value="skills" className="mt-6">
            <SkillTreeTab />
          </TabsContent>
          <TabsContent value="quests" className="mt-6">
            <QuestLogTab />
          </TabsContent>
          <TabsContent value="achievements" className="mt-6">
            <AchievementsTab />
          </TabsContent>
          <TabsContent value="leaderboard" className="mt-6">
            <LeaderboardTab />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default PerformanceGamification;
