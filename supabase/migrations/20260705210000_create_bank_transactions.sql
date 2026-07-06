-- Migration: Create bank_transactions table for Casso bank transfer reconciliation
CREATE TABLE IF NOT EXISTS public.bank_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    transaction_id TEXT NOT NULL UNIQUE,
    amount NUMERIC(15,2) NOT NULL,
    content TEXT,
    gateway TEXT NOT NULL,
    account_number TEXT,
    sender_name TEXT,
    transaction_time TIMESTAMPTZ NOT NULL,
    reconciliation_status TEXT NOT NULL DEFAULT 'unmatched' CHECK (reconciliation_status IN ('matched', 'unmatched')),
    matched_entity_id UUID,
    matched_entity_type TEXT,
    reconciled_at TIMESTAMPTZ,
    reconciled_by UUID,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bank_transactions_select" ON public.bank_transactions FOR SELECT TO authenticated
  USING (company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()));

CREATE POLICY "bank_transactions_insert" ON public.bank_transactions FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()));

CREATE POLICY "bank_transactions_update" ON public.bank_transactions FOR UPDATE TO authenticated
  USING (company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()));

CREATE POLICY "bank_transactions_delete" ON public.bank_transactions FOR DELETE TO authenticated
  USING (company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid() AND cm.role IN ('admin', 'manager')));

CREATE TRIGGER update_bank_transactions_modtime BEFORE UPDATE ON public.bank_transactions FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();
