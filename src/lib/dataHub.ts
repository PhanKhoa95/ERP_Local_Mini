import { supabase } from "@/integrations/supabase/client";
import type { Json, TablesInsert } from "@/integrations/supabase/types";

export type RawEventInsert = TablesInsert<"raw_events">;

export const sourceTypeLabels: Record<string, string> = {
  manual: "Nhập tay",
  pos: "POS",
  public_store: "Cửa hàng public",
  marketplace: "Sàn TMĐT",
  social: "Mạng xã hội",
  website: "Website",
  crm: "CRM",
  webhook: "Webhook",
  api: "API",
  file_import: "File import",
  other: "Khác",
};

export const ingestionStatusLabels: Record<string, string> = {
  received: "Đã nhận",
  processed: "Đã xử lý",
  failed: "Lỗi",
  ignored: "Bỏ qua",
};

export const validationStatusLabels: Record<string, string> = {
  queued: "Chờ chuẩn hóa",
  normalized: "Đã chuẩn hóa",
  linked: "Đã liên kết",
  rejected: "Từ chối",
  duplicate: "Trùng",
};

export function calculateOrderQualityScore(input: {
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_address?: string | null;
  payment_method?: string | null;
  total?: number | null;
  items_count?: number | null;
}) {
  const checks = [
    input.customer_name,
    input.customer_phone,
    input.customer_address,
    input.payment_method,
    input.total !== undefined && input.total !== null && input.total > 0,
    input.items_count !== undefined && input.items_count !== null && input.items_count > 0,
  ];
  const passed = checks.filter(Boolean).length;
  return Math.round((passed / checks.length) * 100);
}

export async function recordRawEvent(input: RawEventInsert, options: { silent?: boolean } = {}) {
  const { silent = true } = options;
  if (!input.company_id) return false;

  const { error } = await supabase.from("raw_events").insert(input);
  if (!error) return true;

  const ignorableCodes = new Set(["23505", "42P01", "42703", "PGRST205", "PGRST204"]);
  if (!silent && !ignorableCodes.has(error.code || "")) {
    throw error;
  }

  if (!ignorableCodes.has(error.code || "")) {
    console.warn("Data Hub raw event was not recorded", error.message);
  }
  return false;
}

export function asJson(value: unknown): Json {
  return value as Json;
}
