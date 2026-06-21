import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Check for documents with upcoming expiry dates and send notifications.
 * Designed to be called on a schedule (daily).
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Find documents expiring within 30 days
    const { data: expiringDocs, error } = await supabase
      .from("documents")
      .select("id, name, company_id, uploaded_by, expiry_date, category")
      .not("expiry_date", "is", null)
      .gte("expiry_date", now.toISOString())
      .lte("expiry_date", in30Days.toISOString())
      .eq("status", "completed");

    if (error) throw error;

    console.log(`Found ${expiringDocs?.length || 0} documents expiring within 30 days`);

    let notificationsSent = 0;

    for (const doc of expiringDocs || []) {
      if (!doc.uploaded_by) continue;

      const expiryDate = new Date(doc.expiry_date);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      
      // Determine urgency
      const isUrgent = daysUntilExpiry <= 7;
      const categoryLabel = doc.category === "contract" ? "Hợp đồng" : doc.category === "invoice" ? "Hóa đơn" : "Tài liệu";

      // Check if we already sent a notification for this document today
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);

      const { data: existingNotif } = await supabase
        .from("rag_notifications")
        .select("id")
        .eq("user_id", doc.uploaded_by)
        .eq("type", "contract_expiring")
        .gte("created_at", todayStart.toISOString())
        .contains("data", { document_id: doc.id })
        .limit(1);

      if (existingNotif && existingNotif.length > 0) continue;

      await supabase.from("rag_notifications").insert({
        user_id: doc.uploaded_by,
        company_id: doc.company_id,
        type: "contract_expiring",
        title: isUrgent ? `⚠️ ${categoryLabel} sắp hết hạn!` : `${categoryLabel} sắp hết hạn`,
        message: `"${doc.name}" sẽ hết hạn trong ${daysUntilExpiry} ngày (${expiryDate.toLocaleDateString("vi-VN")}).`,
        data: {
          document_id: doc.id,
          days_until_expiry: daysUntilExpiry,
          expiry_date: doc.expiry_date,
          is_urgent: isUrgent,
        },
      });

      notificationsSent++;
    }

    console.log(`Sent ${notificationsSent} expiry notifications`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        documentsChecked: expiringDocs?.length || 0,
        notificationsSent 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error checking document expiry:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
