// parse-voice-report edge function
// Uses Lovable AI (Gemini) to parse Vietnamese voice transcript into structured tasks

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
    const { transcript, projects } = await req.json();

    if (!transcript || typeof transcript !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing transcript" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Parsing voice transcript:", transcript.substring(0, 100));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!Deno.env.get("OPENROUTER_API_KEY") && !LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify(fallbackParse(transcript)),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build prompt for AI - enhanced for Vietnamese voice transcription
    const systemPrompt = `Báº¡n lÃ  trá»£ lÃ½ phÃ¢n tÃ­ch bÃ¡o cÃ¡o cÃ´ng viá»‡c tiáº¿ng Viá»‡t Ä‘Æ°á»£c chuyá»ƒn Ä‘á»•i tá»« giá»ng nÃ³i.

## Nhiá»‡m vá»¥
PhÃ¢n tÃ­ch vÄƒn báº£n transcript vÃ  trÃ­ch xuáº¥t danh sÃ¡ch cÃ´ng viá»‡c vá»›i phÃ¢n loáº¡i chÃ­nh xÃ¡c.

${projects?.length ? `## Dá»± Ã¡n cÃ³ sáºµn\n${projects.map((p: Project) => `- [${p.code}] ${p.name}`).join("\n")}` : ""}

## Quy táº¯c phÃ¢n loáº¡i

### completed (ÄÃ£ hoÃ n thÃ nh)
Tá»« khÃ³a: xong, hoÃ n thÃ nh, done, finish, Ä‘Ã£ lÃ m xong, Ä‘Ã£ xá»­ lÃ½, Ä‘Ã£ gá»­i, Ä‘Ã£ review, Ä‘Ã£ test, Ä‘Ã£ fix, Ä‘Ã£ deploy, Ä‘Ã£ merge
VÃ­ dá»¥: "Xong task lÃ m UI", "ÄÃ£ hoÃ n thÃ nh bÃ¡o cÃ¡o", "Done fix bug login"

### pending (Äang lÃ m / Sáº½ lÃ m)  
Tá»« khÃ³a: Ä‘ang lÃ m, Ä‘ang code, Ä‘ang viáº¿t, sáº½ lÃ m, chÆ°a xong, in progress, cÃ²n, tiáº¿p tá»¥c, lÃ m tiáº¿p, cáº§n lÃ m
VÃ­ dá»¥: "Äang code tÃ­nh nÄƒng má»›i", "Sáº½ lÃ m unit test", "CÃ²n viá»‡c design"

### blocker (Váº¥n Ä‘á» cháº·n)
Tá»« khÃ³a: chá», chá» Ä‘á»£i, block, blocked, bá»‹ cháº·n, khÃ´ng thá»ƒ, chÆ°a cÃ³, pending approval, Ä‘ang chá», bá»‹ stuck, gáº·p khÃ³ khÄƒn, cáº§n há»— trá»£
VÃ­ dá»¥: "Chá» API tá»« team backend", "Bá»‹ block vÃ¬ chÆ°a cÃ³ design", "Äang chá» approval"

## Xá»­ lÃ½ giá»ng nÃ³i tiáº¿ng Viá»‡t
1. Bá» qua tá»« Ä‘á»‡m: á»«m, Ã , Æ¡, thÃ¬, lÃ , cÃ¡i, nÃ y, Ä‘áº¥y, Ä‘Ã³
2. Suy luáº­n ngá»¯ cáº£nh khi cÃ³ lá»—i nháº­n dáº¡ng nhá»
3. TÃ¡ch nhiá»u cÃ´ng viá»‡c náº¿u user nÃ³i liÃªn tiáº¿p (dÃ¹ng "vÃ ", "rá»“i", "sau Ä‘Ã³", hoáº·c ngá»¯ cáº£nh)
4. GÃ¡n project_code náº¿u user nháº¯c Ä‘áº¿n dá»± Ã¡n trong danh sÃ¡ch

## Format JSON output
{
  "tasks": [
    {
      "project_code": "PRJ-001 hoáº·c null náº¿u khÃ´ng rÃµ",
      "task": "mÃ´ táº£ cÃ´ng viá»‡c ngáº¯n gá»n, rÃµ rÃ ng", 
      "type": "completed|pending|blocker"
    }
  ]
}

## VÃ­ dá»¥ phÃ¢n tÃ­ch

Input: "HÃ´m nay mÃ¬nh xong viá»‡c design trang chá»§, Ä‘ang code pháº§n login, cÃ²n bá»‹ chá» API authentication tá»« backend"
Output:
{
  "tasks": [
    {"task": "Design trang chá»§", "type": "completed"},
    {"task": "Code pháº§n login", "type": "pending"},
    {"task": "Chá» API authentication tá»« backend", "type": "blocker"}
  ]
}

Input: "á»ªm thÃ¬ hÃ´m nay lÃ m xong cÃ¡i task fix bug Ä‘áº¥y, rá»“i cÃ²n Ä‘ang viáº¿t test ná»¯a"
Output:
{
  "tasks": [
    {"task": "Fix bug", "type": "completed"},
    {"task": "Viáº¿t test", "type": "pending"}
  ]
}`;

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
          { role: "user", content: `PhÃ¢n tÃ­ch transcript giá»ng nÃ³i sau vÃ  tráº£ vá» JSON:\n\n"${transcript}"` }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Fallback parsing
      return new Response(
        JSON.stringify(fallbackParse(transcript)),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content;
    
    console.log("AI response:", content);

    try {
      const parsed = JSON.parse(content);
      return new Response(
        JSON.stringify({ tasks: parsed.tasks || [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr);
      return new Response(
        JSON.stringify(fallbackParse(transcript)),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    console.error("Error processing voice report:", error);
    return new Response(
      JSON.stringify({ tasks: [], error: "Processing failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function fallbackParse(transcript: string): { tasks: ParsedTask[] } {
  const lowerText = transcript.toLowerCase();
  
  // Simple sentence splitting
  const sentences = transcript
    .split(/[,.\n;]/)
    .map(s => s.trim())
    .filter(s => s.length > 5);
  
  const tasks: ParsedTask[] = [];
  
  for (const sentence of sentences) {
    const lowerSentence = sentence.toLowerCase();
    
    let type: "completed" | "pending" | "blocker" = "pending";
    
    if (lowerSentence.includes("xong") || 
        lowerSentence.includes("hoÃ n thÃ nh") || 
        lowerSentence.includes("Ä‘Ã£ lÃ m") ||
        lowerSentence.includes("done")) {
      type = "completed";
    } else if (lowerSentence.includes("chá»") || 
               lowerSentence.includes("block") || 
               lowerSentence.includes("khÃ´ng thá»ƒ") ||
               lowerSentence.includes("chÆ°a cÃ³")) {
      type = "blocker";
    }
    
    tasks.push({ task: sentence, type });
  }
  
  // If no sentences found, use entire transcript
  if (tasks.length === 0 && transcript.trim()) {
    tasks.push({
      task: transcript.trim(),
      type: lowerText.includes("xong") ? "completed" : "pending"
    });
  }
  
  return { tasks };
}



