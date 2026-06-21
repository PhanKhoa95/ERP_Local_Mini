-- =============================================
-- PHASE 3: Gamification Schema
-- Achievements, Quests, Leaderboards, Feedback 360, Templates
-- =============================================

-- Achievements: Định nghĩa huy hiệu
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'trophy',
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  condition_type TEXT NOT NULL CHECK (condition_type IN ('xp_milestone', 'skill_max', 'quest_complete', 'streak', 'kpi_score', 'custom')),
  condition_value JSONB NOT NULL DEFAULT '{}',
  xp_reward INTEGER DEFAULT 0,
  badge_reward TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Achievements: Thành tích đã đạt
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.perf_employees(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  evidence_data JSONB,
  UNIQUE(employee_id, achievement_id)
);

-- Quests: Nhiệm vụ/thử thách
CREATE TABLE public.quests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  quest_type TEXT NOT NULL CHECK (quest_type IN ('daily', 'weekly', 'monthly', 'special', 'promotion', 'onboarding')),
  xp_reward INTEGER DEFAULT 0,
  achievement_reward_id UUID REFERENCES public.achievements(id) ON DELETE SET NULL,
  start_date DATE,
  end_date DATE,
  conditions JSONB NOT NULL DEFAULT '{}',
  max_completions INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quest Progress: Tiến độ hoàn thành
CREATE TABLE public.quest_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.perf_employees(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  current_progress JSONB DEFAULT '{}',
  completion_count INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, quest_id)
);

-- Promotion Quests: Quest bắt buộc để thăng chức
CREATE TABLE public.promotion_quests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level_id UUID NOT NULL REFERENCES public.career_levels(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  is_mandatory BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(level_id, quest_id)
);

-- Leaderboard Snapshots: Xếp hạng theo kỳ
CREATE TABLE public.leaderboard_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  org_unit_id UUID REFERENCES public.perf_org_units(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  rankings JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Feedback 360: Đánh giá 360 độ
CREATE TABLE public.feedback_360 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.perf_employees(id) ON DELETE CASCADE,
  season_id UUID NOT NULL REFERENCES public.kpi_seasons(id) ON DELETE CASCADE,
  reviewer_id UUID,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('self', 'peer', 'manager', 'subordinate', 'external')),
  raw_content TEXT,
  anonymized_content TEXT,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  is_processed BOOLEAN DEFAULT false,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Industry Templates: Bộ KPI mẫu theo ngành
CREATE TABLE public.industry_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  industry TEXT NOT NULL CHECK (industry IN ('retail', 'real_estate', 'technology', 'manufacturing', 'services', 'healthcare', 'education', 'finance')),
  template_type TEXT NOT NULL CHECK (template_type IN ('kpi', 'career_path', 'skill_tree', 'achievements', 'quests')),
  name TEXT NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance Onboarding: Theo dõi onboarding
CREATE TABLE public.performance_onboarding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  step_completed INTEGER DEFAULT 0,
  selected_industry TEXT,
  selected_templates JSONB DEFAULT '[]',
  org_structure JSONB DEFAULT '{}',
  kbif_config JSONB DEFAULT '{}',
  imported_employees INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

-- =============================================
-- XP & LEVEL UP TRIGGERS
-- =============================================

-- Function: Tính XP từ KPI Score
CREATE OR REPLACE FUNCTION public.calculate_xp_from_score()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.final_score IS NOT NULL AND (OLD.final_score IS NULL OR NEW.final_score != OLD.final_score) THEN
    UPDATE public.perf_employees
    SET total_xp = total_xp + GREATEST(0, (NEW.final_score * 10)::INTEGER),
        updated_at = now()
    WHERE id = NEW.employee_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_xp_from_kpi
AFTER UPDATE OF final_score ON public.staff_scores
FOR EACH ROW EXECUTE FUNCTION public.calculate_xp_from_score();

-- Function: Check Level Up
CREATE OR REPLACE FUNCTION public.check_level_up()
RETURNS TRIGGER AS $$
DECLARE
  current_path_id UUID;
  next_level RECORD;
