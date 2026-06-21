
-- =============================================
-- PHASE 1: PERFORMANCE MANAGEMENT FOUNDATION
-- =============================================

-- 1.1 Organizational Structure
-- =============================================

-- Phòng ban/Khối với cấu hình trọng số K.B.I.F
CREATE TABLE public.perf_org_units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.perf_org_units(id) ON DELETE SET NULL,
  manager_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  level_order INTEGER NOT NULL DEFAULT 0,
  kbif_weights JSONB NOT NULL DEFAULT '{"K": 0.4, "B": 0.3, "I": 0.2, "F": 0.1}'::jsonb,
  icon TEXT,
  color TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Thông tin nhân viên gamification
CREATE TABLE public.perf_employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  org_unit_id UUID REFERENCES public.perf_org_units(id) ON DELETE SET NULL,
  position_id UUID,
  current_level_id UUID,
  career_path_id UUID,
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  avatar_frame TEXT,
  title TEXT,
  hire_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);

-- Vị trí công việc
CREATE TABLE public.perf_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  org_unit_id UUID REFERENCES public.perf_org_units(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  level_order INTEGER NOT NULL DEFAULT 0,
  min_xp INTEGER NOT NULL DEFAULT 0,
  requirements JSONB DEFAULT '[]'::jsonb,
  responsibilities JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key for position_id after perf_positions is created
ALTER TABLE public.perf_employees 
  ADD CONSTRAINT fk_perf_employees_position 
  FOREIGN KEY (position_id) REFERENCES public.perf_positions(id) ON DELETE SET NULL;

-- 1.2 KPI Scoring Engine (K.B.I.F)
-- =============================================

-- Chu kỳ đánh giá
CREATE TABLE public.kpi_seasons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('quarter', 'half_year', 'year', 'custom')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  scoring_deadline DATE,
  review_deadline DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Định nghĩa các chỉ tiêu KPI
CREATE TABLE public.kpi_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id UUID NOT NULL REFERENCES public.kpi_seasons(id) ON DELETE CASCADE,
  org_unit_id UUID REFERENCES public.perf_org_units(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('K', 'B', 'I', 'F')),
  name TEXT NOT NULL,
  description TEXT,
  weight DECIMAL(5,4) NOT NULL DEFAULT 1.0 CHECK (weight >= 0 AND weight <= 1),
  target_value DECIMAL(15,2),
  min_value DECIMAL(15,2) DEFAULT 0,
  max_value DECIMAL(15,2) DEFAULT 100,
  unit TEXT,
  calculation_type TEXT DEFAULT 'manual' CHECK (calculation_type IN ('manual', 'auto', 'formula')),
  formula JSONB,
  is_required BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Điểm số của nhân viên
CREATE TABLE public.staff_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.perf_employees(id) ON DELETE CASCADE,
  metric_id UUID NOT NULL REFERENCES public.kpi_metrics(id) ON DELETE CASCADE,
  self_score DECIMAL(5,2) CHECK (self_score >= 0 AND self_score <= 100),
  manager_score DECIMAL(5,2) CHECK (manager_score >= 0 AND manager_score <= 100),
  final_score DECIMAL(5,2) CHECK (final_score >= 0 AND final_score <= 100),
  actual_value DECIMAL(15,2),
  self_comment TEXT,
  manager_comment TEXT,
  self_scored_at TIMESTAMP WITH TIME ZONE,
  manager_scored_at TIMESTAMP WITH TIME ZONE,
  finalized_at TIMESTAMP WITH TIME ZONE,
  finalized_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'self_scored', 'manager_scored', 'finalized', 'disputed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, metric_id)
);

