import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!Deno.env.get("OPENROUTER_API_KEY") && !LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Auth check
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    // Get company from membership
    const { data: membership } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("user_id", userId)
      .limit(1)
      .single();
    if (!membership) {
      return new Response(JSON.stringify({ error: "No company" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const companyId = membership.company_id;

    // Gather 6 months of data
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Get partner IDs for this company to filter payment_transactions
    const { data: companyPartners } = await supabase
      .from("partners")
      .select("id")
      .eq("company_id", companyId);
    const partnerIds = (companyPartners || []).map(p => p.id);

    const [ordersRes, paymentsRes, debtRes] = await Promise.all([
      supabase
        .from("orders")
        .select("total, order_date, status, payment_status")
        .eq("company_id", companyId)
        .gte("order_date", sixMonthsAgo.toISOString())
        .neq("status", "cancelled")
        .order("order_date", { ascending: true }),
      partnerIds.length > 0
        ? supabase
            .from("payment_transactions")
            .select("amount, transaction_date, transaction_type")
            .in("partner_id", partnerIds)
            .gte("transaction_date", sixMonthsAgo.toISOString())
            .order("transaction_date", { ascending: true })
        : Promise.resolve({ data: [] }),
      supabase
        .from("partners")
        .select("name, debt_amount, partner_type")
        .eq("company_id", companyId)
        .gt("debt_amount", 0),
    ]);

    // Aggregate monthly data
    const monthlyData: Record<string, { revenue: number; payments_in: number; payments_out: number; orders: number }> = {};
    
    for (const order of ordersRes.data || []) {
      const month = order.order_date.substring(0, 7);
      if (!monthlyData[month]) monthlyData[month] = { revenue: 0, payments_in: 0, payments_out: 0, orders: 0 };
      monthlyData[month].revenue += order.total || 0;
      monthlyData[month].orders++;
    }

    for (const payment of paymentsRes.data || []) {
      const month = payment.transaction_date.substring(0, 7);
      if (!monthlyData[month]) monthlyData[month] = { revenue: 0, payments_in: 0, payments_out: 0, orders: 0 };
      if (payment.transaction_type === 'payment_in') {
        monthlyData[month].payments_in += payment.amount || 0;
      } else {
        monthlyData[month].payments_out += payment.amount || 0;
      }
    }

    const totalDebt = (debtRes.data || []).reduce((s: number, p: any) => s + (p.debt_amount || 0), 0);
    const topDebtors = (debtRes.data || [])
      .sort((a: any, b: any) => (b.debt_amount || 0) - (a.debt_amount || 0))
      .slice(0, 5);

    // Ask AI to forecast
    const prompt = `Dá»±a trÃªn dá»¯ liá»‡u tÃ i chÃ­nh 6 thÃ¡ng qua, hÃ£y phÃ¢n tÃ­ch vÃ  dá»± bÃ¡o dÃ²ng tiá»n 30 ngÃ y tá»›i.

Dá»¯ liá»‡u theo thÃ¡ng:
${JSON.stringify(monthlyData, null, 2)}

Tá»•ng cÃ´ng ná»£ hiá»‡n táº¡i: ${totalDebt.toLocaleString('vi-VN')}Ä‘
Top 5 cÃ´ng ná»£ lá»›n nháº¥t: ${JSON.stringify(topDebtors)}

HÃ£y tráº£ vá» JSON vá»›i format:
{
  "forecast": [
    { "week": "Tuáº§n 1", "expected_revenue": number, "expected_expense": number, "net_cashflow": number },
    { "week": "Tuáº§n 2", ... },
    { "week": "Tuáº§n 3", ... },
    { "week": "Tuáº§n 4", ... }
  ],
  "insights": ["insight1", "insight2", ...],
  "risk_level": "low" | "medium" | "high",
  "recommendations": ["rec1", "rec2", ...]
}`;

    const aiResponse = await fetch((Deno.env.get("OPENROUTER_API_KEY") ? ((Deno.env.get("OPENROUTER_BASE_URL") || "https://openrouter.ai/api/v1") + "/chat/completions") : "https://ai.gateway.lovable.dev/v1/chat/completions"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("OPENROUTER_API_KEY") || LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: Deno.env.get("OPENROUTER_MODEL") || "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Báº¡n lÃ  chuyÃªn gia phÃ¢n tÃ­ch tÃ i chÃ­nh. Tráº£ lá»i báº±ng JSON thuáº§n tÃºy, khÃ´ng markdown." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_forecast",
            description: "Return cash flow forecast data",
            parameters: {
              type: "object",
              properties: {
                forecast: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      week: { type: "string" },
                      expected_revenue: { type: "number" },
                      expected_expense: { type: "number" },
                      net_cashflow: { type: "number" },
                    },
                    required: ["week", "expected_revenue", "expected_expense", "net_cashflow"],
                  },
                },
                insights: { type: "array", items: { type: "string" } },
                risk_level: { type: "string", enum: ["low", "medium", "high"] },
                recommendations: { type: "array", items: { type: "string" } },
              },
              required: ["forecast", "insights", "risk_level", "recommendations"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_forecast" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiResult = await aiResponse.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    
    let forecastData;
    if (toolCall) {
      forecastData = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try parsing content
      const content = aiResult.choices?.[0]?.message?.content || "{}";
      forecastData = JSON.parse(content.replace(/```json?\n?/g, '').replace(/```/g, ''));
    }

    return new Response(JSON.stringify({
      ...forecastData,
      historical: monthlyData,
      total_debt: totalDebt,
      top_debtors: topDebtors,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("ai-cashflow-forecast error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});



