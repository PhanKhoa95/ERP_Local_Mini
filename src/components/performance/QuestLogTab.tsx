import { useQuests } from "@/hooks/useQuests";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Swords, Award, CheckCircle, ShieldAlert, Sparkles, Trophy } from "lucide-react";

export function QuestLogTab() {
  const { quests = [], questProgress = [], isLoading, completeQuest } = useQuests();

  const getProgress = (questId: string) => {
    const prog = questProgress.find((p: any) => p.quest_id === questId);
    return prog ? prog.is_completed : false;
  };

  const getQuestTypeBadge = (type: string) => {
    switch (type) {
      case "daily":
        return <Badge variant="secondary">Hàng ngày</Badge>;
      case "weekly":
        return <Badge variant="outline">Hàng tuần</Badge>;
      case "special":
        return <Badge className="bg-purple-500 hover:bg-purple-600">Đặc biệt</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Swords className="h-5 w-5 text-primary" />
          Nhiệm vụ & Thách thức ERP
        </h2>
        <p className="text-muted-foreground text-sm">
          Hoàn thành các hoạt động hệ thống hàng ngày/tuần để tích lũy điểm kinh nghiệm (XP)
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {isLoading ? (
          [1, 2].map(i => <Skeleton key={i} className="h-40 rounded-lg" />)
        ) : quests.length === 0 ? (
          <Card className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 border-dashed border-2">
            <Trophy className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>Không có nhiệm vụ nào khả dụng vào lúc này</p>
            <p className="text-xs">Hãy quay lại sau hoặc liên hệ Admin để gán nhiệm vụ mới</p>
          </Card>
        ) : (
          quests.map((quest: any) => {
            const isCompleted = getProgress(quest.id);
            return (
              <Card key={quest.id} className={`hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between ${
                isCompleted ? "border-emerald-500/30 bg-emerald-500/5" : ""
              }`}>
                <div>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      {getQuestTypeBadge(quest.quest_type)}
                      <Badge variant="secondary" className="gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <Award className="h-3 w-3" />
                        +{quest.xp_reward || 50} XP
                      </Badge>
                    </div>
                    <CardTitle className="text-base flex items-center gap-1.5">
                      {isCompleted && <CheckCircle className="h-4.5 w-4.5 text-emerald-500 shrink-0" />}
                      {quest.name}
                    </CardTitle>
                    <CardDescription className="text-xs line-clamp-2">{quest.description}</CardDescription>
                  </CardHeader>
                </div>
                
                <CardContent className="pt-2 flex justify-end gap-2 border-t mt-4 bg-muted/10 p-4">
                  {isCompleted ? (
                    <Button variant="ghost" size="sm" className="text-emerald-600 gap-1" disabled>
                      <CheckCircle className="h-4 w-4" /> Đã hoàn thành
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => completeQuest.mutate(quest.id)} 
                      disabled={completeQuest.isPending}
                      size="sm" 
                      className="gap-1.5"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Hoàn thành nhiệm vụ
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
