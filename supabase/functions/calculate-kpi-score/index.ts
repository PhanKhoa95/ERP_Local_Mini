import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface KPIScoreRequest {
  employee_id: string;
  season_id: string;
}

interface ScoreBreakdown {
  K: number;
  B: number;
  I: number;
  F: number;
}

// Map rubric level (1-5) to 0-100 score
function rubricLevelToScore(level: number): number {
  const mapping: Record<number, number> = { 1: 20, 2: 40, 3: 60, 4: 80, 5: 100 };
  return mapping[level] || 0;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { employee_id, season_id }: KPIScoreRequest = await req.json();

    if (!employee_id || !season_id) {
      return new Response(
        JSON.stringify({ error: 'employee_id và season_id là bắt buộc' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Calculating KPI score for employee: ${employee_id}, season: ${season_id}`);

    // Get employee info with org_unit
    const { data: employee, error: empError } = await supabase
      .from('perf_employees')
      .select('*, perf_org_units(*)')
      .eq('id', employee_id)
      .single();

    if (empError || !employee) {
      console.error('Employee not found:', empError);
      return new Response(
        JSON.stringify({ error: 'Không tìm thấy nhân viên' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const kbifWeights = employee.perf_org_units?.kbif_weights || { K: 40, B: 20, I: 20, F: 20 };
    const evaluationMode = employee.perf_org_units?.evaluation_mode || 'kbif_standard';
    console.log('KBIF weights:', kbifWeights, 'Evaluation mode:', evaluationMode);

    // Get all metrics for this season and org_unit
    let metricsQuery = supabase
      .from('kpi_metrics')
      .select('*')
      .eq('season_id', season_id);
    
    if (employee.org_unit_id) {
      metricsQuery = metricsQuery.or(`org_unit_id.eq.${employee.org_unit_id},org_unit_id.is.null`);
    } else {
      metricsQuery = metricsQuery.is('org_unit_id', null);
    }
    
    const { data: metrics, error: metricsError } = await metricsQuery;

    if (metricsError) {
      console.error('Error fetching metrics:', metricsError);
      return new Response(
        JSON.stringify({ error: 'Lỗi khi lấy danh sách chỉ tiêu' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all scores for this employee and season
    const { data: scores, error: scoresError } = await supabase
      .from('staff_scores')
      .select('*')
      .eq('employee_id', employee_id)
      .in('metric_id', metrics?.map(m => m.id) || []);

    if (scoresError) {
      console.error('Error fetching scores:', scoresError);
      return new Response(
        JSON.stringify({ error: 'Lỗi khi lấy điểm số' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For peer_review metrics, fetch feedback_360
    const feedbackScores: Record<string, number> = {};
    const peerReviewMetrics = metrics?.filter(m => m.evaluation_type === 'peer_review') || [];
    if (peerReviewMetrics.length > 0) {
      const { data: feedback } = await supabase
        .from('feedback_360')
        .select('*')
        .eq('employee_id', employee_id)
        .eq('season_id', season_id)
        .not('sentiment', 'is', null);

      if (feedback?.length) {
        // Map sentiment to score
        const sentimentMap: Record<string, number> = {
          'very_positive': 95, 'positive': 80, 'neutral': 60, 'negative': 40, 'very_negative': 20
        };
        const avgScore = feedback.reduce((sum, f) => sum + (sentimentMap[f.sentiment || 'neutral'] || 60), 0) / feedback.length;
        // Apply to all peer_review metrics
        for (const m of peerReviewMetrics) {
          feedbackScores[m.id] = avgScore;
        }
      }
    }

    // Calculate weighted scores by category
    const breakdown: ScoreBreakdown = { K: 0, B: 0, I: 0, F: 0 };
    const categoryTotals: ScoreBreakdown = { K: 0, B: 0, I: 0, F: 0 };

    for (const metric of metrics || []) {
      const score = scores?.find(s => s.metric_id === metric.id);
      const evaluationType = metric.evaluation_type || 'quantitative';
      let finalScore = 0;

      if (evaluationType === 'peer_review' && feedbackScores[metric.id] !== undefined) {
        finalScore = feedbackScores[metric.id];
      } else if (evaluationType === 'qualitative') {
        // For qualitative, self_score is a rubric level (1-5), convert to 0-100
        const rawScore = score?.final_score || score?.manager_score || score?.self_score || 0;
        finalScore = rawScore <= 5 ? rubricLevelToScore(rawScore) : rawScore;
      } else {
        // quantitative: use existing logic
        finalScore = score?.final_score || score?.manager_score || score?.self_score || 0;
      }

      const category = metric.category as keyof ScoreBreakdown;
      if (category in breakdown) {
        breakdown[category] += finalScore * (metric.weight || 1);
        categoryTotals[category] += metric.weight || 1;
      }
    }

    // Normalize category scores (0-100)
    for (const cat of ['K', 'B', 'I', 'F'] as const) {
      if (categoryTotals[cat] > 0) {
        breakdown[cat] = breakdown[cat] / categoryTotals[cat];
      }
    }

    // Calculate total score with KBIF weights
    const totalWeight = (kbifWeights.K || 0) + (kbifWeights.B || 0) + (kbifWeights.I || 0) + (kbifWeights.F || 0);
    const totalScore = totalWeight > 0
      ? (breakdown.K * (kbifWeights.K || 0) +
         breakdown.B * (kbifWeights.B || 0) +
         breakdown.I * (kbifWeights.I || 0) +
         breakdown.F * (kbifWeights.F || 0)) / totalWeight
      : 0;

    const xpEarned = Math.round(totalScore * 10);

    console.log(`Total score: ${totalScore}, XP earned: ${xpEarned}, mode: ${evaluationMode}`);

    // Update or insert season_results
    const { data: existingResult } = await supabase
      .from('season_results')
      .select('id')
      .eq('employee_id', employee_id)
      .eq('season_id', season_id)
      .single();

    const resultData = {
      employee_id,
      season_id,
      k_score: breakdown.K,
      b_score: breakdown.B,
      i_score: breakdown.I,
      f_score: breakdown.F,
      total_score: totalScore,
      xp_earned: xpEarned,
      calculated_at: new Date().toISOString(),
    };

    if (existingResult) {
      await supabase
        .from('season_results')
        .update(resultData)
        .eq('id', existingResult.id);
    } else {
      await supabase
        .from('season_results')
        .insert(resultData);
    }

    // Update employee XP
    const { error: xpError } = await supabase
      .from('perf_employees')
      .update({ 
        total_xp: (employee.total_xp || 0) + xpEarned,
        updated_at: new Date().toISOString()
      })
      .eq('id', employee_id);

    if (xpError) {
      console.error('Error updating XP:', xpError);
    }

    const response = {
      employee_id,
      season_id,
      evaluation_mode: evaluationMode,
      total_score: Math.round(totalScore * 100) / 100,
      xp_earned: xpEarned,
      breakdown: {
        K: Math.round(breakdown.K * 100) / 100,
        B: Math.round(breakdown.B * 100) / 100,
        I: Math.round(breakdown.I * 100) / 100,
        F: Math.round(breakdown.F * 100) / 100,
      },
      kbif_weights: kbifWeights,
    };

    console.log('KPI calculation complete:', response);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error calculating KPI score:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Lỗi không xác định' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
