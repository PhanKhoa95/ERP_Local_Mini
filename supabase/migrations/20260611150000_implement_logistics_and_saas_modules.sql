-- =========================================================================
-- DATABASE MIGRATION: IMPLEMENT LOGISTICS AND SAAS SUBSCRIPTION MODULES
-- Date: 2026-06-11
-- =========================================================================

-- 1. FLEET MANAGEMENT: Drivers & Delivery Trips
CREATE TABLE IF NOT EXISTS public.drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    license_number TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_trip')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.delivery_trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
    vehicle_info TEXT, -- e.g., "Ford Transit - 29A-123.45"
    status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'loading', 'en_route', 'completed', 'cancelled')),
    planned_start TIMESTAMPTZ,
    planned_end TIMESTAMPTZ,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alter shipments to connect to internal fleet delivery trips
ALTER TABLE public.shipments
  ADD COLUMN IF NOT EXISTS trip_id UUID REFERENCES public.delivery_trips(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS delivery_order INTEGER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_drivers_company ON public.drivers(company_id);
CREATE INDEX IF NOT EXISTS idx_delivery_trips_company ON public.delivery_trips(company_id);
CREATE INDEX IF NOT EXISTS idx_delivery_trips_driver ON public.delivery_trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_shipments_trip ON public.shipments(trip_id) WHERE trip_id IS NOT NULL;


-- 2. DETAILED WAREHOUSE LOCATIONS (Bins / Shelves)
CREATE TABLE IF NOT EXISTS public.warehouse_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g., "Aisle A - Row 1 - Shelf 2 - Bin 3"
    zone TEXT,          -- e.g., "Zone A"
    aisle TEXT,
    shelf TEXT,
    bin TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(warehouse_id, name)
);

-- Alter warehouse stock and inventory transactions to support shelf positioning
ALTER TABLE public.warehouse_stock
  ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.warehouse_locations(id) ON DELETE SET NULL;

ALTER TABLE public.inventory_transactions
  ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.warehouse_locations(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_warehouse_locations_warehouse ON public.warehouse_locations(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_location ON public.warehouse_stock(location_id) WHERE location_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_tx_location ON public.inventory_transactions(location_id) WHERE location_id IS NOT NULL;


-- 3. PICKING & PACKING PROCESS (Fulfillment Batches)
CREATE TABLE IF NOT EXISTS public.picking_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'picking', 'packed', 'completed', 'cancelled')),
    assigned_to UUID, -- references auth.users(id) via profiles
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.picking_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    picking_list_id UUID NOT NULL REFERENCES public.picking_lists(id) ON DELETE CASCADE,
    order_item_id UUID REFERENCES public.order_items(id) ON DELETE SET NULL,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity_requested INTEGER NOT NULL,
    quantity_picked INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'picked', 'short')),
    location_id UUID REFERENCES public.warehouse_locations(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_picking_lists_company ON public.picking_lists(company_id);
CREATE INDEX IF NOT EXISTS idx_picking_lists_warehouse ON public.picking_lists(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_picking_list_items_list ON public.picking_list_items(picking_list_id);


-- 4. PRICE LISTS (Bulk Pricing & Custom Tiers)
CREATE TABLE IF NOT EXISTS public.price_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.price_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    price_list_id UUID NOT NULL REFERENCES public.price_lists(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
    custom_price NUMERIC(15,2) NOT NULL,
    min_quantity NUMERIC(15,2) NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(price_list_id, product_id, variant_id, min_quantity)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_price_lists_company ON public.price_lists(company_id);
CREATE INDEX IF NOT EXISTS idx_price_list_items_list ON public.price_list_items(price_list_id);
CREATE INDEX IF NOT EXISTS idx_price_list_items_prod ON public.price_list_items(product_id);


-- 5. SAAS SUBSCRIPTIONS (Plan billing details)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL DEFAULT 'starter' CHECK (plan_type IN ('starter', 'growth', 'enterprise')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'canceled')),
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '14 days',
    payment_gateway TEXT,
    gateway_subscription_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_company ON public.subscriptions(company_id);


-- 6. ROW LEVEL SECURITY (RLS) POLICIES FOR NEW TABLES
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.picking_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.picking_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Helper to check company membership (avoids duplicated SELECT policies)
-- Driver policies
CREATE POLICY "drivers_select" ON public.drivers FOR SELECT TO authenticated
  USING (company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()));

CREATE POLICY "drivers_insert" ON public.drivers FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()));

CREATE POLICY "drivers_update" ON public.drivers FOR UPDATE TO authenticated
  USING (company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()));

CREATE POLICY "drivers_delete" ON public.drivers FOR DELETE TO authenticated
  USING (company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid() AND cm.role IN ('admin', 'manager')));

-- Delivery trip policies
CREATE POLICY "trips_select" ON public.delivery_trips FOR SELECT TO authenticated
  USING (company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()));

CREATE POLICY "trips_insert" ON public.delivery_trips FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()));

CREATE POLICY "trips_update" ON public.delivery_trips FOR UPDATE TO authenticated
  USING (company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()));

CREATE POLICY "trips_delete" ON public.delivery_trips FOR DELETE TO authenticated
  USING (company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid() AND cm.role IN ('admin', 'manager')));

-- Warehouse location policies
CREATE POLICY "locations_select" ON public.warehouse_locations FOR SELECT TO authenticated
  USING (warehouse_id IN (
    SELECT w.id FROM public.warehouses w 
    WHERE w.company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid())
  ));

