-- Drop existing problematic UPDATE policy for employees
DROP POLICY IF EXISTS "Employees update own draft reports" ON work_reports;

-- Create proper UPDATE policy with both USING and WITH CHECK
-- USING: chỉ cho phép update báo cáo của mình khi status là draft hoặc rejected  
-- WITH CHECK: cho phép update thành bất kỳ status nào (draft, submitted, etc.)
CREATE POLICY "Employees update own draft reports" 
ON work_reports
FOR UPDATE
USING (
  employee_id IN (SELECT id FROM perf_employees WHERE user_id = auth.uid())
  AND status IN ('draft', 'rejected')
)
WITH CHECK (
  employee_id IN (SELECT id FROM perf_employees WHERE user_id = auth.uid())
);