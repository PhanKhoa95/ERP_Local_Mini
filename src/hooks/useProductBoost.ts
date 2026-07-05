import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { toast } from "sonner";

export interface CategoryMap {
  id: string;
  company_id?: string | null;
  pos_category: string;
  platform: "shopee" | "tiktok";
  platform_category: string;
  size_chart_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PushLog {
  id: string;
  company_id?: string | null;
  product_id: string | null;
  product_name: string;
  product_sku: string;
  platform: "shopee" | "tiktok";
  status: "success" | "failed";
  error_msg?: string | null;
  created_at: string;
  updated_at: string;
}

const LOCAL_MAPS_KEY = "erp-mini-local-demo-category-maps";
const LOCAL_LOGS_KEY = "erp-mini-local-demo-push-logs";

const DEFAULT_MAPS: CategoryMap[] = [
  {
    id: "map-1",
    pos_category: "Sticker / Decal",
    platform: "shopee",
    platform_category: "Nhà cửa & Đời sống > Văn phòng phẩm > Sticker & Nhãn dán",
    size_chart_id: "size-101"
  },
  {
    id: "map-2",
    pos_category: "Thiết kế & In ấn",
    platform: "tiktok",
    platform_category: "Sách & Văn phòng phẩm > Quà tặng & Đồ thủ công",
    size_chart_id: "size-202"
  }
];

const DEFAULT_LOGS: PushLog[] = [
  {
    id: "log-1",
    product_id: "p1",
    product_name: "Sticker logo decal giấy",
    product_sku: "PRD-STICKER",
    platform: "shopee",
    status: "success",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: "log-2",
    product_id: "p2",
    product_name: "Card cảm ơn / Thank you card",
    product_sku: "PRD-CARD",
    platform: "tiktok",
    status: "failed",
    error_msg: "Thiếu thuộc tính Thương hiệu (Brand) bắt buộc của ngành hàng",
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString()
  }
];

export function getLocalMaps(): CategoryMap[] {
  const raw = localStorage.getItem(LOCAL_MAPS_KEY);
  if (!raw) {
    localStorage.setItem(LOCAL_MAPS_KEY, JSON.stringify(DEFAULT_MAPS));
    return DEFAULT_MAPS;
  }
  return JSON.parse(raw);
}

export function getLocalLogs(): PushLog[] {
  const raw = localStorage.getItem(LOCAL_LOGS_KEY);
  if (!raw) {
    localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(DEFAULT_LOGS));
    return DEFAULT_LOGS;
  }
  return JSON.parse(raw);
}

export function saveLocalMaps(maps: CategoryMap[]) {
  localStorage.setItem(LOCAL_MAPS_KEY, JSON.stringify(maps));
}

export function saveLocalLogs(logs: PushLog[]) {
  localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(logs));
}

export function useProductBoost() {
  const queryClient = useQueryClient();
  const { companyId } = useCompanyContext();

  const { data: categoryMaps = [], isLoading: isMapsLoading } = useQuery({
    queryKey: ["platform-category-mappings", companyId],
    queryFn: async (): Promise<CategoryMap[]> => {
      if (isLocalDemoAuthEnabled()) {
        return getLocalMaps();
      }
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("platform_category_mappings")
        .select("*")
        .eq("company_id", companyId);

      if (error) throw error;
      return data as CategoryMap[];
    }
  });

  const { data: pushLogs = [], isLoading: isLogsLoading } = useQuery({
    queryKey: ["platform-push-logs", companyId],
    queryFn: async (): Promise<PushLog[]> => {
      if (isLocalDemoAuthEnabled()) {
        return getLocalLogs();
      }
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("platform_push_logs")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PushLog[];
    }
  });

  const executePush = useMutation({
    mutationFn: async (payload: { logs: Omit<PushLog, "id" | "created_at" | "updated_at">[] }) => {
      if (isLocalDemoAuthEnabled()) {
        const local = getLocalLogs();
        const formatted: PushLog[] = payload.logs.map(log => ({
          ...log,
          id: `log-${Date.now()}-${log.product_id || Math.random()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        const combined = [...formatted, ...local];
        saveLocalLogs(combined);
        return formatted;
      }

      if (!companyId) throw new Error("Chưa chọn doanh nghiệp");

      const insertData = payload.logs.map(log => ({
        ...log,
        company_id: companyId,
      }));

      const { data, error } = await supabase
        .from("platform_push_logs")
        .insert(insertData)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-push-logs", companyId] });
    }
  });

  const executeRetry = useMutation({
    mutationFn: async (logId: string) => {
      if (isLocalDemoAuthEnabled()) {
        const local = getLocalLogs();
        const updated = local.map(l => {
          if (l.id === logId) {
            return {
              ...l,
              status: "success" as const,
              error_msg: null,
              updated_at: new Date().toISOString()
            };
          }
          return l;
        });
        saveLocalLogs(updated);
        return logId;
      }

      const { data, error } = await supabase
        .from("platform_push_logs")
        .update({
          status: "success",
          error_msg: null,
          updated_at: new Date().toISOString()
        })
        .eq("id", logId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-push-logs", companyId] });
      toast.success("Đẩy lại sản phẩm thành công!");
    }
  });

  const addCategoryMap = useMutation({
    mutationFn: async (payload: { posCategory: string; platform: "shopee" | "tiktok"; platformCategory: string; sizeChartId?: string }) => {
      if (isLocalDemoAuthEnabled()) {
        const local = getLocalMaps();
        const exists = local.findIndex(m => m.pos_category === payload.posCategory && m.platform === payload.platform);
        if (exists >= 0) {
          local[exists].platform_category = payload.platformCategory;
          if (payload.sizeChartId) local[exists].size_chart_id = payload.sizeChartId;
          local[exists].updated_at = new Date().toISOString();
        } else {
          local.push({
            id: `map-${Date.now()}`,
            pos_category: payload.posCategory,
            platform: payload.platform,
            platform_category: payload.platformCategory,
            size_chart_id: payload.sizeChartId || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
        saveLocalMaps(local);
        return payload;
      }

      if (!companyId) throw new Error("Chưa chọn doanh nghiệp");

      // Check if existing map
      const { data: existing } = await supabase
        .from("platform_category_mappings")
        .select("id")
        .eq("company_id", companyId)
        .eq("pos_category", payload.posCategory)
        .eq("platform", payload.platform)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("platform_category_mappings")
          .update({
            platform_category: payload.platformCategory,
            size_chart_id: payload.sizeChartId || null,
            updated_at: new Date().toISOString()
          })
          .eq("id", existing.id)
          .select();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("platform_category_mappings")
          .insert({
            company_id: companyId,
            pos_category: payload.posCategory,
            platform: payload.platform,
            platform_category: payload.platformCategory,
            size_chart_id: payload.sizeChartId || null
          })
          .select();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-category-mappings", companyId] });
      toast.success("Cập nhật cấu hình đồng bộ ngành hàng thành công!");
    }
  });

  return {
    categoryMaps,
    pushLogs,
    isMapsLoading,
    isLogsLoading,
    executePush,
    executeRetry,
    addCategoryMap
  };
}
