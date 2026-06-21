import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SkillGapRequest {
  employee_id: string;
  target_position_id?: string;
}

interface SkillGap {
  skill_name: string;
  skill_id: string;
  current_level: number;
  required_level: number;
  gap: number;
  priority: 'high' | 'medium' | 'low';
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

    const { employee_id, target_position_id }: SkillGapRequest = await req.json();

    if (!employee_id) {
      return new Response(
        JSON.stringify({ error: 'employee_id lÃ  báº¯t buá»™c' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing skill gap for employee: ${employee_id}`);

    // Get employee info
    const { data: employee, error: empError } = await supabase
      .from('perf_employees')
      .select('*, perf_positions(*)')
      .eq('id', employee_id)
      .single();

    if (empError || !employee) {
      return new Response(
        JSON.stringify({ error: 'KhÃ´ng tÃ¬m tháº¥y nhÃ¢n viÃªn' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine target position (next level or specified)
    const positionId = target_position_id || employee.position_id;
    
    // Get required skills for target position
    const { data: requirements, error: reqError } = await supabase
      .from('position_skill_requirements')
      .select('*, skill_nodes(*)')
      .eq('position_id', positionId);

    if (reqError) {
      console.error('Error fetching requirements:', reqError);
    }

    // Get employee's current skill progress
    const { data: progress, error: progError } = await supabase
      .from('user_skill_progress')
      .select('*, skill_nodes(*)')
      .eq('employee_id', employee_id);

    if (progError) {
      console.error('Error fetching progress:', progError);
    }

    // Calculate skill gaps
    const skillGaps: SkillGap[] = [];
    const progressMap = new Map(progress?.map(p => [p.skill_node_id, p]) || []);

    for (const req of requirements || []) {
      const currentProgress = progressMap.get(req.skill_node_id);
      const currentLevel = currentProgress?.current_level || 0;
      const gap = req.required_level - currentLevel;

      if (gap > 0) {
        skillGaps.push({
          skill_name: req.skill_nodes?.name || 'Unknown',
          skill_id: req.skill_node_id,
          current_level: currentLevel,
          required_level: req.required_level,
          gap,
          priority: gap >= 3 ? 'high' : gap >= 2 ? 'medium' : 'low',
        });
      }
    }

    // Sort by priority and gap
    skillGaps.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.gap - a.gap;
    });

    // Generate AI recommendations if LOVABLE_API_KEY is available
    let aiRecommendations = null;
    let estimatedTimeToReady = null;

    if (lovableApiKey && skillGaps.length > 0) {
      try {
        const prompt = `Báº¡n lÃ  chuyÃªn gia phÃ¡t triá»ƒn nhÃ¢n sá»±. PhÃ¢n tÃ­ch lá»— há»•ng ká»¹ nÄƒng sau vÃ  Ä‘á» xuáº¥t káº¿ hoáº¡ch Ä‘Ã o táº¡o:

Vá»‹ trÃ­ hiá»‡n táº¡i: ${employee.perf_positions?.name || 'N/A'}
Lá»— há»•ng ká»¹ nÄƒng:
${skillGaps.map(g => `- ${g.skill_name}: Level ${g.current_level}/${g.required_level} (Gap: ${g.gap}, Priority: ${g.priority})`).join('\n')}

HÃ£y Ä‘Æ°a ra:
1. TÃ³m táº¯t ngáº¯n gá»n vá» tÃ¬nh tráº¡ng hiá»‡n táº¡i
2. Top 3 khÃ³a Ä‘Ã o táº¡o Æ°u tiÃªn vá»›i mÃ´ táº£ ngáº¯n
3. Æ¯á»›c tÃ­nh thá»i gian Ä‘á»ƒ sáºµn sÃ ng cho vá»‹ trÃ­ má»›i (tÃ­nh báº±ng thÃ¡ng)

Tráº£ lá»i báº±ng tiáº¿ng Viá»‡t, ngáº¯n gá»n vÃ  thá»±c tiá»…n.`;

        const aiResponse = await fetch((Deno.env.get('OPENROUTER_API_KEY') ? ((Deno.env.get('OPENROUTER_BASE_URL') || 'https://openrouter.ai/api/v1') + '/chat/completions') : 'https://ai.gateway.lovable.dev/v1/chat/completions'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get("OPENROUTER_API_KEY") || lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: Deno.env.get('OPENROUTER_MODEL') || 'google/gemini-3-flash-preview',
            messages: [
              { role: 'system', content: 'Báº¡n lÃ  AI tÆ° váº¥n phÃ¡t triá»ƒn nhÃ¢n sá»± chuyÃªn nghiá»‡p.' },
              { role: 'user', content: prompt }
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          aiRecommendations = aiData.choices?.[0]?.message?.content;
          
          // Extract estimated time from AI response (simple regex)
          const timeMatch = aiRecommendations?.match(/(\d+)\s*thÃ¡ng/);
          if (timeMatch) {
            estimatedTimeToReady = parseInt(timeMatch[1]);
          }
        } else if (aiResponse.status === 429) {
          console.log('Rate limited, skipping AI recommendations');
        } else if (aiResponse.status === 402) {
          console.log('Payment required, skipping AI recommendations');
        }
      } catch (aiError) {
        console.error('AI recommendation error:', aiError);
      }
    }

    const response = {
      employee_id,
      employee_name: employee.perf_positions?.name,
      target_position_id: positionId,
      skill_gaps: skillGaps,
      total_gaps: skillGaps.length,
      high_priority_count: skillGaps.filter(g => g.priority === 'high').length,
      ai_recommendations: aiRecommendations,
      estimated_time_to_ready: estimatedTimeToReady,
      readiness_score: requirements?.length 
        ? Math.round((1 - skillGaps.reduce((sum, g) => sum + g.gap, 0) / (requirements.length * 5)) * 100)
        : 100,
    };

    console.log('Skill gap analysis complete:', { 
      employee_id, 
      gaps: skillGaps.length,
      readiness: response.readiness_score 
    });

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in skill gap analysis:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Lá»—i khÃ´ng xÃ¡c Ä‘á»‹nh' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


