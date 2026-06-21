-- ============================================
-- PHASE 1: FIX ONBOARDING INTEGRITY
-- ============================================

-- 1. Create skill_requirements table (missing)
CREATE TABLE IF NOT EXISTS public.skill_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id UUID NOT NULL REFERENCES public.perf_positions(id) ON DELETE CASCADE,
  skill_node_id UUID NOT NULL REFERENCES public.skill_nodes(id) ON DELETE CASCADE,
  required_level INTEGER DEFAULT 1,
  is_mandatory BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(position_id, skill_node_id)
);

-- Enable RLS
ALTER TABLE public.skill_requirements ENABLE ROW LEVEL SECURITY;

-- RLS Policy: View skill requirements for positions in user's company
CREATE POLICY "View skill requirements for company positions"
  ON public.skill_requirements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.perf_positions pp
      JOIN public.company_members cm ON cm.company_id = pp.company_id
      WHERE pp.id = skill_requirements.position_id
      AND cm.user_id = auth.uid()
    )
  );

-- RLS Policy: Manage skill requirements (HR/Admin)
CREATE POLICY "HR can manage skill requirements"
  ON public.skill_requirements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.perf_positions pp
      JOIN public.company_members cm ON cm.company_id = pp.company_id
      WHERE pp.id = skill_requirements.position_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('admin', 'hr')
    )
  );

-- 2. Attach Triggers (functions already exist)
-- Drop existing triggers if they exist (to avoid errors)
DROP TRIGGER IF EXISTS trigger_xp_from_kpi ON public.staff_scores;
DROP TRIGGER IF EXISTS trigger_check_level_up ON public.perf_employees;
DROP TRIGGER IF EXISTS trigger_check_achievements ON public.perf_employees;

-- Create Trigger 1: XP from KPI Score
CREATE TRIGGER trigger_xp_from_kpi
  AFTER UPDATE OF final_score ON public.staff_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_xp_from_score();

-- Create Trigger 2: Check Level Up
CREATE TRIGGER trigger_check_level_up
  BEFORE UPDATE OF total_xp ON public.perf_employees
  FOR EACH ROW
  EXECUTE FUNCTION public.check_level_up();

-- Create Trigger 3: Check Achievements
CREATE TRIGGER trigger_check_achievements
  AFTER UPDATE ON public.perf_employees
  FOR EACH ROW
  EXECUTE FUNCTION public.check_achievements();

-- 3. Enable Realtime for skill_requirements
ALTER PUBLICATION supabase_realtime ADD TABLE public.skill_requirements;