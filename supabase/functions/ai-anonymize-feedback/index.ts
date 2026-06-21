import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnonymizeFeedbackRequest {
  feedback_id?: string;
  raw_content?: string;
  employee_id?: string;
  season_id?: string;
  reviewer_id?: string;
  relationship_type?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: AnonymizeFeedbackRequest = await req.json();

    if (!Deno.env.get("OPENROUTER_API_KEY") && !lovableApiKey) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY chÆ°a Ä‘Æ°á»£c cáº¥u hÃ¬nh' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let rawContent = body.raw_content;
    let feedbackId = body.feedback_id;

    // If feedback_id provided, fetch the raw content
    if (feedbackId && !rawContent) {
      const { data: feedback, error } = await supabase
        .from('feedback_360')
        .select('raw_content')
        .eq('id', feedbackId)
        .single();

      if (error || !feedback?.raw_content) {
        return new Response(
          JSON.stringify({ error: 'KhÃ´ng tÃ¬m tháº¥y feedback' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      rawContent = feedback.raw_content;
    }

    if (!rawContent) {
      return new Response(
        JSON.stringify({ error: 'raw_content hoáº·c feedback_id lÃ  báº¯t buá»™c' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Anonymizing feedback, length:', rawContent.length);

    // Use AI to anonymize and rewrite feedback
    const prompt = `Báº¡n lÃ  chuyÃªn gia xá»­ lÃ½ pháº£n há»“i 360 Ä‘á»™. Nhiá»‡m vá»¥ cá»§a báº¡n lÃ  viáº¿t láº¡i ná»™i dung pháº£n há»“i sau Ä‘Ã¢y sao cho:

1. **áº¨n danh hoÃ n toÃ n**: Loáº¡i bá» má»i dáº¥u hiá»‡u nháº­n dáº¡ng ngÆ°á»i viáº¿t (tÃªn, biá»‡t danh, phÃ²ng ban cá»¥ thá»ƒ, sá»± kiá»‡n riÃªng biá»‡t)
2. **Giá»ng vÄƒn trung tÃ­nh**: Viáº¿t láº¡i vá»›i giá»ng vÄƒn chuyÃªn nghiá»‡p, khÃ¡ch quan, khÃ´ng thiÃªn vá»‹
3. **Giá»¯ nguyÃªn Ã½ chÃ­nh**: Ná»™i dung cá»‘t lÃµi vÃ  Ã½ kiáº¿n pháº£i Ä‘Æ°á»£c báº£o toÃ n
4. **PhÃ¢n tÃ­ch cáº£m xÃºc**: XÃ¡c Ä‘á»‹nh sentiment (positive/neutral/negative)

Ná»™i dung gá»‘c:
"""
${rawContent}
"""

Tráº£ lá»i theo format JSON (chá»‰ tráº£ vá» JSON, khÃ´ng cÃ³ text khÃ¡c):
{
  "anonymized_content": "Ná»™i dung Ä‘Ã£ Ä‘Æ°á»£c viáº¿t láº¡i...",
  "sentiment": "positive|neutral|negative",
  "key_points": ["Äiá»ƒm chÃ­nh 1", "Äiá»ƒm chÃ­nh 2"]
}`;

    const aiResponse = await fetch((Deno.env.get('OPENROUTER_API_KEY') ? ((Deno.env.get('OPENROUTER_BASE_URL') || 'https://openrouter.ai/api/v1') + '/chat/completions') : 'https://ai.gateway.lovable.dev/v1/chat/completions'), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get("OPENROUTER_API_KEY") || lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: Deno.env.get('OPENROUTER_MODEL') || 'google/gemini-3-flash-preview',
        messages: [
          { 
            role: 'system', 
            content: 'Báº¡n lÃ  AI chuyÃªn xá»­ lÃ½ pháº£n há»“i nhÃ¢n sá»±. LuÃ´n tráº£ vá» JSON há»£p lá»‡.' 
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'ÄÃ£ vÆ°á»£t quÃ¡ giá»›i háº¡n request. Vui lÃ²ng thá»­ láº¡i sau.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Cáº§n náº¡p thÃªm credits. Vui lÃ²ng liÃªn há»‡ admin.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await aiResponse.text();
      console.error('AI error:', aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Lá»—i tá»« AI Gateway' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '';

    // Parse AI response
    let parsedResult;
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      parsedResult = {
        anonymized_content: rawContent, // Fallback to original
        sentiment: 'neutral',
        key_points: []
      };
    }

    // If feedback_id provided, update the database
    if (feedbackId) {
      const { error: updateError } = await supabase
        .from('feedback_360')
        .update({
          anonymized_content: parsedResult.anonymized_content,
          sentiment: parsedResult.sentiment,
          is_processed: true,
          processed_at: new Date().toISOString()
        })
        .eq('id', feedbackId);

      if (updateError) {
        console.error('Error updating feedback:', updateError);
      }
    }

    // If creating new feedback
    if (!feedbackId && body.employee_id && body.season_id) {
      const { data: newFeedback, error: insertError } = await supabase
        .from('feedback_360')
        .insert({
          employee_id: body.employee_id,
          season_id: body.season_id,
          reviewer_id: body.reviewer_id,
          relationship_type: body.relationship_type || 'peer',
          raw_content: rawContent,
          anonymized_content: parsedResult.anonymized_content,
          sentiment: parsedResult.sentiment,
          is_processed: true,
          processed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting feedback:', insertError);
      } else {
        feedbackId = newFeedback?.id;
      }
    }

    console.log('Feedback anonymized successfully');

    return new Response(
      JSON.stringify({
        feedback_id: feedbackId,
        anonymized_content: parsedResult.anonymized_content,
        sentiment: parsedResult.sentiment,
        key_points: parsedResult.key_points || [],
        processed: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error anonymizing feedback:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Lá»—i khÃ´ng xÃ¡c Ä‘á»‹nh' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


