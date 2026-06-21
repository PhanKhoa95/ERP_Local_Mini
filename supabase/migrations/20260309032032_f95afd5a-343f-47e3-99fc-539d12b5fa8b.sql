
-- Smart Contracts table
CREATE TABLE public.smart_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
  contract_number TEXT NOT NULL,
  contract_type TEXT NOT NULL DEFAULT 'service',
  industry TEXT NOT NULL DEFAULT 'services',
  title TEXT NOT NULL,
  content_template JSONB DEFAULT '{}',
  variables JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  signer_user_id UUID,
  signer_vneid_hash TEXT,
  signed_at TIMESTAMPTZ,
  offline_hash TEXT,
  total_value NUMERIC DEFAULT 0,
  token_auto_issue BOOLEAN DEFAULT false,
  token_issue_percent NUMERIC DEFAULT 0,
  valid_from DATE,
  valid_to DATE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contract Milestones table
CREATE TABLE public.contract_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.smart_contracts(id) ON DELETE CASCADE,
  milestone_name TEXT NOT NULL,
  milestone_order INTEGER NOT NULL DEFAULT 1,
  due_date DATE,
  amount NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  token_issue_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  booking_type TEXT NOT NULL DEFAULT 'consultation',
  resource_type TEXT NOT NULL DEFAULT 'room',
  resource_name TEXT NOT NULL,
  resource_id UUID,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  industry TEXT NOT NULL DEFAULT 'services',
  vneid_hash TEXT,
  voucher_on_complete BOOLEAN DEFAULT false,
  voucher_discount NUMERIC DEFAULT 0,
  token_reward_on_complete NUMERIC DEFAULT 0,
  offline_queued BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Updated_at triggers
CREATE TRIGGER update_smart_contracts_updated_at BEFORE UPDATE ON public.smart_contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.smart_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- smart_contracts: manager+ can CRUD
CREATE POLICY "Managers can manage smart_contracts" ON public.smart_contracts
  FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id) AND public.is_perf_admin_or_manager())
  WITH CHECK (public.is_company_member(auth.uid(), company_id) AND public.is_perf_admin_or_manager());

-- contract_milestones: via smart_contracts company check
CREATE POLICY "Managers can manage milestones" ON public.contract_milestones
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.smart_contracts sc
    WHERE sc.id = contract_milestones.contract_id
    AND public.is_company_member(auth.uid(), sc.company_id)
    AND public.is_perf_admin_or_manager()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.smart_contracts sc
    WHERE sc.id = contract_milestones.contract_id
    AND public.is_company_member(auth.uid(), sc.company_id)
    AND public.is_perf_admin_or_manager()
  ));

-- bookings: all staff can CRUD within company
CREATE POLICY "Staff can manage bookings" ON public.bookings
  FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id))
  WITH CHECK (public.is_company_member(auth.uid(), company_id));
