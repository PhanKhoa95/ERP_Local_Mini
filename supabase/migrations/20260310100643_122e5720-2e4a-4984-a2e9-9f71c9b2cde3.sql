
-- 1. Create increment_account_balance function
CREATE OR REPLACE FUNCTION public.increment_account_balance(p_account_id UUID, p_amount NUMERIC)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE chart_of_accounts
  SET balance = COALESCE(balance, 0) + p_amount,
      updated_at = now()
  WHERE id = p_account_id;
$$;

-- 2. Add UNIQUE constraint on (company_id, code) if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chart_of_accounts_company_id_code_key'
  ) THEN
    ALTER TABLE public.chart_of_accounts
    ADD CONSTRAINT chart_of_accounts_company_id_code_key UNIQUE (company_id, code);
  END IF;
END $$;
