-- Fix RLS policy for system_settings to use company_members instead of legacy user_roles
DROP POLICY IF EXISTS "Admins can manage settings" ON public.system_settings;

CREATE POLICY "Admins can manage settings" ON public.system_settings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_members
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.company_members
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );
