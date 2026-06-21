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

    const companyId = member.company_id;
    const results: any[] = [];

    // Check 1: Products with negative stock
    const { data: negativeStock } = await supabase
      .from("products")
      .select("id, name, stock_quantity")
      .eq("company_id", companyId)
      .lt("stock_quantity", 0);

    results.push({
      module: "Tồn kho",
      status: (negativeStock?.length || 0) > 0 ? "warning" : "ok",
      message: (negativeStock?.length || 0) > 0
        ? `${negativeStock!.length} SP tồn âm`
        : "Hợp lệ",
      details: negativeStock?.map(p => `${p.name}: ${p.stock_quantity}`).join(", "),
    });

    // Check 2: Orders with zero total but have items
    const { data: suspiciousOrders } = await supabase
      .from("orders")
      .select("id, order_number, total")
      .eq("company_id", companyId)
      .eq("total", 0)
      .neq("status", "cancelled")
      .limit(50);

    results.push({
      module: "Đơn hàng",
      status: (suspiciousOrders?.length || 0) > 5 ? "warning" : "ok",
      message: (suspiciousOrders?.length || 0) > 5
        ? `${suspiciousOrders!.length} đơn tổng = 0`
        : "Hợp lệ",
    });

    // Check 3: Partners with abnormal debt
    const { data: highDebt } = await supabase
      .from("partners")
      .select("id, name, debt_amount")
      .eq("company_id", companyId)
      .lt("debt_amount", -1000000);

    results.push({
      module: "Công nợ",
      status: (highDebt?.length || 0) > 0 ? "warning" : "ok",
      message: (highDebt?.length || 0) > 0
        ? `${highDebt!.length} đối tác nợ âm bất thường`
        : "Hợp lệ",
    });

    // Check 4: Counts overview
    const { count: totalProducts } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("is_active", true);

    const { count: totalOrders } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId);

    results.push({
      module: "Tổng quan",
      status: "ok",
      message: `${totalProducts || 0} SP, ${totalOrders || 0} đơn`,
    });

    // Check 5: Warehouse stock vs products consistency
    const { data: warehouseSums } = await supabase
      .from("warehouse_stock")
      .select("product_id, quantity, warehouses!inner(company_id)")
      .eq("warehouses.company_id", companyId);

    const { data: productStocks } = await supabase
      .from("products")
      .select("id, stock_quantity")
      .eq("company_id", companyId)
      .eq("is_active", true);

    if (warehouseSums && productStocks) {
      const sumByProduct = new Map<string, number>();
      for (const s of warehouseSums as any[]) {
        sumByProduct.set(s.product_id, (sumByProduct.get(s.product_id) || 0) + (s.quantity || 0));
      }
      let mismatches = 0;
      for (const p of productStocks) {
        const wsSum = sumByProduct.get(p.id) || 0;
        if (wsSum !== (p.stock_quantity || 0) && wsSum > 0) mismatches++;
      }
      results.push({
        module: "Đồng bộ kho",
        status: mismatches > 0 ? "warning" : "ok",
        message: mismatches > 0 ? `${mismatches} SP lệch giữa products và warehouse_stock` : "Đồng bộ",
      });
    }

    // Persist result to audit_logs
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "INTEGRITY_CHECK",
      table_name: "system",
      new_data: { results, company_id: companyId, ran_at: new Date().toISOString() },
    });

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
