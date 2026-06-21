import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── HMAC-SHA256 Utility for Shopee ──

async function hmacSHA256(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function shopeeSign(partnerId: string, partnerKey: string, path: string, timestamp: number, accessToken?: string, shopId?: string): Promise<string> {
  let baseString = `${partnerId}${path}${timestamp}`;
  if (accessToken && shopId) {
    baseString += `${accessToken}${shopId}`;
  }
  return hmacSHA256(partnerKey, baseString);
}

// ── Platform Adapters ──

interface PlatformAdapter {
  getAuthUrl(credentials: Record<string, string>, redirectUri: string): Promise<string> | string;
  exchangeToken(credentials: Record<string, string>, code: string, redirectUri: string): Promise<TokenResult>;
  refreshToken(credentials: Record<string, string>, refreshToken: string): Promise<TokenResult>;
  fetchOrders(accessToken: string, credentials: Record<string, string>, params: SyncParams): Promise<PlatformOrder[]>;
}

interface TokenResult {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

interface SyncParams {
  from_date?: string;
  to_date?: string;
  page?: number;
  page_size?: number;
}

interface PlatformOrder {
  platform_order_id: string;
  platform_status: string;
  mapped_status: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  shipping_province?: string;
  payment_method?: string;
  external_created_at?: string;
  total_amount: number;
  shipping_fee?: number;
  items: PlatformOrderItem[];
  raw_data: Record<string, unknown>;
}

interface PlatformOrderItem {
  sku: string;
  name: string;
  quantity: number;
  price: number;
}

function normalizePhone(value?: string) {
  return (value || "").replace(/\D/g, "");
}

function calculateOrderQualityScore(input: {
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  payment_method?: string;
  total_amount?: number;
  items?: PlatformOrderItem[];
}) {
  const checks = [
    input.customer_name,
    input.customer_phone,
    input.customer_address,
    input.payment_method,
    typeof input.total_amount === "number" && input.total_amount > 0,
    Array.isArray(input.items) && input.items.length > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

async function upsertPlatformDataSource(adminClient: any, channel: any, ingestedAt: string) {
  if (!channel.company_id) return;
  const { error } = await adminClient.from("data_sources").upsert({
    company_id: channel.company_id,
    channel_id: channel.id,
    code: `channel_${channel.code || channel.id}`,
    name: channel.name || channel.code || channel.platform_type || "Marketplace",
    source_type: "marketplace",
    status: "active",
    config: {
      platform_type: channel.platform_type,
      channel_code: channel.code,
    },
    mapping: {
      entity: "order",
      external_id: "platform_order_id",
    },
    last_ingested_at: ingestedAt,
    last_error: null,
  }, { onConflict: "company_id,code" });

  if (error && !["42P01", "42703", "PGRST205", "PGRST204"].includes(error.code || "")) {
    console.warn("Data source upsert failed", error.message);
  }
}

async function recordRawEvent(adminClient: any, input: Record<string, unknown>) {
  if (!input.company_id) return;
  const { error } = await adminClient.from("raw_events").insert(input);
  if (error && !["23505", "42P01", "42703", "PGRST205", "PGRST204"].includes(error.code || "")) {
    console.warn("Raw event insert failed", error.message);
  }
}

// ── Shopee Adapter ──

const ShopeeAdapter: PlatformAdapter = {
  async getAuthUrl(credentials, redirectUri) {
    const partnerId = credentials.partner_id;
    const partnerKey = credentials.partner_key || "";
    const timestamp = Math.floor(Date.now() / 1000);
    const path = "/api/v2/shop/auth_partner";
    const baseUrl = "https://partner.shopeemobile.com";
    const sign = await shopeeSign(partnerId, partnerKey, path, timestamp);
    return `${baseUrl}${path}?partner_id=${partnerId}&timestamp=${timestamp}&sign=${sign}&redirect=${encodeURIComponent(redirectUri)}`;
  },

  async exchangeToken(credentials, code, _redirectUri) {
    const partnerId = credentials.partner_id;
    const partnerKey = credentials.partner_key || "";
    const shopId = credentials.shop_id;
    const timestamp = Math.floor(Date.now() / 1000);
    const path = "/api/v2/auth/token/get";
    const sign = await shopeeSign(partnerId, partnerKey, path, timestamp);

    const url = `https://partner.shopeemobile.com${path}?partner_id=${partnerId}&timestamp=${timestamp}&sign=${sign}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        partner_id: Number(partnerId),
        shop_id: Number(shopId),
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.message || "Shopee token exchange failed");
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expire_in || 14400,
    };
  },

  async refreshToken(credentials, refreshToken) {
    const partnerId = credentials.partner_id;
    const partnerKey = credentials.partner_key || "";
    const shopId = credentials.shop_id;
    const timestamp = Math.floor(Date.now() / 1000);
    const path = "/api/v2/auth/access_token/get";
    const sign = await shopeeSign(partnerId, partnerKey, path, timestamp);

    const url = `https://partner.shopeemobile.com${path}?partner_id=${partnerId}&timestamp=${timestamp}&sign=${sign}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        refresh_token: refreshToken,
        partner_id: Number(partnerId),
        shop_id: Number(shopId),
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.message || "Shopee token refresh failed");
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expire_in || 14400,
    };
  },

  async fetchOrders(accessToken, credentials, params) {
    const partnerId = credentials.partner_id;
    const partnerKey = credentials.partner_key || "";
    const shopId = credentials.shop_id;
    const timestamp = Math.floor(Date.now() / 1000);

    const fromDate = params.from_date
      ? Math.floor(new Date(params.from_date).getTime() / 1000)
      : Math.floor(Date.now() / 1000) - 7 * 86400;
    const toDate = params.to_date
      ? Math.floor(new Date(params.to_date).getTime() / 1000)
      : Math.floor(Date.now() / 1000);

    // Step 1: Get order list
    const listPath = "/api/v2/order/get_order_list";
    const listSign = await shopeeSign(partnerId, partnerKey, listPath, timestamp, accessToken, shopId);

    const listUrl = new URL(`https://partner.shopeemobile.com${listPath}`);
    listUrl.searchParams.set("access_token", accessToken);
    listUrl.searchParams.set("shop_id", shopId);
    listUrl.searchParams.set("partner_id", partnerId);
    listUrl.searchParams.set("timestamp", timestamp.toString());
    listUrl.searchParams.set("sign", listSign);
    listUrl.searchParams.set("time_range_field", "create_time");
    listUrl.searchParams.set("time_from", fromDate.toString());
    listUrl.searchParams.set("time_to", toDate.toString());
    listUrl.searchParams.set("page_size", (params.page_size || 50).toString());
    listUrl.searchParams.set("cursor", ((params.page || 0) * (params.page_size || 50)).toString());

    const listRes = await fetch(listUrl.toString());
    const listData = await listRes.json();

    if (listData.error) throw new Error(listData.message || "Shopee fetch orders failed");

    const orderList = listData.response?.order_list || [];
    if (orderList.length === 0) return [];

    // Step 2: Get order details (includes items)
    const orderSns = orderList.map((o: any) => o.order_sn).join(",");
    const detailPath = "/api/v2/order/get_order_detail";
    const detailTimestamp = Math.floor(Date.now() / 1000);
    const detailSign = await shopeeSign(partnerId, partnerKey, detailPath, detailTimestamp, accessToken, shopId);

    const detailUrl = new URL(`https://partner.shopeemobile.com${detailPath}`);
    detailUrl.searchParams.set("access_token", accessToken);
    detailUrl.searchParams.set("shop_id", shopId);
    detailUrl.searchParams.set("partner_id", partnerId);
    detailUrl.searchParams.set("timestamp", detailTimestamp.toString());
    detailUrl.searchParams.set("sign", detailSign);
    detailUrl.searchParams.set("order_sn_list", orderSns);
    detailUrl.searchParams.set("response_optional_fields", "item_list,buyer_username,estimated_shipping_fee,total_amount");

    const detailRes = await fetch(detailUrl.toString());
    const detailData = await detailRes.json();
    const detailedOrders = detailData.response?.order_list || orderList;

    return detailedOrders.map((o: any) => ({
      platform_order_id: o.order_sn,
      platform_status: o.order_status,
      mapped_status: mapShopeeStatus(o.order_status),
      customer_name: o.buyer_username,
      payment_method: "platform",
      external_created_at: o.create_time ? new Date(o.create_time * 1000).toISOString() : undefined,
      total_amount: o.total_amount || 0,
      shipping_fee: o.estimated_shipping_fee || 0,
      items: (o.item_list || []).map((item: any) => ({
        sku: item.item_sku || item.model_sku || "",
        name: item.item_name || "",
        quantity: item.model_quantity_purchased || item.quantity || 1,
        price: item.model_discounted_price || item.model_original_price || 0,
      })),
      raw_data: o,
    }));
  },
};

function mapShopeeStatus(status: string): string {
  const map: Record<string, string> = {
    UNPAID: "pending",
    READY_TO_SHIP: "confirmed",
    PROCESSED: "processing",
    SHIPPED: "shipping",
    COMPLETED: "delivered",
    IN_CANCEL: "cancelled",
    CANCELLED: "cancelled",
    INVOICE_PENDING: "pending",
  };
  return map[status] || "pending";
}

// ── Lazada Adapter ──

const LazadaAdapter: PlatformAdapter = {
  getAuthUrl(credentials, redirectUri) {
    const appKey = credentials.app_key;
    return `https://auth.lazada.com/oauth/authorize?response_type=code&force_auth=true&redirect_uri=${encodeURIComponent(redirectUri)}&client_id=${appKey}`;
  },

  async exchangeToken(credentials, code, _redirectUri) {
    const res = await fetch("https://auth.lazada.com/rest/auth/token/create", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        app_key: credentials.app_key,
        app_secret: credentials.app_secret,
      }),
    });
    const data = await res.json();
    if (data.code !== "0") throw new Error(data.message || "Lazada token exchange failed");
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in || 604800,
    };
  },

  async refreshToken(credentials, refreshToken) {
    const res = await fetch("https://auth.lazada.com/rest/auth/token/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        app_key: credentials.app_key,
        app_secret: credentials.app_secret,
      }),
    });
    const data = await res.json();
    if (data.code !== "0") throw new Error(data.message || "Lazada token refresh failed");
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in || 604800,
    };
  },

  async fetchOrders(accessToken, credentials, params) {
    // Step 1: Get order list
    const listUrl = new URL("https://api.lazada.vn/rest/orders/get");
    listUrl.searchParams.set("access_token", accessToken);
    listUrl.searchParams.set("app_key", credentials.app_key);
    if (params.from_date) listUrl.searchParams.set("created_after", params.from_date);
    listUrl.searchParams.set("limit", (params.page_size || 50).toString());
    listUrl.searchParams.set("offset", ((params.page || 0) * (params.page_size || 50)).toString());

    const listRes = await fetch(listUrl.toString());
    const listData = await listRes.json();

    const orderList = listData.data?.orders || [];
    
    // Step 2: Fetch items for each order
    const results: PlatformOrder[] = [];
    for (const o of orderList) {
      let items: PlatformOrderItem[] = [];
      try {
        const itemsUrl = new URL("https://api.lazada.vn/rest/order/items/get");
        itemsUrl.searchParams.set("access_token", accessToken);
        itemsUrl.searchParams.set("app_key", credentials.app_key);
        itemsUrl.searchParams.set("order_id", o.order_id?.toString());
        const itemsRes = await fetch(itemsUrl.toString());
        const itemsData = await itemsRes.json();
        items = (itemsData.data || []).map((item: any) => ({
          sku: item.sku || "",
          name: item.name || "",
          quantity: item.quantity || 1,
          price: parseFloat(item.paid_price || item.item_price) || 0,
        }));
      } catch {
        // Items fetch failed, continue without items
      }

      results.push({
        platform_order_id: o.order_id?.toString(),
        platform_status: o.statuses?.[0] || o.status,
        mapped_status: mapLazadaStatus(o.statuses?.[0] || o.status),
        customer_name: `${o.address_billing?.first_name || ""} ${o.address_billing?.last_name || ""}`.trim(),
        customer_phone: o.address_billing?.phone,
        customer_email: o.customer_email,
        customer_address: o.address_shipping?.address1,
        shipping_province: o.address_shipping?.region || o.address_shipping?.city,
        payment_method: "platform",
        external_created_at: o.created_at,
        total_amount: parseFloat(o.price) || 0,
        items,
        raw_data: o,
      });
    }
    return results;
  },
};

