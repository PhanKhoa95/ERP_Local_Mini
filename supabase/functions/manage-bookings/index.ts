import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { action, ...params } = await req.json();

    if (action === "check_conflict") {
      const { company_id, resource_name, start_time, end_time, exclude_id } = params;

      let query = supabase
        .from("bookings")
        .select("id, resource_name, start_time, end_time, customer_name")
        .eq("company_id", company_id)
        .eq("resource_name", resource_name)
        .not("status", "in", '("cancelled","no_show")')
        .lt("start_time", end_time)
        .gt("end_time", start_time);

      if (exclude_id) query = query.neq("id", exclude_id);

      const { data: conflicts, error } = await query;
      if (error) throw error;

      return new Response(JSON.stringify({ conflicts: conflicts || [], has_conflict: (conflicts?.length || 0) > 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "complete_booking") {
      const { booking_id } = params;

      const { data: booking, error: bErr } = await supabase
        .from("bookings")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", booking_id)
        .select()
        .single();

      if (bErr) throw bErr;

      const results: any = { booking };

      // Auto-create voucher if configured
      if (booking.voucher_on_complete && booking.voucher_discount > 0) {
        const voucherCode = `BK-${Date.now().toString(36).toUpperCase()}`;
        const { data: voucher } = await supabase.from("vouchers").insert({
          company_id: booking.company_id,
          code: voucherCode,
          name: `Voucher đặt lịch - ${booking.customer_name}`,
          discount_type: "percentage",
          discount_value: booking.voucher_discount,
          usage_limit: 1,
          is_active: true,
        }).select().single();
        results.voucher = voucher;
      }

      // Auto-issue tokens if configured
      if (booking.token_reward_on_complete > 0) {
        await fetch(`${supabaseUrl}/functions/v1/manage-tokens`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
          body: JSON.stringify({
            action: "issue",
            company_id: booking.company_id,
            amount: booking.token_reward_on_complete,
            reason: `Hoàn thành đặt lịch: ${booking.resource_name} - ${booking.customer_name}`,
          }),
        });
        results.token_issued = booking.token_reward_on_complete;
      }

      return new Response(JSON.stringify(results), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("manage-bookings error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
