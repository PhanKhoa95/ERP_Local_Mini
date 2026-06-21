import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-api-key, x-vneid-signature',
};

const SENSITIVE_SCOPES = ['write:tokens', 'write:shares'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  let statusCode = 400;
  let responseBody: Record<string, unknown> = {};

  try {
    const apiKey = req.headers.get('x-api-key');
    const signature = req.headers.get('x-vneid-signature');

    if (!apiKey) {
      throw new Error('API Key is required');
    }

    // 1. Lookup key
    const { data: keyRecord, error: keyError } = await supabaseClient
      .from('api_keys')
      .select('*')
      .eq('api_key_hash', apiKey)
      .eq('is_active', true)
      .single();

    if (keyError || !keyRecord) {
      throw new Error('Invalid or inactive API Key');
    }

    // 2. Check expiry
    if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
      throw new Error('API Key has expired');
    }

    // 3. Validate IP whitelist
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (keyRecord.allowed_ips && keyRecord.allowed_ips.length > 0) {
      if (!keyRecord.allowed_ips.includes(clientIp)) {
        throw new Error(`IP ${clientIp} is not in the allowed list`);
      }
    }

    // 4. Validate domain whitelist
    const origin = req.headers.get('origin') || req.headers.get('referer') || '';
    if (keyRecord.allowed_domains && keyRecord.allowed_domains.length > 0) {
      let domainMatch = false;
      try {
        const originHost = new URL(origin).hostname;
        domainMatch = keyRecord.allowed_domains.some((d: string) => originHost.endsWith(d));
      } catch {
        // origin might not be a valid URL
      }
      if (!domainMatch) {
        throw new Error('Origin domain is not in the allowed list');
      }
    }

    // 5. VNeID signature check for sensitive scopes
    const scopes: string[] = Array.isArray(keyRecord.scopes) ? keyRecord.scopes : [];
    const hasSensitiveScope = scopes.some(s => SENSITIVE_SCOPES.includes(s));
    if (hasSensitiveScope && !signature) {
      throw new Error('VNeID signature is required for sensitive operations (write:tokens, write:shares)');
    }

    // 6. Parse payload
    const payload = await req.json();

    statusCode = 200;
    responseBody = { success: true, message: 'Request accepted', company_id: keyRecord.company_id };

    // 7. Log to webhook_logs
    await supabaseClient.from('webhook_logs').insert({
      company_id: keyRecord.company_id,
      api_key_id: keyRecord.id,
      endpoint: new URL(req.url).pathname,
      method: req.method,
      request_body: payload,
      response_body: responseBody,
      ip_address: clientIp,
      user_agent: req.headers.get('user-agent'),
      vneid_signature: signature,
      status_code: statusCode,
    });

    return new Response(JSON.stringify(responseBody), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: statusCode,
    });
  } catch (error: any) {
    statusCode = 400;
    responseBody = { error: error.message };

    // Best-effort log the failed request
    try {
      const apiKey = req.headers.get('x-api-key');
      if (apiKey) {
        const { data: keyRecord } = await supabaseClient
          .from('api_keys')
          .select('id, company_id')
          .eq('api_key_hash', apiKey)
          .single();

        if (keyRecord) {
          await supabaseClient.from('webhook_logs').insert({
            company_id: keyRecord.company_id,
            api_key_id: keyRecord.id,
            endpoint: new URL(req.url).pathname,
            method: req.method,
            request_body: null,
            response_body: responseBody,
            ip_address: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
            user_agent: req.headers.get('user-agent'),
            vneid_signature: req.headers.get('x-vneid-signature'),
            status_code: statusCode,
          });
        }
      }
    } catch {
      // ignore logging errors
    }

    return new Response(JSON.stringify(responseBody), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: statusCode,
    });
  }
});