function mapLazadaStatus(status: string): string {
  const map: Record<string, string> = {
    pending: "pending",
    packed: "processing",
    ready_to_ship: "confirmed",
    shipped: "shipping",
    delivered: "delivered",
    failed: "cancelled",
    canceled: "cancelled",
    returned: "returned",
  };
  return map[status?.toLowerCase()] || "pending";
}

// ── TikTok Shop Adapter ──

const TiktokAdapter: PlatformAdapter = {
  getAuthUrl(credentials, _redirectUri) {
    const appKey = credentials.app_key;
    return `https://auth.tiktok-shops.com/oauth/authorize?app_key=${appKey}&state=tiktok`;
  },

  async exchangeToken(credentials, code, _redirectUri) {
    const res = await fetch("https://auth.tiktok-shops.com/api/v2/token?app_key=" + credentials.app_key + "&app_secret=" + credentials.app_secret + "&auth_code=" + code + "&grant_type=authorized_code", {
      method: "GET",
    });
    const data = await res.json();
    if (data.code !== 0) throw new Error(data.message || "TikTok token exchange failed");
    return {
      access_token: data.data?.access_token,
      refresh_token: data.data?.refresh_token,
      expires_in: data.data?.access_token_expire_in || 86400,
    };
  },

  async refreshToken(credentials, refreshToken) {
    const res = await fetch("https://auth.tiktok-shops.com/api/v2/token/refresh?app_key=" + credentials.app_key + "&app_secret=" + credentials.app_secret + "&refresh_token=" + refreshToken + "&grant_type=refresh_token", {
      method: "GET",
    });
    const data = await res.json();
    if (data.code !== 0) throw new Error(data.message || "TikTok token refresh failed");
    return {
      access_token: data.data?.access_token,
      refresh_token: data.data?.refresh_token,
      expires_in: data.data?.access_token_expire_in || 86400,
    };
  },

  async fetchOrders(accessToken, credentials, params) {
    const res = await fetch("https://open-api.tiktokglobalshop.com/api/orders/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tts-access-token": accessToken,
      },
      body: JSON.stringify({
        page_size: params.page_size || 50,
        sort_by: "CREATE_TIME",
        sort_type: 2,
      }),
    });
    const data = await res.json();
    const orderList = data.data?.order_list || [];
    return orderList.map((o: any) => ({
      platform_order_id: o.order_id,
      platform_status: o.order_status?.toString(),
      mapped_status: mapTiktokStatus(o.order_status),
      customer_name: o.recipient_address?.name,
      customer_phone: o.recipient_address?.phone,
      customer_address: o.recipient_address?.full_address,
      shipping_province: o.recipient_address?.region,
      payment_method: "platform",
      external_created_at: o.create_time ? new Date(Number(o.create_time) * 1000).toISOString() : undefined,
      total_amount: parseFloat(o.payment_info?.total_amount) || 0,
      shipping_fee: parseFloat(o.payment_info?.shipping_fee) || 0,
      items: (o.item_list || []).map((item: any) => ({
        sku: item.seller_sku || "",
        name: item.product_name || "",
        quantity: item.quantity || 1,
        price: parseFloat(item.sale_price) || 0,
      })),
      raw_data: o,
    }));
  },
};

