import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = user.id;

    const { data: member } = await supabase
      .from("company_members")
      .select("company_id, role")
      .eq("user_id", userId)
      .limit(1)
      .single();
    if (!member) {
      return new Response(JSON.stringify({ error: "No company" }), { status: 403, headers: corsHeaders });
    }
    const companyId = member.company_id;
    const userRole = member.role;

    const { action, ...params } = await req.json();

    // === ISSUE TOKENS ===
    if (action === "issue") {
      if (userRole !== "admin" && userRole !== "manager") {
        return new Response(JSON.stringify({ error: "Chỉ admin/manager có quyền phát hành token" }), { status: 403, headers: corsHeaders });
      }

      const { target_user_id, amount, token_type = "reward", project_id = null } = params;
      if (!target_user_id || !amount || amount <= 0) {
        return new Response(JSON.stringify({ error: "Invalid parameters" }), { status: 400, headers: corsHeaders });
      }

      // Get or create balance
      const { data: existing } = await supabase
        .from("token_balances")
        .select("*")
        .eq("company_id", companyId)
        .eq("user_id", target_user_id)
        .is("project_id", project_id)
        .maybeSingle();

      const newBalance = (existing?.balance || 0) + amount;

      // Upsert balance
      if (existing) {
        await supabase.from("token_balances").update({ balance: newBalance, last_updated: new Date().toISOString() }).eq("id", existing.id);
      } else {
        await supabase.from("token_balances").insert({ company_id: companyId, user_id: target_user_id, project_id, balance: newBalance });
      }

      // Ledger entry
      await supabase.from("token_ledger").insert({
        company_id: companyId,
        user_id: target_user_id,
        project_id,
        token_type,
        amount,
        balance_after: newBalance,
        reference_type: "issuance",
        reference_id: `issued_by_${userId}`,
      });

      return new Response(JSON.stringify({ success: true, new_balance: newBalance }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === TRANSFER TOKENS ===
    if (action === "transfer") {
      const { to_user_id, amount, project_id = null } = params;
      if (!to_user_id || !amount || amount <= 0) {
        return new Response(JSON.stringify({ error: "Invalid parameters" }), { status: 400, headers: corsHeaders });
      }

      // Check sender balance
      const { data: senderBal } = await supabase
        .from("token_balances")
        .select("*")
        .eq("company_id", companyId)
        .eq("user_id", userId)
        .is("project_id", project_id)
        .maybeSingle();

      if (!senderBal || senderBal.balance < amount) {
        return new Response(JSON.stringify({ error: "Số dư không đủ" }), { status: 400, headers: corsHeaders });
      }

      const senderNew = senderBal.balance - amount;

      // Get or create receiver balance
      const { data: receiverBal } = await supabase
        .from("token_balances")
        .select("*")
        .eq("company_id", companyId)
        .eq("user_id", to_user_id)
        .is("project_id", project_id)
        .maybeSingle();

      const receiverNew = (receiverBal?.balance || 0) + amount;

      // Update sender
      await supabase.from("token_balances").update({ balance: senderNew, last_updated: new Date().toISOString() }).eq("id", senderBal.id);

      // Upsert receiver
      if (receiverBal) {
        await supabase.from("token_balances").update({ balance: receiverNew, last_updated: new Date().toISOString() }).eq("id", receiverBal.id);
      } else {
        await supabase.from("token_balances").insert({ company_id: companyId, user_id: to_user_id, project_id, balance: receiverNew });
      }

      // Double-entry ledger
      await supabase.from("token_ledger").insert([
        { company_id: companyId, user_id: userId, project_id, token_type: "equity", amount: -amount, balance_after: senderNew, reference_type: "transfer", counterparty_user_id: to_user_id },
        { company_id: companyId, user_id: to_user_id, project_id, token_type: "equity", amount, balance_after: receiverNew, reference_type: "transfer", counterparty_user_id: userId },
      ]);

      return new Response(JSON.stringify({ success: true, sender_balance: senderNew, receiver_balance: receiverNew }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === EXCHANGE TOKEN -> VOUCHER ===
    if (action === "exchange") {
      const { amount, voucher_code, voucher_discount = 10 } = params;
      if (!amount || amount <= 0) {
        return new Response(JSON.stringify({ error: "Invalid amount" }), { status: 400, headers: corsHeaders });
      }

      const { data: bal } = await supabase
        .from("token_balances")
        .select("*")
        .eq("company_id", companyId)
        .eq("user_id", userId)
        .is("project_id", null)
        .maybeSingle();

      if (!bal || bal.balance < amount) {
        return new Response(JSON.stringify({ error: "Số dư không đủ" }), { status: 400, headers: corsHeaders });
      }

      const newBal = bal.balance - amount;
      await supabase.from("token_balances").update({ balance: newBal, last_updated: new Date().toISOString() }).eq("id", bal.id);

      // Create voucher
      const code = voucher_code || `TKN-${Date.now().toString(36).toUpperCase()}`;
      await supabase.from("vouchers").insert({
        company_id: companyId,
        code,
        discount_type: "percent",
        discount_value: voucher_discount,
        max_uses: 1,
        current_uses: 0,
        is_active: true,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString(),
      });

      // Ledger
      await supabase.from("token_ledger").insert({
        company_id: companyId,
        user_id: userId,
        token_type: "reward",
        amount: -amount,
        balance_after: newBal,
        reference_type: "exchange",
        reference_id: code,
      });

      return new Response(JSON.stringify({ success: true, voucher_code: code, new_balance: newBal }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: corsHeaders });
  } catch (e) {
    console.error("manage-tokens error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
