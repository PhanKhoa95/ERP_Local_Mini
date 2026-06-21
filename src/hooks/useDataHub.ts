import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/hooks/useCompanyContext";
import { useToast } from "@/hooks/use-toast";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { isLocalDemoAuthEnabled } from "@/lib/localDemoAuth";

export type DataSource = Tables<"data_sources"> & {
  sales_channels?: Pick<Tables<"sales_channels">, "id" | "name" | "code" | "platform_type"> | null;
};

export type RawEvent = Tables<"raw_events"> & {
  data_sources?: Pick<Tables<"data_sources">, "id" | "name" | "code" | "source_type"> | null;
};

export type DataQualityIssue = Tables<"data_quality_issues">;

type DataSourceInsert = TablesInsert<"data_sources">;
type DataSourceUpdate = TablesUpdate<"data_sources">;
type RawEventUpdate = TablesUpdate<"raw_events">;
type RetryFailedEventsInput = {
  sourceType?: string;
  dataSourceId?: string;
};

const DATA_SOURCES_KEY = "erp-mini-local-demo-data-sources";
const RAW_EVENTS_KEY = "erp-mini-local-demo-raw-events";
const QUALITY_ISSUES_KEY = "erp-mini-local-demo-data-quality-issues";

function getLocalDataSources(companyId: string): DataSource[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(DATA_SOURCES_KEY);
  if (!raw) {
    const defaultSources: DataSource[] = [
      {
        id: "source-manual",
        company_id: companyId,
        code: "manual",
        name: "Đơn nhập tay",
        source_type: "manual",
        status: "active",
        channel_id: null,
        config: { module: "orders" },
        mapping: { entity: "order" },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_ingested_at: new Date().toISOString(),
        last_error: null,
        created_by: null,
      },
      {
        id: "source-pos",
        company_id: companyId,
        code: "pos",
        name: "POS bán hàng",
        source_type: "pos",
        status: "active",
        channel_id: null,
        config: { module: "pos" },
        mapping: { entity: "order" },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_ingested_at: new Date().toISOString(),
        last_error: null,
        created_by: null,
      },
      {
        id: "source-public",
        company_id: companyId,
        code: "public_store",
        name: "Cửa hàng public",
        source_type: "public_store",
        status: "active",
        channel_id: null,
        config: { route: "/order" },
        mapping: { entity: "order" },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_ingested_at: new Date().toISOString(),
        last_error: null,
        created_by: null,
      },
      {
        id: "source-shopee",
        company_id: companyId,
        code: "channel_shopee",
        name: "Shopee",
        source_type: "marketplace",
        status: "active",
        channel_id: "channel-shopee",
        config: { platform_type: "shopee", channel_code: "SHOPEE" },
        mapping: { entity: "order", external_id: "platform_order_id" },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_ingested_at: new Date().toISOString(),
        last_error: null,
        created_by: null,
      }
    ];
    localStorage.setItem(DATA_SOURCES_KEY, JSON.stringify(defaultSources));
    return defaultSources;
  }
  return JSON.parse(raw);
}

function saveLocalDataSources(sources: DataSource[]) {
  localStorage.setItem(DATA_SOURCES_KEY, JSON.stringify(sources));
}

