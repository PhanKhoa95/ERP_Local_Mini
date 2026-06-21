import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GitBranch, Lock, CheckCircle2 } from "lucide-react";
import { useSkillTree } from "@/hooks/useSkillTree";
import { EmptySkillTreeState } from "./empty-states/EmptySkillTreeState";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export function SkillTreeTab() {
  const { categories, skillNodes, userProgress, isLoading } = useSkillTree();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return <EmptySkillTreeState />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cây Kỹ năng</h2>
          <p className="text-muted-foreground">
            Phát triển kỹ năng để mở khóa các cấp độ mới
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <GitBranch className="h-4 w-4 mr-2" />
          {userProgress?.length || 0} kỹ năng đã học
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const categorySkills = skillNodes?.filter(
            (s) => s.category_id === category.id
          ) || [];
          const unlockedCount = categorySkills.filter((s) =>
            userProgress?.some((p) => p.skill_node_id === s.id && p.current_level > 0)
          ).length;

          return (
            <Card key={category.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <span 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: category.color ? `${category.color}20` : undefined }}
                    >
                      <GitBranch className="h-5 w-5" style={{ color: category.color || undefined }} />
                    </span>
                    {category.name}
                  </CardTitle>
                  <Badge variant="secondary">
                    {unlockedCount}/{categorySkills.length}
                  </Badge>
                </div>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categorySkills.slice(0, 4).map((skill) => {
                    const progress = userProgress?.find(
                      (p) => p.skill_node_id === skill.id
                    );
                    const isUnlocked = progress && progress.current_level > 0;
                    const progressPercent = progress
                      ? (progress.current_level / skill.max_level) * 100
                      : 0;

                    return (
                      <div
                        key={skill.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                      >
                        {isUnlocked ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        ) : (
                          <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{skill.name}</p>
                          <Progress value={progressPercent} className="h-1.5 mt-1" />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {progress?.current_level || 0}/{skill.max_level}
                        </span>
                      </div>
                    );
                  })}
                  {categorySkills.length > 4 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{categorySkills.length - 4} kỹ năng khác
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
