-- =============================================
-- PHASE 2: Career Path & Skill Tree Schema
-- =============================================

-- Career Paths: Lộ trình thăng tiến (Sales Path, Tech Path, Management Path)
CREATE TABLE public.career_paths (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'briefcase',
  color TEXT DEFAULT '#3b82f6',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Career Levels: Cấp bậc trong lộ trình (Junior -> Senior -> Lead -> Manager)
CREATE TABLE public.career_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  path_id UUID NOT NULL REFERENCES public.career_paths(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level_order INTEGER NOT NULL DEFAULT 1,
  min_xp INTEGER NOT NULL DEFAULT 0,
  badge_icon TEXT,
  color TEXT,
  perks JSONB DEFAULT '[]',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Level Requirements: Yêu cầu thăng cấp
CREATE TABLE public.level_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level_id UUID NOT NULL REFERENCES public.career_levels(id) ON DELETE CASCADE,
  requirement_type TEXT NOT NULL CHECK (requirement_type IN ('xp', 'skill', 'achievement', 'quest', 'tenure')),
  requirement_value JSONB NOT NULL,
  is_mandatory BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Skill Categories: Nhóm kỹ năng (Communication, Technical, Leadership)
CREATE TABLE public.skill_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'star',
  color TEXT DEFAULT '#10b981',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Skill Nodes: Kỹ năng đơn lẻ (RPG tree style)
CREATE TABLE public.skill_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.skill_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  max_level INTEGER DEFAULT 5,
  xp_per_level INTEGER DEFAULT 100,
  parent_node_id UUID REFERENCES public.skill_nodes(id) ON DELETE SET NULL,
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  icon TEXT DEFAULT 'zap',
  unlock_conditions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Skill Progress: Tiến độ học tập của nhân viên
CREATE TABLE public.user_skill_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.perf_employees(id) ON DELETE CASCADE,
  skill_node_id UUID NOT NULL REFERENCES public.skill_nodes(id) ON DELETE CASCADE,
  current_level INTEGER DEFAULT 0,
  xp_progress INTEGER DEFAULT 0,
  unlocked_at TIMESTAMPTZ,
  last_updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, skill_node_id)
);

-- Skill Requirements: Kỹ năng bắt buộc cho từng vị trí
CREATE TABLE public.position_skill_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  position_id UUID NOT NULL REFERENCES public.perf_positions(id) ON DELETE CASCADE,
  skill_node_id UUID NOT NULL REFERENCES public.skill_nodes(id) ON DELETE CASCADE,
  required_level INTEGER DEFAULT 1,
  is_mandatory BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(position_id, skill_node_id)
);

-- Add career_path_id to perf_employees if not exists
ALTER TABLE public.perf_employees 
ADD COLUMN IF NOT EXISTS career_path_id UUID REFERENCES public.career_paths(id) ON DELETE SET NULL;

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_career_paths_company ON public.career_paths(company_id);
CREATE INDEX idx_career_levels_path ON public.career_levels(path_id);
CREATE INDEX idx_career_levels_order ON public.career_levels(path_id, level_order);
CREATE INDEX idx_skill_categories_company ON public.skill_categories(company_id);
CREATE INDEX idx_skill_nodes_category ON public.skill_nodes(category_id);
CREATE INDEX idx_skill_nodes_parent ON public.skill_nodes(parent_node_id);
CREATE INDEX idx_user_skill_progress_employee ON public.user_skill_progress(employee_id);
CREATE INDEX idx_user_skill_progress_skill ON public.user_skill_progress(skill_node_id);
CREATE INDEX idx_position_skill_req_position ON public.position_skill_requirements(position_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Career Paths RLS
ALTER TABLE public.career_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view career paths"
ON public.career_paths FOR SELECT
USING (company_id IN (
  SELECT company_id FROM public.company_members WHERE user_id = auth.uid()
));

CREATE POLICY "Admins and managers can manage career paths"
ON public.career_paths FOR ALL
USING (company_id IN (
  SELECT company_id FROM public.company_members 
  WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
));

-- Career Levels RLS
ALTER TABLE public.career_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View career levels via path"
ON public.career_levels FOR SELECT
USING (path_id IN (
  SELECT id FROM public.career_paths 
  WHERE company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid())
));

