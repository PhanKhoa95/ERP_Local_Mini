import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const tools = [
  {
    type: "function",
    function: {
      name: "check_inventory",
      description: "Tra cá»©u tá»“n kho sáº£n pháº©m theo tÃªn hoáº·c SKU. Tráº£ vá» danh sÃ¡ch sáº£n pháº©m khá»›p vá»›i thÃ´ng tin tá»“n kho.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "TÃªn sáº£n pháº©m hoáº·c SKU cáº§n tÃ¬m" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "find_orders",
      description: "TÃ¬m Ä‘Æ¡n hÃ ng theo mÃ£ Ä‘Æ¡n, tÃªn khÃ¡ch hÃ ng hoáº·c tráº¡ng thÃ¡i. Tráº£ vá» danh sÃ¡ch Ä‘Æ¡n hÃ ng phÃ¹ há»£p.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "MÃ£ Ä‘Æ¡n hÃ ng, tÃªn khÃ¡ch, hoáº·c tráº¡ng thÃ¡i (pending, confirmed, shipping, delivered)" },
          status: { type: "string", description: "Lá»c theo tráº¡ng thÃ¡i cá»¥ thá»ƒ (optional)" },
          limit: { type: "number", description: "Sá»‘ lÆ°á»£ng káº¿t quáº£ tá»‘i Ä‘a (default 10)" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_debt_summary",
      description: "Kiá»ƒm tra cÃ´ng ná»£ cá»§a khÃ¡ch hÃ ng hoáº·c nhÃ  cung cáº¥p. Tráº£ vá» tá»•ng cÃ´ng ná»£ vÃ  chi tiáº¿t.",
      parameters: {
        type: "object",
        properties: {
          partner_name: { type: "string", description: "TÃªn khÃ¡ch hÃ ng hoáº·c nhÃ  cung cáº¥p" },
        },
        required: ["partner_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_revenue_stats",
      description: "Láº¥y thá»‘ng kÃª doanh thu theo khoáº£ng thá»i gian. Tráº£ vá» tá»•ng doanh thu, sá»‘ Ä‘Æ¡n, trung bÃ¬nh Ä‘Æ¡n.",
      parameters: {
        type: "object",
        properties: {
          period: { type: "string", description: "Khoáº£ng thá»i gian: today, this_week, this_month, last_month, this_quarter" },
        },
        required: ["period"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_low_stock_products",
      description: "Láº¥y danh sÃ¡ch sáº£n pháº©m sáº¯p háº¿t hÃ ng (tá»“n kho <= má»©c tá»‘i thiá»ƒu).",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Sá»‘ lÆ°á»£ng káº¿t quáº£ tá»‘i Ä‘a (default 10)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_top_products",
      description: "Láº¥y danh sÃ¡ch sáº£n pháº©m bÃ¡n cháº¡y nháº¥t theo doanh thu hoáº·c sá»‘ lÆ°á»£ng.",
      parameters: {
        type: "object",
        properties: {
          period: { type: "string", description: "Khoáº£ng thá»i gian: this_week, this_month, last_month" },
          sort_by: { type: "string", description: "Sáº¯p xáº¿p theo: revenue hoáº·c quantity" },
          limit: { type: "number", description: "Sá»‘ lÆ°á»£ng (default 10)" },
        },
        required: ["period"],
      },
    },
  },
  // HR Tools
  {
    type: "function",
    function: {
      name: "check_leave_balance",
      description: "Kiá»ƒm tra sá»‘ ngÃ y nghá»‰ phÃ©p cÃ²n láº¡i cá»§a nhÃ¢n viÃªn hiá»‡n táº¡i.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "lookup_payslip",
      description: "Tra cá»©u phiáº¿u lÆ°Æ¡ng cá»§a nhÃ¢n viÃªn hiá»‡n táº¡i theo thÃ¡ng/nÄƒm.",
      parameters: {
        type: "object",
        properties: {
          month: { type: "number", description: "ThÃ¡ng (1-12)" },
          year: { type: "number", description: "NÄƒm" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_attendance_summary",
      description: "Xem tÃ³m táº¯t cháº¥m cÃ´ng thÃ¡ng hiá»‡n táº¡i cá»§a nhÃ¢n viÃªn.",
      parameters: { type: "object", properties: {} },
    },
  },
];

function getDateRange(period: string): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString();
  let start: Date;

  switch (period) {
    case "today":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "this_week":
      start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      break;
    case "this_month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "last_month": {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: start.toISOString(), end: endOfLastMonth.toISOString() };
    }
    case "this_quarter": {
      const quarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), quarter * 3, 1);
      break;
    }
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return { start: start.toISOString(), end };
}

async function executeTool(supabase: any, companyId: string, name: string, args: any, userId?: string): Promise<string> {
  try {
    switch (name) {
      case "check_inventory": {
        const { data } = await supabase
          .from("products")
          .select("name, sku, stock_quantity, min_stock, price, unit, reorder_point")
          .eq("company_id", companyId)
          .or(`name.ilike.%${args.query}%,sku.ilike.%${args.query}%`)
          .limit(10);
        if (!data?.length) return `KhÃ´ng tÃ¬m tháº¥y sáº£n pháº©m nÃ o khá»›p "${args.query}".`;
        return data.map((p: any) => 
          `â€¢ **${p.name}** (${p.sku || 'N/A'}) - Tá»“n: ${p.stock_quantity || 0} ${p.unit || ''}, Min: ${p.min_stock || 0}, GiÃ¡: ${(p.price || 0).toLocaleString('vi-VN')}Ä‘`
        ).join('\n');
      }
      case "find_orders": {
        let query = supabase
          .from("orders")
          .select("order_number, status, total, order_date, partners(name, phone), notes, platform_order_id")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false })
          .limit(args.limit || 10);

        if (args.status) {
          query = query.eq("status", args.status);
        }
        
        // Search by order number OR partner name
        if (args.query && !args.status) {
          query = query.or(`order_number.ilike.%${args.query}%,partners.name.ilike.%${args.query}%`);
        }

        const { data } = await query;
        if (!data?.length) return `KhÃ´ng tÃ¬m tháº¥y Ä‘Æ¡n hÃ ng nÃ o khá»›p "${args.query}".`;
        
        const statusMap: Record<string, string> = {
          pending: "Chá» xá»­ lÃ½", confirmed: "ÄÃ£ xÃ¡c nháº­n", processing: "Äang xá»­ lÃ½",
          shipping: "Äang giao", delivered: "ÄÃ£ giao", cancelled: "ÄÃ£ há»§y",
        };
        return data.map((o: any) => 
          `â€¢ **${o.order_number}** - ${statusMap[o.status] || o.status} - ${(o.total || 0).toLocaleString('vi-VN')}Ä‘ - KH: ${o.partners?.name || 'N/A'} - ${new Date(o.order_date).toLocaleDateString('vi-VN')}`
        ).join('\n');
      }
      case "get_debt_summary": {
        const { data } = await supabase
          .from("partners")
          .select("name, code, debt_amount, total_spent, partner_type, phone")
          .eq("company_id", companyId)
          .ilike("name", `%${args.partner_name}%`)
          .limit(5);
        if (!data?.length) return `KhÃ´ng tÃ¬m tháº¥y Ä‘á»‘i tÃ¡c nÃ o khá»›p "${args.partner_name}".`;
        return data.map((p: any) => 
          `â€¢ **${p.name}** (${p.code}) - Loáº¡i: ${p.partner_type === 'customer' ? 'KhÃ¡ch hÃ ng' : 'NCC'} - CÃ´ng ná»£: ${(p.debt_amount || 0).toLocaleString('vi-VN')}Ä‘ - Tá»•ng chi tiÃªu: ${(p.total_spent || 0).toLocaleString('vi-VN')}Ä‘`
        ).join('\n');
      }
      case "get_revenue_stats": {
        const { start, end } = getDateRange(args.period);
        const { data } = await supabase
          .from("orders")
          .select("total, status")
          .eq("company_id", companyId)
          .gte("order_date", start)
          .lte("order_date", end)
          .neq("status", "cancelled");
        
        if (!data?.length) return `KhÃ´ng cÃ³ Ä‘Æ¡n hÃ ng trong khoáº£ng thá»i gian nÃ y.`;
        
        const totalRevenue = data.reduce((s: number, o: any) => s + (o.total || 0), 0);
        const deliveredOrders = data.filter((o: any) => o.status === 'delivered');
        const deliveredRevenue = deliveredOrders.reduce((s: number, o: any) => s + (o.total || 0), 0);
        
        return `ðŸ“Š Thá»‘ng kÃª ${args.period}:\nâ€¢ Tá»•ng Ä‘Æ¡n: ${data.length}\nâ€¢ Tá»•ng giÃ¡ trá»‹: ${totalRevenue.toLocaleString('vi-VN')}Ä‘\nâ€¢ ÄÃ£ giao: ${deliveredOrders.length} Ä‘Æ¡n (${deliveredRevenue.toLocaleString('vi-VN')}Ä‘)\nâ€¢ TB/Ä‘Æ¡n: ${data.length > 0 ? Math.round(totalRevenue / data.length).toLocaleString('vi-VN') : 0}Ä‘`;
      }
      case "get_low_stock_products": {
        const { data } = await supabase
          .from("products")
          .select("name, sku, stock_quantity, min_stock, reorder_point, avg_daily_sales")
          .eq("company_id", companyId)
          .eq("is_active", true)
          .order("stock_quantity", { ascending: true })
          .limit(args.limit || 10);
        
        const lowStock = (data || []).filter((p: any) => (p.stock_quantity || 0) <= (p.min_stock || 0));
        if (!lowStock.length) return "âœ… Táº¥t cáº£ sáº£n pháº©m Ä‘á»u Ä‘á»§ hÃ ng!";
        
        return `âš ï¸ ${lowStock.length} sáº£n pháº©m sáº¯p háº¿t hÃ ng:\n` + lowStock.map((p: any) => {
          const daysLeft = p.avg_daily_sales > 0 ? Math.floor((p.stock_quantity || 0) / p.avg_daily_sales) : 'âˆž';
          return `â€¢ **${p.name}** (${p.sku || 'N/A'}) - Tá»“n: ${p.stock_quantity || 0}/${p.min_stock || 0} - CÃ²n ~${daysLeft} ngÃ y`;
        }).join('\n');
      }
      case "get_top_products": {
        const { start, end } = getDateRange(args.period);
        const { data } = await supabase
          .from("order_items")
          .select("quantity, total, products(name, sku), orders!inner(order_date, company_id, status)")
          .eq("orders.company_id", companyId)
          .eq("orders.status", "delivered")
          .gte("orders.order_date", start)
          .lte("orders.order_date", end);

        if (!data?.length) return "KhÃ´ng cÃ³ dá»¯ liá»‡u bÃ¡n hÃ ng trong khoáº£ng thá»i gian nÃ y.";
        
        // Aggregate by product
        const productMap = new Map<string, { name: string; sku: string; qty: number; revenue: number }>();
        for (const item of data) {
          const key = item.products?.name || 'Unknown';
          const existing = productMap.get(key) || { name: key, sku: item.products?.sku || '', qty: 0, revenue: 0 };
          existing.qty += item.quantity || 0;
          existing.revenue += item.total || 0;
          productMap.set(key, existing);
        }
        
        const sorted = Array.from(productMap.values())
          .sort((a, b) => (args.sort_by === 'quantity' ? b.qty - a.qty : b.revenue - a.revenue))
          .slice(0, args.limit || 10);
        
        return `ðŸ† Top sáº£n pháº©m (${args.period}):\n` + sorted.map((p, i) => 
          `${i + 1}. **${p.name}** - SL: ${p.qty} - DT: ${p.revenue.toLocaleString('vi-VN')}Ä‘`
        ).join('\n');
      }
      // HR Tools
      case "check_leave_balance": {
        if (!userId) return "KhÃ´ng xÃ¡c Ä‘á»‹nh Ä‘Æ°á»£c ngÆ°á»i dÃ¹ng.";
        const { data: emp } = await supabase
          .from("perf_employees")
          .select("id, hire_date")
          .eq("user_id", userId)
          .eq("company_id", companyId)
          .single();
        if (!emp) return "ChÆ°a cÃ³ há»“ sÆ¡ nhÃ¢n viÃªn trong há»‡ thá»‘ng.";
        
        const years = emp.hire_date 
          ? Math.floor((Date.now() - new Date(emp.hire_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : 0;
        const allowance = Math.min(20, 12 + years);
        
        const { data: leaves } = await supabase
          .from("approval_requests")
          .select("description")
          .eq("requested_by", userId)
          .eq("request_type", "leave")
          .eq("status", "approved");
        
        let usedDays = 0;
        for (const l of leaves || []) {
          try { usedDays += (JSON.parse(l.description || "{}")?.days || 1); } catch { usedDays += 1; }
        }
        
        return `ðŸ“… Nghá»‰ phÃ©p:\nâ€¢ Tá»•ng phÃ©p nÄƒm: ${allowance} ngÃ y\nâ€¢ ÄÃ£ sá»­ dá»¥ng: ${usedDays} ngÃ y\nâ€¢ CÃ²n láº¡i: **${allowance - usedDays} ngÃ y**\nâ€¢ ThÃ¢m niÃªn: ${years} nÄƒm`;
      }
      case "lookup_payslip": {
        if (!userId) return "KhÃ´ng xÃ¡c Ä‘á»‹nh Ä‘Æ°á»£c ngÆ°á»i dÃ¹ng.";
        const { data: emp } = await supabase
          .from("perf_employees")
          .select("id")
          .eq("user_id", userId)
          .eq("company_id", companyId)
          .single();
        if (!emp) return "ChÆ°a cÃ³ há»“ sÆ¡ nhÃ¢n viÃªn.";
        
        const now = new Date();
        const month = args.month || now.getMonth() + 1;
        const year = args.year || now.getFullYear();
        
        const { data: runs } = await supabase
          .from("payroll_runs")
          .select("id")
          .eq("company_id", companyId)
          .eq("period_month", month)
          .eq("period_year", year)
          .limit(1);
        
        if (!runs?.length) return `ChÆ°a cÃ³ báº£ng lÆ°Æ¡ng thÃ¡ng ${month}/${year}.`;
        
        const { data: item } = await supabase
          .from("payroll_items")
          .select("*")
          .eq("payroll_run_id", runs[0].id)
          .eq("employee_id", emp.id)
          .single();
        
        if (!item) return `KhÃ´ng tÃ¬m tháº¥y phiáº¿u lÆ°Æ¡ng thÃ¡ng ${month}/${year} cá»§a báº¡n.`;
        
        const fmt = (n: number) => (n || 0).toLocaleString("vi-VN");
        return `ðŸ’° Phiáº¿u lÆ°Æ¡ng T${month}/${year}:\nâ€¢ LÆ°Æ¡ng cÆ¡ báº£n: ${fmt(item.base_salary)}Ä‘\nâ€¢ NgÃ y cÃ´ng: ${item.worked_days}/${item.standard_days}\nâ€¢ TÄƒng ca: ${item.overtime_hours}h (+${fmt(item.overtime_pay)}Ä‘)\nâ€¢ BHXH: -${fmt(item.insurance_deduction)}Ä‘\nâ€¢ Thuáº¿ TNCN: -${fmt(item.tax_deduction)}Ä‘\nâ€¢ **Thá»±c nháº­n: ${fmt(item.net_salary)}Ä‘**`;
      }
      case "get_attendance_summary": {
        if (!userId) return "KhÃ´ng xÃ¡c Ä‘á»‹nh Ä‘Æ°á»£c ngÆ°á»i dÃ¹ng.";
        const { data: emp } = await supabase
          .from("perf_employees")
          .select("id")
          .eq("user_id", userId)
          .eq("company_id", companyId)
          .single();
        if (!emp) return "ChÆ°a cÃ³ há»“ sÆ¡ nhÃ¢n viÃªn.";
        
        const now = new Date();
        const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
        const { data: records } = await supabase
          .from("attendance_records")
          .select("work_hours, overtime_hours, date, check_in, check_out")
          .eq("employee_id", emp.id)
          .gte("date", start);
        
        if (!records?.length) return "ChÆ°a cÃ³ dá»¯ liá»‡u cháº¥m cÃ´ng thÃ¡ng nÃ y.";
        
        const days = records.length;
        const totalHours = records.reduce((s: number, r: any) => s + (r.work_hours || 0), 0);
        const totalOT = records.reduce((s: number, r: any) => s + (r.overtime_hours || 0), 0);
        
        return `â ° Cháº¥m cÃ´ng thÃ¡ng ${now.getMonth() + 1}:\nâ€¢ NgÃ y cÃ´ng: ${days} ngÃ y\nâ€¢ Tá»•ng giá» : ${totalHours.toFixed(1)}h\nâ€¢ TÄƒng ca: ${totalOT.toFixed(1)}h\nâ€¢ TB/ngÃ y: ${(totalHours / days).toFixed(1)}h`;
      }
      default:
        return `Tool "${name}" khÃ´ng Ä‘Æ°á»£c há»— trá»£.`;
    }
  } catch (error) {
    console.error(`Tool ${name} error:`, error);
    return `Lá»—i khi thá»±c hiá»‡n "${name}": ${error.message}`;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
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

    const requestBody = await req.json();
    const { messages, aiProviderConfig } = requestBody;

    // Load company-specific AI settings (prioritize frontend rotated config)
    let openRouterApiKey = aiProviderConfig?.apiKey || Deno.env.get("OPENROUTER_API_KEY");
    let openRouterModel = aiProviderConfig?.model || Deno.env.get("OPENROUTER_MODEL") || "google/gemini-2.5-flash";
    let openRouterBaseUrl = aiProviderConfig?.baseUrl || Deno.env.get("OPENROUTER_BASE_URL") || "https://openrouter.ai/api/v1";

    if (!aiProviderConfig?.apiKey) {
      const { data: shopSettings } = await supabase
        .from("shop_settings")
        .select("value")
        .eq("company_id", companyId)
        .eq("key", "ai_provider_config")
        .maybeSingle();

      if (shopSettings?.value) {
        const config = shopSettings.value as any;
        if (config.openRouterApiKey) {
          openRouterApiKey = config.openRouterApiKey;
          if (config.openRouterModel) openRouterModel = config.openRouterModel;
          if (config.openRouterBaseUrl) openRouterBaseUrl = config.openRouterBaseUrl;
        }
      }
    }

    if (!openRouterApiKey && !LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY/OPENROUTER_API_KEY is not configured");
    }

    const systemPrompt = `Báº¡n lÃ  trá»£ lÃ½ AI thÃ´ng minh cho há»‡ thá»‘ng ERP quáº£n lÃ½ bÃ¡n hÃ ng Ä‘a kÃªnh & nhÃ¢n sá»±. Báº¡n cÃ³ thá»ƒ:
- Tra cá»©u tá»“n kho sáº£n pháº©m
- TÃ¬m kiáº¿m Ä‘Æ¡n hÃ ng
- Kiá»ƒm tra cÃ´ng ná»£ khÃ¡ch hÃ ng/nhÃ  cung cáº¥p
- Xem thá»‘ng kÃª doanh thu
- Cáº£nh bÃ¡o sáº£n pháº©m sáº¯p háº¿t hÃ ng
- Xem sáº£n pháº©m bÃ¡n cháº¡y
- Kiá»ƒm tra sá»‘ ngÃ y nghá»‰ phÃ©p cÃ²n láº¡i
- Tra cá»©u phiáº¿u lÆ°Æ¡ng theo thÃ¡ng
- Xem tÃ³m táº¯t cháº¥m cÃ´ng thÃ¡ng

Tráº£ lá» i báº±ng tiáº¿ng Viá»‡t, ngáº¯n gá» n vÃ  dá»… hiá»ƒu. Sá»­ dá»¥ng emoji phÃ¹ há»£p. Khi user há» i vá»  dá»¯ liá»‡u, hÃ£y gá» i tool tÆ°Æ¡ng á»©ng.
Náº¿u user chÃ o há» i hoáº·c há» i vá»  kháº£ nÄƒng, hÃ£y giá»›i thiá»‡u báº¡n cÃ³ thá»ƒ lÃ m gÃ¬.`;

    const allMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    // First call with tools
    let response = await fetch((openRouterApiKey ? (openRouterBaseUrl + "/chat/completions") : "https://ai.gateway.lovable.dev/v1/chat/completions"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openRouterApiKey || LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: openRouterModel || "google/gemini-3-flash-preview",
        messages: allMessages,
        tools,
        stream: false,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Vui lÃ²ng thá»­ láº¡i sau." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Háº¿t quota AI. Vui lÃ²ng náº¡p thÃªm credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    let result = await response.json();
    let assistantMessage = result.choices?.[0]?.message;

    // Handle tool calls iteratively (max 3 rounds)
    let rounds = 0;
    while (assistantMessage?.tool_calls && rounds < 3) {
      rounds++;
      const toolMessages = [];
      
      for (const toolCall of assistantMessage.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments);
        const toolResult = await executeTool(supabase, companyId, toolCall.function.name, args, userId);
        toolMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: toolResult,
        });
      }

      // Call AI again with tool results
      response = await fetch((openRouterApiKey ? (openRouterBaseUrl + "/chat/completions") : "https://ai.gateway.lovable.dev/v1/chat/completions"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openRouterApiKey || LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: openRouterModel || "google/gemini-2.5-flash",
          messages: [...allMessages, assistantMessage, ...toolMessages],
          tools,
          stream: false,
        }),
      });

      if (!response.ok) throw new Error(`AI gateway error: ${response.status}`);
      result = await response.json();
      assistantMessage = result.choices?.[0]?.message;
    }

    return new Response(JSON.stringify({ 
      answer: assistantMessage?.content || "Xin lá»—i, tÃ´i khÃ´ng thá»ƒ tráº£ lá»i lÃºc nÃ y.",
      tool_calls_used: rounds > 0,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("ai-erp-assistant error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});



