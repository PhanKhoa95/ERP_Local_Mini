import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, GitBranch, ArrowRight } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { toast } from "sonner";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";

interface CareerPath {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
}

export function CareerPathSetup() {
  const { companyId } = useCompanyContext();
  const queryClient = useQueryClient();
  const [newPathName, setNewPathName] = useState("");

  const { data: careerPaths, isLoading } = useQuery({
    queryKey: ["career-paths", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      if (isLocalDemoAuthEnabled()) {
        const raw = localStorage.getItem("erp-mini-local-demo-career-paths");
        if (!raw) return [];
        try {
          return JSON.parse(raw).filter((p: any) => p.is_active !== false) as CareerPath[];
        } catch {
          return [];
        }
      }
      
      const { data, error } = await supabase
        .from("career_paths")
        .select("id, name, description, color")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data as CareerPath[];
    },
    enabled: !!companyId,
  });

  const addPath = useMutation({
    mutationFn: async (name: string) => {
      if (!companyId) throw new Error("No company");
      
      const colors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444"];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      if (isLocalDemoAuthEnabled()) {
        const rawPaths = localStorage.getItem("erp-mini-local-demo-career-paths");
        const paths = rawPaths ? JSON.parse(rawPaths) : [];
        const newPathId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
        const newPath = {
          id: newPathId,
          company_id: companyId,
          name,
          color: randomColor,
          is_active: true,
        };
        paths.push(newPath);
        localStorage.setItem("erp-mini-local-demo-career-paths", JSON.stringify(paths));

        // Create default career levels for this path
        const levels = [
          { name: "Fresher", level_order: 1, min_xp: 0, badge_icon: "🌱", color: "#10B981" },
          { name: "Junior", level_order: 2, min_xp: 500, badge_icon: "⭐", color: "#3B82F6" },
          { name: "Senior", level_order: 3, min_xp: 2000, badge_icon: "🔥", color: "#F59E0B" },
          { name: "Lead", level_order: 4, min_xp: 5000, badge_icon: "👑", color: "#8B5CF6" },
          { name: "Expert", level_order: 5, min_xp: 10000, badge_icon: "💎", color: "#EC4899" },
        ];
        const rawLevels = localStorage.getItem("erp-mini-local-demo-career-levels");
        const existingLevels = rawLevels ? JSON.parse(rawLevels) : [];
        const newLevels = levels.map((l, index) => ({
          id: `level-${newPathId}-${index}`,
          path_id: newPathId,
          name: l.name,
          level_order: l.level_order,
          min_xp: l.min_xp,
          badge_icon: l.badge_icon,
          color: l.color,
          perks: {},
        }));
        localStorage.setItem("erp-mini-local-demo-career-levels", JSON.stringify([...existingLevels, ...newLevels]));
        return newPath;
      }
      
      // Create career path
      const { data: newPath, error } = await supabase
        .from("career_paths")
        .insert({
          company_id: companyId,
          name,
          color: randomColor,
          is_active: true,
        })
        .select()
        .single();
      
      if (error) throw error;

      // Create default career_levels for this path
      const levels = [
        { name: "Fresher", level_order: 1, min_xp: 0, badge_icon: "🌱", color: "#10B981" },
        { name: "Junior", level_order: 2, min_xp: 500, badge_icon: "⭐", color: "#3B82F6" },
        { name: "Senior", level_order: 3, min_xp: 2000, badge_icon: "🔥", color: "#F59E0B" },
        { name: "Lead", level_order: 4, min_xp: 5000, badge_icon: "👑", color: "#8B5CF6" },
        { name: "Expert", level_order: 5, min_xp: 10000, badge_icon: "💎", color: "#EC4899" },
      ];

      const { error: levelsError } = await supabase
        .from("career_levels")
        .insert(levels.map((level) => ({ ...level, path_id: newPath.id })));

      if (levelsError) {
        console.error("Error creating career levels:", levelsError);
      }

      return newPath;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["career-paths", companyId] });
      queryClient.invalidateQueries({ queryKey: ["career-paths-count", companyId] });
      setNewPathName("");
      toast.success("Đã thêm lộ trình với 5 cấp bậc mặc định");
    },
    onError: (error) => {
      toast.error("Lỗi: " + error.message);
    },
  });

  const deletePath = useMutation({
    mutationFn: async (id: string) => {
      if (isLocalDemoAuthEnabled()) {
        const rawPaths = localStorage.getItem("erp-mini-local-demo-career-paths");
        if (rawPaths) {
          const list = JSON.parse(rawPaths);
          const updated = list.map((p: any) => p.id === id ? { ...p, is_active: false } : p);
          localStorage.setItem("erp-mini-local-demo-career-paths", JSON.stringify(updated));
        }
        return;
      }
      
      const { error } = await supabase
        .from("career_paths")
        .update({ is_active: false })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["career-paths", companyId] });
      queryClient.invalidateQueries({ queryKey: ["career-paths-count", companyId] });
      toast.success("Đã xóa lộ trình");
    },
    onError: (error) => {
      toast.error("Lỗi: " + error.message);
    },
  });

  const handleAdd = () => {
    if (newPathName.trim()) {
      addPath.mutate(newPathName.trim());
    }
  };

  const suggestedPaths = [
    "Sales Path",
    "Tech Path", 
    "Management Path",
    "Operations Path",
    "Creative Path"
  ];

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Tạo các lộ trình thăng tiến (Career Paths) cho nhân viên. 
        Mỗi lộ trình có các cấp bậc và yêu cầu XP riêng.
      </p>

      {/* Quick add suggestions */}
      <div className="flex flex-wrap gap-2">
        {suggestedPaths
          .filter(p => !careerPaths?.some(cp => cp.name === p))
          .map((path) => (
            <Button
              key={path}
              variant="outline"
              size="sm"
              onClick={() => addPath.mutate(path)}
              disabled={addPath.isPending}
            >
              <Plus className="h-3 w-3 mr-1" />
              {path}
            </Button>
          ))}
      </div>

      {/* Add custom path */}
      <div className="flex gap-3">
        <div className="flex-1">
          <Label htmlFor="path-name" className="sr-only">Tên lộ trình</Label>
          <Input
            id="path-name"
            placeholder="Tên lộ trình tùy chỉnh..."
            value={newPathName}
            onChange={(e) => setNewPathName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
        </div>
        <Button onClick={handleAdd} disabled={!newPathName.trim() || addPath.isPending}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm
        </Button>
      </div>

      {/* List of paths */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : careerPaths && careerPaths.length > 0 ? (
          careerPaths.map((path) => (
            <Card key={path.id}>
              <CardContent className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${path.color}20` }}
                  >
                    <GitBranch 
                      className="h-4 w-4" 
                      style={{ color: path.color || undefined }}
                    />
                  </div>
                  <div>
                    <span className="font-medium">{path.name}</span>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      Junior <ArrowRight className="h-3 w-3" /> 
                      Senior <ArrowRight className="h-3 w-3" /> 
                      Lead <ArrowRight className="h-3 w-3" /> 
                      Manager
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deletePath.mutate(path.id)}
                  disabled={deletePath.isPending}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <GitBranch className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Chưa có lộ trình nào</p>
            <p className="text-sm">Thêm lộ trình hoặc chọn từ gợi ý ở trên</p>
          </div>
        )}
      </div>
    </div>
  );
}
