import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { userId, companyId, type, title, message, data } = await req.json();

    if (!userId || !type || !title) {
      throw new Error("userId, type, and title are required");
    }

    console.log("Sending notification:", type, "to user:", userId);

    // 1. Always create in-app notification
    const { error: notifError } = await supabase.from("rag_notifications").insert({
      user_id: userId,
      company_id: companyId,
      type,
      title,
      message,
      data,
    });

    if (notifError) {
      console.error("Error creating notification:", notifError);
    }

    // 2. Check user email preferences
    const { data: prefs } = await supabase
      .from("email_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Default preferences if not set
    const emailEnabled = prefs?.email_enabled ?? true;
    const shouldSendEmail = emailEnabled && (
      (type === "document_processed" && (prefs?.document_processed ?? true)) ||
      (type === "document_failed" && (prefs?.document_failed ?? true)) ||
      (type === "weekly_trending" && (prefs?.weekly_trending ?? true))
    );

    // 3. Send email if enabled
    if (shouldSendEmail) {
      // Get Resend API key from system settings
      const { data: settings } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "resend_api_key")
        .single();

      const resendApiKey = settings?.value?.key;

      if (resendApiKey) {
        // Get user email from auth
        const { data: userData } = await supabase.auth.admin.getUserById(userId);
        const userEmail = userData?.user?.email;

        if (userEmail) {
          try {
            const emailResponse = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "RAG System <notifications@resend.dev>",
                to: [userEmail],
                subject: title,
                html: generateEmailHtml(type, title, message, data),
              }),
            });

            if (!emailResponse.ok) {
              const errorText = await emailResponse.text();
              console.error("Error sending email:", errorText);
            } else {
              console.log("Email sent successfully to:", userEmail);
            }
          } catch (emailError) {
            console.error("Error sending email:", emailError);
          }
        }
      } else {
        console.log("Resend API key not configured, skipping email");
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-notification:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateEmailHtml(type: string, title: string, message?: string, data?: any): string {
  const baseStyle = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  `;

  const headerStyle = `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 30px;
    border-radius: 10px 10px 0 0;
    text-align: center;
  `;

  const contentStyle = `
    background: #f8f9fa;
    padding: 30px;
    border-radius: 0 0 10px 10px;
  `;

  let icon = "📄";
  let statusColor = "#667eea";

  switch (type) {
    case "document_processed":
      icon = "✅";
      statusColor = "#10b981";
      break;
    case "document_failed":
      icon = "❌";
      statusColor = "#ef4444";
      break;
    case "weekly_trending":
      icon = "🔥";
      statusColor = "#f59e0b";
      break;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="${baseStyle}">
      <div style="${headerStyle}">
        <div style="font-size: 48px; margin-bottom: 10px;">${icon}</div>
        <h1 style="margin: 0; font-size: 24px;">${title}</h1>
      </div>
      <div style="${contentStyle}">
        ${message ? `<p style="color: #4b5563; font-size: 16px; line-height: 1.6;">${message}</p>` : ""}
        ${data?.document_id ? `
          <div style="background: white; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              Document ID: <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${data.document_id}</code>
            </p>
            ${data.chunk_count ? `<p style="margin: 10px 0 0; color: #6b7280; font-size: 14px;">Số đoạn văn bản: <strong>${data.chunk_count}</strong></p>` : ""}
          </div>
        ` : ""}
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            Bạn nhận được email này vì đã bật thông báo qua email.
            <a href="#" style="color: #667eea;">Tắt thông báo</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