function getLocalRawEvents(companyId: string): RawEvent[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(RAW_EVENTS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveLocalRawEvents(events: RawEvent[]) {
  localStorage.setItem(RAW_EVENTS_KEY, JSON.stringify(events));
}

function getLocalQualityIssues(companyId: string): DataQualityIssue[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(QUALITY_ISSUES_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveLocalQualityIssues(issues: DataQualityIssue[]) {
  localStorage.setItem(QUALITY_ISSUES_KEY, JSON.stringify(issues));
}

export function useDataHub() {
  const { companyId, role } = useCompanyContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const dataSourcesQuery = useQuery({
    queryKey: ["data-hub", "sources", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      if (isLocalDemoAuthEnabled()) {
        return getLocalDataSources(companyId);
      }
      const { data, error } = await supabase
        .from("data_sources")
        .select("*, sales_channels(id, name, code, platform_type)")
        .eq("company_id", companyId)
        .order("source_type")
        .order("name");
      if (error) throw error;
      return data as DataSource[];
    },
    enabled: !!companyId,
  });

  const rawEventsQuery = useQuery({
    queryKey: ["data-hub", "raw-events", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      if (isLocalDemoAuthEnabled()) {
        const events = getLocalRawEvents(companyId);
        const sources = getLocalDataSources(companyId);
        return events.map(event => ({
          ...event,
          data_sources: sources.find(s => s.id === event.data_source_id) || null
        }));
      }
      const { data, error } = await supabase
        .from("raw_events")
        .select("*, data_sources(id, name, code, source_type)")
        .eq("company_id", companyId)
        .order("received_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as RawEvent[];
    },
    enabled: !!companyId,
  });

  const qualityIssuesQuery = useQuery({
    queryKey: ["data-hub", "quality-issues", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      if (isLocalDemoAuthEnabled()) {
        return getLocalQualityIssues(companyId);
      }
      const { data, error } = await supabase
        .from("data_quality_issues")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as DataQualityIssue[];
    },
    enabled: !!companyId,
  });

  const upsertDataSources = useMutation({
    mutationFn: async (sources: Omit<DataSourceInsert, "company_id">[]) => {
      if (!companyId) throw new Error("Missing company context");
      
      if (isLocalDemoAuthEnabled()) {
        const local = getLocalDataSources(companyId);
        const updated = [...local];
        sources.forEach(source => {
          const idx = updated.findIndex(s => s.code === source.code);
          if (idx >= 0) {
            updated[idx] = { ...updated[idx], ...source } as DataSource;
          } else {
            updated.push({
              ...source,
              id: `source-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
              company_id: companyId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              last_ingested_at: null,
              last_error: null,
              created_by: null,
            } as DataSource);
          }
        });
        saveLocalDataSources(updated);
        return updated;
      }

      const rows = sources.map((source) => ({ ...source, company_id: companyId }));
      const { data, error } = await supabase
        .from("data_sources")
        .upsert(rows, { onConflict: "company_id,code" })
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data-hub"] });
      toast({ title: "Đã cập nhật nguồn dữ liệu" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi Data Hub", description: error.message });
    },
  });

  const updateDataSource = useMutation({
    mutationFn: async ({ id, ...updates }: DataSourceUpdate & { id: string }) => {
      if (isLocalDemoAuthEnabled()) {
        const local = getLocalDataSources(companyId || "");
        const idx = local.findIndex(s => s.id === id);
        if (idx >= 0) {
          local[idx] = { ...local[idx], ...updates, updated_at: new Date().toISOString() } as DataSource;
          saveLocalDataSources(local);
          return local[idx];
        }
        throw new Error("Không tìm thấy nguồn dữ liệu local");
      }

      const { data, error } = await supabase
        .from("data_sources")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data-hub"] });
      toast({ title: "Đã cập nhật trạng thái nguồn" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi Data Hub", description: error.message });
    },
  });

  const resolveQualityIssue = useMutation({
    mutationFn: async (id: string) => {
      if (isLocalDemoAuthEnabled()) {
        const local = getLocalQualityIssues(companyId || "");
        const idx = local.findIndex(i => i.id === id);
        if (idx >= 0) {
          local[idx].status = "resolved";
          local[idx].resolved_at = new Date().toISOString();
          saveLocalQualityIssues(local);
          return;
        }
        throw new Error("Không tìm thấy vấn đề dữ liệu local");
      }

      const { error } = await supabase
        .from("data_quality_issues")
        .update({ status: "resolved", resolved_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data-hub"] });
      toast({ title: "Đã đóng vấn đề dữ liệu" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Lỗi Data Hub", description: error.message });
    },
  });

  const retryRawEvent = useMutation({
    mutationFn: async (event: Pick<RawEvent, "id" | "data_source_id">) => {
      if (isLocalDemoAuthEnabled()) {
        const events = getLocalRawEvents(companyId || "");
        const idx = events.findIndex(e => e.id === event.id);
        if (idx >= 0) {
          events[idx].ingestion_status = "received";
          events[idx].validation_status = "queued";
          events[idx].error_message = null;
          events[idx].processed_at = null;
          events[idx].updated_at = new Date().toISOString();
          saveLocalRawEvents(events);
        }
        if (event.data_source_id) {
          const sources = getLocalDataSources(companyId || "");
          const sIdx = sources.findIndex(s => s.id === event.data_source_id);
          if (sIdx >= 0) {
            sources[sIdx].status = "active";
            sources[sIdx].last_error = null;
            sources[sIdx].updated_at = new Date().toISOString();
            saveLocalDataSources(sources);
          }
        }
        return;
      }

      const updates: RawEventUpdate = {
        ingestion_status: "received",
        validation_status: "queued",
        error_message: null,
        processed_at: null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("raw_events")
        .update(updates)
        .eq("id", event.id);
      if (error) throw error;

      if (event.data_source_id) {
        const { error: sourceError } = await supabase
          .from("data_sources")
          .update({
            status: "active",
            last_error: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", event.data_source_id);
        if (sourceError) throw sourceError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data-hub"] });
      toast({ title: "Đã đưa event vào hàng đợi xử lý lại" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Không thể retry event", description: error.message });
    },
  });

  const retryFailedEvents = useMutation({
    mutationFn: async (filter?: RetryFailedEventsInput) => {
      if (!companyId) throw new Error("Missing company context");

      if (isLocalDemoAuthEnabled()) {
        const events = getLocalRawEvents(companyId);
        let count = 0;
        events.forEach(event => {
          if (event.ingestion_status === "failed") {
            let matches = true;
            if (filter?.dataSourceId && event.data_source_id !== filter.dataSourceId) matches = false;
            if (filter?.sourceType && event.source_type !== filter.sourceType) matches = false;
            
            if (matches) {
              event.ingestion_status = "received";
              event.validation_status = "queued";
              event.error_message = null;
              event.processed_at = null;
              event.updated_at = new Date().toISOString();
              count++;
            }
          }
        });
        saveLocalRawEvents(events);

        // Update status of data sources
        const sources = getLocalDataSources(companyId);
        sources.forEach(source => {
          let matches = false;
          if (filter?.dataSourceId && source.id === filter.dataSourceId) matches = true;
          else if (filter?.sourceType && source.source_type === filter.sourceType) matches = true;
          else if (!filter?.dataSourceId && !filter?.sourceType && (source.status === "error" || source.status === "paused")) matches = true;

          if (matches) {
            source.status = "active";
            source.last_error = null;
            source.updated_at = new Date().toISOString();
          }
        });
        saveLocalDataSources(sources);
        return count;
      }

      const updates: RawEventUpdate = {
        ingestion_status: "received",
        validation_status: "queued",
        error_message: null,
        processed_at: null,
        updated_at: new Date().toISOString(),
      };

      let query = supabase
        .from("raw_events")
        .update(updates)
        .eq("company_id", companyId)
        .eq("ingestion_status", "failed");

      if (filter?.dataSourceId) {
        query = query.eq("data_source_id", filter.dataSourceId);
      } else if (filter?.sourceType) {
        query = query.eq("source_type", filter.sourceType);
      }

      const { data, error } = await query.select("id");
      if (error) throw error;

      if (filter?.dataSourceId) {
        const { error: sourceError } = await supabase
          .from("data_sources")
          .update({
            status: "active",
            last_error: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", filter.dataSourceId);
        if (sourceError) throw sourceError;
      } else if (filter?.sourceType) {
        const { error: sourceError } = await supabase
          .from("data_sources")
          .update({
            status: "active",
            last_error: null,
            updated_at: new Date().toISOString(),
          })
          .eq("company_id", companyId)
          .eq("source_type", filter.sourceType)
          .in("status", ["error", "paused"]);
        if (sourceError) throw sourceError;
      }

      return data?.length || 0;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["data-hub"] });
      toast({
        title: count > 0 ? `Đã retry ${count} event lỗi` : "Không có event lỗi cần retry",
      });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Không thể retry hàng loạt", description: error.message });
    },
  });

  return {
    companyId,
    role,
    dataSources: dataSourcesQuery.data || [],
    rawEvents: rawEventsQuery.data || [],
    qualityIssues: qualityIssuesQuery.data || [],
    isLoading: dataSourcesQuery.isLoading || rawEventsQuery.isLoading || qualityIssuesQuery.isLoading,
    error: dataSourcesQuery.error || rawEventsQuery.error || qualityIssuesQuery.error,
    upsertDataSources,
    updateDataSource,
    resolveQualityIssue,
    retryRawEvent,
    retryFailedEvents,
  };
}
