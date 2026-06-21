-- =============================================
-- FIX: performance_onboarding RLS INSERT violation
-- Problem: The single FOR ALL policy with USING clause fails on INSERT
-- because the row doesn't exist yet when USING is evaluated.
-- Solution: Split into separate SELECT, INSERT, UPDATE, DELETE policies.
-- =============================================

-- Drop the existing combined policy
DROP POLICY IF EXISTS "Company members manage onboarding" ON public.performance_onboarding;
DROP POLICY IF EXISTS "View own company onboarding" ON public.performance_onboarding;

-- SELECT: Company members can view their company's onboarding
CREATE POLICY "perf_onboarding_select"
  ON public.performance_onboarding
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()
    )
  );

-- INSERT: Company members can create onboarding for their company
-- Only WITH CHECK is needed for INSERT (no USING clause)
CREATE POLICY "perf_onboarding_insert"
  ON public.performance_onboarding
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()
    )
  );

-- UPDATE: Company members can update their company's onboarding
CREATE POLICY "perf_onboarding_update"
  ON public.performance_onboarding
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()
    )
  );

-- DELETE: Only admin/manager can delete onboarding records
CREATE POLICY "perf_onboarding_delete"
  ON public.performance_onboarding
  FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT cm.company_id FROM public.company_members cm
      WHERE cm.user_id = auth.uid() AND cm.role IN ('admin', 'manager')
    )
  );