CREATE POLICY "locations_insert" ON public.warehouse_locations FOR INSERT TO authenticated
  WITH CHECK (warehouse_id IN (
    SELECT w.id FROM public.warehouses w 
    WHERE w.company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid())
  ));

CREATE POLICY "locations_update" ON public.warehouse_locations FOR UPDATE TO authenticated
  USING (warehouse_id IN (
    SELECT w.id FROM public.warehouses w 
    WHERE w.company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid())
  ))
  WITH CHECK (warehouse_id IN (
    SELECT w.id FROM public.warehouses w 
    WHERE w.company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid())
  ));

CREATE POLICY "locations_delete" ON public.warehouse_locations FOR DELETE TO authenticated
  USING (warehouse_id IN (
    SELECT w.id FROM public.warehouses w 
    WHERE w.company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid() AND cm.role IN ('admin', 'manager'))
  ));

-- Picking list policies
CREATE POLICY "picking_select" ON public.picking_lists FOR SELECT TO authenticated
  USING (company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()));

CREATE POLICY "picking_insert" ON public.picking_lists FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()));

CREATE POLICY "picking_update" ON public.picking_lists FOR UPDATE TO authenticated
  USING (company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()));

CREATE POLICY "picking_delete" ON public.picking_lists FOR DELETE TO authenticated
  USING (company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid() AND cm.role IN ('admin', 'manager')));

-- Picking list item policies
CREATE POLICY "picking_items_select" ON public.picking_list_items FOR SELECT TO authenticated
  USING (picking_list_id IN (
    SELECT pl.id FROM public.picking_lists pl 
    WHERE pl.company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid())
  ));

CREATE POLICY "picking_items_insert" ON public.picking_list_items FOR INSERT TO authenticated
  WITH CHECK (picking_list_id IN (
    SELECT pl.id FROM public.picking_lists pl 
    WHERE pl.company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid())
  ));

CREATE POLICY "picking_items_update" ON public.picking_list_items FOR UPDATE TO authenticated
  USING (picking_list_id IN (
    SELECT pl.id FROM public.picking_lists pl 
    WHERE pl.company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid())
  ))
  WITH CHECK (picking_list_id IN (
    SELECT pl.id FROM public.picking_lists pl 
    WHERE pl.company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid())
  ));

CREATE POLICY "picking_items_delete" ON public.picking_list_items FOR DELETE TO authenticated
  USING (picking_list_id IN (
    SELECT pl.id FROM public.picking_lists pl 
    WHERE pl.company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid() AND cm.role IN ('admin', 'manager'))
  ));

-- Price list policies
CREATE POLICY "prices_select" ON public.price_lists FOR SELECT TO authenticated
  USING (company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()));

CREATE POLICY "prices_insert" ON public.price_lists FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()));

CREATE POLICY "prices_update" ON public.price_lists FOR UPDATE TO authenticated
  USING (company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()));

CREATE POLICY "prices_delete" ON public.price_lists FOR DELETE TO authenticated
  USING (company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid() AND cm.role IN ('admin', 'manager')));

-- Price list items policies
CREATE POLICY "price_items_select" ON public.price_list_items FOR SELECT TO authenticated
  USING (price_list_id IN (
    SELECT pl.id FROM public.price_lists pl 
    WHERE pl.company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid())
  ));

CREATE POLICY "price_items_insert" ON public.price_list_items FOR INSERT TO authenticated
  WITH CHECK (price_list_id IN (
    SELECT pl.id FROM public.price_lists pl 
    WHERE pl.company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid())
  ));

CREATE POLICY "price_items_update" ON public.price_list_items FOR UPDATE TO authenticated
  USING (price_list_id IN (
    SELECT pl.id FROM public.price_lists pl 
    WHERE pl.company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid())
  ))
  WITH CHECK (price_list_id IN (
    SELECT pl.id FROM public.price_lists pl 
    WHERE pl.company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid())
  ));

CREATE POLICY "price_items_delete" ON public.price_list_items FOR DELETE TO authenticated
  USING (price_list_id IN (
    SELECT pl.id FROM public.price_lists pl 
    WHERE pl.company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid() AND cm.role IN ('admin', 'manager'))
  ));

-- Subscription policies
CREATE POLICY "subs_select" ON public.subscriptions FOR SELECT TO authenticated
  USING (company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()));

CREATE POLICY "subs_insert" ON public.subscriptions FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid() AND cm.role = 'admin'));

CREATE POLICY "subs_update" ON public.subscriptions FOR UPDATE TO authenticated
  USING (company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid() AND cm.role = 'admin'))
  WITH CHECK (company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid() AND cm.role = 'admin'));

CREATE POLICY "subs_delete" ON public.subscriptions FOR DELETE TO authenticated
  USING (company_id IN (SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid() AND cm.role = 'admin'));


-- 7. TIMESTAMPS AUTO-UPDATE TRIGGERS
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_drivers_modtime BEFORE UPDATE ON public.drivers FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();
CREATE TRIGGER update_delivery_trips_modtime BEFORE UPDATE ON public.delivery_trips FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();
CREATE TRIGGER update_warehouse_locations_modtime BEFORE UPDATE ON public.warehouse_locations FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();
CREATE TRIGGER update_picking_lists_modtime BEFORE UPDATE ON public.picking_lists FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();
CREATE TRIGGER update_price_lists_modtime BEFORE UPDATE ON public.price_lists FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();
CREATE TRIGGER update_price_list_items_modtime BEFORE UPDATE ON public.price_list_items FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();
CREATE TRIGGER update_subscriptions_modtime BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();
