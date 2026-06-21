ALTER TABLE strategic_reports 
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id),
  ADD COLUMN IF NOT EXISTS project_tasks_summary jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS resources_summary jsonb DEFAULT '[]';