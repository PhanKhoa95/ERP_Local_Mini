-- Repair performance_onboarding RLS policies for real Supabase users.
-- Local demo admin/admin is handled client-side because it is not a real Supabase Auth session.

ALTER TABLE public.performance_onboarding ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage onboarding" ON public.performance_onboarding;
DROP POLICY IF EXISTS "Company members manage onboarding" ON public.performance_onboarding;
DROP POLICY IF EXISTS "Company members can view onboarding" ON public.performance_onboarding;
DROP POLICY IF EXISTS "View own company onboarding" ON public.performance_onboarding;
DROP POLICY IF EXISTS "perf_onboarding_select" ON public.performance_onboarding;
DROP POLICY IF EXISTS "perf_onboarding_insert" ON public.performance_onboarding;
DROP POLICY IF EXISTS "perf_onboarding_update" ON public.performance_onboarding;
DROP POLICY IF EXISTS "perf_onboarding_delete" ON public.performance_onboarding;

CREATE POLICY "perf_onboarding_select"
  ON public.performance_onboarding
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.company_members cm
      WHERE cm.user_id = auth.uid()
        AND cm.company_id = performance_onboarding.company_id
    )
  );

CREATE POLICY "perf_onboarding_insert"
  ON public.performance_onboarding
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.company_members cm
      WHERE cm.user_id = auth.uid()
        AND cm.company_id = performance_onboarding.company_id
        AND cm.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "perf_onboarding_update"
  ON public.performance_onboarding
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.company_members cm
      WHERE cm.user_id = auth.uid()
        AND cm.company_id = performance_onboarding.company_id
        AND cm.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.company_members cm
      WHERE cm.user_id = auth.uid()
        AND cm.company_id = performance_onboarding.company_id
        AND cm.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "perf_onboarding_delete"
  ON public.performance_onboarding
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.company_members cm
      WHERE cm.user_id = auth.uid()
        AND cm.company_id = performance_onboarding.company_id
        AND cm.role IN ('admin', 'manager')
    )
  );
