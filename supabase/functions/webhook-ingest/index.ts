import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-company-id, x-source-code",
};

/**
 * Webhook Ingest – captures social inbox, marketplace and partner payloads
 * into `raw_events` for Data Hub processing.
 *
 * Query params:
 *   ?source=shopee|lazada|tiktok|zalo|messenger|api|other
 *   &company_id=<uuid>           (required)
 *   &source_code=<custom_code>   (optional, overrides source)
 *
 * Headers (alternative to query params):
 *   x-company-id: <uuid>
 *   x-source-code: <custom_code>
 *
 * Body: JSON payload from the external channel.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const url = new URL(req.url);
    const source =
      url.searchParams.get("source") ||
      req.headers.get("x-source-code") ||
      "webhook";
    const companyId =
      url.searchParams.get("company_id") ||
      req.headers.get("x-company-id") ||
      "";
    const sourceCode =
      url.searchParams.get("source_code") ||
      req.headers.get("x-source-code") ||
      source;

    if (!companyId) {
      return new Response(
        JSON.stringify({ error: "company_id is required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const rawPayload = await req.json();

    // Determine source_type from source param
    const sourceTypeMap: Record<string, string> = {
      shopee: "marketplace",
      lazada: "marketplace",
      tiktok: "marketplace",
      sendo: "marketplace",
      zalo: "social",
      messenger: "social",
      facebook: "social",
      instagram: "social",
      api: "api",
      webhook: "webhook",
      website: "website",
    };
    const sourceType = sourceTypeMap[source.toLowerCase()] || "webhook";

    // Try to extract event type and entity hints from payload
    const eventType = rawPayload.event_type || rawPayload.type || "webhook.received";
    const entityType = rawPayload.entity_type || "unknown";
    const externalId =
      rawPayload.order_id ||
      rawPayload.external_id ||
      rawPayload.id ||
      null;
    const customerPhone =
      rawPayload.customer_phone ||
      rawPayload.phone ||
      rawPayload.buyer_phone ||
      null;
    const customerName =
      rawPayload.customer_name ||
      rawPayload.name ||
      rawPayload.buyer_name ||
      null;

    // Build dedupe key
    const dedupeKey = `${companyId}:${sourceCode}:${eventType}:${externalId || Date.now()}`;

    // Calculate a basic quality score
    const qualityChecks = [
      !!externalId,
      !!customerPhone,
      !!customerName,
      !!rawPayload.total || !!rawPayload.amount,
      !!rawPayload.items || !!rawPayload.products,
      !!rawPayload.address || !!rawPayload.shipping_address,
    ];
    const qualityScore = Math.round(
      (qualityChecks.filter(Boolean).length / qualityChecks.length) * 100
    );

    // Normalize payload into a consistent snapshot
    const normalizedPayload = {
      external_id: externalId,
      customer_name: customerName,
      customer_phone: customerPhone,
      address:
        rawPayload.address ||
        rawPayload.shipping_address ||
        rawPayload.buyer_address ||
        null,
      total: rawPayload.total || rawPayload.amount || null,
      items_count: rawPayload.items?.length || rawPayload.products?.length || null,
      status: rawPayload.status || null,
      source_event_type: eventType,
    };

    const now = new Date().toISOString();

    const { error: insertError } = await supabaseClient
      .from("raw_events")
      .insert({
        company_id: companyId,
        source_type: sourceType,
        source_code: sourceCode,
        event_type: eventType,
        entity_type: entityType,
        entity_id: null,
        external_id: externalId,
        dedupe_key: dedupeKey,
        raw_payload: rawPayload,
        normalized_payload: normalizedPayload,
        quality_score: qualityScore,
        validation_status: "queued",
        ingestion_status: "received",
        received_at: now,
      });

    if (insertError) {
      // If duplicate (23505 = unique_violation), still return 200
      if (insertError.code === "23505") {
        return new Response(
          JSON.stringify({
            success: true,
            message: "Duplicate event ignored",
            dedupe_key: dedupeKey,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      // If table doesn't exist yet, log and return gracefully
      if (insertError.code === "42P01" || insertError.code === "PGRST204") {
        console.warn("raw_events table not ready:", insertError.message);
        return new Response(
          JSON.stringify({
            success: false,
            message: "Data Hub migration not applied yet",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 202,
          }
        );
      }

      throw insertError;
    }

    // Log data quality issues if important fields are missing
    const missingFields: string[] = [];
    if (!customerPhone) missingFields.push("customer_phone");
    if (!customerName) missingFields.push("customer_name");
    if (!externalId) missingFields.push("external_id");

    if (missingFields.length > 0) {
      try {
        await supabaseClient.from("data_quality_issues").insert({
          company_id: companyId,
          issue_type: "missing_field",
          severity: "medium",
          field_name: missingFields.join(", "),
          message: `Webhook ${sourceCode}/${eventType} thiếu: ${missingFields.join(", ")}`,
          status: "open",
        });
      } catch {
        // Best-effort, don't fail the webhook.
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Event ingested",
        dedupe_key: dedupeKey,
        quality_score: qualityScore,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Webhook ingest error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
