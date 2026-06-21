import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PostingRule {
  debit_code: string;
  credit_code: string;
  asset_type: string;
  memo: string;
}

const EVENT_RULES: Record<string, PostingRule[]> = {
  order_delivered: [
    { debit_code: "131", credit_code: "511", asset_type: "cash", memo: "Doanh thu bán hàng" },
    { debit_code: "632", credit_code: "156", asset_type: "cash", memo: "Giá vốn hàng bán" },
  ],
  token_issued: [
    { debit_code: "641", credit_code: "157", asset_type: "token", memo: "Phát hành Token thưởng" },
  ],
  token_exchanged: [
    { debit_code: "157", credit_code: "521", asset_type: "token", memo: "Đổi Token lấy Voucher" },
  ],
  share_created: [
    { debit_code: "241", credit_code: "411", asset_type: "share", memo: "Phát hành cổ phần dự án" },
  ],
  kpi_completed: [
    { debit_code: "622", credit_code: "334", asset_type: "cash", memo: "Chi phí nhân công (KPI)" },
  ],
  payment_received: [
    { debit_code: "112", credit_code: "131", asset_type: "cash", memo: "Nhận thanh toán từ khách hàng" },
  ],
  bnpl_issued: [
    { debit_code: "131", credit_code: "511", asset_type: "bnpl", memo: "Bán hàng trả sau (BNPL)" },
  ],
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { event_type, company_id, source_id, amount, cogs_amount, description, vneid_signature } = await req.json();

    if (!event_type || !company_id || !amount) {
      return new Response(JSON.stringify({ error: "Missing required fields: event_type, company_id, amount" }), {
        status: 400, headers: corsHeaders,
      });
    }

    const rules = EVENT_RULES[event_type];
    if (!rules) {
      return new Response(JSON.stringify({ error: `Unknown event_type: ${event_type}` }), {
        status: 400, headers: corsHeaders,
      });
    }

    // Create journal entry
    const { data: entry, error: entryErr } = await supabase.from("journal_entries").insert({
      company_id,
      entry_date: new Date().toISOString().split("T")[0],
      description: description || rules[0].memo,
      source_type: event_type.split("_")[0],
      source_id: source_id || null,
      status: vneid_signature ? "posted" : "draft",
      vneid_signature: vneid_signature || null,
      created_by: user.id,
      posted_by: vneid_signature ? user.id : null,
    }).select("id").single();

    if (entryErr || !entry) {
      throw new Error(`Failed to create journal entry: ${entryErr?.message}`);
    }

    // Get account IDs for this company
    const allCodes = [...new Set(rules.flatMap(r => [r.debit_code, r.credit_code]))];
    const { data: accounts } = await supabase
      .from("chart_of_accounts")
      .select("id, code")
      .eq("company_id", company_id)
      .in("code", allCodes);

    if (!accounts || accounts.length === 0) {
      throw new Error("Chart of accounts not initialized for this company");
    }

    const accountMap = Object.fromEntries(accounts.map(a => [a.code, a.id]));

    // Create journal lines
    const lines = [];
    for (const rule of rules) {
      const debitAccountId = accountMap[rule.debit_code];
      const creditAccountId = accountMap[rule.credit_code];
      if (!debitAccountId || !creditAccountId) continue;

      // Use cogs_amount for cost of goods entries
      const lineAmount = (rule.debit_code === "632" && cogs_amount) ? cogs_amount : amount;

      lines.push({
        entry_id: entry.id,
        account_id: debitAccountId,
        debit: lineAmount,
        credit: 0,
        asset_type: rule.asset_type,
        memo: rule.memo,
      });
      lines.push({
        entry_id: entry.id,
        account_id: creditAccountId,
        debit: 0,
        credit: lineAmount,
        asset_type: rule.asset_type,
        memo: rule.memo,
      });
    }

    if (lines.length > 0) {
      const { error: linesErr } = await supabase.from("journal_lines").insert(lines);
      if (linesErr) throw new Error(`Failed to create journal lines: ${linesErr.message}`);
    }

    // Update account balances
    for (const rule of rules) {
      const lineAmount = (rule.debit_code === "632" && cogs_amount) ? cogs_amount : amount;
      // Debit increases asset/expense, decreases liability/equity/revenue
      await supabase.rpc("increment_account_balance", {
        p_account_id: accountMap[rule.debit_code],
        p_amount: lineAmount,
      }).catch(() => {});
      // Credit decreases asset/expense, increases liability/equity/revenue
      await supabase.rpc("increment_account_balance", {
        p_account_id: accountMap[rule.credit_code],
        p_amount: -lineAmount,
      }).catch(() => {});
    }

    return new Response(JSON.stringify({
      success: true,
      entry_id: entry.id,
      lines_count: lines.length,
      status: vneid_signature ? "posted" : "draft",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("auto-posting error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
