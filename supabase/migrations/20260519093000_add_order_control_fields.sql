-- Add normalized order-control fields used across manual, POS, public store and platform sync flows.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS customer_email text,
  ADD COLUMN IF NOT EXISTS customer_address text,
  ADD COLUMN IF NOT EXISTS shipping_province text,
  ADD COLUMN IF NOT EXISTS shipping_district text,
  ADD COLUMN IF NOT EXISTS shipping_ward text,
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS warehouse_id uuid REFERENCES public.warehouses(id),
  ADD COLUMN IF NOT EXISTS shipping_zone_id uuid REFERENCES public.shipping_zones(id),
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS internal_notes text,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS shipped_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_reason text,
  ADD COLUMN IF NOT EXISTS external_created_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

DO $$
BEGIN
  ALTER TABLE public.orders
    ADD CONSTRAINT orders_source_type_check
    CHECK (source_type IN ('manual', 'pos', 'public_store', 'platform'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.orders
    ADD CONSTRAINT orders_priority_check
    CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Best-effort backfill from legacy packed fields.
UPDATE public.orders
SET source_type = CASE
    WHEN platform_order_id IS NOT NULL THEN 'platform'
    WHEN order_number ILIKE 'POS-%' THEN 'pos'
    WHEN created_by IS NULL AND order_number ILIKE 'PO%' THEN 'public_store'
    ELSE source_type
  END
WHERE source_type = 'manual';

UPDATE public.orders
SET customer_name = NULLIF(trim(split_part(split_part(shipping_address, E'\n', 1), '-', 1)), '')
WHERE customer_name IS NULL
  AND shipping_address IS NOT NULL
  AND position('-' in split_part(shipping_address, E'\n', 1)) > 0;

UPDATE public.orders
SET customer_phone = NULLIF(regexp_replace(split_part(split_part(shipping_address, E'\n', 1), '-', 2), '\D', '', 'g'), '')
WHERE customer_phone IS NULL
  AND shipping_address IS NOT NULL
  AND position('-' in split_part(shipping_address, E'\n', 1)) > 0;

UPDATE public.orders
SET customer_address = NULLIF(
    trim(
      CASE
        WHEN position(E'\n' in shipping_address) > 0 THEN split_part(shipping_address, E'\n', 2)
        ELSE shipping_address
      END
    ),
    ''
  )
WHERE customer_address IS NULL
  AND shipping_address IS NOT NULL;

UPDATE public.orders
SET payment_method = CASE
    WHEN notes ILIKE '%chuyển khoản%' OR notes ILIKE '%chuyen khoan%' THEN 'bank_transfer'
    WHEN notes ILIKE '%cod%' THEN 'cod'
    WHEN payment_status = 'paid' THEN 'cash'
    ELSE payment_method
  END
WHERE payment_method IS NULL;

UPDATE public.orders SET confirmed_at = COALESCE(confirmed_at, updated_at) WHERE status IN ('confirmed', 'processing', 'shipping', 'delivered');
UPDATE public.orders SET shipped_at = COALESCE(shipped_at, updated_at) WHERE status IN ('shipping', 'delivered');
UPDATE public.orders SET delivered_at = COALESCE(delivered_at, updated_at) WHERE status = 'delivered';
UPDATE public.orders SET cancelled_at = COALESCE(cancelled_at, updated_at) WHERE status = 'cancelled';

CREATE INDEX IF NOT EXISTS idx_orders_company_status ON public.orders(company_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_company_source ON public.orders(company_id, source_type);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone) WHERE customer_phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_warehouse_id ON public.orders(warehouse_id) WHERE warehouse_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_shipping_zone_id ON public.orders(shipping_zone_id) WHERE shipping_zone_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_priority ON public.orders(priority);
CREATE INDEX IF NOT EXISTS idx_orders_last_synced_at ON public.orders(last_synced_at) WHERE last_synced_at IS NOT NULL;
