
-- Chart of Accounts
CREATE TABLE public.chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL,
  name TEXT NOT NULL,
  account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('asset','liability','equity','revenue','expense')),
  parent_id UUID REFERENCES public.chart_of_accounts(id),
  is_active BOOLEAN DEFAULT true,
  balance NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, code)
);

ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own company accounts" ON public.chart_of_accounts
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Admins/managers can manage accounts" ON public.chart_of_accounts
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id() AND public.is_perf_admin_or_manager())
  WITH CHECK (company_id = public.get_user_company_id() AND public.is_perf_admin_or_manager());

-- Journal Entries
CREATE TABLE public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  source_type VARCHAR(30) DEFAULT 'manual',
  source_id UUID,
  status VARCHAR(10) DEFAULT 'draft' CHECK (status IN ('draft','posted','voided')),
  vneid_signature TEXT,
  created_by UUID,
  posted_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own company entries" ON public.journal_entries
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Admins/managers can manage entries" ON public.journal_entries
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id() AND public.is_perf_admin_or_manager())
  WITH CHECK (company_id = public.get_user_company_id() AND public.is_perf_admin_or_manager());

-- Journal Lines (double-entry)
CREATE TABLE public.journal_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id),
  debit NUMERIC DEFAULT 0,
  credit NUMERIC DEFAULT 0,
  asset_type VARCHAR(20) DEFAULT 'cash' CHECK (asset_type IN ('cash','token','share','bnpl')),
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.journal_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own company lines" ON public.journal_lines
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.journal_entries je 
    WHERE je.id = journal_lines.entry_id 
    AND je.company_id = public.get_user_company_id()
  ));

CREATE POLICY "Admins/managers can manage lines" ON public.journal_lines
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.journal_entries je 
    WHERE je.id = journal_lines.entry_id 
    AND je.company_id = public.get_user_company_id()
  ) AND public.is_perf_admin_or_manager())
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.journal_entries je 
    WHERE je.id = journal_lines.entry_id 
    AND je.company_id = public.get_user_company_id()
  ) AND public.is_perf_admin_or_manager());

-- Triggers for updated_at
CREATE TRIGGER update_chart_of_accounts_updated_at BEFORE UPDATE ON public.chart_of_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
