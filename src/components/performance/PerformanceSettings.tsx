import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, RefreshCw, Download, AlertTriangle, Loader2 } from "lucide-react";
import { usePerformanceOnboarding } from "@/hooks/usePerformanceOnboarding";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { exportToExcel } from "@/lib/exportExcel";
import { EvaluationModeConfig } from "./EvaluationModeConfig";

export function PerformanceSettings() {
  const { onboarding } = usePerformanceOnboarding();
  const { companyId } = useCompanyContext();
  const [recalculating, setRecalculating] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Get active season
  const { data: activeSeason } = useQuery({
    queryKey: ["active-kpi-season", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase
        .from("kpi_seasons")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .maybeSingle();
      return data;
    },
    enabled: !!companyId,
  });

  const handleRecalculate = async () => {
    if (!activeSeason || !companyId) {
      toast.error("Chưa có mùa đánh giá đang hoạt động");
      return;
    }

    setRecalculating(true);
    try {
      // Get all employees
      const { data: employees } = await supabase
        .from("perf_employees")
        .select("id")
        .eq("company_id", companyId)
        .eq("is_active", true);

      if (!employees?.length) {
        toast.warning("Không có nhân viên nào để tính điểm");
        return;
      }

      // Call calculate-kpi-score for each employee
      const results = await Promise.allSettled(
        employees.map(emp =>
          supabase.functions.invoke("calculate-kpi-score", {
            body: { employee_id: emp.id, season_id: activeSeason.id },
          })
        )
      );

      const succeeded = results.filter(r => r.status === "fulfilled").length;
      const failed = results.filter(r => r.status === "rejected").length;

      // Log audit
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("audit_logs").insert({
        user_id: user?.id,
        action: "recalculate_kpi",
        table_name: "season_results",
        new_data: { season_id: activeSeason.id, succeeded, failed },
      });

      toast.success(`Đã tính lại điểm cho ${succeeded} nhân viên${failed > 0 ? `, ${failed} thất bại` : ""}`);
    } catch (err) {
      toast.error("Lỗi khi tính lại điểm KPI");
    } finally {
      setRecalculating(false);
    }
  };

  const handleExport = async () => {
    if (!activeSeason || !companyId) {
      toast.error("Chưa có mùa đánh giá đang hoạt động");
      return;
    }

    setExporting(true);
    try {
      const { data: results } = await supabase
        .from("season_results")
        .select("*")
        .eq("season_id", activeSeason.id);

      if (!results?.length) {
        toast.warning("Chưa có kết quả đánh giá");
        setExporting(false);
        return;
      }

      // Get employee names
      const employeeIds = results.map(r => r.employee_id);
      const { data: employees } = await supabase
        .from("perf_employees")
        .select("id, user_id, title")
        .in("id", employeeIds);
      
      const userIds = employees?.map(e => e.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);
      const empMap = new Map(employees?.map(e => [e.id, { user_id: e.user_id, title: e.title }]) || []);

      const exportData = results.map(r => {
        const emp = empMap.get(r.employee_id);
        return {
          name: emp ? profileMap.get(emp.user_id) || "Ẩn danh" : "Ẩn danh",
          title: emp?.title || "",
          total_score: r.total_score,
          rank: r.rank_in_company,
          xp_earned: r.xp_earned,
        };
      });

      exportToExcel(exportData, [
        { key: "name", header: "Nhân viên", width: 25 },
        { key: "title", header: "Chức danh", width: 20 },
        { key: "total_score", header: "Điểm tổng", width: 12 },
        { key: "rank", header: "Xếp hạng", width: 10 },
        { key: "xp_earned", header: "XP kiếm được", width: 12 },
      ], `Hieu_suat_${activeSeason.name}`);

      toast.success("Đã xuất báo cáo hiệu suất");
    } catch {
      toast.error("Lỗi khi xuất báo cáo");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Cài đặt Hiệu suất</h2>
        <p className="text-muted-foreground">
          Quản lý cấu hình hệ thống đánh giá hiệu suất
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Cấu hình chung
            </CardTitle>
            <CardDescription>Thông tin cấu hình hệ thống hiệu suất</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Ngành nghề</span>
              <span className="font-medium">{onboarding?.selected_industry || "Chưa chọn"}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Trạng thái</span>
              <span className="font-medium text-success">
                {onboarding?.is_completed ? "Đã kích hoạt" : "Chưa hoàn tất"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Nhân viên đã import</span>
              <span className="font-medium">{onboarding?.imported_employees || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Mùa đánh giá hiện tại</span>
              <span className="font-medium">{activeSeason?.name || "Chưa có"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Công cụ
            </CardTitle>
            <CardDescription>Các công cụ quản lý hệ thống</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={handleRecalculate}
              disabled={recalculating || !activeSeason}
            >
              {recalculating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Tính lại điểm KPI
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={handleExport}
              disabled={exporting || !activeSeason}
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Xuất báo cáo hiệu suất
            </Button>
          </CardContent>
        </Card>

        {/* Evaluation Mode Config */}
        <EvaluationModeConfig />

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Vùng nguy hiểm
            </CardTitle>
            <CardDescription>Các thao tác không thể hoàn tác</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" disabled>
              Đặt lại toàn bộ dữ liệu hiệu suất
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Chức năng này đang bị vô hiệu hóa để đảm bảo an toàn dữ liệu.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
