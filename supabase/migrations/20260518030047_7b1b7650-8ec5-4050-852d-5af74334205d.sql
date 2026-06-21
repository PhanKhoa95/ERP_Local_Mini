
-- ============ Drop overly permissive ALL true/true policies ============
DROP POLICY IF EXISTS "Authenticated users can manage product_categories" ON public.product_categories;
DROP POLICY IF EXISTS "Authenticated users can manage product_variants" ON public.product_variants;
DROP POLICY IF EXISTS "Authenticated users can manage shipping_zones" ON public.shipping_zones;
DROP POLICY IF EXISTS "Authenticated users can manage shop_settings" ON public.shop_settings;
DROP POLICY IF EXISTS "Authenticated users can manage loyalty_transactions" ON public.loyalty_transactions;

-- ============ Replacement scoped policies ============

-- product_categories: shared catalog (no company_id). Only authenticated users may write.
CREATE POLICY "Authenticated users can insert product_categories"
  ON public.product_categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update product_categories"
  ON public.product_categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete product_categories"
  ON public.product_categories FOR DELETE TO authenticated USING (true);

-- product_variants: scope writes by parent product company
CREATE POLICY "Company members can manage product_variants"
  ON public.product_variants FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.products p
                 WHERE p.id = product_variants.product_id
                   AND p.company_id = public.get_user_company_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.products p
                      WHERE p.id = product_variants.product_id
                        AND p.company_id = public.get_user_company_id()));

-- loyalty_transactions: scope by partner.company_id
CREATE POLICY "Company members can manage loyalty_transactions"
  ON public.loyalty_transactions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.partners p
                 WHERE p.id = loyalty_transactions.partner_id
                   AND p.company_id = public.get_user_company_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.partners p
                      WHERE p.id = loyalty_transactions.partner_id
                        AND p.company_id = public.get_user_company_id()));

-- ============ shop_settings: restrict public read to safe keys only ============
DROP POLICY IF EXISTS "Public can read shop_settings" ON public.shop_settings;
CREATE POLICY "Public can read shop_settings public keys"
  ON public.shop_settings FOR SELECT TO anon
  USING (key IN ('bank_info', 'shop_info'));

-- ============ embedding_cache: restrict reads to authenticated ============
DROP POLICY IF EXISTS "Allow read access to embedding cache" ON public.embedding_cache;
CREATE POLICY "Authenticated users can read embedding_cache"
  ON public.embedding_cache FOR SELECT TO authenticated USING (true);

-- ============ audit_logs: scope to admin's own company ============
DROP POLICY IF EXISTS "Admins can view audit_logs" ON public.audit_logs;
CREATE POLICY "Admins can view their company audit_logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_members me
      JOIN public.company_members target
        ON target.company_id = me.company_id
      WHERE me.user_id = auth.uid()
        AND me.role IN ('admin','manager')
        AND target.user_id = audit_logs.user_id
    )
  );

-- ============ Function search_path hardening ============
ALTER FUNCTION public.get_user_company_id() SET search_path = public;
ALTER FUNCTION public.update_perf_updated_at() SET search_path = public;
