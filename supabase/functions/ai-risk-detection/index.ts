import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RiskDetectionRequest {
  company_id: string;
  season_id: string;
}

interface RiskAnomaly {
  employee_id: string;
  employee_name?: string;
  type: 'score_anomaly' | 'gaming_pattern' | 'plagiarism' | 'sudden_change';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  evidence: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { company_id, season_id }: RiskDetectionRequest = await req.json();

    if (!company_id || !season_id) {
      return new Response(
        JSON.stringify({ error: 'company_id và season_id là bắt buộc' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Running risk detection for company: ${company_id}, season: ${season_id}`);

    const anomalies: RiskAnomaly[] = [];

    // Get all employees in the company
    const { data: employees, error: empError } = await supabase
      .from('perf_employees')
      .select('*, profiles(*)')
      .eq('company_id', company_id);

    if (empError) {
      console.error('Error fetching employees:', empError);
    }

    // Get all scores for this season
    const { data: allScores, error: scoresError } = await supabase
      .from('staff_scores')
      .select('*, kpi_metrics(*)')
      .in('employee_id', employees?.map(e => e.id) || []);

    if (scoresError) {
      console.error('Error fetching scores:', scoresError);
    }

    // Group scores by employee
    const scoresByEmployee = new Map<string, typeof allScores>();
    for (const score of allScores || []) {
      const existing = scoresByEmployee.get(score.employee_id) || [];
      existing.push(score);
      scoresByEmployee.set(score.employee_id, existing);
    }

    // Get previous season results for comparison
    const { data: previousResults } = await supabase
      .from('season_results')
      .select('*')
      .in('employee_id', employees?.map(e => e.id) || [])
      .neq('season_id', season_id)
      .order('created_at', { ascending: false });

    const previousScoreMap = new Map(
      previousResults?.map(r => [r.employee_id, r.total_score]) || []
    );

    for (const employee of employees || []) {
      const employeeScores = scoresByEmployee.get(employee.id) || [];
      const employeeName = employee.profiles?.full_name || 'Unknown';

      // 1. Check for score anomalies (all perfect scores)
      const perfectScores = employeeScores.filter(s => s.final_score === 100);
      if (perfectScores.length >= 3 && perfectScores.length === employeeScores.length) {
        anomalies.push({
          employee_id: employee.id,
          employee_name: employeeName,
          type: 'score_anomaly',
          severity: 'medium',
          details: 'Tất cả điểm số đều đạt tối đa 100%. Có thể cần xem xét lại.',
          evidence: {
            perfect_count: perfectScores.length,
            total_metrics: employeeScores.length
          }
        });
      }

      // 2. Check for sudden score changes
      const previousScore = previousScoreMap.get(employee.id);
      if (previousScore !== undefined) {
        const currentAvg = employeeScores.length > 0
          ? employeeScores.reduce((sum, s) => sum + (s.final_score || 0), 0) / employeeScores.length
          : 0;
        
        const change = currentAvg - previousScore;
        if (Math.abs(change) > 30) {
          anomalies.push({
            employee_id: employee.id,
            employee_name: employeeName,
            type: 'sudden_change',
            severity: change > 0 ? 'medium' : 'high',
            details: `Điểm thay đổi đột ngột ${change > 0 ? '+' : ''}${Math.round(change)}% so với kỳ trước.`,
            evidence: {
              previous_score: previousScore,
              current_average: Math.round(currentAvg),
              change_percent: Math.round(change)
            }
          });
        }
      }

      // 3. Check for gaming patterns (same scores across different metrics)
      const scoreValues = employeeScores.map(s => s.self_score).filter(s => s !== null);
      const uniqueScores = new Set(scoreValues);
      if (scoreValues.length >= 5 && uniqueScores.size <= 2) {
        anomalies.push({
          employee_id: employee.id,
          employee_name: employeeName,
          type: 'gaming_pattern',
          severity: 'medium',
          details: 'Phát hiện pattern điểm số lặp lại. Có thể tự chấm điểm không chính xác.',
          evidence: {
            total_scores: scoreValues.length,
            unique_values: Array.from(uniqueScores)
          }
        });
      }

      // 4. Check for large gap between self-score and manager-score
      const largeGaps = employeeScores.filter(s => {
        if (s.self_score !== null && s.manager_score !== null) {
          return Math.abs(s.self_score - s.manager_score) > 20;
        }
        return false;
      });

      if (largeGaps.length >= 2) {
        anomalies.push({
          employee_id: employee.id,
          employee_name: employeeName,
          type: 'score_anomaly',
          severity: 'low',
          details: `${largeGaps.length} chỉ tiêu có chênh lệch lớn giữa tự đánh giá và quản lý đánh giá.`,
          evidence: {
            gap_count: largeGaps.length,
            metrics: largeGaps.map(g => ({
              metric: g.kpi_metrics?.name,
              self: g.self_score,
              manager: g.manager_score
            }))
          }
        });
      }
    }

    // Sort by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    anomalies.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    // Count by severity
    const summaryCounts = {
      critical: anomalies.filter(a => a.severity === 'critical').length,
      high: anomalies.filter(a => a.severity === 'high').length,
      medium: anomalies.filter(a => a.severity === 'medium').length,
      low: anomalies.filter(a => a.severity === 'low').length,
    };

    // Count by type
    const typeCounts = {
      score_anomaly: anomalies.filter(a => a.type === 'score_anomaly').length,
      gaming_pattern: anomalies.filter(a => a.type === 'gaming_pattern').length,
      plagiarism: anomalies.filter(a => a.type === 'plagiarism').length,
      sudden_change: anomalies.filter(a => a.type === 'sudden_change').length,
    };

    console.log(`Risk detection complete: ${anomalies.length} anomalies found`);

    return new Response(
      JSON.stringify({
        company_id,
        season_id,
        total_anomalies: anomalies.length,
        summary: summaryCounts,
        by_type: typeCounts,
        anomalies,
        scan_timestamp: new Date().toISOString(),
        employees_scanned: employees?.length || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in risk detection:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Lỗi không xác định' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
