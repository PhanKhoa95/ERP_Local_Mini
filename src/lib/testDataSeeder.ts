import { isLocalDemoAuthEnabled } from "./localDemoAuth";
import { supabase } from "@/integrations/supabase/client";

const DATA_SOURCES_KEY = "erp-mini-local-demo-data-sources";
const RAW_EVENTS_KEY = "erp-mini-local-demo-raw-events";
const QUALITY_ISSUES_KEY = "erp-mini-local-demo-data-quality-issues";

export async function seedTestDataFlow(companyId: string): Promise<void> {
  if (isLocalDemoAuthEnabled()) {
    const dataSources = [
      {
        id: "ds-shopee",
        company_id: companyId,
        name: "Shopee Store API Integration",
        code: "SHOPEE_MAIN",
        source_type: "marketplace",
        connection_config: {},
        status: "active",
        last_ingested_at: new Date().toISOString(),
        last_error: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "ds-pos",
        company_id: companyId,
        name: "Hệ thống POS Cửa hàng",
        code: "POS_MAIN",
        source_type: "pos",
        connection_config: {},
        status: "active",
        last_ingested_at: new Date().toISOString(),
        last_error: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];

    const rawEvents = [
      {
        id: "ev-1",
        company_id: companyId,
        data_source_id: "ds-shopee",
        event_type: "order_created",
        source_type: "marketplace",
        source_code: "SHOPEE_MAIN",
        external_id: "SHP882937",
        payload: { customer: "Nguyễn Văn A", total: 450000 },
        validation_status: "success",
        validation_errors: null,
        ingestion_status: "success",
        quality_score: 98,
        received_at: new Date().toISOString(),
        processed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      {
        id: "ev-2",
        company_id: companyId,
        data_source_id: "ds-pos",
        event_type: "pos_payment",
        source_type: "pos",
        source_code: "POS_MAIN",
        external_id: "POS992813",
        payload: { cashier: "Lê Thị B", total: 1250000 },
        validation_status: "success",
        validation_errors: null,
        ingestion_status: "success",
        quality_score: 100,
        received_at: new Date().toISOString(),
        processed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }
    ];

    const qualityIssues = [
      {
        id: "qi-1",
        company_id: companyId,
        raw_event_id: "ev-1",
        data_source_id: "ds-shopee",
        issue_type: "missing_phone",
        column_name: "customer_phone",
        description: "Số điện thoại khách hàng bị trống, đã tự động chuẩn hóa.",
        severity: "low",
        status: "resolved",
        resolved_at: new Date().toISOString(),
        resolved_by: "system",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];

    localStorage.setItem(DATA_SOURCES_KEY, JSON.stringify(dataSources));
    localStorage.setItem(RAW_EVENTS_KEY, JSON.stringify(rawEvents));
    localStorage.setItem(QUALITY_ISSUES_KEY, JSON.stringify(qualityIssues));
  } else {
    // Supabase inserts
    const { data: source } = await supabase.from("data_sources").insert({
      company_id: companyId,
      name: "Shopee Live API",
      code: "SHOPEE_LIVE",
      source_type: "marketplace",
      status: "active"
    }).select().single();

    if (source) {
      await supabase.from("raw_events").insert({
        company_id: companyId,
        data_source_id: source.id,
        event_type: "order_created",
        source_type: "marketplace",
        source_code: "SHOPEE_LIVE",
        external_id: "SHP-SQL-1",
        payload: { customer: "Test User", total: 150000 } as never,
        validation_status: "success",
        ingestion_status: "success",
        quality_score: 95
      });
    }
  }
}

export async function seedComplexTestDataFlow(companyId: string): Promise<void> {
  // Simulating a more complex flow with duplicate checks and format errors
  if (isLocalDemoAuthEnabled()) {
    const dataSources = [
      {
        id: "ds-shopee",
        company_id: companyId,
        name: "Shopee Store API Integration",
        code: "SHOPEE_MAIN",
        source_type: "marketplace",
        connection_config: {},
        status: "active",
        last_ingested_at: new Date().toISOString(),
        last_error: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "ds-pos",
        company_id: companyId,
        name: "Hệ thống POS Cửa hàng",
        code: "POS_MAIN",
        source_type: "pos",
        connection_config: {},
        status: "active",
        last_ingested_at: new Date().toISOString(),
        last_error: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "ds-tiktok",
        company_id: companyId,
        name: "TikTok Shop Integration",
        code: "TIKTOK_MAIN",
        source_type: "social",
        connection_config: {},
        status: "error",
        last_ingested_at: new Date().toISOString(),
        last_error: "401 Unauthorized: Invalid API Token",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];

    const rawEvents = [
      {
        id: "ev-1",
        company_id: companyId,
        data_source_id: "ds-shopee",
        event_type: "order_created",
        source_type: "marketplace",
        source_code: "SHOPEE_MAIN",
        external_id: "SHP882937",
        payload: { customer: "Nguyễn Văn A", total: 450000 },
        validation_status: "success",
        validation_errors: null,
        ingestion_status: "success",
        quality_score: 98,
        received_at: new Date().toISOString(),
        processed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      {
        id: "ev-3",
        company_id: companyId,
        data_source_id: "ds-tiktok",
        event_type: "order_created",
        source_type: "social",
        source_code: "TIKTOK_MAIN",
        external_id: "TT991283",
        payload: { customer: "Trần Thị B", phone: "invalid-phone-format" },
        validation_status: "failed",
        validation_errors: { phone: "Số điện thoại không đúng định dạng" },
        ingestion_status: "failed",
        quality_score: 45,
        received_at: new Date().toISOString(),
        processed_at: null,
        created_at: new Date().toISOString(),
      }
    ];

    const qualityIssues = [
      {
        id: "qi-2",
        company_id: companyId,
        raw_event_id: "ev-3",
        data_source_id: "ds-tiktok",
        issue_type: "invalid_format",
        column_name: "customer_phone",
        description: "Số điện thoại không hợp lệ (invalid-phone-format). Cần chỉnh sửa thủ công.",
        severity: "high",
        status: "open",
        resolved_at: null,
        resolved_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];

    localStorage.setItem(DATA_SOURCES_KEY, JSON.stringify(dataSources));
    localStorage.setItem(RAW_EVENTS_KEY, JSON.stringify(rawEvents));
    localStorage.setItem(QUALITY_ISSUES_KEY, JSON.stringify(qualityIssues));
  } else {
    // Mock for Supabase
    await seedTestDataFlow(companyId);
  }
}

export async function seedGrowthTestDataFlow(companyId: string): Promise<void> {
  // Simulating 6 months of metrics growth
  if (isLocalDemoAuthEnabled()) {
    await seedComplexTestDataFlow(companyId);
    
    // Seed some orders and stats in local storage to boost graphics
    const ANALYTICS_ATTRIBUTION_KEY = "erp-mini-local-demo-channel-attribution";
    const ANALYTICS_CLV_KEY = "erp-mini-local-demo-customer-clv";
    const ANALYTICS_COHORTS_KEY = "erp-mini-local-demo-customer-cohorts";

    const attribution = [
      { channel_name: "Shopee Store", order_count: 120, total_revenue: 35000000, conversion_rate: 3.2 },
      { channel_name: "Lazada Store", order_count: 85, total_revenue: 28000000, conversion_rate: 2.8 },
      { channel_name: "TikTok Shop", order_count: 150, total_revenue: 42000000, conversion_rate: 4.5 },
      { channel_name: "Cửa hàng POS", order_count: 210, total_revenue: 85000000, conversion_rate: 15.0 },
    ];

    const clv = [
      { customer_name: "Nguyễn Văn An", order_count: 12, total_spent: 8500000, first_order_date: "2026-01-10", last_order_date: "2026-06-20" },
      { customer_name: "Trần Thị Bình", order_count: 8, total_spent: 6200000, first_order_date: "2026-02-15", last_order_date: "2026-06-18" },
      { customer_name: "Phan Hoàng Việt", order_count: 15, total_spent: 14500000, first_order_date: "2026-01-05", last_order_date: "2026-06-22" },
    ];

    const cohorts = [
      { cohort_month: "2026-01-01", cohort_index: 0, customer_count: 100, active_count: 100, retention_rate: 100, revenue: 15000000 },
      { cohort_month: "2026-01-01", cohort_index: 1, customer_count: 100, active_count: 45, retention_rate: 45, revenue: 8500000 },
      { cohort_month: "2026-01-01", cohort_index: 2, customer_count: 100, active_count: 38, retention_rate: 38, revenue: 6200000 },
      { cohort_month: "2026-02-01", cohort_index: 0, customer_count: 120, active_count: 120, retention_rate: 100, revenue: 18000000 },
      { cohort_month: "2026-02-01", cohort_index: 1, customer_count: 120, active_count: 52, retention_rate: 43.3, revenue: 9800000 },
    ];

    localStorage.setItem(ANALYTICS_ATTRIBUTION_KEY, JSON.stringify(attribution));
    localStorage.setItem(ANALYTICS_CLV_KEY, JSON.stringify(clv));
    localStorage.setItem(ANALYTICS_COHORTS_KEY, JSON.stringify(cohorts));
  } else {
    await seedTestDataFlow(companyId);
  }
}
