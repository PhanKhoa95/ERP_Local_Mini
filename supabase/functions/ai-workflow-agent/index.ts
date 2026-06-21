import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TOOLS = [
  {
    type: "function",
    function: {
      name: "check_project_budget",
      description: "Kiá»ƒm tra ngÃ¢n sÃ¡ch cÃ²n láº¡i cá»§a dá»± Ã¡n",
      parameters: {
        type: "object",
        properties: { project_id: { type: "string" } },
        required: ["project_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_company_sop",
      description: "Tra cá»©u quy Ä‘á»‹nh, SOP cÃ´ng ty qua tÃ¬m kiáº¿m ngá»¯ nghÄ©a",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_order_status",
      description: "Cáº­p nháº­t tráº¡ng thÃ¡i Ä‘Æ¡n hÃ ng",
      parameters: {
        type: "object",
        properties: {
          order_id: { type: "string" },
          new_status: { type: "string", enum: ["pending", "confirmed", "shipping", "delivered", "cancelled"] },
        },
        required: ["order_id", "new_status"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_approval_request",
      description: "Táº¡o yÃªu cáº§u phÃª duyá»‡t E-Office",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          request_type: { type: "string" },
          amount: { type: "number" },
        },
        required: ["title", "request_type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_inventory_status",
      description: "Kiá»ƒm tra tá»“n kho sáº£n pháº©m theo tÃªn hoáº·c SKU",
      parameters: {
        type: "object",
        properties: { search: { type: "string" } },
        required: ["search"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_notification",
      description: "Gá»­i thÃ´ng bÃ¡o cho nhÃ¢n viÃªn",
      parameters: {
        type: "object",
        properties: {
          message: { type: "string" },
          type: { type: "string", enum: ["info", "warning", "alert"] },
        },
        required: ["message"],
      },
    },
  },
];

async function executeTool(
  toolName: string,
  args: Record<string, any>,
  supabase: any,
  companyId: string,
  userId: string
): Promise<string> {
  try {
    switch (toolName) {
      case "check_project_budget": {
        const { data } = await supabase
          .from("projects")
          .select("name, budget, spent_budget, status")
          .eq("id", args.project_id)
          .eq("company_id", companyId)
          .single();
        if (!data) return JSON.stringify({ error: "KhÃ´ng tÃ¬m tháº¥y dá»± Ã¡n" });
        return JSON.stringify({
          name: data.name,
          budget: data.budget,
          spent: data.spent_budget,
          remaining: (data.budget || 0) - (data.spent_budget || 0),
          status: data.status,
        });
      }

      case "search_company_sop": {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        const resp = await fetch(`${supabaseUrl}/functions/v1/semantic-search`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseKey}` },
          body: JSON.stringify({ query: args.query, company_id: companyId }),
        });
        const result = await resp.json();
        return JSON.stringify(result?.results?.slice(0, 3) || []);
      }

      case "update_order_status": {
        const { error } = await supabase
          .from("orders")
          .update({ status: args.new_status })
          .eq("id", args.order_id)
          .eq("company_id", companyId);
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, order_id: args.order_id, new_status: args.new_status });
      }

      case "create_approval_request": {
        const { data, error } = await supabase
          .from("approval_requests")
          .insert({
            company_id: companyId,
            requested_by: userId,
            title: args.title,
            description: args.description || null,
            request_type: args.request_type,
            amount: args.amount || null,
            status: "pending",
          })
          .select("id")
          .single();
        if (error) return JSON.stringify({ error: error.message });
        return JSON.stringify({ success: true, approval_id: data.id });
      }

      case "get_inventory_status": {
        const { data } = await supabase
          .from("products")
          .select("name, sku, stock_quantity, min_stock")
          .eq("company_id", companyId)
          .or(`name.ilike.%${args.search}%,sku.ilike.%${args.search}%`)
          .limit(5);
        return JSON.stringify(data || []);
      }

      case "send_notification": {
        await supabase.from("rag_notifications").insert({
          user_id: userId,
          company_id: companyId,
          type: args.type || "info",
          title: "ThÃ´ng bÃ¡o tá»« AI Workflow",
          message: args.message,
        });
        return JSON.stringify({ success: true });
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${toolName}` });
    }
  } catch (e) {
    return JSON.stringify({ error: e.message });
  }
}

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
      .select("company_id")
      .eq("user_id", userId)
      .limit(1)
      .single();
    if (!member) {
      return new Response(JSON.stringify({ error: "No company" }), { status: 403, headers: corsHeaders });
    }
    const companyId = member.company_id;

    const { node_type, config, context_data } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!Deno.env.get("OPENROUTER_API_KEY") && !LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    if (node_type === "ai_router") {
      // AI Router: classify input data and return branch name
      const prompt = config.classification_prompt || "PhÃ¢n loáº¡i dá»¯ liá»‡u Ä‘áº§u vÃ o";
      const branches = (config.branches || "").split(",").map((b: string) => b.trim()).filter(Boolean);

      const response = await fetch((Deno.env.get("OPENROUTER_API_KEY") ? ((Deno.env.get("OPENROUTER_BASE_URL") || "https://openrouter.ai/api/v1") + "/chat/completions") : "https://ai.gateway.lovable.dev/v1/chat/completions"), {
        method: "POST",
        headers: { Authorization: `Bearer ${Deno.env.get("OPENROUTER_API_KEY") || LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: Deno.env.get("OPENROUTER_MODEL") || "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `Báº¡n lÃ  AI phÃ¢n loáº¡i. Dá»±a trÃªn dá»¯ liá»‡u Ä‘áº§u vÃ o, chá»n ÄÃšNG Má»˜T nhÃ¡nh phÃ¹ há»£p nháº¥t.\nCÃ¡c nhÃ¡nh: ${branches.join(", ")}\nChá»‰ tráº£ lá»i TÃŠN NHÃNH, khÃ´ng giáº£i thÃ­ch.`,
            },
            { role: "user", content: `Prompt: ${prompt}\n\nDá»¯ liá»‡u: ${JSON.stringify(context_data)}` },
          ],
        }),
      });

      const result = await response.json();
      const chosenBranch = result.choices?.[0]?.message?.content?.trim() || branches[0] || "unknown";

      return new Response(JSON.stringify({
        result: { chosen_branch: chosenBranch, reasoning: `AI phÃ¢n loáº¡i chá»n nhÃ¡nh: ${chosenBranch}` },
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (node_type === "ai_self_correct") {
      // AI Self-Correct: analyze error and suggest fix
      const response = await fetch((Deno.env.get("OPENROUTER_API_KEY") ? ((Deno.env.get("OPENROUTER_BASE_URL") || "https://openrouter.ai/api/v1") + "/chat/completions") : "https://ai.gateway.lovable.dev/v1/chat/completions"), {
        method: "POST",
        headers: { Authorization: `Bearer ${Deno.env.get("OPENROUTER_API_KEY") || LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: Deno.env.get("OPENROUTER_MODEL") || "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: "Báº¡n lÃ  AI sá»­a lá»—i. PhÃ¢n tÃ­ch lá»—i tá»« bÆ°á»›c trÆ°á»›c vÃ  Ä‘á» xuáº¥t dá»¯ liá»‡u Ä‘Ã£ sá»­a. Tráº£ vá» JSON há»£p lá»‡ vá»›i key 'corrected_data' vÃ  'explanation'.",
            },
            {
              role: "user",
              content: `Lá»—i: ${JSON.stringify(context_data?.error)}\nDá»¯ liá»‡u gá»‘c: ${JSON.stringify(context_data?.original_data)}`,
            },
          ],
        }),
      });

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content || "{}";

      return new Response(JSON.stringify({
        result: { correction: content, reasoning: "AI Ä‘Ã£ phÃ¢n tÃ­ch lá»—i vÃ  Ä‘á» xuáº¥t sá»­a" },
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // AI Agent: multi-round tool calling with sandboxing
    const maxRounds = Math.min(config.max_rounds || 5, 10);
    const agentPrompt = config.prompt || "Thá»±c hiá»‡n yÃªu cáº§u dá»±a trÃªn dá»¯ liá»‡u";

    // Agent sandboxing: load allowed tools from agent_permissions
    let allowedTools = TOOLS;
    const agentName = config.agent_name || "default";
    const { data: agentPerm } = await supabase
      .from("agent_permissions")
      .select("allowed_tables, allowed_actions, max_amount_limit, requires_human_approval")
      .eq("company_id", companyId)
      .eq("agent_name", agentName)
      .eq("is_active", true)
      .maybeSingle();

    if (agentPerm) {
      const allowedTables = agentPerm.allowed_tables || [];
      // Filter tools based on allowed tables
      const tableToolMap: Record<string, string[]> = {
        projects: ["check_project_budget"],
        orders: ["update_order_status"],
        products: ["get_inventory_status"],
        approval_requests: ["create_approval_request"],
        documents: ["search_company_sop"],
        rag_notifications: ["send_notification"],
      };

      const allowedToolNames = new Set<string>();
      for (const table of allowedTables) {
        const tools = tableToolMap[table as string];
        if (tools) tools.forEach(t => allowedToolNames.add(t));
      }

      if (allowedToolNames.size > 0) {
        allowedTools = TOOLS.filter(t => allowedToolNames.has(t.function.name));
      }
    }

    const messages: any[] = [
      {
        role: "system",
        content: `Báº¡n lÃ  AI Agent trong há»‡ thá»‘ng ERP. Báº¡n cÃ³ thá»ƒ sá»­ dá»¥ng cÃ¡c tool Ä‘á»ƒ truy váº¥n vÃ  thao tÃ¡c dá»¯ liá»‡u.\nHÃ£y thá»±c hiá»‡n yÃªu cáº§u sau vÃ  bÃ¡o cÃ¡o káº¿t quáº£.\nCompany ID: ${companyId}${agentPerm ? `\nGiá»›i háº¡n sá»‘ tiá»n: ${agentPerm.max_amount_limit}Ä‘` : ""}`,
      },
      {
        role: "user",
        content: `YÃªu cáº§u: ${agentPrompt}\n\nDá»¯ liá»‡u ngá»¯ cáº£nh: ${JSON.stringify(context_data || {})}`,
      },
    ];

    const reasoning: any[] = [];

    for (let round = 0; round < maxRounds; round++) {
      const response = await fetch((Deno.env.get("OPENROUTER_API_KEY") ? ((Deno.env.get("OPENROUTER_BASE_URL") || "https://openrouter.ai/api/v1") + "/chat/completions") : "https://ai.gateway.lovable.dev/v1/chat/completions"), {
        method: "POST",
        headers: { Authorization: `Bearer ${Deno.env.get("OPENROUTER_API_KEY") || LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: Deno.env.get("OPENROUTER_MODEL") || "google/gemini-3-flash-preview",
          messages,
          tools: allowedTools,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        throw new Error(`AI Gateway error: ${response.status} ${errText}`);
      }

      const result = await response.json();
      const choice = result.choices?.[0];
      if (!choice) break;

      const assistantMessage = choice.message;
      messages.push(assistantMessage);

      if (choice.finish_reason === "tool_calls" && assistantMessage.tool_calls?.length) {
        for (const toolCall of assistantMessage.tool_calls) {
          const fnName = toolCall.function.name;
          const fnArgs = JSON.parse(toolCall.function.arguments || "{}");

          reasoning.push({ round, action: "tool_call", tool: fnName, args: fnArgs });

          const toolResult = await executeTool(fnName, fnArgs, supabase, companyId, userId);

          reasoning.push({ round, action: "tool_result", tool: fnName, result: toolResult.substring(0, 500) });

          messages.push({ role: "tool", tool_call_id: toolCall.id, content: toolResult });
        }
      } else {
        // Final answer
        reasoning.push({ round, action: "final_answer", content: assistantMessage.content?.substring(0, 500) });
        break;
      }
    }

    const finalMessage = messages[messages.length - 1];
    return new Response(JSON.stringify({
      result: {
        answer: finalMessage?.content || "ÄÃ£ hoÃ n thÃ nh",
        reasoning,
        rounds: reasoning.filter(r => r.action === "tool_call").length,
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ai-workflow-agent error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});



