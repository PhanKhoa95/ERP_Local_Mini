// Sales Agent edge function â€” streaming chat + tool calling
// Allows anonymous web visitors via session_token, members via JWT
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

// Tools exposed to the model
const TOOLS = [
  {
    type: "function",
    function: {
      name: "search_products",
      description: "TÃ¬m sáº£n pháº©m/dá»‹ch vá»¥ theo tÃªn, mÃ£ hoáº·c danh má»¥c. Tráº£ vá» tÃªn, giÃ¡, tá»“n kho.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Tá»« khÃ³a tÃ¬m kiáº¿m" },
          max_price: { type: "number" },
          limit: { type: "number" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_stock",
      description: "Kiá»ƒm tra tá»“n kho cá»§a sáº£n pháº©m theo id",
      parameters: {
        type: "object",
        properties: { product_id: { type: "string" }, qty: { type: "number" } },
        required: ["product_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_active_vouchers",
      description: "Liá»‡t kÃª voucher Ä‘ang cÃ²n hiá»‡u lá»±c Ä‘á»ƒ gá»£i Ã½ cho khÃ¡ch",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "create_quotation_draft",
      description: "Táº¡o bÃ¡o giÃ¡ nhÃ¡p (draft) cho khÃ¡ch. DÃ¹ng khi khÃ¡ch Ä‘á»“ng Ã½ phÆ°Æ¡ng Ã¡n.",
      parameters: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                product_id: { type: "string" },
                quantity: { type: "number" },
                unit_price: { type: "number" },
              },
              required: ["product_id", "quantity"],
            },
          },
          notes: { type: "string" },
        },
        required: ["items"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_order",
      description:
        "Táº¡o Ä‘Æ¡n hÃ ng chÃ­nh thá»©c. Há»‡ thá»‘ng sáº½ kiá»ƒm tra ngÆ°á»¡ng max_order_value; vÆ°á»£t sáº½ chuyá»ƒn sang yÃªu cáº§u duyá»‡t.",
      parameters: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                product_id: { type: "string" },
                quantity: { type: "number" },
                unit_price: { type: "number" },
              },
              required: ["product_id", "quantity"],
            },
          },
          payment_method: { type: "string", enum: ["cod", "bank_transfer", "wallet"] },
        },
        required: ["items"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "request_human_handoff",
      description: "Chuyá»ƒn há»™i thoáº¡i sang nhÃ¢n viÃªn tháº­t khi khÃ¡ch yÃªu cáº§u hoáº·c vÆ°á»£t pháº¡m vi AI.",
      parameters: {
        type: "object",
        properties: { reason: { type: "string" } },
        required: ["reason"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_lead_info",
      description: "Cáº­p nháº­t thÃ´ng tin liÃªn há»‡ cá»§a lead khi thu tháº­p Ä‘Æ°á»£c trong há»™i thoáº¡i.",
      parameters: {
        type: "object",
        properties: {
          contact_name: { type: "string" },
          contact_phone: { type: "string" },
          contact_email: { type: "string" },
          estimated_value: { type: "number" },
          status: { type: "string", enum: ["new", "qualifying", "proposed", "won", "lost"] },
        },
      },
    },
  },
];