BEGIN
  -- Get employee's career path
  SELECT career_path_id INTO current_path_id FROM public.perf_employees WHERE id = NEW.id;
  
  IF current_path_id IS NOT NULL THEN
    -- Find the highest level the employee qualifies for
    SELECT cl.* INTO next_level
    FROM public.career_levels cl
    WHERE cl.path_id = current_path_id
      AND cl.min_xp <= NEW.total_xp
    ORDER BY cl.level_order DESC
    LIMIT 1;
    
    IF next_level IS NOT NULL AND (NEW.current_level_id IS NULL OR next_level.id != NEW.current_level_id) THEN
      NEW.current_level_id := next_level.id;
      -- Insert notification for level up
      INSERT INTO public.rag_notifications (user_id, company_id, type, title, message, data)
      VALUES (
        NEW.user_id, 
        NEW.company_id, 
        'level_up', 
        'Chúc mừng thăng cấp!',
        'Bạn đã đạt cấp ' || next_level.name,
        jsonb_build_object('level_id', next_level.id, 'level_name', next_level.name, 'xp', NEW.total_xp)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_check_level_up
BEFORE UPDATE OF total_xp ON public.perf_employees
FOR EACH ROW EXECUTE FUNCTION public.check_level_up();

-- Function: Auto-award achievements
CREATE OR REPLACE FUNCTION public.check_achievements()
RETURNS TRIGGER AS $$
DECLARE
  ach RECORD;
BEGIN
  FOR ach IN 
    SELECT * FROM public.achievements 
    WHERE company_id = NEW.company_id AND is_active = true 
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.user_achievements 
      WHERE employee_id = NEW.id AND achievement_id = ach.id
    ) THEN
      -- Check XP milestone achievements
      IF ach.condition_type = 'xp_milestone' AND NEW.total_xp >= (ach.condition_value->>'min_xp')::INTEGER THEN
        INSERT INTO public.user_achievements (employee_id, achievement_id, evidence_data)
        VALUES (NEW.id, ach.id, jsonb_build_object('xp_at_award', NEW.total_xp));
        
        -- Award XP from achievement
        IF ach.xp_reward > 0 THEN
          NEW.total_xp := NEW.total_xp + ach.xp_reward;
        END IF;
        
        -- Notify
        INSERT INTO public.rag_notifications (user_id, company_id, type, title, message, data)
        VALUES (
          NEW.user_id,
          NEW.company_id,
          'achievement',
          'Đạt thành tựu mới!',
          'Bạn đã nhận được huy hiệu: ' || ach.name,
          jsonb_build_object('achievement_id', ach.id, 'rarity', ach.rarity)
        );
      END IF;
      
      -- Check streak achievements
      IF ach.condition_type = 'streak' AND NEW.current_streak >= (ach.condition_value->>'min_streak')::INTEGER THEN
        INSERT INTO public.user_achievements (employee_id, achievement_id, evidence_data)
        VALUES (NEW.id, ach.id, jsonb_build_object('streak_at_award', NEW.current_streak));
      END IF;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_check_achievements
