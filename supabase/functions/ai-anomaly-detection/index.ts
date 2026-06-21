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
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { data: member } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (!member) {
      return new Response(JSON.stringify({ error: "No company" }), { status: 403, headers: corsHeaders });
    }

    // Fetch recent audit logs (last 24h)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentLogs } = await supabase
      .from("audit_logs")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(500);

    if (!recentLogs || recentLogs.length === 0) {
      return new Response(JSON.stringify({ anomalies: [], message: "No recent activity" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pattern detection
    const anomalies: any[] = [];

    // 1. Mass deletes detection
    const deletesByUser = new Map<string, { count: number; timestamps: string[] }>();
    for (const log of recentLogs) {
      if (log.action === "DELETE" && log.user_id) {
        const entry = deletesByUser.get(log.user_id) || { count: 0, timestamps: [] };
        entry.count++;
        entry.timestamps.push(log.created_at);
        deletesByUser.set(log.user_id, entry);
      }
    }

    for (const [userId, data] of deletesByUser) {
      if (data.count > 10) {
        anomalies.push({
          type: "mass_delete",
          severity: "high",
          user_id: userId,
          message: `NgÆ°á»i dÃ¹ng xÃ³a ${data.count} báº£n ghi trong 24h`,
          count: data.count,
        });
      }
    }

    // 2. Unusual volume detection
    const actionCounts = new Map<string, number>();
    for (const log of recentLogs) {
      const key = `${log.user_id}:${log.action}`;
      actionCounts.set(key, (actionCounts.get(key) || 0) + 1);
    }

    for (const [key, count] of actionCounts) {
      if (count > 50) {
        const [userId, action] = key.split(":");
        anomalies.push({
          type: "high_volume",
          severity: "medium",
          user_id: userId,
          message: `${count} thao tÃ¡c ${action} trong 24h - báº¥t thÆ°á»ng`,
          count,
        });
      }
    }

    // 3. AI classification if anomalies found
    if (anomalies.length > 0) {
      try {
        const aiResponse = await fetch((Deno.env.get("OPENROUTER_API_KEY") ? ((Deno.env.get("OPENROUTER_BASE_URL") || "https://openrouter.ai/api/v1") + "/chat/completions") : "https://api.lovable.dev/v1/chat/completions"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("OPENROUTER_API_KEY") || Deno.env.get("LOVABLE_API_KEY")}`,
          },
          body: JSON.stringify({
            model: Deno.env.get("OPENROUTER_MODEL") || "google/gemini-2.5-flash-lite",
            messages: [
              {
                role: "system",
                content: "Báº¡n lÃ  há»‡ thá»‘ng phÃ¡t hiá»‡n báº¥t thÆ°á»ng cho ERP. PhÃ¢n tÃ­ch cÃ¡c anomaly vÃ  Ä‘Ã¡nh giÃ¡ má»©c Ä‘á»™ nguy hiá»ƒm. Tráº£ lá»i báº±ng JSON: { analysis: string, risk_level: 'low'|'medium'|'high'|'critical', recommendations: string[] }",
              },
              {
                role: "user",
                content: `PhÃ¢n tÃ­ch cÃ¡c hÃ nh vi báº¥t thÆ°á»ng sau: ${JSON.stringify(anomalies)}`,
              },
            ],
          }),
        });

        const aiData = await aiResponse.json();
        const aiContent = aiData.choices?.[0]?.message?.content || "";

        // Create notification for admins
        const { data: admins } = await supabase
          .from("company_members")
          .select("user_id")
          .eq("company_id", member.company_id)
          .eq("role", "admin");

        for (const admin of admins || []) {
          await supabase.from("rag_notifications").insert({
            user_id: admin.user_id,
            company_id: member.company_id,
            type: "anomaly",
            title: "âš ï¸ PhÃ¡t hiá»‡n hÃ nh vi báº¥t thÆ°á»ng",
            message: `${anomalies.length} anomaly detected trong 24h gáº§n nháº¥t`,
            data: { anomalies, ai_analysis: aiContent },
          });
        }
      } catch (aiErr) {
        console.error("AI analysis failed:", aiErr);
      }
    }

    return new Response(JSON.stringify({ anomalies, total_logs: recentLogs.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});