function mapTiktokStatus(status: number): string {
  const map: Record<number, string> = {
    100: "pending",
    111: "confirmed",
    112: "processing",
    114: "shipping",
    121: "delivered",
    130: "delivered",
    140: "cancelled",
  };
  return map[status] || "pending";
}

// ── Tiki Adapter ──

const TikiAdapter: PlatformAdapter = {
  getAuthUrl(_credentials, _redirectUri) {
    return "https://api.tiki.vn/integration/v2.1/auth";
  },

  async exchangeToken(credentials, code, _redirectUri) {
    return {
      access_token: credentials.api_token || code,
      refresh_token: "",
      expires_in: 999999,
    };
  },

  async refreshToken(credentials, _refreshToken) {
    return {
      access_token: credentials.api_token || "",
      refresh_token: "",
      expires_in: 999999,
    };
  },

  async fetchOrders(accessToken, _credentials, params) {
    const url = new URL("https://api.tiki.vn/integration/v2.1/orders");
    url.searchParams.set("page", ((params.page || 0) + 1).toString());
    url.searchParams.set("limit", (params.page_size || 50).toString());

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    const orderList = data.data || [];
    return orderList.map((o: any) => ({
      platform_order_id: o.code || o.order_code,
      platform_status: o.status,
      mapped_status: mapTikiStatus(o.status),
      customer_name: o.shipping?.name,
      customer_phone: o.shipping?.phone,
      customer_address: o.shipping?.street,
      shipping_province: o.shipping?.region || o.shipping?.city,
      payment_method: "platform",
      external_created_at: o.created_at,
      total_amount: o.grand_total || 0,
      shipping_fee: o.shipping_fee || 0,
      items: (o.items || []).map((item: any) => ({
        sku: item.seller_product_code || "",
        name: item.product_name || "",
        quantity: item.qty || 1,
        price: item.price || 0,
      })),
      raw_data: o,
    }));
  },
};

