
-- Employee profiles (extended personal info)
CREATE TABLE public.employee_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.perf_employees(id) ON DELETE CASCADE UNIQUE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  date_of_birth DATE,
  gender TEXT,
  id_number TEXT,
  id_issued_date DATE,
  id_issued_place TEXT,
  permanent_address TEXT,
  current_address TEXT,
  personal_email TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  bank_account TEXT,
  bank_name TEXT,
  tax_code TEXT,
  social_insurance_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Employee contracts
CREATE TABLE public.employee_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.perf_employees(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  contract_type TEXT NOT NULL DEFAULT 'fixed_term',
  contract_number TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  salary_amount NUMERIC,
  salary_currency TEXT DEFAULT 'VND',
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_employee_profiles_company ON public.employee_profiles(company_id);
CREATE INDEX idx_employee_profiles_employee ON public.employee_profiles(employee_id);
CREATE INDEX idx_employee_contracts_company ON public.employee_contracts(company_id);
CREATE INDEX idx_employee_contracts_employee ON public.employee_contracts(employee_id);
CREATE INDEX idx_employee_contracts_status ON public.employee_contracts(status);

-- Updated_at triggers
CREATE TRIGGER update_employee_profiles_updated_at
  BEFORE UPDATE ON public.employee_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_contracts_updated_at
  BEFORE UPDATE ON public.employee_contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_contracts ENABLE ROW LEVEL SECURITY;

-- employee_profiles: company members can read, admin/manager can write
CREATE POLICY "Company members can view employee profiles"
  ON public.employee_profiles FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));

CREATE POLICY "Admin/manager can insert employee profiles"
  ON public.employee_profiles FOR INSERT TO authenticated
  WITH CHECK (public.is_perf_admin_or_manager() OR employee_id IN (
    SELECT id FROM public.perf_employees WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admin/manager can update employee profiles"
  ON public.employee_profiles FOR UPDATE TO authenticated
  USING (public.is_perf_admin_or_manager() OR employee_id IN (
    SELECT id FROM public.perf_employees WHERE user_id = auth.uid()
  ));

-- employee_contracts: only admin/manager
CREATE POLICY "Company members can view contracts"
  ON public.employee_contracts FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));

CREATE POLICY "Admin/manager can insert contracts"
  ON public.employee_contracts FOR INSERT TO authenticated
  WITH CHECK (public.is_perf_admin_or_manager());

CREATE POLICY "Admin/manager can update contracts"
  ON public.employee_contracts FOR UPDATE TO authenticated
  USING (public.is_perf_admin_or_manager());

CREATE POLICY "Admin/manager can delete contracts"
  ON public.employee_contracts FOR DELETE TO authenticated
  USING (public.is_perf_admin_or_manager());
