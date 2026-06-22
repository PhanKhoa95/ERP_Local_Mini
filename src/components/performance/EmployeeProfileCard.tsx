import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Zap, Trophy, Building2, GraduationCap, Briefcase, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName?: string;
}

export function EmployeeProfileCard({ open, onOpenChange, employeeId, employeeName }: Props) {
  const { data: profile, isLoading } = useQuery({
    queryKey: ["employee-profile", employeeId],
    queryFn: async () => {
      const { data: emp, error } = await supabase
        .from("perf_employees")
        .select("*, perf_org_units(name, icon), perf_positions(name)")
        .eq("id", employeeId)
        .single();
      if (error) throw error;

      // Get profile info
      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", emp.user_id)
        .single();

      // Get training enrollments
      const { data: trainings } = await supabase
        .from("training_enrollments")
        .select("*, training_programs(title, category)")
        .eq("employee_id", employeeId)
        .order("enrolled_at", { ascending: false })
        .limit(5);

      // Get career level
      let levelName = null;
      if (emp.current_level_id) {
        const { data: level } = await supabase
          .from("career_levels")
          .select("name, badge_icon, color")
          .eq("id", emp.current_level_id)
          .single();
        levelName = level;
      }

      return { ...emp, profile: prof, trainings: trainings || [], level: levelName };
    },
    enabled: open && !!employeeId,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Hồ sơ Nhân viên</DialogTitle></DialogHeader>
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-20 bg-muted rounded" />
            <div className="h-16 bg-muted rounded" />
          </div>
        ) : profile ? (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="text-lg">{(profile.profile?.full_name || employeeName || "?").charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{profile.profile?.full_name || employeeName || "Ẩn danh"}</h3>
                <p className="text-sm text-muted-foreground">{profile.title || (profile as any).perf_positions?.name || "Nhân viên"}</p>
                <div className="flex items-center gap-2 mt-1">
                  {(profile as any).perf_org_units?.name && (
                    <Badge variant="outline" className="gap-1 text-xs">
                      <Building2 className="h-3 w-3" />{(profile as any).perf_org_units.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* XP & Level */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="pt-4 pb-3 flex items-center gap-3">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <div>
                    <div className="font-bold">{profile.total_xp.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Tổng XP</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-bold">{profile.level?.name || "Chưa có"}</div>
                    <div className="text-xs text-muted-foreground">Cấp bậc</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Details */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Briefcase className="h-4 w-4" />
                <span>
                  Ngày vào: {profile.hire_date && !isNaN(new Date(profile.hire_date).getTime())
                    ? format(new Date(profile.hire_date), "dd/MM/yyyy")
                    : "—"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>Streak: {profile.current_streak} ngày (kỷ lục: {profile.longest_streak})</span>
              </div>
            </div>

            {/* Training History */}
            {profile.trainings.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Đào tạo gần đây</h4>
                  <div className="space-y-2">
                    {profile.trainings.map((t: any) => (
                      <div key={t.id} className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                        <span>{t.training_programs?.title}</span>
                        <Badge variant={t.status === "completed" ? "default" : "secondary"} className="text-xs">
                          {t.status === "completed" ? "Hoàn thành" : t.status === "in_progress" ? "Đang học" : "Ghi danh"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground">Không tìm thấy thông tin nhân viên</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
