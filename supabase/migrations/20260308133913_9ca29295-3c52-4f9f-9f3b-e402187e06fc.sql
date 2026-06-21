
-- Extend products table with reorder_point, lead_time_days, avg_daily_sales
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS reorder_point integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lead_time_days integer DEFAULT 7,
  ADD COLUMN IF NOT EXISTS avg_daily_sales numeric DEFAULT 0;

-- Purchase Orders table
CREATE TABLE public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) NOT NULL,
  po_number text NOT NULL,
  supplier_id uuid REFERENCES public.partners(id),
  status text NOT NULL DEFAULT 'draft',
  order_date timestamptz NOT NULL DEFAULT now(),
  expected_date timestamptz,
  subtotal numeric DEFAULT 0,
  discount numeric DEFAULT 0,
  total numeric DEFAULT 0,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid REFERENCES public.purchase_orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  received_quantity numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Quotations table
CREATE TABLE public.quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) NOT NULL,
  quotation_number text NOT NULL,
  partner_id uuid REFERENCES public.partners(id),
  status text NOT NULL DEFAULT 'draft',
  valid_until timestamptz,
  subtotal numeric DEFAULT 0,
  discount numeric DEFAULT 0,
  total numeric DEFAULT 0,
  notes text,
  converted_order_id uuid REFERENCES public.orders(id),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.quotation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid REFERENCES public.quotations(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  discount numeric DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Approval Requests table (E-Office)
CREATE TABLE public.approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) NOT NULL,
  request_type text NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft',
  requested_by uuid NOT NULL,
  approved_by uuid,
  approved_at timestamptz,
  rejection_reason text,
  reference_type text,
  reference_id uuid,
  amount numeric,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Production Orders table
CREATE TABLE public.production_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) NOT NULL,
  production_number text NOT NULL,
  product_id uuid REFERENCES public.products(id) NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'planned',
  order_id uuid REFERENCES public.orders(id),
  planned_start timestamptz,
  planned_end timestamptz,
  actual_start timestamptz,
  actual_end timestamptz,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for purchase_orders
CREATE POLICY "Company members can view purchase_orders" ON public.purchase_orders
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Company members can insert purchase_orders" ON public.purchase_orders
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "Company members can update purchase_orders" ON public.purchase_orders
  FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Company members can delete purchase_orders" ON public.purchase_orders
  FOR DELETE TO authenticated
  USING (company_id = public.get_user_company_id());

-- RLS Policies for purchase_order_items
CREATE POLICY "Company members can manage purchase_order_items" ON public.purchase_order_items
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.purchase_orders po 
    WHERE po.id = purchase_order_items.purchase_order_id 
    AND po.company_id = public.get_user_company_id()
  ));

-- RLS Policies for quotations
CREATE POLICY "Company members can view quotations" ON public.quotations
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Company members can insert quotations" ON public.quotations
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "Company members can update quotations" ON public.quotations
  FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Company members can delete quotations" ON public.quotations
  FOR DELETE TO authenticated
  USING (company_id = public.get_user_company_id());

-- RLS Policies for quotation_items
CREATE POLICY "Company members can manage quotation_items" ON public.quotation_items
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.quotations q 
    WHERE q.id = quotation_items.quotation_id 
    AND q.company_id = public.get_user_company_id()
  ));

-- RLS Policies for approval_requests
CREATE POLICY "Company members can view approval_requests" ON public.approval_requests
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Company members can insert approval_requests" ON public.approval_requests
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "Admins/managers can update approval_requests" ON public.approval_requests
  FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company_id());

-- RLS Policies for production_orders
CREATE POLICY "Company members can view production_orders" ON public.production_orders
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Company members can insert production_orders" ON public.production_orders
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "Company members can update production_orders" ON public.production_orders
  FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Company members can delete production_orders" ON public.production_orders
  FOR DELETE TO authenticated
  USING (company_id = public.get_user_company_id());
