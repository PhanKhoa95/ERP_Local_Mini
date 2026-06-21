
-- 1. project_shares - Cap table
CREATE TABLE public.project_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  holder_user_id UUID NOT NULL,
  share_count NUMERIC NOT NULL DEFAULT 0,
  share_type TEXT NOT NULL DEFAULT 'founder',
  vesting_start DATE,
  vesting_end DATE,
  is_vested BOOLEAN DEFAULT false,
  vneid_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. token_ledger - Double-entry ledger
CREATE TABLE public.token_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  token_type TEXT NOT NULL DEFAULT 'reward',
  amount NUMERIC NOT NULL,
  balance_after NUMERIC NOT NULL DEFAULT 0,
  reference_type TEXT NOT NULL DEFAULT 'issuance',
  reference_id TEXT,
  counterparty_user_id UUID,
  vneid_hash TEXT,
  tx_signature TEXT,
  blockchain_tx_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. token_balances - Realtime balances
CREATE TABLE public.token_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  balance NUMERIC NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, user_id, project_id)
);

-- 4. blockchain_config - Admin config
CREATE TABLE public.blockchain_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  chain_name TEXT NOT NULL DEFAULT '',
  chain_id TEXT,
  contract_address TEXT,
  rpc_url TEXT,
  gas_limit INTEGER,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. vneid_verifications
CREATE TABLE public.vneid_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  vneid_hash TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  verification_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);

-- Enable RLS
ALTER TABLE public.project_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vneid_verifications ENABLE ROW LEVEL SECURITY;

-- RLS: project_shares - company members can view, admin/manager can manage
CREATE POLICY "Members view shares" ON public.project_shares FOR SELECT TO authenticated
  USING (is_company_member(auth.uid(), company_id));
CREATE POLICY "Admins manage shares" ON public.project_shares FOR ALL TO authenticated
  USING (is_company_admin(auth.uid(), company_id));

-- RLS: token_ledger - users see own, admin sees all
CREATE POLICY "Users view own ledger" ON public.token_ledger FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_perf_admin_or_manager());
CREATE POLICY "System insert ledger" ON public.token_ledger FOR INSERT TO authenticated
  WITH CHECK (is_company_member(auth.uid(), company_id));

-- RLS: token_balances - users see own, admin sees all
CREATE POLICY "Users view own balance" ON public.token_balances FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_perf_admin_or_manager());
CREATE POLICY "System manage balances" ON public.token_balances FOR ALL TO authenticated
  USING (is_company_member(auth.uid(), company_id));

-- RLS: blockchain_config - admin only
CREATE POLICY "Admin manage blockchain" ON public.blockchain_config FOR ALL TO authenticated
  USING (is_company_admin(auth.uid(), company_id));

-- RLS: vneid_verifications - users see own, admin sees all
CREATE POLICY "Users view own vneid" ON public.vneid_verifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_perf_admin_or_manager());
CREATE POLICY "Users manage own vneid" ON public.vneid_verifications FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin manage vneid" ON public.vneid_verifications FOR ALL TO authenticated
  USING (is_company_admin(auth.uid(), company_id));
