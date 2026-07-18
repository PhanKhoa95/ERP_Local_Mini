-- Harden RLS for the Pancake/CRM tables added in July 2026.
-- Historical migrations are intentionally left immutable; this migration
-- removes their permissive policies and replaces them with tenant-scoped ones.

-- Product variant components derive their tenant through products. Both sides
-- of a component relationship must belong to the same company.
DROP POLICY IF EXISTS "Allow read access to authenticated users on product_variant_components" ON public.product_variant_components;
DROP POLICY IF EXISTS "Allow write access to authenticated users on product_variant_components" ON public.product_variant_components;
DROP POLICY IF EXISTS "tenant_members_manage_product_variant_components" ON public.product_variant_components;
CREATE POLICY "tenant_members_manage_product_variant_components"
  ON public.product_variant_components
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.product_variants parent_variant
      JOIN public.products parent_product ON parent_product.id = parent_variant.product_id
      JOIN public.product_variants child_variant ON child_variant.id = product_variant_components.child_variant_id
      JOIN public.products child_product ON child_product.id = child_variant.product_id
      WHERE parent_variant.id = product_variant_components.parent_variant_id
        AND child_product.company_id = parent_product.company_id
        AND public.is_company_member(auth.uid(), parent_product.company_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.product_variants parent_variant
      JOIN public.products parent_product ON parent_product.id = parent_variant.product_id
      JOIN public.product_variants child_variant ON child_variant.id = product_variant_components.child_variant_id
      JOIN public.products child_product ON child_product.id = child_variant.product_id
      WHERE parent_variant.id = product_variant_components.parent_variant_id
        AND child_product.company_id = parent_product.company_id
        AND public.is_company_member(auth.uid(), parent_product.company_id)
    )
  );

DROP POLICY IF EXISTS "Allow read access to authenticated users on wholesale_settings" ON public.wholesale_settings;
DROP POLICY IF EXISTS "Allow write access to authenticated users on wholesale_settings" ON public.wholesale_settings;
DROP POLICY IF EXISTS "tenant_members_read_wholesale_settings" ON public.wholesale_settings;
DROP POLICY IF EXISTS "tenant_admins_manage_wholesale_settings" ON public.wholesale_settings;
CREATE POLICY "tenant_members_read_wholesale_settings"
  ON public.wholesale_settings FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "tenant_admins_manage_wholesale_settings"
  ON public.wholesale_settings FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));

DROP POLICY IF EXISTS "Allow read access to authenticated users on product_wholesale_prices" ON public.product_wholesale_prices;
DROP POLICY IF EXISTS "Allow write access to authenticated users on product_wholesale_prices" ON public.product_wholesale_prices;
DROP POLICY IF EXISTS "tenant_members_manage_product_wholesale_prices" ON public.product_wholesale_prices;
CREATE POLICY "tenant_members_manage_product_wholesale_prices"
  ON public.product_wholesale_prices
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.products product
      LEFT JOIN public.product_variants variant ON variant.id = product_wholesale_prices.variant_id
      WHERE product.id = product_wholesale_prices.product_id
        AND (product_wholesale_prices.variant_id IS NULL OR variant.product_id = product.id)
        AND public.is_company_member(auth.uid(), product.company_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.products product
      LEFT JOIN public.product_variants variant ON variant.id = product_wholesale_prices.variant_id
      WHERE product.id = product_wholesale_prices.product_id
        AND (product_wholesale_prices.variant_id IS NULL OR variant.product_id = product.id)
        AND public.is_company_member(auth.uid(), product.company_id)
    )
  );

-- Loyalty configuration is readable by company members and writable by admins.
DROP POLICY IF EXISTS "Allow read access to authenticated users on loyalty_settings" ON public.loyalty_settings;
DROP POLICY IF EXISTS "Allow write access to authenticated users on loyalty_settings" ON public.loyalty_settings;
DROP POLICY IF EXISTS "tenant_members_read_loyalty_settings" ON public.loyalty_settings;
DROP POLICY IF EXISTS "tenant_admins_manage_loyalty_settings" ON public.loyalty_settings;
CREATE POLICY "tenant_members_read_loyalty_settings"
  ON public.loyalty_settings FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "tenant_admins_manage_loyalty_settings"
  ON public.loyalty_settings FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));

DROP POLICY IF EXISTS "Allow read access to authenticated users on referral_settings" ON public.referral_settings;
DROP POLICY IF EXISTS "Allow write access to authenticated users on referral_settings" ON public.referral_settings;
DROP POLICY IF EXISTS "tenant_members_read_referral_settings" ON public.referral_settings;
DROP POLICY IF EXISTS "tenant_admins_manage_referral_settings" ON public.referral_settings;
CREATE POLICY "tenant_members_read_referral_settings"
  ON public.referral_settings FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "tenant_admins_manage_referral_settings"
  ON public.referral_settings FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));

DROP POLICY IF EXISTS "Allow read access to authenticated users on loyalty_transactions" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "Allow write access to authenticated users on loyalty_transactions" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "Company members can manage loyalty_transactions" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "tenant_members_manage_loyalty_transactions" ON public.loyalty_transactions;
CREATE POLICY "tenant_members_manage_loyalty_transactions"
  ON public.loyalty_transactions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.partners partner
      LEFT JOIN public.orders related_order ON related_order.id = loyalty_transactions.order_id
      WHERE partner.id = loyalty_transactions.partner_id
        AND (loyalty_transactions.order_id IS NULL OR related_order.company_id = partner.company_id)
        AND public.is_company_member(auth.uid(), partner.company_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.partners partner
      LEFT JOIN public.orders related_order ON related_order.id = loyalty_transactions.order_id
      WHERE partner.id = loyalty_transactions.partner_id
        AND (loyalty_transactions.order_id IS NULL OR related_order.company_id = partner.company_id)
        AND public.is_company_member(auth.uid(), partner.company_id)
    )
  );

-- Company-owned operational tables.
DROP POLICY IF EXISTS "Allow all actions for authenticated users on product_reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "tenant_members_manage_product_reviews" ON public.product_reviews;
CREATE POLICY "tenant_members_manage_product_reviews"
  ON public.product_reviews FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id))
  WITH CHECK (public.is_company_member(auth.uid(), company_id));

DROP POLICY IF EXISTS "Allow all actions for authenticated users on platform_category_mappings" ON public.platform_category_mappings;
DROP POLICY IF EXISTS "tenant_members_manage_platform_category_mappings" ON public.platform_category_mappings;
CREATE POLICY "tenant_members_manage_platform_category_mappings"
  ON public.platform_category_mappings FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id))
  WITH CHECK (public.is_company_member(auth.uid(), company_id));

DROP POLICY IF EXISTS "Allow all actions for authenticated users on platform_push_logs" ON public.platform_push_logs;
DROP POLICY IF EXISTS "tenant_members_manage_platform_push_logs" ON public.platform_push_logs;
CREATE POLICY "tenant_members_manage_platform_push_logs"
  ON public.platform_push_logs FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id))
  WITH CHECK (public.is_company_member(auth.uid(), company_id));

DROP POLICY IF EXISTS "Allow all actions for authenticated users on payment_settings" ON public.payment_settings;
DROP POLICY IF EXISTS "tenant_members_read_payment_settings" ON public.payment_settings;
DROP POLICY IF EXISTS "tenant_admins_manage_payment_settings" ON public.payment_settings;
CREATE POLICY "tenant_members_read_payment_settings"
  ON public.payment_settings FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "tenant_admins_manage_payment_settings"
  ON public.payment_settings FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));

DROP POLICY IF EXISTS "Allow all actions for authenticated users on warehouse_permissions" ON public.warehouse_permissions;
DROP POLICY IF EXISTS "tenant_members_read_warehouse_permissions" ON public.warehouse_permissions;
DROP POLICY IF EXISTS "tenant_admins_manage_warehouse_permissions" ON public.warehouse_permissions;
CREATE POLICY "tenant_members_read_warehouse_permissions"
  ON public.warehouse_permissions FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "tenant_admins_manage_warehouse_permissions"
  ON public.warehouse_permissions FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));

-- CRM records must be isolated by company membership. These policy names came
-- from migrations that omitted TO authenticated, making them apply to PUBLIC.
DROP POLICY IF EXISTS "Allow public select of crm_companies by company_id" ON public.crm_companies;
DROP POLICY IF EXISTS "Allow public insert of crm_companies by company_id" ON public.crm_companies;
DROP POLICY IF EXISTS "Allow public update of crm_companies by company_id" ON public.crm_companies;
DROP POLICY IF EXISTS "Allow public delete of crm_companies by company_id" ON public.crm_companies;
DROP POLICY IF EXISTS "tenant_members_manage_crm_companies" ON public.crm_companies;
CREATE POLICY "tenant_members_manage_crm_companies"
  ON public.crm_companies FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id))
  WITH CHECK (public.is_company_member(auth.uid(), company_id));

DROP POLICY IF EXISTS "Allow public select of crm_contacts by company_id" ON public.crm_contacts;
DROP POLICY IF EXISTS "Allow public insert of crm_contacts by company_id" ON public.crm_contacts;
DROP POLICY IF EXISTS "Allow public update of crm_contacts by company_id" ON public.crm_contacts;
DROP POLICY IF EXISTS "Allow public delete of crm_contacts by company_id" ON public.crm_contacts;
DROP POLICY IF EXISTS "tenant_members_manage_crm_contacts" ON public.crm_contacts;
CREATE POLICY "tenant_members_manage_crm_contacts"
  ON public.crm_contacts FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id))
  WITH CHECK (
    public.is_company_member(auth.uid(), company_id)
    AND (
      company_map_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.crm_companies mapped_company
        WHERE mapped_company.id = crm_contacts.company_map_id
          AND mapped_company.company_id = crm_contacts.company_id
      )
    )
  );

