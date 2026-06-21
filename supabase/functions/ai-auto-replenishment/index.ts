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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    const userId = user.id;

    // Get company from membership
    const { data: membership } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("user_id", userId)
      .limit(1)
      .single();
    if (!membership) {
      return new Response(JSON.stringify({ error: "No company" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const companyId = membership.company_id;

    const { action } = await req.json();

    if (action === "analyze") {
      // Get products that need replenishment
      const { data: products } = await supabase
        .from("products")
        .select("id, name, sku, stock_quantity, min_stock, reorder_point, lead_time_days, avg_daily_sales, price")
        .eq("company_id", companyId)
        .eq("is_active", true);

      // Calculate avg daily sales from last 30 days orders
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentSales } = await supabase
        .from("order_items")
        .select("product_id, quantity, orders!inner(order_date, company_id, status)")
        .eq("orders.company_id", companyId)
        .eq("orders.status", "delivered")
        .gte("orders.order_date", thirtyDaysAgo.toISOString());

      // Calculate velocity per product
      const salesMap = new Map<string, number>();
      for (const item of recentSales || []) {
        const current = salesMap.get(item.product_id) || 0;
        salesMap.set(item.product_id, current + (item.quantity || 0));
      }

      const recommendations = [];
      for (const product of products || []) {
        const totalSold = salesMap.get(product.id) || 0;
        const avgDaily = totalSold / 30;
        const currentStock = product.stock_quantity || 0;
        const minStock = product.min_stock || 0;
        const leadTime = product.lead_time_days || 7;
        const reorderPoint = product.reorder_point || minStock;

        // Update avg_daily_sales
        if (avgDaily > 0) {
          await supabase
            .from("products")
            .update({ avg_daily_sales: Math.round(avgDaily * 100) / 100 })
            .eq("id", product.id);
        }

        // Check if needs reorder
        const safetyStock = Math.ceil(avgDaily * leadTime * 1.5);
        const daysUntilStockout = avgDaily > 0 ? Math.floor(currentStock / avgDaily) : 999;
        
        if (currentStock <= reorderPoint || daysUntilStockout <= leadTime) {
          const optimalOrderQty = Math.max(
            safetyStock - currentStock + Math.ceil(avgDaily * 14), // 2 weeks buffer
            minStock * 2
          );

          recommendations.push({
            product_id: product.id,
            product_name: product.name,
            sku: product.sku,
            current_stock: currentStock,
            min_stock: minStock,
            avg_daily_sales: Math.round(avgDaily * 100) / 100,
            days_until_stockout: daysUntilStockout,
            lead_time_days: leadTime,
            recommended_quantity: Math.max(optimalOrderQty, 1),
            estimated_cost: Math.max(optimalOrderQty, 1) * (product.price || 0),
            urgency: daysUntilStockout <= 3 ? 'critical' : daysUntilStockout <= leadTime ? 'high' : 'normal',
          });
        }
      }

      // Sort by urgency
      recommendations.sort((a, b) => {
        const urgencyOrder = { critical: 0, high: 1, normal: 2 };
        return (urgencyOrder[a.urgency as keyof typeof urgencyOrder] || 2) - (urgencyOrder[b.urgency as keyof typeof urgencyOrder] || 2);
      });

      return new Response(JSON.stringify({ recommendations, total_products: products?.length || 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create_po") {
      const { supplierId, items } = await req.json();
      
      // Generate PO number
      const poNumber = `PO-${Date.now().toString(36).toUpperCase()}`;
      
      const subtotal = items.reduce((s: number, i: any) => s + (i.quantity * i.unit_price), 0);
      
      const { data: po, error: poError } = await supabase
        .from("purchase_orders")
        .insert({
          company_id: companyId,
          po_number: poNumber,
          supplier_id: supplierId,
          status: "draft",
          subtotal,
          total: subtotal,
          created_by: userId,
        })
        .select()
        .single();

      if (poError) throw poError;

      const poItems = items.map((item: any) => ({
        purchase_order_id: po.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price,
      }));

      const { error: itemsError } = await supabase
        .from("purchase_order_items")
        .insert(poItems);

      if (itemsError) throw itemsError;

      return new Response(JSON.stringify({ success: true, po }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("ai-auto-replenishment error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