-- Bằng chứng đính kèm
CREATE TABLE public.score_evidence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  score_id UUID NOT NULL REFERENCES public.staff_scores(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  description TEXT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Kết quả tổng hợp theo mùa
CREATE TABLE public.season_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.perf_employees(id) ON DELETE CASCADE,
  season_id UUID NOT NULL REFERENCES public.kpi_seasons(id) ON DELETE CASCADE,
  k_score DECIMAL(5,2) DEFAULT 0,
  b_score DECIMAL(5,2) DEFAULT 0,
  i_score DECIMAL(5,2) DEFAULT 0,
  f_score DECIMAL(5,2) DEFAULT 0,
  total_score DECIMAL(5,2) DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  rank_in_company INTEGER,
  rank_in_org_unit INTEGER,
  calculated_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, season_id)
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_perf_org_units_company ON public.perf_org_units(company_id);
CREATE INDEX idx_perf_org_units_parent ON public.perf_org_units(parent_id);
CREATE INDEX idx_perf_org_units_manager ON public.perf_org_units(manager_id);

CREATE INDEX idx_perf_employees_company ON public.perf_employees(company_id);
CREATE INDEX idx_perf_employees_user ON public.perf_employees(user_id);
CREATE INDEX idx_perf_employees_org_unit ON public.perf_employees(org_unit_id);
CREATE INDEX idx_perf_employees_xp ON public.perf_employees(total_xp DESC);

CREATE INDEX idx_perf_positions_company ON public.perf_positions(company_id);
CREATE INDEX idx_perf_positions_org_unit ON public.perf_positions(org_unit_id);

CREATE INDEX idx_kpi_seasons_company ON public.kpi_seasons(company_id);
CREATE INDEX idx_kpi_seasons_active ON public.kpi_seasons(company_id, is_active);
CREATE INDEX idx_kpi_seasons_dates ON public.kpi_seasons(start_date, end_date);

CREATE INDEX idx_kpi_metrics_season ON public.kpi_metrics(season_id);
CREATE INDEX idx_kpi_metrics_org_unit ON public.kpi_metrics(org_unit_id);
CREATE INDEX idx_kpi_metrics_category ON public.kpi_metrics(category);

CREATE INDEX idx_staff_scores_employee ON public.staff_scores(employee_id);
CREATE INDEX idx_staff_scores_metric ON public.staff_scores(metric_id);
CREATE INDEX idx_staff_scores_status ON public.staff_scores(status);

CREATE INDEX idx_score_evidence_score ON public.score_evidence(score_id);

CREATE INDEX idx_season_results_employee ON public.season_results(employee_id);
CREATE INDEX idx_season_results_season ON public.season_results(season_id);
CREATE INDEX idx_season_results_total ON public.season_results(total_score DESC);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.perf_org_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perf_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perf_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.season_results ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's company_id
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM public.company_members WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to check if user is admin/manager
CREATE OR REPLACE FUNCTION public.is_perf_admin_or_manager()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'manager')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- perf_org_units policies
CREATE POLICY "Users can view org units in their company"
  ON public.perf_org_units FOR SELECT
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Admins can manage org units"
  ON public.perf_org_units FOR ALL
  USING (company_id = public.get_user_company_id() AND public.is_perf_admin_or_manager());

-- perf_employees policies
CREATE POLICY "Users can view employees in their company"
  ON public.perf_employees FOR SELECT
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can update their own employee record"
  ON public.perf_employees FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage employees"
  ON public.perf_employees FOR ALL
  USING (company_id = public.get_user_company_id() AND public.is_perf_admin_or_manager());

-- perf_positions policies
CREATE POLICY "Users can view positions in their company"
  ON public.perf_positions FOR SELECT
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Admins can manage positions"
  ON public.perf_positions FOR ALL
  USING (company_id = public.get_user_company_id() AND public.is_perf_admin_or_manager());

-- kpi_seasons policies
CREATE POLICY "Users can view seasons in their company"
  ON public.kpi_seasons FOR SELECT
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Admins can manage seasons"
  ON public.kpi_seasons FOR ALL
  USING (company_id = public.get_user_company_id() AND public.is_perf_admin_or_manager());

-- kpi_metrics policies
CREATE POLICY "Users can view metrics in their company"
  ON public.kpi_metrics FOR SELECT
  USING (
    season_id IN (
      SELECT id FROM public.kpi_seasons WHERE company_id = public.get_user_company_id()
    )
  );

CREATE POLICY "Admins can manage metrics"
  ON public.kpi_metrics FOR ALL
  USING (
    season_id IN (
      SELECT id FROM public.kpi_seasons WHERE company_id = public.get_user_company_id()
    ) AND public.is_perf_admin_or_manager()
  );

