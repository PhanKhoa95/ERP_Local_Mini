import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useOnboardingChecklist } from "@/hooks/useOnboardingChecklist";
import { CheckCircle2, ClipboardList, Loader2, PartyPopper } from "lucide-react";

export function OnboardingChecklistCard() {
  const { checklist, isLoading, createChecklist, toggleItem } = useOnboardingChecklist();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Hide when completed
  if (checklist?.is_completed) return null;

  if (!checklist) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Checklist Onboarding
          </CardTitle>
          <CardDescription>Bắt đầu hành trình tại công ty</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => createChecklist.mutate(undefined)} disabled={createChecklist.isPending}>
            {createChecklist.isPending ? "Đang tạo..." : "Bắt đầu Onboarding"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const items = checklist.items as any as Array<{ id: string; label: string; completed: boolean }>;
  const progressPercent = checklist.total_count > 0 ? Math.round((checklist.completed_count / checklist.total_count) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {checklist.is_completed ? <PartyPopper className="h-5 w-5 text-yellow-500" /> : <ClipboardList className="h-5 w-5" />}
              Checklist Onboarding
            </CardTitle>
            <CardDescription>
              {checklist.is_completed ? "Hoàn thành! Chào mừng bạn! 🎉" : `${checklist.completed_count}/${checklist.total_count} hoàn thành`}
            </CardDescription>
          </div>
        </div>
        <Progress value={progressPercent} className="mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <Checkbox
                checked={item.completed}
                onCheckedChange={() => toggleItem.mutate(item.id)}
                disabled={toggleItem.isPending}
              />
              <span className={`text-sm ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                {item.label}
              </span>
              {item.completed && <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
