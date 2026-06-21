
ALTER TABLE public.workflow_logs
ADD COLUMN IF NOT EXISTS node_executions jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS waiting_for_approval boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS approval_request_id uuid REFERENCES public.approval_requests(id);