-- staff_scores policies
CREATE POLICY "Users can view their own scores"
  ON public.staff_scores FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM public.perf_employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can view team scores"
  ON public.staff_scores FOR SELECT
  USING (
    employee_id IN (
      SELECT pe.id FROM public.perf_employees pe
      JOIN public.perf_org_units pou ON pe.org_unit_id = pou.id
      WHERE pou.manager_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their self scores"
  ON public.staff_scores FOR UPDATE
  USING (
    employee_id IN (
      SELECT id FROM public.perf_employees WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Can only update self_score and self_comment
    employee_id IN (
      SELECT id FROM public.perf_employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can manage team scores"
  ON public.staff_scores FOR ALL
  USING (
    employee_id IN (
      SELECT pe.id FROM public.perf_employees pe
      JOIN public.perf_org_units pou ON pe.org_unit_id = pou.id
      WHERE pou.manager_id = auth.uid()
    ) OR public.is_perf_admin_or_manager()
  );

-- score_evidence policies
CREATE POLICY "Users can view evidence for their scores"
  ON public.score_evidence FOR SELECT
  USING (
    score_id IN (
      SELECT ss.id FROM public.staff_scores ss
      JOIN public.perf_employees pe ON ss.employee_id = pe.id
      WHERE pe.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add evidence to their scores"
  ON public.score_evidence FOR INSERT
  WITH CHECK (
    score_id IN (
      SELECT ss.id FROM public.staff_scores ss
      JOIN public.perf_employees pe ON ss.employee_id = pe.id
      WHERE pe.user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can view team evidence"
  ON public.score_evidence FOR SELECT
  USING (
    score_id IN (
      SELECT ss.id FROM public.staff_scores ss
      JOIN public.perf_employees pe ON ss.employee_id = pe.id
      JOIN public.perf_org_units pou ON pe.org_unit_id = pou.id
      WHERE pou.manager_id = auth.uid()
    ) OR public.is_perf_admin_or_manager()
  );

-- season_results policies
CREATE POLICY "Users can view their own results"
  ON public.season_results FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM public.perf_employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can view team results"
  ON public.season_results FOR SELECT
  USING (
    employee_id IN (
      SELECT pe.id FROM public.perf_employees pe
      JOIN public.perf_org_units pou ON pe.org_unit_id = pou.id
      WHERE pou.manager_id = auth.uid()
    ) OR public.is_perf_admin_or_manager()
  );

CREATE POLICY "Admins can manage results"
  ON public.season_results FOR ALL
  USING (public.is_perf_admin_or_manager());

-- =============================================
-- TRIGGERS
-- =============================================

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION public.update_perf_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_perf_org_units_updated_at
  BEFORE UPDATE ON public.perf_org_units
  FOR EACH ROW EXECUTE FUNCTION public.update_perf_updated_at();

CREATE TRIGGER update_perf_employees_updated_at
  BEFORE UPDATE ON public.perf_employees
  FOR EACH ROW EXECUTE FUNCTION public.update_perf_updated_at();

CREATE TRIGGER update_perf_positions_updated_at
  BEFORE UPDATE ON public.perf_positions
  FOR EACH ROW EXECUTE FUNCTION public.update_perf_updated_at();

CREATE TRIGGER update_kpi_seasons_updated_at
  BEFORE UPDATE ON public.kpi_seasons
  FOR EACH ROW EXECUTE FUNCTION public.update_perf_updated_at();

CREATE TRIGGER update_kpi_metrics_updated_at
  BEFORE UPDATE ON public.kpi_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_perf_updated_at();

CREATE TRIGGER update_staff_scores_updated_at
  BEFORE UPDATE ON public.staff_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_perf_updated_at();

CREATE TRIGGER update_season_results_updated_at
  BEFORE UPDATE ON public.season_results
  FOR EACH ROW EXECUTE FUNCTION public.update_perf_updated_at();

-- Enable realtime for leaderboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_scores;
ALTER PUBLICATION supabase_realtime ADD TABLE public.season_results;
