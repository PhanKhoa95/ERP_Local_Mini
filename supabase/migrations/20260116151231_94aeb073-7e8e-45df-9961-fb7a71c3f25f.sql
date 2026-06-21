-- =====================================================
-- WORK REPORTING SYSTEM - Báo cáo công việc tự động
-- =====================================================

-- 1. Bảng báo cáo công việc (hàng ngày/tuần/tháng)
CREATE TABLE IF NOT EXISTS public.work_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.perf_employees(id) ON DELETE CASCADE,
  org_unit_id UUID REFERENCES public.perf_org_units(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly', 'seasonal')),
  report_date DATE NOT NULL,
  period_start DATE,
  period_end DATE,
  
  -- Nội dung báo cáo
  summary TEXT,
  completed_tasks JSONB DEFAULT '[]'::jsonb,
  pending_tasks JSONB DEFAULT '[]'::jsonb,
  blockers JSONB DEFAULT '[]'::jsonb,
  
  -- Số liệu tự động (từ orders/products nếu có)
  auto_metrics JSONB DEFAULT '{}'::jsonb,
  
  -- Trạng thái
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed', 'approved', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_comment TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, report_type, report_date)
);

-- 2. Metric values riêng cho từng report (link với kpi_metrics)
CREATE TABLE IF NOT EXISTS public.report_metric_values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.work_reports(id) ON DELETE CASCADE,
  metric_id UUID NOT NULL REFERENCES public.kpi_metrics(id) ON DELETE CASCADE,
  target_value DECIMAL(15,2),
  actual_value DECIMAL(15,2),
  unit TEXT,
  notes TEXT,
  evidence_urls JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(report_id, metric_id)
);

-- Enable RLS
ALTER TABLE public.work_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_metric_values ENABLE ROW LEVEL SECURITY;

-- RLS Policies for work_reports
CREATE POLICY "Employees view own reports" ON public.work_reports
  FOR SELECT USING (
    employee_id IN (
      SELECT id FROM public.perf_employees 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers view team reports" ON public.work_reports
  FOR SELECT USING (
    org_unit_id IN (
      SELECT id FROM public.perf_org_units 
      WHERE manager_id = auth.uid()
    )
  );

CREATE POLICY "Employees create own reports" ON public.work_reports
  FOR INSERT WITH CHECK (
    employee_id IN (
      SELECT id FROM public.perf_employees 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Employees update own draft reports" ON public.work_reports
  FOR UPDATE USING (
    employee_id IN (
      SELECT id FROM public.perf_employees 
      WHERE user_id = auth.uid()
    ) AND status IN ('draft', 'rejected')
  );

CREATE POLICY "Managers review team reports" ON public.work_reports
  FOR UPDATE USING (
    org_unit_id IN (
      SELECT id FROM public.perf_org_units 
      WHERE manager_id = auth.uid()
    )
  );

-- RLS for report_metric_values
CREATE POLICY "View metrics via report" ON public.report_metric_values
  FOR SELECT USING (
    report_id IN (SELECT id FROM public.work_reports)
  );

CREATE POLICY "Manage metrics" ON public.report_metric_values
  FOR ALL USING (
    report_id IN (
      SELECT id FROM public.work_reports 
      WHERE employee_id IN (
        SELECT id FROM public.perf_employees WHERE user_id = auth.uid()
      )
    )
  );

-- Trigger
CREATE TRIGGER update_work_reports_updated_at
BEFORE UPDATE ON public.work_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.work_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.report_metric_values;

-- Insert KPI templates
INSERT INTO public.industry_templates (industry, template_type, name, description, template_data, is_active)
VALUES 
('retail', 'kpi', 'Sales - Doanh số', 'Chỉ tiêu doanh số', '{"category": "K", "name": "Doanh số thực tế", "unit": "VND"}', true),
('retail', 'kpi', 'Sales - Số đơn', 'Số lượng đơn hàng', '{"category": "K", "name": "Số đơn hoàn thành", "unit": "đơn"}', true),
('retail', 'kpi', 'Sales - CSKH', 'Chăm sóc khách hàng', '{"category": "B", "name": "Thời gian phản hồi", "unit": "phút"}', true),
('manufacturing', 'kpi', 'Ops - Năng suất', 'Task hoàn thành', '{"category": "K", "name": "Task hoàn thành", "unit": "task"}', true),
('manufacturing', 'kpi', 'Ops - Tiến độ', 'On-time Delivery', '{"category": "K", "name": "On-time", "unit": "%", "target": 95}', true),
('manufacturing', 'kpi', 'Ops - Chất lượng', 'Tỷ lệ lỗi', '{"category": "K", "name": "Tỷ lệ lỗi", "unit": "%"}', true),
('manufacturing', 'kpi', 'Ops - Tuân thủ', 'SLA Compliance', '{"category": "B", "name": "Tuân thủ SLA", "unit": "%"}', true),
('manufacturing', 'kpi', 'Ops - Sáng kiến', 'Đề xuất cải tiến', '{"category": "I", "name": "Sáng kiến", "unit": "ý tưởng"}', true);