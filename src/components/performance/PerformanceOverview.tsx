import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAchievements } from "@/hooks/useAchievements";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useQuests } from "@/hooks/useQuests";
import { Trophy, Zap, Target, TrendingUp, Star, Award, Swords, ArrowRight, Flame, Sparkles } from "lucide-react";
import { EmptyPerformanceState } from "./empty-states/EmptyPerformanceState";
import { PersonalWorkHub } from "../tasks/PersonalWorkHub";
import { WelcomeGuide } from "../onboarding/WelcomeGuide";
import { Link } from "react-router-dom";
import type { PerformanceEmployee, CareerLevel } from "@/hooks/usePerformanceEmployee";

interface PerformanceOverviewProps {
  employee: PerformanceEmployee | null;
  currentLevel: CareerLevel | null;
  isEmployeeLoading: boolean;
}

export const PerformanceOverview = React.forwardRef<HTMLDivElement, PerformanceOverviewProps>(
  ({ employee, currentLevel, isEmployeeLoading }, ref) => {
  const { userAchievements, isLoading: achievementsLoading } = useAchievements();
  const { currentUserRank, isLoading: leaderboardLoading } = useLeaderboard();
  const { questProgress, isLoading: questsLoading } = useQuests();

  const isLoading = isEmployeeLoading || achievementsLoading || leaderboardLoading || questsLoading;

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!employee) {
    return <EmptyPerformanceState />;
  }

  const earnedAchievementsCount = userAchievements?.length || 0;
  const completedQuestsCount = questProgress?.filter(p => p.is_completed).length || 0;
  const xpToNextLevel = currentLevel ? (currentLevel.min_xp + 1000) - employee.total_xp : 1000;
  const xpProgress = currentLevel ? Math.max(0, Math.min(100, ((employee.total_xp - currentLevel.min_xp) / 1000) * 100)) : 0;

  return (
    <div ref={ref} className="space-y-6">
      {/* Welcome Guide for new employees */}
      <WelcomeGuide />

      {/* XP & Level Hero Card */}
      <Card className="relative overflow-hidden border-primary/20 animate-fade-in">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-primary/4 to-transparent" />
        <CardHeader className="relative pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="p-3.5 rounded-2xl bg-primary/15 ring-2 ring-primary/20">
                  <Trophy className="h-7 w-7 text-primary" />
                </div>
                {employee.current_streak > 0 && (
                  <div className="absolute -top-1 -right-1 p-1 rounded-full bg-background border-2 border-warning">
                    <Flame className="h-3 w-3 text-warning" />
                  </div>
                )}
              </div>
              <div>
                <CardTitle className="text-xl">
                  {currentLevel?.name || "Chưa có cấp bậc"}
                </CardTitle>
                <CardDescription className="mt-0.5">
                  {employee.title || "Nhân viên"}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-base px-4 py-1.5 font-semibold gap-1.5">
                <Zap className="h-4 w-4 text-warning" />
                {employee.total_xp.toLocaleString()} XP
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tiến độ lên cấp</span>
              <span className="font-medium tabular-nums">{Math.round(xpProgress)}%</span>
            </div>
            <Progress value={xpProgress} className="h-3" />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                Còn {Math.max(0, xpToNextLevel).toLocaleString()} XP để lên cấp
              </p>
              {employee.current_streak > 0 && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Flame className="h-3 w-3 text-warning" />
                  {employee.current_streak} ngày liên tiếp
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { 
            title: "Tổng XP", 
            value: employee.total_xp.toLocaleString(), 
            desc: "Điểm kinh nghiệm tích lũy",
            icon: Zap, 
            iconClass: "text-warning",
            bgClass: "bg-warning/10"
          },
          { 
            title: "Streak hiện tại", 
            value: employee.current_streak, 
            suffix: "ngày",
            desc: `Kỷ lục: ${employee.longest_streak} ngày`,
            icon: Flame, 
            iconClass: "text-destructive",
            bgClass: "bg-destructive/10"
          },
          { 
            title: "Thành tích", 
            value: earnedAchievementsCount, 
            desc: "Huy hiệu đã đạt được",
            icon: Award, 
            iconClass: "text-primary",
            bgClass: "bg-primary/10"
          },
          { 
            title: "Xếp hạng", 
            value: currentUserRank ? `#${currentUserRank}` : "—", 
            desc: "Trong công ty",
            icon: TrendingUp, 
            iconClass: "text-success",
            bgClass: "bg-success/10"
          },
        ].map((stat, index) => (
          <Card 
            key={stat.title} 
            className="hover:shadow-md transition-all duration-300 animate-slide-up group"
            style={{ animationDelay: `${index * 75}ms` }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgClass} transition-transform group-hover:scale-110`}>
                <stat.icon className={`h-4 w-4 ${stat.iconClass}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-baseline gap-1.5">
                {stat.value}
                {stat.suffix && (
                  <span className="text-sm font-normal text-muted-foreground">{stat.suffix}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{stat.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Personal Work Hub + Quick Links Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <PersonalWorkHub />
        <Card className="hover:shadow-md transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Swords className="h-4 w-4 text-primary" />
                Nhiệm vụ
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/performance/gamification" className="gap-1 text-muted-foreground hover:text-foreground">
                  Xem tất cả
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{completedQuestsCount}</p>
                <p className="text-sm text-muted-foreground">Nhiệm vụ hoàn thành</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-primary/10">
                <Target className="h-7 w-7 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="h-4 w-4 text-warning" />
                Thành tích gần đây
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/performance/gamification" className="gap-1 text-muted-foreground hover:text-foreground">
                  Xem tất cả
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {earnedAchievementsCount > 0 ? (
              <div className="flex items-center gap-3">
                <div className="p-3.5 rounded-2xl bg-warning/10">
                  <Award className="h-7 w-7 text-warning" />
                </div>
                <div>
                  <p className="font-semibold">Đã đạt {earnedAchievementsCount} huy hiệu</p>
                  <p className="text-sm text-muted-foreground">Tiếp tục phấn đấu!</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="p-3.5 rounded-2xl bg-muted">
                  <Sparkles className="h-7 w-7 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Chưa có huy hiệu</p>
                  <p className="text-sm text-muted-foreground">Hoàn thành nhiệm vụ để nhận!</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
  }
);

PerformanceOverview.displayName = "PerformanceOverview";
