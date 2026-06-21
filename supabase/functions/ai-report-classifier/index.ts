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
    if (!authHeader) throw new Error("Missing authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    // Get company
    const { data: member } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("user_id", user.id)
      .single();
    if (!member) throw new Error("No company found");

    const { report_tasks, employee_id } = await req.json();
    if (!report_tasks?.length) {
      return new Response(JSON.stringify({
        matched: [], unmatched: [], suggestions: [],
        stats: { matched_count: 0, unmatched_count: 0, coverage_rate: 100 }
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch active directives with their tasks
    const { data: directives } = await supabase
      .from("directives")
      .select("id, title, status, content")
      .eq("company_id", member.company_id)
      .in("status", ["active", "in_progress", "pending"]);

    const { data: directiveTasks } = await supabase
      .from("tasks")
      .select("id, title, directive_id, status, assigned_to")
      .eq("company_id", member.company_id)
      .not("directive_id", "is", null);

    // Build context for AI
    const directiveContext = (directives || []).map(d => ({
      id: d.id,
      title: d.title,
      tasks: (directiveTasks || [])
        .filter(t => t.directive_id === d.id)
        .map(t => ({ id: t.id, title: t.title }))
    }));

    const reportItemsText = report_tasks.map((t: any, i: number) =>
      `${i + 1}. ${t.text || t}`
    ).join("\n");

    const directivesText = directiveContext.map(d =>
      `Directive [${d.id}] "${d.title}":\n  Tasks: ${d.tasks.map(t => `[${t.id}] "${t.title}"`).join(", ") || "(no tasks)"}`
    ).join("\n\n");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!Deno.env.get("OPENROUTER_API_KEY") && !LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch((Deno.env.get("OPENROUTER_API_KEY") ? ((Deno.env.get("OPENROUTER_BASE_URL") || "https://openrouter.ai/api/v1") + "/chat/completions") : "https://ai.gateway.lovable.dev/v1/chat/completions"), {
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
            content: `Báº¡n lÃ  AI phÃ¢n loáº¡i cÃ´ng viá»‡c. Nhiá»‡m vá»¥: so khá»›p cÃ¡c má»¥c bÃ¡o cÃ¡o (report items) vá»›i directives/tasks Ä‘Ã£ cÃ³ trong há»‡ thá»‘ng WBS.

Quy táº¯c:
- Náº¿u report item khá»›p nghÄ©a vá»›i má»™t task Ä‘Ã£ cÃ³ â†’ matched (tráº£ directive_id, task_id, confidence 0-1)
- Náº¿u report item KHÃ”NG khá»›p task nÃ o nhÆ°ng cÃ³ thá»ƒ liÃªn quan Ä‘áº¿n directive â†’ unmatched + gá»£i Ã½ directive (suggested_directive_id, reason)
- Náº¿u report item hoÃ n toÃ n khÃ´ng liÃªn quan â†’ unmatched, suggested_directive_id = null
- confidence >= 0.7 â†’ matched, < 0.7 â†’ unmatched`
          },
          {
            role: "user",
            content: `## CÃ¡c má»¥c bÃ¡o cÃ¡o:\n${reportItemsText}\n\n## Directives & Tasks hiá»‡n cÃ³:\n${directivesText}\n\nHÃ£y phÃ¢n loáº¡i tá»«ng má»¥c bÃ¡o cÃ¡o.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify_report_items",
              description: "Classify each report item as matched or unmatched to WBS directives/tasks",
              parameters: {
                type: "object",
                properties: {
                  results: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        report_index: { type: "number", description: "0-based index of the report item" },
                        matched: { type: "boolean" },
                        directive_id: { type: "string", description: "UUID of matched directive, null if unmatched" },
                        task_id: { type: "string", description: "UUID of matched task, null if no exact match" },
                        confidence: { type: "number", description: "0-1 confidence score" },
                        suggested_directive_id: { type: "string", description: "For unmatched items, suggested directive to assign to" },
                        reason: { type: "string", description: "Brief explanation" }
                      },
                      required: ["report_index", "matched", "confidence", "reason"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["results"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "classify_report_items" } }
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const errText = await aiResponse.text();
      console.error("AI error:", status, errText);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      throw new Error("AI classification failed");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    let classificationResults: any[] = [];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      classificationResults = parsed.results || [];
    }

    // Validate directive/task IDs exist
    const validDirectiveIds = new Set((directives || []).map(d => d.id));
    const validTaskIds = new Set((directiveTasks || []).map(t => t.id));

    const matched: any[] = [];
    const unmatched: any[] = [];

    for (const result of classificationResults) {
      const reportItem = report_tasks[result.report_index];
      if (!reportItem) continue;

      const itemText = reportItem.text || reportItem;

      if (result.matched && result.confidence >= 0.7) {
        matched.push({
          report_item: itemText,
          report_index: result.report_index,
          directive_id: validDirectiveIds.has(result.directive_id) ? result.directive_id : null,
          task_id: validTaskIds.has(result.task_id) ? result.task_id : null,
          confidence: result.confidence,
          reason: result.reason,
        });
      } else {
        unmatched.push({
          report_item: itemText,
          report_index: result.report_index,
          suggested_directive_id: validDirectiveIds.has(result.suggested_directive_id) ? result.suggested_directive_id : null,
          suggested_directive_title: directives?.find(d => d.id === result.suggested_directive_id)?.title || null,
          confidence: result.confidence,
          reason: result.reason,
        });
      }
    }

    // Items not covered by AI
    for (let i = 0; i < report_tasks.length; i++) {
      if (!classificationResults.some((r: any) => r.report_index === i)) {
        unmatched.push({
          report_item: report_tasks[i].text || report_tasks[i],
          report_index: i,
          suggested_directive_id: null,
          suggested_directive_title: null,
          confidence: 0,
          reason: "KhÃ´ng Ä‘Æ°á»£c AI phÃ¢n tÃ­ch",
        });
      }
    }

    const stats = {
      matched_count: matched.length,
      unmatched_count: unmatched.length,
      coverage_rate: report_tasks.length > 0
        ? Math.round((matched.length / report_tasks.length) * 100)
        : 100,
    };

    return new Response(JSON.stringify({ matched, unmatched, stats }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("ai-report-classifier error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});



