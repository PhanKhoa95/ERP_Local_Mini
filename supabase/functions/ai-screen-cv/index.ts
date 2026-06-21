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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    const { application_id, cv_text, job_description } = await req.json();

    if (!cv_text || !job_description) {
      return new Response(JSON.stringify({ error: "cv_text and job_description are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch((Deno.env.get("OPENROUTER_API_KEY") ? ((Deno.env.get("OPENROUTER_BASE_URL") || "https://openrouter.ai/api/v1") + "/chat/completions") : "https://ai.gateway.lovable.dev/v1/chat/completions"), {
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
            content: `Báº¡n lÃ  chuyÃªn gia tuyá»ƒn dá»¥ng AI. PhÃ¢n tÃ­ch CV á»©ng viÃªn so vá»›i mÃ´ táº£ cÃ´ng viá»‡c (JD).
Sá»­ dá»¥ng tool score_cv Ä‘á»ƒ tráº£ káº¿t quáº£.`,
          },
          {
            role: "user",
            content: `## MÃ´ táº£ cÃ´ng viá»‡c (JD):\n${job_description}\n\n## CV á»©ng viÃªn:\n${cv_text}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "score_cv",
              description: "Tráº£ vá» Ä‘iá»ƒm Ä‘Ã¡nh giÃ¡ CV á»©ng viÃªn",
              parameters: {
                type: "object",
                properties: {
                  overall_score: { type: "number", description: "Äiá»ƒm tá»•ng 0-100" },
                  strengths: {
                    type: "array",
                    items: { type: "string" },
                    description: "Danh sÃ¡ch Ä‘iá»ƒm máº¡nh (3-5 items)",
                  },
                  weaknesses: {
                    type: "array",
                    items: { type: "string" },
                    description: "Danh sÃ¡ch Ä‘iá»ƒm yáº¿u/thiáº¿u (2-4 items)",
                  },
                  skill_match: { type: "number", description: "Äiá»ƒm phÃ¹ há»£p ká»¹ nÄƒng 0-100" },
                  experience_match: { type: "number", description: "Äiá»ƒm phÃ¹ há»£p kinh nghiá»‡m 0-100" },
                  recommendation: {
                    type: "string",
                    enum: ["highly_recommended", "recommended", "consider", "not_recommended"],
                    description: "Khuyáº¿n nghá»‹",
                  },
                  summary: { type: "string", description: "TÃ³m táº¯t Ä‘Ã¡nh giÃ¡ 2-3 cÃ¢u" },
                },
                required: ["overall_score", "strengths", "weaknesses", "skill_match", "experience_match", "recommendation", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "score_cv" } },
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      throw new Error("AI did not return scoring results");
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    // Update application if ID provided
    if (application_id) {
      await supabase
        .from("job_applications")
        .update({
          ai_score: analysis.overall_score,
          ai_analysis: analysis,
          status: "screening",
          updated_at: new Date().toISOString(),
        })
        .eq("id", application_id);
    }

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("ai-screen-cv error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});



