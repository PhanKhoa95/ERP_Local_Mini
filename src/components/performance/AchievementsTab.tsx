import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Lock, Star, Sparkles, Trophy, Target, Zap } from "lucide-react";
import { useAchievements } from "@/hooks/useAchievements";
import { EmptyAchievementsState } from "./empty-states/EmptyAchievementsState";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const rarityConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  common: { label: "Thường", color: "text-muted-foreground", bgColor: "bg-muted" },
  rare: { label: "Hiếm", color: "text-info", bgColor: "bg-info/10" },
  epic: { label: "Sử thi", color: "text-primary", bgColor: "bg-primary/10" },
  legendary: { label: "Huyền thoại", color: "text-warning", bgColor: "bg-warning/10" },
};

const iconMap: Record<string, React.ElementType> = {
  trophy: Trophy,
  star: Star,
  target: Target,
  zap: Zap,
  award: Award,
};

export function AchievementsTab() {
  const { achievements, userAchievements, isLoading } = useAchievements();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <div className="h-16 w-16 bg-muted rounded-full" />
                <div className="h-4 bg-muted rounded w-3/4 mt-4" />
                <div className="h-3 bg-muted rounded w-1/2 mt-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!achievements || achievements.length === 0) {
    return <EmptyAchievementsState />;
  }

  const earnedIds = new Set(userAchievements?.map((ua) => ua.achievement_id) || []);
  const earnedCount = earnedIds.size;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Thành tích</h2>
          <p className="text-muted-foreground">
            Sưu tầm huy hiệu bằng cách hoàn thành các mục tiêu
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          <Award className="h-4 w-4 mr-2" />
          {earnedCount}/{achievements.length} đã đạt
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {achievements.map((achievement) => {
          const isEarned = earnedIds.has(achievement.id);
          const userAch = userAchievements?.find(
            (ua) => ua.achievement_id === achievement.id
          );
          const rarity = rarityConfig[achievement.rarity || "common"];
          const IconComponent = iconMap[achievement.icon || "award"] || Award;

          return (
            <Card
              key={achievement.id}
              className={`transition-all ${
                isEarned
                  ? "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/30"
                  : "opacity-60 hover:opacity-80"
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div
                    className={`relative p-4 rounded-full ${
                      isEarned ? rarity.bgColor : "bg-muted"
                    }`}
                  >
                    <IconComponent
                      className={`h-10 w-10 ${
                        isEarned ? rarity.color : "text-muted-foreground"
                      }`}
                    />
                    {!isEarned && (
                      <Lock className="absolute -bottom-1 -right-1 h-5 w-5 text-muted-foreground bg-background rounded-full p-0.5" />
                    )}
                  </div>

                  <h3 className="font-semibold mt-4">{achievement.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {achievement.description}
                  </p>

                  <div className="flex items-center gap-2 mt-3">
                    <Badge
                      variant="outline"
                      className={isEarned ? rarity.color : ""}
                    >
                      {rarity.label}
                    </Badge>
                    {achievement.xp_reward && (
                      <Badge variant="secondary">
                        <Zap className="h-3 w-3 mr-1" />
                        +{achievement.xp_reward} XP
                      </Badge>
                    )}
                  </div>

                  {isEarned && userAch?.earned_at && (
                    <p className="text-xs text-muted-foreground mt-3">
                      Đạt được:{" "}
                      {format(new Date(userAch.earned_at), "dd/MM/yyyy", {
                        locale: vi,
                      })}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
