import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { erpMetrics, keyResults, projectTasks, projectResources, seasonName, title } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!Deno.env.get("OPENROUTER_API_KEY") && !LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const dataContext = `
## Dá»¯ liá»‡u ERP hiá»‡n táº¡i:
- Doanh thu: ${erpMetrics?.totalRevenue?.toLocaleString() || 0}Ä‘
- Tá»•ng Ä‘Æ¡n hÃ ng: ${erpMetrics?.totalOrders || 0} (HoÃ n thÃ nh: ${erpMetrics?.deliveredOrders || 0}, Äang xá»­ lÃ½: ${erpMetrics?.pendingOrders || 0})
- Tá»· lá»‡ hoÃ n thÃ nh Ä‘Æ¡n: ${erpMetrics?.orderCompletionRate || 0}%
- GiÃ¡ trá»‹ Ä‘Æ¡n trung bÃ¬nh: ${erpMetrics?.avgOrderValue?.toLocaleString() || 0}Ä‘
- Tá»•ng sáº£n pháº©m: ${erpMetrics?.totalProducts || 0}
- Cáº£nh bÃ¡o tá»“n kho tháº¥p: ${erpMetrics?.lowStockCount || 0}
- Háº¿t hÃ ng: ${erpMetrics?.outOfStockCount || 0}
- GiÃ¡ trá»‹ tá»“n kho: ${erpMetrics?.totalStockValue?.toLocaleString() || 0}Ä‘
- CÃ´ng ná»£ pháº£i thu: ${erpMetrics?.totalDebtReceivable?.toLocaleString() || 0}Ä‘
- CÃ´ng ná»£ pháº£i tráº£: ${erpMetrics?.totalDebtPayable?.toLocaleString() || 0}Ä‘
- Lá»£i nhuáº­n gá»™p: ${erpMetrics?.grossProfit?.toLocaleString() || 0}Ä‘ (BiÃªn LN: ${erpMetrics?.profitMargin || 0}%)
- Tá»•ng nhÃ¢n viÃªn: ${erpMetrics?.totalEmployees || 0}
- XP trung bÃ¬nh: ${erpMetrics?.avgXp || 0}
- Tá»· lá»‡ hoÃ n thÃ nh task: ${erpMetrics?.taskCompletionRate || 0}%
- Doanh thu theo thÃ¡ng: ${JSON.stringify(erpMetrics?.revenueByMonth || [])}

## KPI hiá»‡n táº¡i:
${(keyResults || []).map((kr: any) => `- ${kr.name}: ${kr.actual}/${kr.target} ${kr.unit || ""}`).join("\n")}

${projectTasks ? `## Dá»± Ã¡n (${projectResources?.projectName || ""}):
- Tiáº¿n Ä‘á»™: ${projectResources?.projectProgress || 0}%
- Tasks: ${projectTasks.total} tá»•ng, ${projectTasks.done} xong, ${projectTasks.pending} chá», ${projectTasks.in_progress} Ä‘ang lÃ m, ${projectTasks.overdue} quÃ¡ háº¡n
- ThÃ nh viÃªn: ${projectResources?.members?.length || 0}
- NgÃ¢n sÃ¡ch: ${projectResources?.budget?.toLocaleString() || 0}Ä‘
- Giá» phÃ¢n bá»•: ${projectResources?.totalAllocatedHours || 0}h` : ""}

TiÃªu Ä‘á» bÃ¡o cÃ¡o: ${title || "BÃ¡o cÃ¡o chiáº¿n lÆ°á»£c"}
Ká»³: ${seasonName || "KhÃ´ng xÃ¡c Ä‘á»‹nh"}
`;

    const systemPrompt = `Báº¡n lÃ  chuyÃªn gia phÃ¢n tÃ­ch chiáº¿n lÆ°á»£c doanh nghiá»‡p Viá»‡t Nam. Dá»±a trÃªn dá»¯ liá»‡u ERP vÃ  KPI Ä‘Æ°á»£c cung cáº¥p, hÃ£y phÃ¢n tÃ­ch sÃ¢u vÃ  táº¡o ná»™i dung cho bÃ¡o cÃ¡o chiáº¿n lÆ°á»£c.

Quy táº¯c:
- Viáº¿t báº±ng tiáº¿ng Viá»‡t, chuyÃªn nghiá»‡p, ngáº¯n gá»n
- PhÃ¢n tÃ­ch dá»±a trÃªn Sá» LIá»†U THá»°C Táº¾, khÃ´ng bá»‹a sá»‘
- Náº¿u cÃ³ cáº£nh bÃ¡o tá»“n kho tháº¥p, háº¿t hÃ ng, task quÃ¡ háº¡n, cÃ´ng ná»£ cao â†’ Ä‘Æ°a vÃ o barriers
- Äá» xuáº¥t hÃ nh Ä‘á»™ng Cá»¤ THá»‚, cÃ³ thá»ƒ thá»±c hiá»‡n Ä‘Æ°á»£c
- Deadline Ä‘á» xuáº¥t trong vÃ²ng 1-3 thÃ¡ng tá»›i`;

    const response = await fetch((Deno.env.get("OPENROUTER_API_KEY") ? ((Deno.env.get("OPENROUTER_BASE_URL") || "https://openrouter.ai/api/v1") + "/chat/completions") : "https://ai.gateway.lovable.dev/v1/chat/completions"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("OPENROUTER_API_KEY") || LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: Deno.env.get("OPENROUTER_MODEL") || "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `PhÃ¢n tÃ­ch dá»¯ liá»‡u sau vÃ  táº¡o bÃ¡o cÃ¡o chiáº¿n lÆ°á»£c:\n${dataContext}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_strategic_report",
              description: "Táº¡o ná»™i dung cho 5 section cá»§a bÃ¡o cÃ¡o chiáº¿n lÆ°á»£c dá»±a trÃªn dá»¯ liá»‡u phÃ¢n tÃ­ch",
              parameters: {
                type: "object",
                properties: {
                  executive_summary: {
                    type: "object",
                    properties: {
                      objective: { type: "string", description: "Má»¥c tiÃªu cá»‘t lÃµi dá»±a trÃªn dá»¯ liá»‡u hiá»‡n táº¡i" },
                      timeline: { type: "string", description: "Thá»i gian thá»±c hiá»‡n VD: Q1 2026" },
                      current_status: { type: "string", enum: ["on_track", "delayed", "achieved"], description: "Tráº¡ng thÃ¡i dá»±a trÃªn KPI" },
                    },
                    required: ["objective", "timeline", "current_status"],
                    additionalProperties: false,
                  },
                  highlight: { type: "string", description: "Äiá»ƒm sÃ¡ng ná»•i báº­t nháº¥t tá»« dá»¯ liá»‡u" },
                  barriers: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        description: { type: "string", description: "MÃ´ táº£ rÃ o cáº£n cá»¥ thá»ƒ tá»« dá»¯ liá»‡u" },
                        cause: { type: "string", enum: ["Thá»‹ trÆ°á»ng", "Nguá»“n lá»±c", "Quy trÃ¬nh", "KhÃ¡c"] },
                      },
                      required: ["description", "cause"],
                      additionalProperties: false,
                    },
                  },
                  next_steps: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        priority: { type: "number" },
                        action: { type: "string", description: "HÃ nh Ä‘á»™ng cá»¥ thá»ƒ" },
                        deadline: { type: "string", description: "NgÃ y deadline YYYY-MM-DD" },
                      },
                      required: ["priority", "action", "deadline"],
                      additionalProperties: false,
                    },
                  },
                  requests: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: ["NgÃ¢n sÃ¡ch", "NhÃ¢n sá»±", "Quyáº¿t sÃ¡ch"] },
                        description: { type: "string" },
                        deadline: { type: "string", description: "NgÃ y deadline YYYY-MM-DD" },
                      },
                      required: ["type", "description"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["executive_summary", "highlight", "barriers", "next_steps", "requests"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_strategic_report" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "ÄÃ£ vÆ°á»£t giá»›i háº¡n yÃªu cáº§u, vui lÃ²ng thá»­ láº¡i sau." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Cáº§n náº¡p thÃªm credits Ä‘á»ƒ sá»­ dá»¥ng AI." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Lá»—i AI gateway" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "AI khÃ´ng tráº£ vá» káº¿t quáº£ há»£p lá»‡" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reportContent = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(reportContent), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-strategic-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});



