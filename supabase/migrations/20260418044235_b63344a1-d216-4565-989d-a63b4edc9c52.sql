-- 1. shop_settings
ALTER TABLE public.shop_settings ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
UPDATE public.shop_settings SET company_id = (SELECT company_id FROM public.company_members LIMIT 1) WHERE company_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_shop_settings_company_id ON public.shop_settings(company_id);
ALTER TABLE public.shop_settings DROP CONSTRAINT IF EXISTS shop_settings_key_key CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS shop_settings_company_key_unique ON public.shop_settings(company_id, key);

ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view shop settings" ON public.shop_settings;
DROP POLICY IF EXISTS "Authenticated users can update shop settings" ON public.shop_settings;
DROP POLICY IF EXISTS "Authenticated users can insert shop settings" ON public.shop_settings;
DROP POLICY IF EXISTS "Company members can view shop settings" ON public.shop_settings;
DROP POLICY IF EXISTS "Company members can manage shop settings" ON public.shop_settings;
CREATE POLICY "Company members can view shop settings" ON public.shop_settings
  FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "Company members can manage shop settings" ON public.shop_settings
  FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id))
  WITH CHECK (public.is_company_member(auth.uid(), company_id));

-- 2. vouchers
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
UPDATE public.vouchers SET company_id = (SELECT company_id FROM public.company_members LIMIT 1) WHERE company_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_vouchers_company_id ON public.vouchers(company_id);
ALTER TABLE public.vouchers DROP CONSTRAINT IF EXISTS vouchers_code_key CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS vouchers_company_code_unique ON public.vouchers(company_id, code);

ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view vouchers" ON public.vouchers;
DROP POLICY IF EXISTS "Authenticated users can manage vouchers" ON public.vouchers;
DROP POLICY IF EXISTS "Company members can view vouchers" ON public.vouchers;
DROP POLICY IF EXISTS "Company members can manage vouchers" ON public.vouchers;
CREATE POLICY "Company members can view vouchers" ON public.vouchers
  FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "Company members can manage vouchers" ON public.vouchers
  FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id))
  WITH CHECK (public.is_company_member(auth.uid(), company_id));

-- 3. shipping_zones
ALTER TABLE public.shipping_zones ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
UPDATE public.shipping_zones SET company_id = (SELECT company_id FROM public.company_members LIMIT 1) WHERE company_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_shipping_zones_company_id ON public.shipping_zones(company_id);

ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view shipping zones" ON public.shipping_zones;
DROP POLICY IF EXISTS "Authenticated users can manage shipping zones" ON public.shipping_zones;
DROP POLICY IF EXISTS "Company members can view shipping zones" ON public.shipping_zones;
DROP POLICY IF EXISTS "Company members can manage shipping zones" ON public.shipping_zones;
CREATE POLICY "Company members can view shipping zones" ON public.shipping_zones
  FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "Company members can manage shipping zones" ON public.shipping_zones
  FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id))
  WITH CHECK (public.is_company_member(auth.uid(), company_id));

-- 4. payment_transactions
ALTER TABLE public.payment_transactions ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
UPDATE public.payment_transactions pt
SET company_id = p.company_id
FROM public.partners p
WHERE pt.partner_id = p.id AND pt.company_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_payment_transactions_company_id ON public.payment_transactions(company_id);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Authenticated users can manage payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Company members can view payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Company members can manage payment transactions" ON public.payment_transactions;
CREATE POLICY "Company members can view payment transactions" ON public.payment_transactions
  FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "Company members can manage payment transactions" ON public.payment_transactions
  FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id))
  WITH CHECK (public.is_company_member(auth.uid(), company_id));