function mapTikiStatus(status: string): string {
  const map: Record<string, string> = {
    queueing: "pending",
    seller_confirmed: "confirmed",
    preparing: "processing",
    shipping: "shipping",
    delivered: "delivered",
    successful_delivery: "delivered",
    canceled: "cancelled",
    returned: "returned",
  };
  return map[status?.toLowerCase()] || "pending";
}

// ── VietERP Adapter ──

const VietERPAdapter: PlatformAdapter = {
  getAuthUrl(_credentials, _redirectUri) {
    return "";
  },

  async exchangeToken(credentials, code, _redirectUri) {
    return {
      access_token: credentials.api_key || code,
      refresh_token: "",
      expires_in: 999999,
    };
  },

  async refreshToken(credentials, _refreshToken) {
    return {
      access_token: credentials.api_key || "",
      refresh_token: "",
      expires_in: 999999,
    };
  },

  async fetchOrders(accessToken, credentials, params) {
    const baseUrl = credentials.base_url || "https://api.vierp.vn/api/v1";
    const tenantId = credentials.tenant_id || "";
    
    const url = new URL(`${baseUrl}/ecommerce/orders`);
    url.searchParams.set("page", ((params.page || 0) + 1).toString());
    url.searchParams.set("limit", (params.page_size || 50).toString());

    const headers: Record<string, string> = {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    };
    if (tenantId) {
      headers["X-Tenant-ID"] = tenantId;
    }

    const res = await fetch(url.toString(), { headers });
    if (!res.ok) {
      throw new Error(`VietERP API returned status ${res.status}`);
    }

    const data = await res.json();
    const orderList = data.data || [];
    return orderList.map((o: any) => ({
      platform_order_id: o.id || o.orderNumber,
      platform_status: o.status,
      mapped_status: mapVietERPStatus(o.status),
      customer_name: o.customer?.name,
      customer_phone: o.customer?.phone || "",
      customer_address: o.customer?.email || "",
      shipping_province: "",
      payment_method: "platform",
      external_created_at: o.createdAt || new Date().toISOString(),
      total_amount: o.totalAmount || o.grandTotal || 0,
      shipping_fee: o.shippingFee || 0,
      items: (o.items || []).map((item: any) => ({
        sku: item.productId || "",
        name: item.productName || "",
        quantity: item.quantity || 1,
        price: item.unitPrice || 0,
      })),
      raw_data: o,
    }));
  },
};