CREATE POLICY "Admins manage career levels"
ON public.career_levels FOR ALL
USING (path_id IN (
  SELECT id FROM public.career_paths 
  WHERE company_id IN (
    SELECT company_id FROM public.company_members WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  )
));

-- Level Requirements RLS
ALTER TABLE public.level_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View level requirements"
ON public.level_requirements FOR SELECT
USING (level_id IN (
  SELECT cl.id FROM public.career_levels cl
  JOIN public.career_paths cp ON cl.path_id = cp.id
  WHERE cp.company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid())
));

CREATE POLICY "Admins manage level requirements"
ON public.level_requirements FOR ALL
USING (level_id IN (
  SELECT cl.id FROM public.career_levels cl
  JOIN public.career_paths cp ON cl.path_id = cp.id
  WHERE cp.company_id IN (
    SELECT company_id FROM public.company_members WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  )
));

-- Skill Categories RLS
ALTER TABLE public.skill_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view skill categories"
ON public.skill_categories FOR SELECT
USING (company_id IN (
  SELECT company_id FROM public.company_members WHERE user_id = auth.uid()
));

CREATE POLICY "Admins manage skill categories"
ON public.skill_categories FOR ALL
USING (company_id IN (
  SELECT company_id FROM public.company_members 
  WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
));

-- Skill Nodes RLS
ALTER TABLE public.skill_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View skill nodes via category"
ON public.skill_nodes FOR SELECT
USING (category_id IN (
  SELECT id FROM public.skill_categories 
  WHERE company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid())
));

CREATE POLICY "Admins manage skill nodes"
ON public.skill_nodes FOR ALL
USING (category_id IN (
  SELECT id FROM public.skill_categories 
  WHERE company_id IN (
    SELECT company_id FROM public.company_members WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  )
));

-- User Skill Progress RLS
ALTER TABLE public.user_skill_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own skill progress"
ON public.user_skill_progress FOR SELECT
USING (employee_id IN (
  SELECT id FROM public.perf_employees WHERE user_id = auth.uid()
));

CREATE POLICY "Managers view team skill progress"
ON public.user_skill_progress FOR SELECT
USING (employee_id IN (
  SELECT pe.id FROM public.perf_employees pe
  JOIN public.perf_org_units ou ON pe.org_unit_id = ou.id
  WHERE ou.manager_id = auth.uid()
));

CREATE POLICY "Users can update own skill progress"
ON public.user_skill_progress FOR UPDATE
USING (employee_id IN (
  SELECT id FROM public.perf_employees WHERE user_id = auth.uid()
));

CREATE POLICY "System can insert skill progress"
ON public.user_skill_progress FOR INSERT
WITH CHECK (true);

-- Position Skill Requirements RLS
ALTER TABLE public.position_skill_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View position skill requirements"
ON public.position_skill_requirements FOR SELECT
USING (position_id IN (
  SELECT id FROM public.perf_positions 
  WHERE company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid())
));

CREATE POLICY "Admins manage position skill requirements"
ON public.position_skill_requirements FOR ALL
USING (position_id IN (
  SELECT id FROM public.perf_positions 
  WHERE company_id IN (
    SELECT company_id FROM public.company_members WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  )
));

-- =============================================
-- UPDATE TRIGGERS
-- =============================================
CREATE TRIGGER update_career_paths_updated_at
  BEFORE UPDATE ON public.career_paths
  FOR EACH ROW EXECUTE FUNCTION public.update_perf_updated_at();

CREATE TRIGGER update_career_levels_updated_at
  BEFORE UPDATE ON public.career_levels
  FOR EACH ROW EXECUTE FUNCTION public.update_perf_updated_at();

CREATE TRIGGER update_skill_categories_updated_at
  BEFORE UPDATE ON public.skill_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_perf_updated_at();

CREATE TRIGGER update_skill_nodes_updated_at
  BEFORE UPDATE ON public.skill_nodes
  FOR EACH ROW EXECUTE FUNCTION public.update_perf_updated_at();

-- =============================================
-- REALTIME
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_skill_progress;