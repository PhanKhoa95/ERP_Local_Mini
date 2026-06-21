import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "./useCompanyContext";
import { toast } from "sonner";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";

export interface KpiSeason {
  id: string;
  company_id: string;
  name: string;
  type: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_locked: boolean;
  description: string | null;
  review_deadline: string | null;
  scoring_deadline: string | null;
  created_at: string;
  updated_at: string;
}

const KPI_SEASONS_KEY = "erp-mini-local-demo-kpi-seasons";

function getLocalKpiSeasons(companyId: string): KpiSeason[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KPI_SEASONS_KEY);
  if (!raw) {
    const defaultSeasons: KpiSeason[] = [
      {
        id: "kpi-season-1",
        company_id: companyId,
        name: "Kỳ KPI Quý 3 - 2026",
        type: "quarter",
        start_date: "2026-07-01",
        end_date: "2026-09-30",
        is_active: true,
        is_locked: false,
        description: "Kỳ đánh giá KPI toàn công ty Quý 3 năm 2026",
        review_deadline: "2026-10-05",
        scoring_deadline: "2026-10-10",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];
    localStorage.setItem(KPI_SEASONS_KEY, JSON.stringify(defaultSeasons));
    return defaultSeasons;
  }
  return JSON.parse(raw);
}

function saveLocalKpiSeasons(seasons: KpiSeason[]) {
  localStorage.setItem(KPI_SEASONS_KEY, JSON.stringify(seasons));
}

export function useKpiSeasons() {
  const { companyId } = useCompanyContext();
  const queryClient = useQueryClient();

  const { data: seasons, isLoading } = useQuery({
    queryKey: ["kpi-seasons", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      if (isLocalDemoAuthEnabled()) {
        return getLocalKpiSeasons(companyId);
      }
      const { data, error } = await supabase
        .from("kpi_seasons")
        .select("*")
        .eq("company_id", companyId)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data as KpiSeason[];
    },
    enabled: !!companyId,
  });

  const createSeason = useMutation({
    mutationFn: async (input: Partial<KpiSeason>) => {
      if (!companyId) throw new Error("No company");
      if (isLocalDemoAuthEnabled()) {
        const local = getLocalKpiSeasons(companyId);
        const newSeason: KpiSeason = {
          id: `kpi-season-${Date.now()}`,
          company_id: companyId,
          name: input.name!,
          type: input.type || "quarter",
          start_date: input.start_date!,
          end_date: input.end_date!,
          is_active: input.is_active ?? true,
          is_locked: false,
          description: input.description || null,
          review_deadline: input.review_deadline || null,
          scoring_deadline: input.scoring_deadline || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        local.push(newSeason);
        saveLocalKpiSeasons(local);
        return newSeason;
      }

      const { data, error } = await supabase
        .from("kpi_seasons")
        .insert({
          company_id: companyId,
          name: input.name!,
          type: input.type || "quarter",
          start_date: input.start_date!,
          end_date: input.end_date!,
          is_active: input.is_active ?? true,
          description: input.description,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kpi-seasons"] });
      toast.success("Đã tạo kỳ KPI");
    },
    onError: (e: any) => toast.error("Lỗi: " + e.message),
  });

  const updateSeason = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<KpiSeason> & { id: string }) => {
      if (isLocalDemoAuthEnabled()) {
        const local = getLocalKpiSeasons(companyId || "");
        const idx = local.findIndex(s => s.id === id);
        if (idx >= 0) {
          local[idx] = { ...local[idx], ...updates, updated_at: new Date().toISOString() } as KpiSeason;
          saveLocalKpiSeasons(local);
          return local[idx];
        }
        throw new Error("Không tìm thấy kỳ KPI");
      }

      const { data, error } = await supabase
        .from("kpi_seasons")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kpi-seasons"] });
      toast.success("Đã cập nhật kỳ KPI");
    },
    onError: (e: any) => toast.error("Lỗi: " + e.message),
  });

  const deleteSeason = useMutation({
    mutationFn: async (id: string) => {
      if (isLocalDemoAuthEnabled()) {
        const local = getLocalKpiSeasons(companyId || "");
        const updated = local.filter(s => s.id !== id);
        saveLocalKpiSeasons(updated);
        return;
      }

      const { error } = await supabase.from("kpi_seasons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kpi-seasons"] });
      toast.success("Đã xóa kỳ KPI");
    },
    onError: (e: any) => toast.error("Lỗi: " + e.message),
  });

  return { seasons, isLoading, createSeason, updateSeason, deleteSeason };
}
