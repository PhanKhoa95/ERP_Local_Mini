-- Phase 1: Add company_id to core tables that don't have it
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.sales_channels ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.customer_groups ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.stock_transfers ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- Phase 2: Backfill company_id from existing data
-- For orders that have created_by, get company from company_members
UPDATE public.products SET company_id = (SELECT company_id FROM public.company_members LIMIT 1) WHERE company_id IS NULL;
UPDATE public.partners SET company_id = (SELECT company_id FROM public.company_members LIMIT 1) WHERE company_id IS NULL;
UPDATE public.orders SET company_id = COALESCE(
  (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = orders.created_by LIMIT 1),
  (SELECT company_id FROM public.company_members LIMIT 1)
) WHERE company_id IS NULL;
UPDATE public.warehouses SET company_id = (SELECT company_id FROM public.company_members LIMIT 1) WHERE company_id IS NULL;
UPDATE public.sales_channels SET company_id = (SELECT company_id FROM public.company_members LIMIT 1) WHERE company_id IS NULL;
UPDATE public.customer_groups SET company_id = (SELECT company_id FROM public.company_members LIMIT 1) WHERE company_id IS NULL;
UPDATE public.stock_transfers SET company_id = COALESCE(
  (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = stock_transfers.created_by LIMIT 1),
  (SELECT company_id FROM public.company_members LIMIT 1)
) WHERE company_id IS NULL;

-- Phase 3: Drop old permissive RLS policies
DROP POLICY IF EXISTS "Authenticated users can manage products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.products;
DROP POLICY IF EXISTS "Public can view active products" ON public.products;

DROP POLICY IF EXISTS "Authenticated users can manage partners" ON public.partners;
DROP POLICY IF EXISTS "Authenticated users can view partners" ON public.partners;

DROP POLICY IF EXISTS "Authenticated users can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can view orders" ON public.orders;
DROP POLICY IF EXISTS "Public can create orders" ON public.orders;
DROP POLICY IF EXISTS "Public can view orders" ON public.orders;

DROP POLICY IF EXISTS "Authenticated users can manage order_items" ON public.order_items;
DROP POLICY IF EXISTS "Authenticated users can view order_items" ON public.order_items;
DROP POLICY IF EXISTS "Public can create order_items" ON public.order_items;
DROP POLICY IF EXISTS "Public can view order_items" ON public.order_items;

DROP POLICY IF EXISTS "Authenticated users can manage warehouses" ON public.warehouses;
DROP POLICY IF EXISTS "Authenticated users can view warehouses" ON public.warehouses;

DROP POLICY IF EXISTS "Authenticated users can manage warehouse_stock" ON public.warehouse_stock;
DROP POLICY IF EXISTS "Authenticated users can view warehouse_stock" ON public.warehouse_stock;

DROP POLICY IF EXISTS "Authenticated users can manage sales_channels" ON public.sales_channels;
DROP POLICY IF EXISTS "Authenticated users can view sales_channels" ON public.sales_channels;

DROP POLICY IF EXISTS "Authenticated users can manage customer_groups" ON public.customer_groups;

DROP POLICY IF EXISTS "Authenticated users can manage inventory_transactions" ON public.inventory_transactions;
DROP POLICY IF EXISTS "Authenticated users can view inventory_transactions" ON public.inventory_transactions;

DROP POLICY IF EXISTS "Authenticated users can manage payment_transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Authenticated users can view payment_transactions" ON public.payment_transactions;

DROP POLICY IF EXISTS "Authenticated users can manage stock_transfers" ON public.stock_transfers;
DROP POLICY IF EXISTS "Authenticated users can view stock_transfers" ON public.stock_transfers;

DROP POLICY IF EXISTS "Authenticated users can manage stock_transfer_items" ON public.stock_transfer_items;
DROP POLICY IF EXISTS "Authenticated users can view stock_transfer_items" ON public.stock_transfer_items;

DROP POLICY IF EXISTS "Authenticated users can manage product_bom" ON public.product_bom;
DROP POLICY IF EXISTS "Authenticated users can view product_bom" ON public.product_bom;

-- Phase 4: Create company-scoped RLS policies for core tables
-- PRODUCTS
CREATE POLICY "Company members can manage products" ON public.products
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "Public can view active products" ON public.products
  FOR SELECT TO anon
  USING (is_active = true);