AFTER UPDATE ON public.perf_employees
FOR EACH ROW EXECUTE FUNCTION public.check_achievements();

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_achievements_company ON public.achievements(company_id);
CREATE INDEX idx_achievements_type ON public.achievements(condition_type);
CREATE INDEX idx_user_achievements_employee ON public.user_achievements(employee_id);
CREATE INDEX idx_user_achievements_achievement ON public.user_achievements(achievement_id);
CREATE INDEX idx_quests_company ON public.quests(company_id);
CREATE INDEX idx_quests_type ON public.quests(quest_type);
CREATE INDEX idx_quests_active ON public.quests(is_active, start_date, end_date);
CREATE INDEX idx_quest_progress_employee ON public.quest_progress(employee_id);
CREATE INDEX idx_quest_progress_quest ON public.quest_progress(quest_id);
CREATE INDEX idx_leaderboard_company_period ON public.leaderboard_snapshots(company_id, period_type, period_start);
CREATE INDEX idx_feedback_employee_season ON public.feedback_360(employee_id, season_id);
CREATE INDEX idx_industry_templates_type ON public.industry_templates(industry, template_type);
CREATE INDEX idx_performance_onboarding_company ON public.performance_onboarding(company_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Achievements RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View company achievements"
ON public.achievements FOR SELECT
USING (company_id IN (
  SELECT company_id FROM public.company_members WHERE user_id = auth.uid()
));

CREATE POLICY "Admins manage achievements"
ON public.achievements FOR ALL
USING (company_id IN (
  SELECT company_id FROM public.company_members 
  WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
));

-- User Achievements RLS
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own achievements"
ON public.user_achievements FOR SELECT
USING (employee_id IN (
  SELECT id FROM public.perf_employees WHERE user_id = auth.uid()
));

CREATE POLICY "View team achievements"
ON public.user_achievements FOR SELECT
USING (employee_id IN (
  SELECT pe.id FROM public.perf_employees pe
  JOIN public.perf_org_units ou ON pe.org_unit_id = ou.id
  WHERE ou.manager_id = auth.uid()
));

CREATE POLICY "System insert achievements"
ON public.user_achievements FOR INSERT
WITH CHECK (true);

-- Quests RLS
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View company quests"
ON public.quests FOR SELECT
USING (company_id IN (
  SELECT company_id FROM public.company_members WHERE user_id = auth.uid()
));

CREATE POLICY "Admins manage quests"
ON public.quests FOR ALL
USING (company_id IN (
  SELECT company_id FROM public.company_members 
  WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
));

-- Quest Progress RLS
ALTER TABLE public.quest_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own quest progress"
ON public.quest_progress FOR SELECT
USING (employee_id IN (
  SELECT id FROM public.perf_employees WHERE user_id = auth.uid()
));

CREATE POLICY "Update own quest progress"
ON public.quest_progress FOR UPDATE
USING (employee_id IN (
  SELECT id FROM public.perf_employees WHERE user_id = auth.uid()
));

CREATE POLICY "System insert quest progress"
ON public.quest_progress FOR INSERT
WITH CHECK (true);

-- Promotion Quests RLS
ALTER TABLE public.promotion_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View promotion quests"
ON public.promotion_quests FOR SELECT
USING (level_id IN (
  SELECT cl.id FROM public.career_levels cl
  JOIN public.career_paths cp ON cl.path_id = cp.id
  WHERE cp.company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid())
));

-- Leaderboard RLS
ALTER TABLE public.leaderboard_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View company leaderboards"
ON public.leaderboard_snapshots FOR SELECT
USING (company_id IN (
  SELECT company_id FROM public.company_members WHERE user_id = auth.uid()
));

CREATE POLICY "System manage leaderboards"
ON public.leaderboard_snapshots FOR ALL
USING (true);

-- Feedback 360 RLS
ALTER TABLE public.feedback_360 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own feedback (anonymized)"
ON public.feedback_360 FOR SELECT
USING (
  employee_id IN (SELECT id FROM public.perf_employees WHERE user_id = auth.uid())
  AND is_processed = true
);

CREATE POLICY "Managers view team feedback"
ON public.feedback_360 FOR SELECT
USING (
  employee_id IN (
    SELECT pe.id FROM public.perf_employees pe
    JOIN public.perf_org_units ou ON pe.org_unit_id = ou.id
    WHERE ou.manager_id = auth.uid()
  )
);

CREATE POLICY "Submit feedback"
ON public.feedback_360 FOR INSERT
WITH CHECK (reviewer_id = auth.uid());

-- Industry Templates RLS (public read)
ALTER TABLE public.industry_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view templates"
ON public.industry_templates FOR SELECT
USING (is_active = true);

-- Performance Onboarding RLS
ALTER TABLE public.performance_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own company onboarding"
ON public.performance_onboarding FOR SELECT
USING (company_id IN (
  SELECT company_id FROM public.company_members WHERE user_id = auth.uid()
));

