import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!Deno.env.get("OPENROUTER_API_KEY") && !lovableApiKey) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Auth
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Missing authorization");
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) throw new Error("Unauthorized");

    // Get company
    const { data: membership } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();
    if (!membership) throw new Error("No company");
    const companyId = membership.company_id;

    // Fetch last 30 days data
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [ordersRes, paymentsRes, partnersRes] = await Promise.all([
      supabase
        .from("orders")
        .select("id, order_number, total, status, order_date, partner_id")
        .eq("company_id", companyId)
        .gte("order_date", thirtyDaysAgo)
        .order("order_date", { ascending: false })
        .limit(200),
      // Filter payment_transactions by company's partners to ensure data isolation
      (async () => {
        const { data: companyPartnerIds } = await supabase
          .from("partners")
          .select("id")
          .eq("company_id", companyId);
        const pIds = (companyPartnerIds || []).map((p: any) => p.id);
        if (pIds.length === 0) return { data: [] };
        return supabase
          .from("payment_transactions")
          .select("id, amount, transaction_type, transaction_date, partner_id, notes")
          .in("partner_id", pIds)
          .gte("transaction_date", thirtyDaysAgo)
          .limit(200);
      })(),
      supabase
        .from("partners")
        .select("id, name, debt_amount")
        .eq("company_id", companyId)
        .gt("debt_amount", 0),
    ]);

    const orders = ordersRes.data || [];
    const payments = paymentsRes.data || [];
    const debtPartners = partnersRes.data || [];

    // Build summary for AI
    const summary = {
      period: "30 ngÃ y gáº§n nháº¥t",
      totalOrders: orders.length,
      totalRevenue: orders.filter(o => o.status === "delivered").reduce((s, o) => s + (Number(o.total) || 0), 0),
      avgOrderValue: orders.length > 0 ? orders.reduce((s, o) => s + (Number(o.total) || 0), 0) / orders.length : 0,
      maxOrderValue: Math.max(...orders.map(o => Number(o.total) || 0), 0),
      cancelledCount: orders.filter(o => o.status === "cancelled").length,
      debtPartners: debtPartners.map(p => ({ name: p.name, debt: p.debt_amount })),
      paymentCount: payments.length,
      paymentTotal: payments.reduce((s, p) => s + (Number(p.amount) || 0), 0),
    };

    const prompt = `Báº¡n lÃ  chuyÃªn gia phÃ¢n tÃ­ch tÃ i chÃ­nh ERP. PhÃ¢n tÃ­ch dá»¯ liá»‡u sau vÃ  tÃ¬m báº¥t thÆ°á»ng:

${JSON.stringify(summary, null, 2)}

TÃ¬m cÃ¡c báº¥t thÆ°á»ng nhÆ°:
1. ÄÆ¡n hÃ ng giÃ¡ trá»‹ báº¥t thÆ°á»ng (> 3x trung bÃ¬nh)
2. CÃ´ng ná»£ quÃ¡ háº¡n cao
3. Tá»· lá»‡ há»§y Ä‘Æ¡n báº¥t thÆ°á»ng
4. Chi tiÃªu tÄƒng/giáº£m Ä‘á»™t biáº¿n

Tráº£ vá» JSON theo format yÃªu cáº§u.`;

    const aiRes = await fetch((Deno.env.get("OPENROUTER_API_KEY") ? ((Deno.env.get("OPENROUTER_BASE_URL") || "https://openrouter.ai/api/v1") + "/chat/completions") : "https://ai.gateway.lovable.dev/v1/chat/completions"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("OPENROUTER_API_KEY") || lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: Deno.env.get("OPENROUTER_MODEL") || "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Báº¡n lÃ  AI phÃ¢n tÃ­ch tÃ i chÃ­nh. LuÃ´n tráº£ lá»i báº±ng tiáº¿ng Viá»‡t." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "report_anomalies",
            description: "BÃ¡o cÃ¡o cÃ¡c báº¥t thÆ°á»ng tÃ i chÃ­nh phÃ¡t hiá»‡n Ä‘Æ°á»£c",
            parameters: {
              type: "object",
              properties: {
                anomalies: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string" },
                      severity: { type: "string", enum: ["critical", "warning", "info"] },
                      title: { type: "string" },
                      description: { type: "string" },
                      recommendation: { type: "string" },
                    },
                    required: ["type", "severity", "title", "description", "recommendation"],
                  },
                },
              },
              required: ["anomalies"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "report_anomalies" } },
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let anomalies = [];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        anomalies = parsed.anomalies || [];
      } catch { /* ignore */ }
    }

    return new Response(JSON.stringify({ anomalies }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Finance anomaly error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});