async function executeTool(
  name: string,
  args: any,
  ctx: { sb: any; companyId: string; leadId: string; conversationId: string; config: any },
): Promise<any> {
  const { sb, companyId, leadId, config } = ctx;
  try {
    switch (name) {
      case "search_products": {
        let q = sb
          .from("products")
          .select("id, name, sku, price, stock_quantity, unit, is_service")
          .eq("company_id", companyId)
          .eq("is_active", true)
          .limit(Math.min(args.limit || 5, 10));
        if (args.query) q = q.or(`name.ilike.%${args.query}%,sku.ilike.%${args.query}%`);
        if (args.max_price) q = q.lte("price", args.max_price);
        const { data, error } = await q;
        if (error) throw error;
        return { products: data || [] };
      }
      case "check_stock": {
        const { data, error } = await sb
          .from("products")
          .select("id, name, stock_quantity, is_service")
          .eq("id", args.product_id)
          .eq("company_id", companyId)
          .maybeSingle();
        if (error) throw error;
        if (!data) return { error: "KhÃ´ng tÃ¬m tháº¥y sáº£n pháº©m" };
        const ok = data.is_service || (data.stock_quantity || 0) >= (args.qty || 1);
        return { product: data, available: ok };
      }
      case "list_active_vouchers": {
        const { data } = await sb
          .from("vouchers")
          .select("code, discount_type, discount_value, min_order_value, valid_until")
          .eq("company_id", companyId)
          .eq("is_active", true)
          .gte("valid_until", new Date().toISOString())
          .limit(5);
        return { vouchers: data || [] };
      }
      case "create_quotation_draft": {
        if (!config.auto_create_quotation) {
          return { error: "TÃ­nh nÄƒng táº¡o bÃ¡o giÃ¡ tá»± Ä‘á»™ng Ä‘Ã£ táº¯t. Vui lÃ²ng Ä‘á»ƒ láº¡i liÃªn há»‡ Ä‘á»ƒ nhÃ¢n viÃªn há»— trá»£." };
        }
        const items = args.items || [];
        let total = 0;
        const enriched: any[] = [];
        for (const it of items) {
          const { data: p } = await sb.from("products").select("price, name").eq("id", it.product_id).maybeSingle();
          const price = it.unit_price ?? p?.price ?? 0;
          const lineTotal = price * (it.quantity || 0);
          total += lineTotal;
          enriched.push({ product_id: it.product_id, quantity: it.quantity, unit_price: price, total: lineTotal });
        }
        const qNumber = `QT-${Date.now().toString(36).toUpperCase()}`;
        const { data: quote, error: qErr } = await sb
          .from("quotations")
          .insert({
            company_id: companyId,
            quotation_number: qNumber,
            status: "draft",
            subtotal: total,
            total,
            notes: args.notes || `BÃ¡o giÃ¡ tá»± Ä‘á»™ng tá»« Sales Agent (Lead: ${leadId})`,
          })
          .select()
          .single();
        if (qErr) return { error: qErr.message };
        if (enriched.length) {
          await sb
            .from("quotation_items")
            .insert(enriched.map((e) => ({ ...e, quotation_id: quote.id })));
        }
        await sb.from("sales_leads").update({ status: "proposed", estimated_value: total }).eq("id", leadId);
        return { quotation_id: quote.id, quotation_number: qNumber, total };
      }
      case "create_order": {
        const items = args.items || [];
        let total = 0;
        const orderItems: any[] = [];
        for (const it of items) {
          const { data: p } = await sb.from("products").select("price, name").eq("id", it.product_id).maybeSingle();
          const price = it.unit_price ?? p?.price ?? 0;
          const lineTotal = price * (it.quantity || 0);
          total += lineTotal;
          orderItems.push({
            product_id: it.product_id,
            quantity: it.quantity,
            unit_price: price,
            subtotal: lineTotal,
            total: lineTotal,
          });
        }
        const maxAllowed = Number(config.max_order_value || 0);
        if (!config.auto_create_order || (maxAllowed > 0 && total > maxAllowed)) {
          // Handoff
          await sb
            .from("sales_conversations")
            .update({ agent_mode: "human", status: "handoff" })
            .eq("id", ctx.conversationId);
          await sb
            .from("sales_leads")
            .update({ status: "proposed", estimated_value: total })
            .eq("id", leadId);
          return {
            handoff: true,
            reason: `ÄÆ¡n hÃ ng giÃ¡ trá»‹ ${total.toLocaleString("vi-VN")}Ä‘ vÆ°á»£t ngÆ°á»¡ng tá»± Ä‘á»™ng (${maxAllowed.toLocaleString("vi-VN")}Ä‘). ÄÃ£ chuyá»ƒn nhÃ¢n viÃªn xá»­ lÃ½.`,
            estimated_total: total,
          };
        }
        const orderNumber = `SA-${Date.now().toString(36).toUpperCase()}`;
        const { data: order, error: oErr } = await sb
          .from("orders")
          .insert({
            company_id: companyId,
            order_number: orderNumber,
            status: "pending",
            payment_status: "unpaid",
            subtotal: total,
            total,
            order_date: new Date().toISOString().slice(0, 10),
            notes: `ÄÆ¡n tá»« Sales Agent (Lead: ${leadId})`,
          })
          .select()
          .single();
        if (oErr) return { error: oErr.message };
        if (orderItems.length) {
          await sb.from("order_items").insert(orderItems.map((e) => ({ ...e, order_id: order.id })));
        }
        await sb.from("sales_leads").update({ status: "won", estimated_value: total }).eq("id", leadId);
        return { order_id: order.id, order_number: orderNumber, total };
      }
      case "request_human_handoff": {
        await sb
          .from("sales_conversations")
          .update({ agent_mode: "human", status: "handoff" })
          .eq("id", ctx.conversationId);
        return { handoff: true, reason: args.reason };
      }
      case "update_lead_info": {
        const upd: any = {};
        for (const k of ["contact_name", "contact_phone", "contact_email", "estimated_value", "status"]) {
          if (args[k] !== undefined) upd[k] = args[k];
        }
        if (Object.keys(upd).length) {
          await sb.from("sales_leads").update(upd).eq("id", leadId);
        }
        return { updated: true, fields: Object.keys(upd) };
      }
      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (e) {
    return { error: (e as Error).message };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const sb = createClient(SUPABASE_URL, SERVICE_KEY);
    const body = await req.json();
    const { message, session_token, company_id, lead_info } = body;
    let { conversation_id, lead_id } = body;

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "message required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve conversation
    let conv: any = null;
    if (conversation_id) {
      const { data } = await sb.from("sales_conversations").select("*").eq("id", conversation_id).maybeSingle();
      conv = data;
    } else if (session_token) {
      const { data } = await sb
        .from("sales_conversations")
        .select("*")
        .eq("session_token", session_token)
        .maybeSingle();
      conv = data;
    }

    if (!conv) {
      // Need a company to create a conversation for anonymous chat
      const cid = company_id || conv?.company_id;
      if (!cid) {
        return new Response(JSON.stringify({ error: "company_id required for new conversation" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Create lead first
      const { data: newLead } = await sb
        .from("sales_leads")
        .insert({
          company_id: cid,
          channel: "web_chat",
          status: "new",
          contact_name: lead_info?.contact_name || null,
          contact_phone: lead_info?.contact_phone || null,
          contact_email: lead_info?.contact_email || null,
        })
        .select()
        .single();
      lead_id = newLead.id;
      const newToken = session_token || crypto.randomUUID();
      const { data: newConv } = await sb
        .from("sales_conversations")
        .insert({ company_id: cid, lead_id, session_token: newToken })
        .select()
        .single();
      conv = newConv;
    }

    conversation_id = conv.id;
    lead_id = conv.lead_id;
    const companyId = conv.company_id;

    // Load company-specific AI settings
    let openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
    let openRouterModel = Deno.env.get("OPENROUTER_MODEL") || "google/gemini-2.5-flash";
    let openRouterBaseUrl = Deno.env.get("OPENROUTER_BASE_URL") || "https://openrouter.ai/api/v1";

    const { data: shopSettings } = await sb
      .from("shop_settings")
      .select("value")
      .eq("company_id", companyId)
      .eq("key", "ai_provider_config")
      .maybeSingle();

    if (shopSettings?.value) {
      const configVal = shopSettings.value as any;
      if ((configVal.provider === "openrouter" || !configVal.provider) && configVal.openRouterApiKey) {
        openRouterApiKey = configVal.openRouterApiKey;
        if (configVal.openRouterModel) openRouterModel = configVal.openRouterModel;
        if (configVal.openRouterBaseUrl) openRouterBaseUrl = configVal.openRouterBaseUrl;
      }
    }

    if (!openRouterApiKey && !LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY/OPENROUTER_API_KEY is not configured");
    }

    // Load config
    const { data: cfg } = await sb
      .from("sales_agent_config")
      .select("*")
      .eq("company_id", companyId)
      .maybeSingle();
    const config = cfg || {
      agent_name: "Trá»£ lÃ½ bÃ¡n hÃ ng",
      greeting: "Xin chÃ o!",
      persona: "Báº¡n lÃ  trá»£ lÃ½ bÃ¡n hÃ ng chuyÃªn nghiá»‡p, thÃ¢n thiá»‡n, nÃ³i tiáº¿ng Viá»‡t.",
      auto_create_order: false,
      auto_create_quotation: true,
      max_order_value: 5000000,
      handoff_keywords: ["gáº·p ngÆ°á» i", "khiáº¿u náº¡i"],
    };

    // Handoff check on user message
    const lower = message.toLowerCase();
    const triggered = (config.handoff_keywords || []).some((k: string) => k && lower.includes(k.toLowerCase()));
    if (triggered) {
      await sb
        .from("sales_conversations")
        .update({ agent_mode: "human", status: "handoff" })
        .eq("id", conversation_id);
    }

    // Save user message
    await sb.from("sales_messages").insert({
      conversation_id,
      role: "user",
      content: message,
    });

    if (conv.agent_mode === "human" || triggered) {
      const reply = "Cáº£m Æ¡n báº¡n! YÃªu cáº§u Ä‘Ã£ Ä‘Æ°á»£c chuyá»ƒn Ä‘áº¿n nhÃ¢n viÃªn há»— trá»£, sáº½ pháº£n há»“i sá»›m nháº¥t.";
      await sb.from("sales_messages").insert({ conversation_id, role: "assistant", content: reply });
      return new Response(
        JSON.stringify({
          conversation_id,
          lead_id,
          session_token: conv.session_token,
          reply,
          handoff: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Build conversation history
    const { data: history } = await sb
      .from("sales_messages")
      .select("role, content, tool_calls, tool_results")
      .eq("conversation_id", conversation_id)
      .order("created_at", { ascending: true })
      .limit(30);

    const systemPrompt = `${config.persona}
TÃªn cá»§a báº¡n: ${config.agent_name}.
Báº¡n Ä‘ang tÆ° váº¥n cho khÃ¡ch hÃ ng tiá» m nÄƒng (Lead ID: ${lead_id}, Company: ${companyId}).
Báº¡n cÃ³ cÃ¡c cÃ´ng cá»¥: search_products, check_stock, list_active_vouchers, create_quotation_draft, create_order, request_human_handoff, update_lead_info.
Quy táº¯c:
- LuÃ´n dÃ¹ng search_products trÆ°á»›c khi bÃ¡o giÃ¡ Ä‘á»ƒ Ä‘áº£m báº£o Ä‘Ãºng sáº£n pháº©m vÃ  giÃ¡.
- Khi khÃ¡ch cho thÃ´ng tin liÃªn há»‡, gá» i update_lead_info ngay.
- Khi khÃ¡ch Ä‘á»“ng Ã½ mua, Æ°u tiÃªn create_quotation_draft trÆ°á»›c; náº¿u khÃ¡ch yÃªu cáº§u chá»‘t Ä‘Æ¡n ngay thÃ¬ create_order.
- Náº¿u giÃ¡ trá»‹ > ${config.max_order_value}Ä‘ hoáº·c khÃ¡ch yÃªu cáº§u phá»©c táº¡p, gá» i request_human_handoff.
- Tráº£ lá» i báº±ng tiáº¿ng Viá»‡t, ngáº¯n gá» n, cÃ³ cáº¥u trÃºc, dÃ¹ng markdown khi cáº§n.`;

    const messages: any[] = [{ role: "system", content: systemPrompt }];
    for (const m of history || []) {
      if (m.role === "user" || m.role === "assistant") {
        messages.push({ role: m.role, content: m.content || "" });
      }
    }

    // Multi-round tool calling (max 4 rounds)
    let finalReply = "";
    const allToolCalls: any[] = [];
    for (let round = 0; round < 4; round++) {
      const aiResp = await fetch((openRouterApiKey ? (openRouterBaseUrl + "/chat/completions") : "https://ai.gateway.lovable.dev/v1/chat/completions"), {
        method: "POST",
        headers: { Authorization: `Bearer ${openRouterApiKey || LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: openRouterModel || "google/gemini-3-flash-preview",
          messages,
          tools: TOOLS,
        }),
      });
      if (!aiResp.ok) {
        const txt = await aiResp.text();
        if (aiResp.status === 429) {
          return new Response(
            JSON.stringify({ error: "Há»‡ thá»‘ng AI Ä‘ang táº£i cao, vui lÃ²ng thá»­ láº¡i sau." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        if (aiResp.status === 402) {
          return new Response(
            JSON.stringify({ error: "TÃ­n dá»¥ng AI Ä‘Ã£ háº¿t. Vui lÃ²ng náº¡p thÃªm trong cÃ i Ä‘áº·t." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        throw new Error(`AI gateway: ${aiResp.status} ${txt}`);
      }
      const result = await aiResp.json();
      const choice = result.choices?.[0];
      const am = choice?.message;
      if (!am) break;
      messages.push(am);

      if (choice.finish_reason === "tool_calls" && am.tool_calls?.length) {
        for (const tc of am.tool_calls) {
          const fnName = tc.function.name;
          const fnArgs = JSON.parse(tc.function.arguments || "{}");
          const out = await executeTool(fnName, fnArgs, {
            sb,
            companyId,
            leadId: lead_id,
            conversationId: conversation_id,
            config,
          });
          allToolCalls.push({ name: fnName, args: fnArgs, result: out });
          messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(out) });
        }
        continue;
      }

      finalReply = am.content || "";
      break;
    }

    if (!finalReply) finalReply = "Xin lá»—i, tÃ´i cáº§n thÃªm thÃ´ng tin Ä‘á»ƒ há»— trá»£ báº¡n.";

    await sb.from("sales_messages").insert({
      conversation_id,
      role: "assistant",
      content: finalReply,
      tool_calls: allToolCalls.length ? allToolCalls : null,
    });

    return new Response(
      JSON.stringify({
        conversation_id,
        lead_id,
        session_token: conv.session_token,
        reply: finalReply,
        tool_calls: allToolCalls,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("sales-agent error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});



