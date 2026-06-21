import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GHN_API_URL = "https://online-gateway.ghn.vn/shiip/public-api";
const GHN_TRACKING_URL = "https://online-gateway.ghn.vn/shiip/public-api";

interface CarrierAdapter {
  createShipment(params: any, token: string, shopId: string): Promise<any>;
  trackShipment(trackingCode: string, token: string): Promise<any>;
  cancelShipment(trackingCode: string, token: string, shopId: string): Promise<any>;
  calculateFee(params: any, token: string, shopId: string): Promise<any>;
  getProvinces(token: string): Promise<any>;
  getDistricts(provinceId: number, token: string): Promise<any>;
  getWards(districtId: number, token: string): Promise<any>;
}

const ghnAdapter: CarrierAdapter = {
  async createShipment(params, token, shopId) {
    const res = await fetch(`${GHN_API_URL}/v2/shipping-order/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Token: token,
        ShopId: shopId,
      },
      body: JSON.stringify({
        payment_type_id: params.payment_type_id || 2,
        note: params.note || "",
        required_note: params.required_note || "KHONGCHOXEMHANG",
        to_name: params.to_name,
        to_phone: params.to_phone,
        to_address: params.to_address,
        to_ward_name: params.to_ward_name,
        to_district_id: params.to_district_id,
        cod_amount: params.cod_amount || 0,
        weight: params.weight || 200,
        length: params.length || 20,
        width: params.width || 20,
        height: params.height || 10,
        service_type_id: params.service_type_id || 2,
        items: params.items || [],
      }),
    });
    const data = await res.json();
    if (data.code !== 200) throw new Error(data.message || "GHN create shipment failed");
    return data.data;
  },

  async trackShipment(trackingCode, token) {
    const res = await fetch(`${GHN_TRACKING_URL}/v2/shipping-order/detail`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Token: token },
      body: JSON.stringify({ order_code: trackingCode }),
    });
    const data = await res.json();
    if (data.code !== 200) throw new Error(data.message || "GHN tracking failed");
    return data.data;
  },

  async cancelShipment(trackingCode, token, shopId) {
    const res = await fetch(`${GHN_API_URL}/v2/switch-status/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Token: token, ShopId: shopId },
      body: JSON.stringify({ order_codes: [trackingCode] }),
    });
    const data = await res.json();
    if (data.code !== 200) throw new Error(data.message || "GHN cancel failed");
    return data.data;
  },

  async calculateFee(params, token, shopId) {
    const res = await fetch(`${GHN_API_URL}/v2/shipping-order/fee`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Token: token, ShopId: shopId },
      body: JSON.stringify({
        service_type_id: params.service_type_id || 2,
        to_district_id: params.to_district_id,
        to_ward_code: params.to_ward_code,
        weight: params.weight || 200,
        length: params.length || 20,
        width: params.width || 20,
        height: params.height || 10,
        insurance_value: params.insurance_value || 0,
        cod_value: params.cod_value || 0,
      }),
    });
    const data = await res.json();
    if (data.code !== 200) throw new Error(data.message || "GHN fee calculation failed");
    return data.data;
  },

  async getProvinces(token) {
    const res = await fetch(`${GHN_API_URL}/master-data/province`, {
      method: "GET",
      headers: { "Content-Type": "application/json", Token: token },
    });
    const data = await res.json();
    if (data.code !== 200) throw new Error(data.message || "GHN get provinces failed");
    return data.data;
  },

  async getDistricts(provinceId, token) {
    const res = await fetch(`${GHN_API_URL}/master-data/district`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Token: token },
      body: JSON.stringify({ province_id: provinceId }),
    });
    const data = await res.json();
    if (data.code !== 200) throw new Error(data.message || "GHN get districts failed");
    return data.data;
  },

  async getWards(districtId, token) {
    const res = await fetch(`${GHN_API_URL}/master-data/ward`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Token: token },
      body: JSON.stringify({ district_id: districtId }),
    });
    const data = await res.json();
    if (data.code !== 200) throw new Error(data.message || "GHN get wards failed");
    return data.data;
  },
};

const adapters: Record<string, CarrierAdapter> = {
  ghn: ghnAdapter,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify auth
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) throw new Error("Unauthorized");

    const body = await req.json();
    const { action, carrier_id, params } = body;

    // Get carrier config
    const { data: carrier, error: carrierError } = await supabase
      .from("shipping_carriers")
      .select("*")
      .eq("id", carrier_id)
      .single();

    if (carrierError || !carrier) throw new Error("Carrier not found");
    if (!carrier.api_token) throw new Error("Carrier API token not configured");

    const adapter = adapters[carrier.code];
    if (!adapter) throw new Error(`Carrier ${carrier.code} is not supported yet`);

    let result: any;

    switch (action) {
      case "create_shipment":
        result = await adapter.createShipment(params, carrier.api_token, carrier.shop_id || "");
        // Save shipment to DB
        if (result.order_code) {
          await supabase.from("shipments").insert({
            order_id: params.order_id,
            carrier_id: carrier.id,
            tracking_code: result.order_code,
            carrier_status: "created",
            shipping_fee_actual: result.total_fee || 0,
            cod_amount: params.cod_amount || 0,
            weight_grams: params.weight || 0,
            carrier_response: result,
          });
        }
        break;

      case "track_shipment":
        result = await adapter.trackShipment(params.tracking_code, carrier.api_token);
        // Update shipment status
        if (params.shipment_id) {
          await supabase.from("shipments").update({
            carrier_status: result.status,
            carrier_response: result,
          }).eq("id", params.shipment_id);
        }
        break;

      case "cancel_shipment":
        result = await adapter.cancelShipment(params.tracking_code, carrier.api_token, carrier.shop_id || "");
        if (params.shipment_id) {
          await supabase.from("shipments").update({
            carrier_status: "cancelled",
          }).eq("id", params.shipment_id);
        }
        break;

      case "calculate_fee":
        result = await adapter.calculateFee(params, carrier.api_token, carrier.shop_id || "");
        break;

      case "get_provinces":
        result = await adapter.getProvinces(carrier.api_token);
        break;

      case "get_districts":
        result = await adapter.getDistricts(params.province_id, carrier.api_token);
        break;

      case "get_wards":
        result = await adapter.getWards(params.district_id, carrier.api_token);
        break;

      case "test_connection":
        result = await adapter.getProvinces(carrier.api_token);
        result = { success: true, message: "Kết nối thành công!" };
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Shipping carrier proxy error:", message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