-- PARTNERS
CREATE POLICY "Company members can manage partners" ON public.partners
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

-- ORDERS
CREATE POLICY "Company members can manage orders" ON public.orders
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "Public can create orders" ON public.orders
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Public can view orders by number" ON public.orders
  FOR SELECT TO anon
  USING (true);

-- ORDER_ITEMS (via parent order)
CREATE POLICY "Company members can manage order_items" ON public.order_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.company_id = public.get_user_company_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.company_id = public.get_user_company_id()));

CREATE POLICY "Public can create order_items" ON public.order_items
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Public can view order_items" ON public.order_items
  FOR SELECT TO anon
  USING (true);

-- WAREHOUSES
CREATE POLICY "Company members can manage warehouses" ON public.warehouses
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

-- WAREHOUSE_STOCK (via parent warehouse)
CREATE POLICY "Company members can manage warehouse_stock" ON public.warehouse_stock
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.warehouses w WHERE w.id = warehouse_stock.warehouse_id AND w.company_id = public.get_user_company_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.warehouses w WHERE w.id = warehouse_stock.warehouse_id AND w.company_id = public.get_user_company_id()));

-- SALES_CHANNELS
CREATE POLICY "Company members can manage sales_channels" ON public.sales_channels
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

-- CUSTOMER_GROUPS
CREATE POLICY "Company members can manage customer_groups" ON public.customer_groups
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

-- INVENTORY_TRANSACTIONS (via parent product)
CREATE POLICY "Company members can manage inventory_transactions" ON public.inventory_transactions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = inventory_transactions.product_id AND p.company_id = public.get_user_company_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.products p WHERE p.id = inventory_transactions.product_id AND p.company_id = public.get_user_company_id()));

-- PAYMENT_TRANSACTIONS (via parent partner)
CREATE POLICY "Company members can manage payment_transactions" ON public.payment_transactions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.partners p WHERE p.id = payment_transactions.partner_id AND p.company_id = public.get_user_company_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.partners p WHERE p.id = payment_transactions.partner_id AND p.company_id = public.get_user_company_id()));

-- STOCK_TRANSFERS
CREATE POLICY "Company members can manage stock_transfers" ON public.stock_transfers
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

-- STOCK_TRANSFER_ITEMS (via parent transfer)
CREATE POLICY "Company members can manage stock_transfer_items" ON public.stock_transfer_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stock_transfers st WHERE st.id = stock_transfer_items.transfer_id AND st.company_id = public.get_user_company_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.stock_transfers st WHERE st.id = stock_transfer_items.transfer_id AND st.company_id = public.get_user_company_id()));

-- PRODUCT_BOM (via parent product)
CREATE POLICY "Company members can manage product_bom" ON public.product_bom
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_bom.product_id AND p.company_id = public.get_user_company_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_bom.product_id AND p.company_id = public.get_user_company_id()));

-- Phase 5: Fix auto_setup_new_user to include company_id in warehouses and sales_channels
CREATE OR REPLACE FUNCTION public.auto_setup_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_company_id uuid;
  email_domain text;
  company_name text;
BEGIN
  email_domain := split_part(NEW.email, '@', 2);
  company_name := COALESCE(
    NEW.raw_user_meta_data->>'company_name',
    'Công ty ' || split_part(NEW.email, '@', 1)
  );
  
  INSERT INTO public.companies (name, code, is_active)
  VALUES (company_name, 'COMP-' || substr(NEW.id::text, 1, 8), true)
  RETURNING id INTO new_company_id;
  
  INSERT INTO public.company_members (user_id, company_id, role)
  VALUES (NEW.id, new_company_id, 'admin');
  
  INSERT INTO public.warehouses (name, code, is_active, is_default, address, company_id)
  VALUES ('Kho chính', 'KHO-' || substr(new_company_id::text, 1, 8), true, true, 'Địa chỉ mặc định', new_company_id);
  
  INSERT INTO public.sales_channels (name, code, is_active, color, description, company_id)
  VALUES ('Cửa hàng', 'STORE-' || substr(new_company_id::text, 1, 8), true, '#3B82F6', 'Kênh bán hàng mặc định', new_company_id);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Auto-setup failed for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;