CREATE POLICY "Admins manage onboarding"
ON public.performance_onboarding FOR ALL
USING (company_id IN (
  SELECT company_id FROM public.company_members 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- =============================================
-- UPDATE TRIGGERS
-- =============================================
CREATE TRIGGER update_achievements_updated_at
  BEFORE UPDATE ON public.achievements
  FOR EACH ROW EXECUTE FUNCTION public.update_perf_updated_at();

CREATE TRIGGER update_quests_updated_at
  BEFORE UPDATE ON public.quests
  FOR EACH ROW EXECUTE FUNCTION public.update_perf_updated_at();

CREATE TRIGGER update_performance_onboarding_updated_at
  BEFORE UPDATE ON public.performance_onboarding
  FOR EACH ROW EXECUTE FUNCTION public.update_perf_updated_at();

-- =============================================
-- REALTIME
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_achievements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quest_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboard_snapshots;

-- =============================================
-- SEED INDUSTRY TEMPLATES
-- =============================================
INSERT INTO public.industry_templates (industry, template_type, name, description, template_data) VALUES
-- Retail KPIs
('retail', 'kpi', 'Bán lẻ - KPI cơ bản', 'Bộ KPI cho ngành bán lẻ', '{
  "metrics": [
    {"name": "Doanh số bán hàng", "category": "K", "weight": 35, "unit": "VND", "description": "Tổng doanh thu trong kỳ"},
    {"name": "Số lượng giao dịch", "category": "K", "weight": 15, "unit": "transactions", "description": "Số đơn hàng hoàn thành"},
    {"name": "Chất lượng phục vụ", "category": "B", "weight": 20, "unit": "score", "description": "Đánh giá từ khách hàng"},
    {"name": "Tỷ lệ hàng trả", "category": "B", "weight": 10, "unit": "%", "description": "% hàng bị trả lại"},
    {"name": "Sáng kiến cải tiến", "category": "I", "weight": 10, "unit": "count", "description": "Số sáng kiến đề xuất"},
    {"name": "Tuân thủ quy trình", "category": "F", "weight": 10, "unit": "%", "description": "Tuân thủ SOP"}
  ]
}'::jsonb),

-- Real Estate KPIs
('real_estate', 'kpi', 'Bất động sản - KPI cơ bản', 'Bộ KPI cho ngành bất động sản', '{
  "metrics": [
    {"name": "Doanh số chốt deal", "category": "K", "weight": 40, "unit": "VND", "description": "Tổng giá trị giao dịch"},
    {"name": "Tỷ lệ chốt deal", "category": "K", "weight": 20, "unit": "%", "description": "% khách hàng chốt deal"},
    {"name": "Phản hồi khách hàng", "category": "B", "weight": 15, "unit": "score", "description": "Điểm đánh giá dịch vụ"},
    {"name": "Số buổi viewing", "category": "B", "weight": 10, "unit": "count", "description": "Số buổi dẫn khách xem BĐS"},
    {"name": "Đề xuất sáng tạo", "category": "I", "weight": 10, "unit": "count", "description": "Sáng kiến marketing, bán hàng"},
    {"name": "Báo cáo đúng hạn", "category": "F", "weight": 5, "unit": "%", "description": "Tuân thủ deadline báo cáo"}
  ]
}'::jsonb),

-- Technology KPIs
('technology', 'kpi', 'Công nghệ - KPI cơ bản', 'Bộ KPI cho ngành công nghệ', '{
  "metrics": [
    {"name": "Sprint velocity", "category": "K", "weight": 25, "unit": "points", "description": "Story points hoàn thành"},
    {"name": "Chất lượng code", "category": "K", "weight": 20, "unit": "%", "description": "Code coverage, bug rate"},
    {"name": "Code review", "category": "B", "weight": 15, "unit": "count", "description": "Số PR đã review"},
    {"name": "Mentoring", "category": "B", "weight": 10, "unit": "hours", "description": "Giờ hỗ trợ đồng nghiệp"},
    {"name": "Tech innovation", "category": "I", "weight": 20, "unit": "count", "description": "Công nghệ mới áp dụng"},
    {"name": "Documentation", "category": "F", "weight": 10, "unit": "%", "description": "Tài liệu kỹ thuật"}
  ]
}'::jsonb),

-- Retail Career Path
('retail', 'career_path', 'Bán lẻ - Lộ trình Sales', 'Lộ trình thăng tiến cho Sales bán lẻ', '{
  "name": "Sales Path",
  "icon": "shopping-cart",
  "color": "#10b981",
  "levels": [
    {"name": "Nhân viên mới", "level_order": 1, "min_xp": 0, "badge_icon": "star", "color": "#94a3b8"},
    {"name": "Sales Associate", "level_order": 2, "min_xp": 500, "badge_icon": "award", "color": "#22c55e"},
    {"name": "Senior Sales", "level_order": 3, "min_xp": 2000, "badge_icon": "medal", "color": "#3b82f6"},
    {"name": "Team Lead", "level_order": 4, "min_xp": 5000, "badge_icon": "crown", "color": "#a855f7"},
    {"name": "Store Manager", "level_order": 5, "min_xp": 10000, "badge_icon": "trophy", "color": "#f59e0b"}
  ]
}'::jsonb),

-- Technology Career Path
('technology', 'career_path', 'Công nghệ - Lộ trình Developer', 'Lộ trình thăng tiến cho Developer', '{
  "name": "Developer Path",
  "icon": "code",
  "color": "#3b82f6",
  "levels": [
    {"name": "Fresher", "level_order": 1, "min_xp": 0, "badge_icon": "star", "color": "#94a3b8"},
    {"name": "Junior Developer", "level_order": 2, "min_xp": 1000, "badge_icon": "award", "color": "#22c55e"},
    {"name": "Mid Developer", "level_order": 3, "min_xp": 3000, "badge_icon": "medal", "color": "#3b82f6"},
    {"name": "Senior Developer", "level_order": 4, "min_xp": 7000, "badge_icon": "crown", "color": "#a855f7"},
    {"name": "Tech Lead", "level_order": 5, "min_xp": 15000, "badge_icon": "trophy", "color": "#f59e0b"}
  ]
}'::jsonb),

-- Skill Tree Template
('retail', 'skill_tree', 'Bán lẻ - Cây kỹ năng', 'Cây kỹ năng cho ngành bán lẻ', '{
  "categories": [
    {
      "name": "Kỹ năng bán hàng",
      "icon": "shopping-cart",
      "color": "#10b981",
      "skills": [
        {"name": "Tư vấn sản phẩm", "max_level": 5, "xp_per_level": 100},
        {"name": "Xử lý phản đối", "max_level": 5, "xp_per_level": 150},
        {"name": "Chốt đơn", "max_level": 5, "xp_per_level": 200}
      ]
    },
    {
      "name": "Kỹ năng giao tiếp",
      "icon": "message-circle",
      "color": "#3b82f6",
      "skills": [
        {"name": "Lắng nghe chủ động", "max_level": 5, "xp_per_level": 100},
        {"name": "Thuyết trình", "max_level": 5, "xp_per_level": 150},
        {"name": "Giải quyết xung đột", "max_level": 5, "xp_per_level": 200}
      ]
    }
  ]
}'::jsonb),

-- Achievement Template
('retail', 'achievements', 'Bán lẻ - Huy hiệu', 'Bộ huy hiệu cho ngành bán lẻ', '{
  "achievements": [
    {"name": "Đơn hàng đầu tiên", "rarity": "common", "condition_type": "custom", "xp_reward": 50, "icon": "star"},
    {"name": "Bán 100 đơn", "rarity": "rare", "condition_type": "custom", "xp_reward": 200, "icon": "medal"},
    {"name": "Top Sales tháng", "rarity": "epic", "condition_type": "custom", "xp_reward": 500, "icon": "crown"},
    {"name": "Huyền thoại Sales", "rarity": "legendary", "condition_type": "xp_milestone", "condition_value": {"min_xp": 10000}, "xp_reward": 1000, "icon": "trophy"}
  ]
}'::jsonb);