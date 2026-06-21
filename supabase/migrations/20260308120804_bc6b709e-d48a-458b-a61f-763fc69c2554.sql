
-- Shipping carriers table
CREATE TABLE public.shipping_carriers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  api_token TEXT,
  shop_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, code)
);

ALTER TABLE public.shipping_carriers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can manage shipping carriers"
  ON public.shipping_carriers FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

-- Shipments table
CREATE TABLE public.shipments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  carrier_id UUID NOT NULL REFERENCES public.shipping_carriers(id) ON DELETE RESTRICT,
  tracking_code TEXT,
  carrier_status TEXT DEFAULT 'created',
  estimated_delivery TIMESTAMPTZ,
  shipping_fee_actual NUMERIC DEFAULT 0,
  cod_amount NUMERIC DEFAULT 0,
  weight_grams INTEGER DEFAULT 0,
  pickup_address TEXT,
  label_url TEXT,
  carrier_response JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can manage shipments"
  ON public.shipments FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = shipments.order_id 
      AND o.company_id = public.get_user_company_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = shipments.order_id 
      AND o.company_id = public.get_user_company_id()
    )
  );

-- Order returns table
CREATE TYPE public.return_status AS ENUM ('requested', 'approved', 'receiving', 'received', 'refunded', 'rejected');
CREATE TYPE public.platform_source AS ENUM ('shopee', 'lazada', 'tiktok', 'manual');

CREATE TABLE public.order_returns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  return_type TEXT NOT NULL DEFAULT 'customer_return',
  platform_source public.platform_source NOT NULL DEFAULT 'manual',
  reason TEXT,
  status public.return_status NOT NULL DEFAULT 'requested',
  refund_amount NUMERIC DEFAULT 0,
  return_items JSONB DEFAULT '[]',
  shipment_id UUID REFERENCES public.shipments(id),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.order_returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can manage order returns"
  ON public.order_returns FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

-- Triggers for updated_at
CREATE TRIGGER update_shipping_carriers_updated_at
  BEFORE UPDATE ON public.shipping_carriers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shipments_updated_at
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_order_returns_updated_at
  BEFORE UPDATE ON public.order_returns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
