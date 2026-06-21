-- Fix Manager update policy - add WITH CHECK
DROP POLICY IF EXISTS "Managers review team reports" ON work_reports;

CREATE POLICY "Managers review team reports"
ON work_reports
FOR UPDATE
USING (
  org_unit_id IN (SELECT id FROM perf_org_units WHERE manager_id = auth.uid())
)
WITH CHECK (
  org_unit_id IN (SELECT id FROM perf_org_units WHERE manager_id = auth.uid())
);