DROP POLICY IF EXISTS "Allow public select of crm_custom_fields by company_id" ON public.crm_custom_fields;
DROP POLICY IF EXISTS "Allow public insert of crm_custom_fields by company_id" ON public.crm_custom_fields;
DROP POLICY IF EXISTS "Allow public delete of crm_custom_fields by company_id" ON public.crm_custom_fields;
DROP POLICY IF EXISTS "tenant_members_manage_crm_custom_fields" ON public.crm_custom_fields;
CREATE POLICY "tenant_members_manage_crm_custom_fields"
  ON public.crm_custom_fields FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id))
  WITH CHECK (public.is_company_member(auth.uid(), company_id));

DROP POLICY IF EXISTS "Allow public select of crm_custom_field_values by company_id" ON public.crm_custom_field_values;
DROP POLICY IF EXISTS "Allow public insert of crm_custom_field_values by company_id" ON public.crm_custom_field_values;
DROP POLICY IF EXISTS "Allow public update of crm_custom_field_values by company_id" ON public.crm_custom_field_values;
DROP POLICY IF EXISTS "tenant_members_manage_crm_custom_field_values" ON public.crm_custom_field_values;
CREATE POLICY "tenant_members_manage_crm_custom_field_values"
  ON public.crm_custom_field_values FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id))
  WITH CHECK (
    public.is_company_member(auth.uid(), company_id)
    AND EXISTS (
      SELECT 1 FROM public.crm_custom_fields field_definition
      WHERE field_definition.id = crm_custom_field_values.field_id
        AND field_definition.company_id = crm_custom_field_values.company_id
    )
  );

-- API credentials are restricted to company administrators, not every member.
DROP POLICY IF EXISTS "Allow public select of crm_api_keys by company_id" ON public.crm_api_keys;
DROP POLICY IF EXISTS "Allow public insert of crm_api_keys by company_id" ON public.crm_api_keys;
DROP POLICY IF EXISTS "Allow public delete of crm_api_keys by company_id" ON public.crm_api_keys;
DROP POLICY IF EXISTS "tenant_admins_manage_crm_api_keys" ON public.crm_api_keys;
CREATE POLICY "tenant_admins_manage_crm_api_keys"
  ON public.crm_api_keys FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));

DROP POLICY IF EXISTS "Allow public select of crm_pos_chat_settings" ON public.crm_pos_chat_settings;
DROP POLICY IF EXISTS "Allow public insert of crm_pos_chat_settings" ON public.crm_pos_chat_settings;
DROP POLICY IF EXISTS "Allow public update of crm_pos_chat_settings" ON public.crm_pos_chat_settings;
DROP POLICY IF EXISTS "tenant_members_read_crm_pos_chat_settings" ON public.crm_pos_chat_settings;
DROP POLICY IF EXISTS "tenant_admins_manage_crm_pos_chat_settings" ON public.crm_pos_chat_settings;
CREATE POLICY "tenant_members_read_crm_pos_chat_settings"
  ON public.crm_pos_chat_settings FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "tenant_admins_manage_crm_pos_chat_settings"
  ON public.crm_pos_chat_settings FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid(), company_id));

DROP POLICY IF EXISTS "Allow public select of crm_lead_forms" ON public.crm_lead_forms;
DROP POLICY IF EXISTS "Allow public insert of crm_lead_forms" ON public.crm_lead_forms;
DROP POLICY IF EXISTS "Allow public update of crm_lead_forms" ON public.crm_lead_forms;
DROP POLICY IF EXISTS "Allow public delete of crm_lead_forms" ON public.crm_lead_forms;
DROP POLICY IF EXISTS "tenant_members_manage_crm_lead_forms" ON public.crm_lead_forms;
CREATE POLICY "tenant_members_manage_crm_lead_forms"
  ON public.crm_lead_forms FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id))
  WITH CHECK (public.is_company_member(auth.uid(), company_id));

DROP POLICY IF EXISTS "Allow public select of crm_automation_rules" ON public.crm_automation_rules;
DROP POLICY IF EXISTS "Allow public insert of crm_automation_rules" ON public.crm_automation_rules;
DROP POLICY IF EXISTS "Allow public update of crm_automation_rules" ON public.crm_automation_rules;
DROP POLICY IF EXISTS "Allow public delete of crm_automation_rules" ON public.crm_automation_rules;
DROP POLICY IF EXISTS "tenant_members_manage_crm_automation_rules" ON public.crm_automation_rules;
CREATE POLICY "tenant_members_manage_crm_automation_rules"
  ON public.crm_automation_rules FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id))
  WITH CHECK (public.is_company_member(auth.uid(), company_id));
