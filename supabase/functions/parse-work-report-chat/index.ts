// parse-work-report-chat edge function

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Project {
  code: string;
  name: string;
}

interface ParsedTask {
  project_code?: string;
  project_name?: string;
  task: string;
  type: "completed" | "pending" | "blocker";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, projectContext, existingTasks, projects } = await req.json();

    console.log("Parsing work report message:", message);
    console.log("Project context:", projectContext);

    // Build prompt for AI
    const systemPrompt = `Báº¡n lÃ  trá»£ lÃ½ phÃ¢n tÃ­ch bÃ¡o cÃ¡o cÃ´ng viá»‡c tiáº¿ng Viá»‡t.

Nhiá»‡m vá»¥: PhÃ¢n tÃ­ch tin nháº¯n cá»§a ngÆ°á»i dÃ¹ng vÃ  trÃ­ch xuáº¥t cÃ´ng viá»‡c.

Dá»± Ã¡n cÃ³ sáºµn: ${projects?.map((p: Project) => `[${p.code}] ${p.name}`).join(", ") || "KhÃ´ng cÃ³"}

${existingTasks ? `CÃ´ng viá»‡c Ä‘Ã£ ghi nháº­n:\n${existingTasks}` : ""}

Quy táº¯c phÃ¢n loáº¡i:
- "completed": CÃ´ng viá»‡c Ä‘Ã£ hoÃ n thÃ nh (cÃ³ tá»«: xong, hoÃ n thÃ nh, done, finish)
- "pending": CÃ´ng viá»‡c Ä‘ang lÃ m dá»Ÿ (cÃ³ tá»«: Ä‘ang, chÆ°a xong, in progress)
- "blocker": Váº¥n Ä‘á» cháº·n (cÃ³ tá»«: chá», block, pending, khÃ´ng thá»ƒ, chÆ°a cÃ³)

Tráº£ vá» JSON vá»›i format:
{
  "tasks": [{"project_code": "PRJ-001", "task": "mÃ´ táº£ cÃ´ng viá»‡c", "type": "completed|pending|blocker"}],
  "response": "CÃ¢u tráº£ lá»i thÃ¢n thiá»‡n cho user",
  "isComplete": false
}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!Deno.env.get("OPENROUTER_API_KEY") && !LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify(fallbackParse(message)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch((Deno.env.get("OPENROUTER_API_KEY") ? ((Deno.env.get("OPENROUTER_BASE_URL") || "https://openrouter.ai/api/v1") + "/chat/completions") : "https://ai.gateway.lovable.dev/v1/chat/completions"), {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("OPENROUTER_API_KEY") || LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: Deno.env.get("OPENROUTER_MODEL") || "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        response_format: { type: "json_object" },
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error("AI API error:", await response.text());
      // Fallback parsing
      return new Response(JSON.stringify(fallbackParse(message)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content;
    
    console.log("AI response:", content);

    const parsed = JSON.parse(content);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error parsing message:", error);
    return new Response(JSON.stringify(fallbackParse("")), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function fallbackParse(message: string): { tasks: ParsedTask[]; response: string; isComplete: boolean } {
  const lowerMsg = message.toLowerCase();
  const isBlocker = lowerMsg.includes("chá»") || lowerMsg.includes("pending") || lowerMsg.includes("block");
  const isDone = lowerMsg.includes("xong") || lowerMsg.includes("hoÃ n thÃ nh") || lowerMsg.includes("done");

  return {
    tasks: message ? [{
      task: message,
      type: isDone ? "completed" : isBlocker ? "blocker" : "pending"
    }] : [],
    response: isDone 
      ? "ÄÃ£ ghi nháº­n! âœ“ CÃ²n viá»‡c gÃ¬ khÃ¡c khÃ´ng?"
      : "ÄÃ£ ghi nháº­n! CÃ²n gÃ¬ ná»¯a khÃ´ng?",
    isComplete: false
  };
}



