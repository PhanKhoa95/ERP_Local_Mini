import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { company_id } = await req.json();

    // Logic to sync from queue
    const { data: queue, error } = await supabaseClient
      .from('integration_queue')
      .select('*')
      .eq('company_id', company_id)
      .eq('status', 'pending')
      .limit(10);

    if (error) throw error;

    for (const item of queue) {
      await supabaseClient.from('integration_queue').update({ status: 'completed', processed_at: new Date().toISOString() }).eq('id', item.id);
    }

    return new Response(JSON.stringify({ success: true, processed: queue.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});