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

    if (action === "generate_template") {
      const { industry, contract_type, partner_name, company_id } = params;

      // Fetch industry template if available â€” graceful fallback if table doesn't exist
      let templateContext = {};
      try {
        const { data: templates } = await supabase
          .from("industry_templates")
          .select("template_data")
          .eq("industry", industry)
          .eq("template_type", "contract")
          .eq("is_active", true)
          .limit(1);
        templateContext = templates?.[0]?.template_data || {};
      } catch {
        // industry_templates table may not exist â€” proceed without template
        console.log("industry_templates not available, proceeding without template context");
      }

      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!Deno.env.get("OPENROUTER_API_KEY") && !LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

      const aiRes = await fetch((Deno.env.get("OPENROUTER_API_KEY") ? ((Deno.env.get("OPENROUTER_BASE_URL") || "https://openrouter.ai/api/v1") + "/chat/completions") : "https://ai.gateway.lovable.dev/v1/chat/completions"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("OPENROUTER_API_KEY") || LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: Deno.env.get("OPENROUTER_MODEL") || "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `Báº¡n lÃ  chuyÃªn gia soáº¡n há»£p Ä‘á»“ng kinh doanh Viá»‡t Nam. Tráº£ vá» JSON vá»›i cáº¥u trÃºc:
{
  "clauses": [{"title": "Äiá»u 1: ...", "content": "Ná»™i dung..."}],
  "variables": {"token_percent": 5, "payment_milestones": [{"name": "Äá»£t 1", "percent": 30}, {"name": "Äá»£t 2", "percent": 70}]},
  "recommended_milestones": [{"name": "Thanh toÃ¡n Ä‘á»£t 1", "order": 1, "percent": 30}]
}`,
            },
            {
              role: "user",
              content: `Táº¡o máº«u há»£p Ä‘á»“ng cho ngÃ nh "${industry}", loáº¡i "${contract_type}", Ä‘á»‘i tÃ¡c "${partner_name || 'chÆ°a xÃ¡c Ä‘á»‹nh'}". Tham kháº£o template: ${JSON.stringify(templateContext)}`,
            },
          ],
          tools: [{
            type: "function",
            function: {
              name: "generate_contract_template",
              description: "Generate structured contract template",
              parameters: {
                type: "object",
                properties: {
                  clauses: { type: "array", items: { type: "object", properties: { title: { type: "string" }, content: { type: "string" } }, required: ["title", "content"] } },
                  variables: { type: "object" },
                  recommended_milestones: { type: "array", items: { type: "object", properties: { name: { type: "string" }, order: { type: "number" }, percent: { type: "number" } }, required: ["name", "order", "percent"] } },
                },
                required: ["clauses", "variables", "recommended_milestones"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "generate_contract_template" } },
        }),
      });

      if (!aiRes.ok) {
        const status = aiRes.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error("AI gateway error");
      }

      const aiData = await aiRes.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      let template = {};
      if (toolCall?.function?.arguments) {
        try { template = JSON.parse(toolCall.function.arguments); } catch { template = { clauses: [], variables: {}, recommended_milestones: [] }; }
      }

      return new Response(JSON.stringify({ template }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "sign_contract") {
      const { contract_id, user_id, vneid_hash, offline_hash } = params;

      const { data, error } = await supabase
        .from("smart_contracts")
        .update({
          status: "active",
          signer_user_id: user_id,
          signer_vneid_hash: vneid_hash || null,
          signed_at: new Date().toISOString(),
          offline_hash: offline_hash || null,
        })
        .eq("id", contract_id)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ contract: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "complete_milestone") {
      const { milestone_id, contract_id } = params;

      const { data: milestone, error: mErr } = await supabase
        .from("contract_milestones")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", milestone_id)
        .select()
        .single();

      if (mErr) throw mErr;

      // Auto-issue tokens if configured
      if (milestone.token_issue_amount > 0) {
        const { data: contract } = await supabase
          .from("smart_contracts")
          .select("company_id, partner_id, title")
          .eq("id", contract_id)
          .single();

        if (contract) {
          // Call manage-tokens to issue
          await fetch(`${supabaseUrl}/functions/v1/manage-tokens`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
            body: JSON.stringify({
              action: "issue",
              company_id: contract.company_id,
              amount: milestone.token_issue_amount,
              reason: `Milestone hoÃ n thÃ nh: ${milestone.milestone_name} - HÄ: ${contract.title}`,
            }),
          });
        }
      }

      return new Response(JSON.stringify({ milestone }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("manage-contracts error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});