function mapVietERPStatus(status: string): string {
  const map: Record<string, string> = {
    pending: "pending",
    confirmed: "confirmed",
    processing: "processing",
    shipped: "shipping",
    delivered: "delivered",
    cancelled: "cancelled",
    returned: "returned",
  };
  return map[status?.toLowerCase()] || "pending";
}

// ── Adapter Registry ──

function getAdapter(platformType: string): PlatformAdapter {
  switch (platformType) {
    case "shopee": return ShopeeAdapter;
    case "lazada": return LazadaAdapter;
    case "tiktok": return TiktokAdapter;
    case "tiki": return TikiAdapter;
    case "vieterp": return VietERPAdapter;
    default: throw new Error(`Unsupported platform: ${platformType}`);
  }
}

// ── Main Handler ──

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Fix: use getUser() instead of non-existent getClaims()
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, channel_id, code, redirect_uri, sync_params } = body;

    switch (action) {
      case "get_auth_url": {
        const { data: channel } = await supabase
          .from("sales_channels")
          .select("*")
          .eq("id", channel_id)
          .single();
        if (!channel) throw new Error("Channel not found");
        const adapter = getAdapter(channel.platform_type);
        const url = await adapter.getAuthUrl(channel.api_credentials || {}, redirect_uri || "");
        return new Response(JSON.stringify({ url }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "exchange_token": {
        const { data: channel } = await supabase
          .from("sales_channels")
          .select("*")
          .eq("id", channel_id)
          .single();
        if (!channel) throw new Error("Channel not found");
        const adapter = getAdapter(channel.platform_type);
        const tokens = await adapter.exchangeToken(
          channel.api_credentials || {},
          code,
          redirect_uri || ""
        );

        const adminClient = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        await adminClient.from("sales_channels").update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          sync_enabled: true,
        }).eq("id", channel_id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "refresh_token": {
        const adminClient = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        const { data: channel } = await adminClient
          .from("sales_channels")
          .select("*")
          .eq("id", channel_id)
          .single();
        if (!channel) throw new Error("Channel not found");
        const adapter = getAdapter(channel.platform_type);
        const tokens = await adapter.refreshToken(
          channel.api_credentials || {},
          channel.refresh_token || ""
        );
        await adminClient.from("sales_channels").update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        }).eq("id", channel_id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "sync_orders": {
        const adminClient = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        const { data: channel } = await adminClient
          .from("sales_channels")
          .select("*")
          .eq("id", channel_id)
          .single();
        if (!channel) throw new Error("Channel not found");

        // Create sync log
        const { data: syncLog } = await supabase
          .from("sync_logs")
          .insert({
            company_id: channel.company_id,
            channel_id: channel.id,
            sync_type: "orders",
            status: "running",
          })
          .select()
          .single();

        try {
          // Check token expiry and refresh if needed
          if (channel.token_expires_at && new Date(channel.token_expires_at) < new Date()) {
            const adapter = getAdapter(channel.platform_type);
            const tokens = await adapter.refreshToken(
              channel.api_credentials || {},
              channel.refresh_token || ""
            );
            await adminClient.from("sales_channels").update({
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token,
              token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
            }).eq("id", channel_id);
            channel.access_token = tokens.access_token;
          }

          const adapter = getAdapter(channel.platform_type);
          const platformOrders = await adapter.fetchOrders(
            channel.access_token || "",
            channel.api_credentials || {},
            sync_params || {}
          );
          const syncStartedAt = new Date().toISOString();
          await upsertPlatformDataSource(adminClient, channel, syncStartedAt);

          let synced = 0;
          let failed = 0;

          for (const po of platformOrders) {
            try {
              const syncedAt = new Date().toISOString();
              // Check if order already exists
              const { data: existing } = await supabase
                .from("orders")
                .select("id")
                .eq("platform_order_id", po.platform_order_id)
                .eq("company_id", channel.company_id)
                .maybeSingle();

              if (existing) {
                // Update status
                await supabase.from("orders").update({
                  source_type: "platform",
                  platform_status: po.platform_status,
                  status: po.mapped_status,
                  customer_name: po.customer_name || null,
                  customer_phone: normalizePhone(po.customer_phone) || null,
                  customer_email: po.customer_email || null,
                  customer_address: po.customer_address || null,
                  shipping_province: po.shipping_province || null,
                  shipping_address: po.customer_address || null,
                  total: po.total_amount,
                  shipping_fee: po.shipping_fee || 0,
                  payment_method: po.payment_method || "platform",
                  platform_data: po.raw_data,
                  external_created_at: po.external_created_at || null,
                  last_synced_at: syncedAt,
                }).eq("id", existing.id);
                await recordRawEvent(adminClient, {
                  company_id: channel.company_id,
                  source_type: "marketplace",
                  source_code: channel.platform_type || channel.code || "platform",
                  event_type: "order.updated",
                  entity_type: "order",
                  entity_id: existing.id,
                  external_id: po.platform_order_id,
                  dedupe_key: `${channel.company_id}:${channel.id}:${po.platform_order_id}:${po.platform_status}`,
                  raw_payload: po.raw_data,
                  normalized_payload: {
                    platform_order_id: po.platform_order_id,
                    platform_status: po.platform_status,
                    mapped_status: po.mapped_status,
                    customer_name: po.customer_name || null,
                    customer_phone: normalizePhone(po.customer_phone) || null,
                    total: po.total_amount,
                    items_count: po.items.length,
                  },
                  quality_score: calculateOrderQualityScore(po),
                  validation_status: "normalized",
                  ingestion_status: "processed",
                  occurred_at: po.external_created_at || syncedAt,
                  processed_at: syncedAt,
                });
              } else {
                // Find or create partner
                let partnerId = null;
                const normalizedPhone = normalizePhone(po.customer_phone);
                if (normalizedPhone) {
                  const { data: partner } = await supabase
                    .from("partners")
                    .select("id")
                    .eq("company_id", channel.company_id)
                    .eq("phone", normalizedPhone)
                    .maybeSingle();
                  partnerId = partner?.id || null;
                }
                if (!partnerId && (po.customer_name || normalizedPhone)) {
                  const { data: createdPartner } = await supabase
                    .from("partners")
                    .insert({
                      company_id: channel.company_id,
                      code: `PLT-${po.platform_order_id.slice(-8)}`,
                      name: po.customer_name || `Khách ${po.platform_order_id.slice(-6)}`,
                      phone: normalizedPhone || null,
                      email: po.customer_email || null,
                      address: po.customer_address || null,
                      partner_type: "customer",
                    })
                    .select("id")
                    .maybeSingle();
                  partnerId = createdPartner?.id || null;
                }

                // Create order
                const orderNumber = `${channel.code || "PLT"}-${po.platform_order_id.slice(-8)}`;
                const { data: newOrder } = await supabase.from("orders").insert({
                  company_id: channel.company_id,
                  channel_id: channel.id,
                  order_number: orderNumber,
                  source_type: "platform",
                  platform_order_id: po.platform_order_id,
                  platform_status: po.platform_status,
                  platform_data: po.raw_data,
                  status: po.mapped_status,
                  customer_name: po.customer_name || null,
                  customer_phone: normalizePhone(po.customer_phone) || null,
                  customer_email: po.customer_email || null,
                  customer_address: po.customer_address || null,
                  shipping_province: po.shipping_province || null,
                  total: po.total_amount,
                  shipping_fee: po.shipping_fee || 0,
                  partner_id: partnerId,
                  shipping_address: po.customer_address,
                  payment_method: po.payment_method || "platform",
                  external_created_at: po.external_created_at || null,
                  last_synced_at: syncedAt,
                  order_type: "b2c",
                }).select("id").single();

                // Sync order items if available
                if (newOrder && po.items.length > 0) {
                  for (const item of po.items) {
                    // Try to match product by SKU
                    let productId: string | null = null;
                    if (item.sku) {
                      const { data: product } = await supabase
                        .from("products")
                        .select("id")
                        .eq("company_id", channel.company_id)
                        .eq("sku", item.sku)
                        .maybeSingle();
                      productId = product?.id || null;
                    }
                    // Only insert if we can match a product
                    if (productId) {
                      await supabase.from("order_items").insert({
                        order_id: newOrder.id,
                        product_id: productId,
                        quantity: item.quantity,
                        unit_price: item.price,
                        total: item.quantity * item.price,
                      });
                    }
                  }
                }
                if (newOrder) {
                  await recordRawEvent(adminClient, {
                    company_id: channel.company_id,
                    source_type: "marketplace",
                    source_code: channel.platform_type || channel.code || "platform",
                    event_type: "order.created",
                    entity_type: "order",
                    entity_id: newOrder.id,
                    external_id: po.platform_order_id,
                    dedupe_key: `${channel.company_id}:${channel.id}:${po.platform_order_id}:${po.platform_status}`,
                    raw_payload: po.raw_data,
                    normalized_payload: {
                      order_id: newOrder.id,
                      platform_order_id: po.platform_order_id,
                      platform_status: po.platform_status,
                      mapped_status: po.mapped_status,
                      customer_name: po.customer_name || null,
                      customer_phone: normalizePhone(po.customer_phone) || null,
                      total: po.total_amount,
                      items_count: po.items.length,
                    },
                    quality_score: calculateOrderQualityScore(po),
                    validation_status: "normalized",
                    ingestion_status: "processed",
                    occurred_at: po.external_created_at || syncedAt,
                    processed_at: syncedAt,
                  });
                }
              }
              synced++;
            } catch {
              failed++;
            }
          }

          // Update sync log
          await supabase.from("sync_logs").update({
            status: failed > 0 ? "partial" : "success",
            records_synced: synced,
            records_failed: failed,
            completed_at: new Date().toISOString(),
          }).eq("id", syncLog?.id);

          // Update last_synced_at
          await adminClient.from("sales_channels").update({
            last_synced_at: new Date().toISOString(),
          }).eq("id", channel_id);

          return new Response(JSON.stringify({ synced, failed, total: platformOrders.length }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch (err) {
          await supabase.from("sync_logs").update({
            status: "failed",
            error_message: (err as Error).message,
            completed_at: new Date().toISOString(),
          }).eq("id", syncLog?.id);
          throw err;
        }
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
