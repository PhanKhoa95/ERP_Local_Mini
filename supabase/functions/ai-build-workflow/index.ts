import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODULE_CATALOG = `
TRIGGER MODULES (type="trigger"):
- order_created: ÄÆ¡n hÃ ng má»›i
- order_status_changed: Äá»•i tráº¡ng thÃ¡i ÄH (config: from_status, to_status)
- payment_received: Nháº­n thanh toÃ¡n
- low_stock: Tá»“n kho tháº¥p (config: threshold)
- approval_completed: Duyá»‡t hoÃ n táº¥t
- schedule: Theo lá»‹ch (config: cron = daily/weekly/monthly)
- employee_onboarded: NV má»›i onboard
- leave_requested: YÃªu cáº§u nghá»‰ phÃ©p
- training_completed: HoÃ n thÃ nh Ä‘Ã o táº¡o
- kpi_score_finalized: Chá»‘t Ä‘iá»ƒm KPI
- document_uploaded: TÃ i liá»‡u má»›i (config: category)
- document_processed: Xá»­ lÃ½ tÃ i liá»‡u xong
- contract_expiring: HÄ sáº¯p háº¿t háº¡n (config: days_before)
- candidate_accepted: á»¨ng viÃªn nháº­n viá»‡c
- contract_expiring_hr: HÄ lao Ä‘á»™ng sáº¯p háº¿t
- payroll_calculated: TÃ­nh lÆ°Æ¡ng xong

CONDITION MODULES (type="condition"):
- ai_router: AI PhÃ¢n loáº¡i (config: classification_prompt, branches)
- compare: So sÃ¡nh giÃ¡ trá»‹ (config: field, operator, value)
- status_check: Kiá»ƒm tra tráº¡ng thÃ¡i (config: expected_status)
- role_check: Kiá»ƒm tra quyá»n (config: required_role)

ACTION MODULES (type="action"):
- update_status: Cáº­p nháº­t tráº¡ng thÃ¡i (config: new_status)
- create_approval: Táº¡o phÃª duyá»‡t (config: approval_title)
- send_notification: Gá»­i thÃ´ng bÃ¡o (config: message)
- create_task: Táº¡o task (config: task_title)
- call_ai: Gá»i AI (config: prompt)
- webhook: Webhook (config: url, method)
- update_field: Cáº­p nháº­t trÆ°á»ng (config: field_name, field_value)
- enroll_training: Ghi danh Ä‘Ã o táº¡o (config: program_category)
- assign_mentor: Giao mentor (config: mentor_criteria)
- update_xp: Cá»™ng XP (config: xp_amount)
- ai_agent: AI Agent (config: prompt, max_rounds)
- human_approval: Chá» phÃª duyá»‡t (config: approver_role, message, timeout_hours)
- ai_self_correct: AI Tá»± sá»­a lá»—i (config: max_retries)
- create_approval_from_doc: Táº¡o phÃª duyá»‡t chá»©ng tá»«
- update_budget: Cáº­p nháº­t ngÃ¢n sÃ¡ch
`;

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

    const { description } = await req.json();
    if (!description) {
      return new Response(JSON.stringify({ error: "Vui lÃ²ng mÃ´ táº£ workflow" }), { status: 400, headers: corsHeaders });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!Deno.env.get("OPENROUTER_API_KEY") && !LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch((Deno.env.get("OPENROUTER_API_KEY") ? ((Deno.env.get("OPENROUTER_BASE_URL") || "https://openrouter.ai/api/v1") + "/chat/completions") : "https://ai.gateway.lovable.dev/v1/chat/completions"), {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("OPENROUTER_API_KEY") || LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: Deno.env.get("OPENROUTER_MODEL") || "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Báº¡n lÃ  AI chuyÃªn thiáº¿t káº¿ workflow tá»± Ä‘á»™ng hÃ³a cho há»‡ thá»‘ng ERP.

Dá»±a trÃªn mÃ´ táº£ cá»§a ngÆ°á»i dÃ¹ng, hÃ£y táº¡o ra má»™t workflow hoÃ n chá»‰nh.

${MODULE_CATALOG}

QUY Táº®C:
- Má»—i node cáº§n id duy nháº¥t (dáº¡ng "n_1", "n_2", ...)
- LuÃ´n báº¯t Ä‘áº§u báº±ng 1 trigger
- Position: node Ä‘áº§u x=200,y=100. CÃ¡c node tiáº¿p theo tÄƒng y thÃªm 120
- Config pháº£i phÃ¹ há»£p vá»›i module
- Edges ná»‘i theo thá»© tá»± logic
- Tráº£ vá» káº¿t quáº£ qua tool generate_workflow`,
          },
          { role: "user", content: description },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_workflow",
              description: "Sinh ra cáº¥u trÃºc workflow JSON hoÃ n chá»‰nh",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string", description: "TÃªn workflow" },
                  description: { type: "string", description: "MÃ´ táº£ ngáº¯n" },
                  trigger_type: { type: "string", description: "Subtype cá»§a trigger node Ä‘áº§u tiÃªn" },
                  nodes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        type: { type: "string", enum: ["trigger", "condition", "action"] },
                        trigger_type: { type: "string" },
                        condition_type: { type: "string" },
                        action_type: { type: "string" },
                        position: {
                          type: "object",
                          properties: { x: { type: "number" }, y: { type: "number" } },
                          required: ["x", "y"],
                        },
                        config: { type: "object" },
                        label: { type: "string" },
                      },
                      required: ["id", "type", "position", "config"],
                    },
                  },
                  edges: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        source: { type: "string" },
                        target: { type: "string" },
                        label: { type: "string" },
                      },
                      required: ["source", "target"],
                    },
                  },
                },
                required: ["name", "description", "trigger_type", "nodes", "edges"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_workflow" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const errText = await response.text();
      throw new Error(`AI Gateway error: ${response.status} ${errText}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(JSON.stringify({ error: "AI khÃ´ng thá»ƒ táº¡o workflow" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const workflow = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({
      name: workflow.name,
      description: workflow.description,
      trigger_type: workflow.trigger_type,
      flow_data: { nodes: workflow.nodes, edges: workflow.edges },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ai-build-workflow error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});



