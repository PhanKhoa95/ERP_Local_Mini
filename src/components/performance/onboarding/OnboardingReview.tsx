import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Building2, Users, Settings, GitBranch, Upload } from "lucide-react";
import { usePerformanceOnboarding } from "@/hooks/usePerformanceOnboarding";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";

const industryNames: Record<string, string> = {
  real_estate: "Bất động sản",
  retail: "Bán lẻ",
  tech: "Công nghệ",
  manufacturing: "Sản xuất",
  services: "Dịch vụ",
};

export function OnboardingReview() {
  const { companyId } = useCompanyContext();
  const { onboarding } = usePerformanceOnboarding();

  const { data: orgUnits } = useQuery({
    queryKey: ["perf-org-units-count", companyId],
    queryFn: async () => {
      if (!companyId) return 0;
      
      if (isLocalDemoAuthEnabled()) {
        const raw = localStorage.getItem("erp-mini-local-demo-perf-org-units");
        if (!raw) return 0;
        try {
          return JSON.parse(raw).length;
        } catch {
          return 0;
        }
      }
      
      const { count } = await supabase
        .from("perf_org_units")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId);
      return count || 0;
    },
    enabled: !!companyId,
  });

  const { data: careerPaths } = useQuery({
    queryKey: ["career-paths-count", companyId],
    queryFn: async () => {
      if (!companyId) return 0;
      
      if (isLocalDemoAuthEnabled()) {
        const raw = localStorage.getItem("erp-mini-local-demo-career-paths");
        if (!raw) return 0;
        try {
          return JSON.parse(raw).filter((p: any) => p.is_active !== false).length;
        } catch {
          return 0;
        }
      }
      
      const { count } = await supabase
        .from("career_paths")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("is_active", true);
      return count || 0;
    },
    enabled: !!companyId,
  });

  const kbifConfig = onboarding?.kbif_config as { K: number; B: number; I: number; F: number } | null;

  const reviewItems = [
    {
      icon: Building2,
      title: "Ngành nghề",
      value: onboarding?.selected_industry 
        ? industryNames[onboarding.selected_industry] || onboarding.selected_industry
        : "Chưa chọn",
      status: !!onboarding?.selected_industry,
    },
    {
      icon: Users,
      title: "Phòng ban",
      value: `${orgUnits || 0} phòng ban`,
      status: (orgUnits || 0) > 0,
    },
    {
      icon: Settings,
      title: "Trọng số K.B.I.F",
      value: kbifConfig 
        ? `K:${kbifConfig.K}% B:${kbifConfig.B}% I:${kbifConfig.I}% F:${kbifConfig.F}%`
        : "Chưa cấu hình",
      status: !!kbifConfig && Object.values(kbifConfig).reduce((a, b) => a + b, 0) === 100,
    },
    {
      icon: GitBranch,
      title: "Lộ trình sự nghiệp",
      value: `${careerPaths || 0} lộ trình`,
      status: (careerPaths || 0) > 0,
    },
    {
      icon: Upload,
      title: "Nhân viên",
      value: `${onboarding?.imported_employees || 0} đã thêm`,
      status: true, // Optional step
    },
  ];

  const allComplete = reviewItems.filter(i => !i.status).length <= 1; // Allow skipping employee import

  return (
    <div className="space-y-6">
      <div className="text-center p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-background rounded-lg">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-2">Sẵn sàng kích hoạt!</h3>
        <p className="text-muted-foreground">
          Xem lại cấu hình bên dưới và nhấn "Hoàn tất thiết lập" để bắt đầu sử dụng hệ thống.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {reviewItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <Card key={index} className={item.status ? "" : "border-orange-200"}>
              <CardContent className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    item.status ? "bg-green-100" : "bg-orange-100"
                  }`}>
                    <Icon className={`h-5 w-5 ${
                      item.status ? "text-green-600" : "text-orange-600"
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.value}</p>
                  </div>
                </div>
                {item.status ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Badge variant="outline" className="text-orange-600 border-orange-300">
                    Cần thiết lập
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!allComplete && (
        <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg text-orange-700 dark:text-orange-300">
          <p className="text-sm">
            ⚠️ Một số mục chưa được cấu hình. Bạn vẫn có thể hoàn tất và cấu hình sau trong phần Cài đặt.
          </p>
        </div>
      )}
    </div>
  );
}
