-- Fix is_perf_admin_or_manager() to check company_members instead of user_roles
CREATE OR REPLACE FUNCTION public.is_perf_admin_or_manager()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'manager')
  );
$$;

-- Drop existing restrictive policies on performance_onboarding
DROP POLICY IF EXISTS "Admins manage onboarding" ON performance_onboarding;
DROP POLICY IF EXISTS "Company members can view onboarding" ON performance_onboarding;
DROP POLICY IF EXISTS "Company members manage onboarding" ON performance_onboarding;

-- Create new policy allowing company members to manage their company's onboarding
CREATE POLICY "Company members manage onboarding" ON performance_onboarding
  FOR ALL TO authenticated
  USING (company_id IN (
    SELECT company_id FROM company_members WHERE user_id = auth.uid()
  ))
  WITH CHECK (company_id IN (
    SELECT company_id FROM company_members WHERE user_id = auth.uid()
  ));

-- Drop and recreate perf_org_units policies
DROP POLICY IF EXISTS "Admins can manage org units" ON perf_org_units;
DROP POLICY IF EXISTS "Company admins manage org units" ON perf_org_units;
DROP POLICY IF EXISTS "Company members can view org units" ON perf_org_units;

-- Allow viewing for all company members
CREATE POLICY "Company members can view org units" ON perf_org_units
  FOR SELECT TO authenticated
  USING (company_id = get_user_company_id());

-- Allow admin/manager to manage org units
CREATE POLICY "Company admins manage org units" ON perf_org_units
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id() AND is_perf_admin_or_manager())
  WITH CHECK (company_id = get_user_company_id() AND is_perf_admin_or_manager());

-- Drop and recreate career_paths policies
DROP POLICY IF EXISTS "Company admins manage career paths" ON career_paths;
DROP POLICY IF EXISTS "Company members can view career paths" ON career_paths;

-- Allow viewing for all company members
CREATE POLICY "Company members can view career paths" ON career_paths
  FOR SELECT TO authenticated
  USING (company_id = get_user_company_id());

-- Allow admin/manager to manage career paths
CREATE POLICY "Company admins manage career paths" ON career_paths
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id() AND is_perf_admin_or_manager())
  WITH CHECK (company_id = get_user_company_id() AND is_perf_admin_or_manager());

-- Drop and recreate perf_employees policies
DROP POLICY IF EXISTS "Users can view own employee record" ON perf_employees;
DROP POLICY IF EXISTS "Users can create own employee record" ON perf_employees;
DROP POLICY IF EXISTS "Users can update own employee record" ON perf_employees;
DROP POLICY IF EXISTS "Admins manage employees" ON perf_employees;
DROP POLICY IF EXISTS "Company members can view employees" ON perf_employees;

-- Allow viewing for all company members
CREATE POLICY "Company members can view employees" ON perf_employees
  FOR SELECT TO authenticated
  USING (company_id = get_user_company_id());

-- Allow users to create their own employee record
CREATE POLICY "Users can create own employee record" ON perf_employees
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND company_id = get_user_company_id());

-- Allow users to update their own employee record
CREATE POLICY "Users can update own employee record" ON perf_employees
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND company_id = get_user_company_id())
  WITH CHECK (user_id = auth.uid() AND company_id = get_user_company_id());

-- Allow admin/manager to manage all employees in company
CREATE POLICY "Admins manage employees" ON perf_employees
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id() AND is_perf_admin_or_manager())
  WITH CHECK (company_id = get_user_company_id() AND is_perf_admin_or_manager());