-- Create projects table for multi-project management
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'on_hold', 'cancelled')),
  start_date DATE,
  end_date DATE,
  manager_id UUID REFERENCES public.perf_employees(id),
  org_unit_id UUID REFERENCES public.perf_org_units(id),
  budget NUMERIC,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, code)
);

-- Create project_members junction table
CREATE TABLE public.project_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.perf_employees(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'lead', 'observer')),
  allocated_hours INTEGER DEFAULT 40,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, employee_id)
);

-- Create tasks table for omni-channel task assignment
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES public.perf_employees(id),
  org_unit_id UUID REFERENCES public.perf_org_units(id),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  source_type TEXT NOT NULL CHECK (source_type IN ('directive', 'order', 'manual', 'project')),
  source_id UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'done', 'cancelled')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  due_date TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 5),
  completion_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add project_id to work_reports for project-based reporting
ALTER TABLE public.work_reports ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- Create chat_report_sessions for chatbot conversations
CREATE TABLE public.chat_report_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.perf_employees(id) ON DELETE CASCADE,
  report_id UUID REFERENCES public.work_reports(id) ON DELETE SET NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  parsed_tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'submitted', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_report_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can view projects in their company"
ON public.projects FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM public.company_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins and managers can manage projects"
ON public.projects FOR ALL
USING (
  company_id IN (
    SELECT company_id FROM public.company_members 
    WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- RLS Policies for project_members
CREATE POLICY "Users can view project members in their company"
ON public.project_members FOR SELECT
USING (
  project_id IN (
    SELECT id FROM public.projects WHERE company_id IN (
      SELECT company_id FROM public.company_members WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Project managers can manage members"
ON public.project_members FOR ALL
USING (
  project_id IN (
    SELECT id FROM public.projects WHERE company_id IN (
      SELECT company_id FROM public.company_members 
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  )
);

-- RLS Policies for tasks
CREATE POLICY "Users can view tasks assigned to them or in their org_unit"
ON public.tasks FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM public.company_members WHERE user_id = auth.uid()
  )
  AND (
    assigned_to IN (SELECT id FROM public.perf_employees WHERE user_id = auth.uid())
    OR assigned_by = auth.uid()
    OR org_unit_id IN (
      SELECT org_unit_id FROM public.perf_employees WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update tasks assigned to them"
ON public.tasks FOR UPDATE
USING (
  assigned_to IN (SELECT id FROM public.perf_employees WHERE user_id = auth.uid())
);

CREATE POLICY "Managers can manage all tasks in company"
ON public.tasks FOR ALL
USING (
  company_id IN (
    SELECT company_id FROM public.company_members 
    WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- RLS Policies for chat_report_sessions
CREATE POLICY "Users can manage their own chat sessions"
ON public.chat_report_sessions FOR ALL
USING (
  employee_id IN (SELECT id FROM public.perf_employees WHERE user_id = auth.uid())
);

-- Trigger to auto-create task from order
CREATE OR REPLACE FUNCTION public.auto_create_task_from_order()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id UUID;
  v_employee_id UUID;
BEGIN
  -- Get company_id from the user who created the order
  SELECT company_id INTO v_company_id
  FROM public.company_members
  WHERE user_id = NEW.created_by
  LIMIT 1;

  -- Find an operations employee to assign (simple round-robin)
  SELECT pe.id INTO v_employee_id
  FROM public.perf_employees pe
  JOIN public.perf_org_units ou ON pe.org_unit_id = ou.id
  WHERE pe.company_id = v_company_id
    AND pe.is_active = true
    AND (ou.name ILIKE '%vận hành%' OR ou.name ILIKE '%operation%' OR ou.name ILIKE '%fulfillment%')
  ORDER BY (
    SELECT COUNT(*) FROM public.tasks t 
    WHERE t.assigned_to = pe.id AND t.status NOT IN ('done', 'cancelled')
  ) ASC
  LIMIT 1;

  -- Only create task if we found an employee
  IF v_employee_id IS NOT NULL AND v_company_id IS NOT NULL THEN
    INSERT INTO public.tasks (
      company_id, assigned_by, assigned_to,
      title, description, source_type, source_id, 
      due_date, priority
    ) VALUES (
      v_company_id,
      NEW.created_by,
      v_employee_id,
      'Xử lý đơn hàng ' || NEW.order_number,
      'Đơn hàng tự động tạo từ ERP. Tổng: ' || COALESCE(NEW.total, 0)::TEXT || 'đ',
      'order',
      NEW.id,
      NEW.order_date::timestamptz + INTERVAL '2 days',
      CASE 
        WHEN COALESCE(NEW.total, 0) > 5000000 THEN 'high'
        WHEN COALESCE(NEW.total, 0) > 10000000 THEN 'urgent'
        ELSE 'normal'
      END
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on orders table
DROP TRIGGER IF EXISTS trigger_auto_create_task_from_order ON public.orders;
CREATE TRIGGER trigger_auto_create_task_from_order
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_task_from_order();

-- Update timestamp triggers
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_report_sessions_updated_at
  BEFORE UPDATE ON public.chat_report_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();