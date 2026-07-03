-- Pancake POS Features Integration: Composite Products and Wholesale Pricing

-- 1. Create table for Product Variant Components (Sản phẩm cấu thành)
CREATE TABLE IF NOT EXISTS public.product_variant_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    child_variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    quantity NUMERIC(15,4) NOT NULL DEFAULT 1.0000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_parent_child_variant UNIQUE (parent_variant_id, child_variant_id),
    CONSTRAINT no_self_reference_variant CHECK (parent_variant_id <> child_variant_id),
    CONSTRAINT quantity_positive CHECK (quantity > 0)
);

-- Enable RLS and permissions for product_variant_components
ALTER TABLE public.product_variant_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to authenticated users on product_variant_components"
    ON public.product_variant_components FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow write access to authenticated users on product_variant_components"
    ON public.product_variant_components FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 2. Add variant_id column to order_items if it doesn't exist
ALTER TABLE public.order_items 
  ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL;

-- 3. Add tags columns to orders and partners to support wholesale conditions
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::TEXT[];

ALTER TABLE public.partners 
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::TEXT[];

-- 4. Create table for Wholesale Settings (Cài đặt bán sỉ)
CREATE TABLE IF NOT EXISTS public.wholesale_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    apply_by_order_qty_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    apply_by_order_qty_threshold INTEGER NOT NULL DEFAULT 10,
    apply_by_product_qty_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    apply_by_product_qty_threshold INTEGER NOT NULL DEFAULT 5,
    apply_by_variant_qty_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    apply_by_order_tags_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    apply_by_order_tags TEXT[] DEFAULT '{}'::TEXT[],
    apply_by_customer_tags_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    apply_by_customer_tags TEXT[] DEFAULT '{}'::TEXT[],
    no_other_discounts BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_company_wholesale_settings UNIQUE (company_id)
);

-- Enable RLS and permissions for wholesale_settings
ALTER TABLE public.wholesale_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to authenticated users on wholesale_settings"
    ON public.wholesale_settings FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow write access to authenticated users on wholesale_settings"
    ON public.wholesale_settings FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 5. Create table for Product Wholesale Prices (Giá bán sỉ theo bậc)
CREATE TABLE IF NOT EXISTS public.product_wholesale_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
    min_quantity NUMERIC(15,2) NOT NULL DEFAULT 1.00,
    wholesale_price NUMERIC(15,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_wholesale_tier UNIQUE (product_id, variant_id, min_quantity)
);

-- Enable RLS and permissions for product_wholesale_prices
ALTER TABLE public.product_wholesale_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to authenticated users on product_wholesale_prices"
    ON public.product_wholesale_prices FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow write access to authenticated users on product_wholesale_prices"
    ON public.product_wholesale_prices FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 6. Update deduct_inventory_on_order_confirm function to handle composite variant subtraction
CREATE OR REPLACE FUNCTION public.deduct_inventory_on_order_confirm() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_item RECORD;
  v_component RECORD;
  v_qty_to_deduct numeric(15,4);
  v_new_var_stock numeric(15,4);
  v_new_prod_stock numeric(15,4);
  v_company_id uuid;
BEGIN
  v_company_id := NEW.company_id;

  IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
    -- Loop through all order items
    FOR v_item IN 
      SELECT oi.id, oi.product_id, oi.variant_id, oi.quantity, p.is_service
      FROM public.order_items oi
      JOIN public.products p ON p.id = oi.product_id
      WHERE oi.order_id = NEW.id
    LOOP
      -- Skip if product is a service
      IF COALESCE(v_item.is_service, false) = true THEN
        CONTINUE;
      END IF;

      -- Check if we have variant_id selected
      IF v_item.variant_id IS NOT NULL THEN
        -- Check if variant has components (Composite Product)
        IF EXISTS (
          SELECT 1 
          FROM public.product_variant_components 
          WHERE parent_variant_id = v_item.variant_id
        ) THEN
          -- Composite variant: subtract inventory from child variants instead of the parent
          FOR v_component IN 
            SELECT pvc.child_variant_id, pvc.quantity AS component_qty, pv.product_id AS child_product_id, pv.sku AS child_sku, p.name AS child_name
            FROM public.product_variant_components pvc
            JOIN public.product_variants pv ON pv.id = pvc.child_variant_id
            JOIN public.products p ON p.id = pv.product_id
            WHERE pvc.parent_variant_id = v_item.variant_id
          LOOP
            v_qty_to_deduct := v_item.quantity * v_component.component_qty;

            -- Update child variant stock
            UPDATE public.product_variants pv
            SET stock_quantity = pv.stock_quantity - v_qty_to_deduct
            WHERE pv.id = v_component.child_variant_id
            RETURNING pv.stock_quantity INTO v_new_var_stock;

            -- Update child product stock
            UPDATE public.products p
            SET stock_quantity = p.stock_quantity - v_qty_to_deduct
            WHERE p.id = v_component.child_product_id
            RETURNING p.stock_quantity INTO v_new_prod_stock;

            -- Insert inventory transaction for the child variant consumption
            INSERT INTO public.inventory_transactions (
              product_id, 
              variant_id,
              transaction_type, 
              quantity, 
              reference_type, 
              reference_id, 
              notes, 
              created_by
            )
            VALUES (
              v_component.child_product_id,
              v_component.child_variant_id,
              'out',
              -v_qty_to_deduct,
              'composite_consumption',
              NEW.id,
              'Tieu hao thanh phan cua Set/Combo - Don ' || NEW.order_number || ' - ' || COALESCE(v_component.child_name, v_component.child_sku),
              NEW.created_by
            );

            -- Sync default warehouse stock
            PERFORM public.sync_default_warehouse_stock(
              v_company_id,
              v_component.child_product_id,
              v_new_prod_stock,
              NULL
            );
          END LOOP;

        ELSE
          -- Standard variant: subtract stock directly from parent variant and product
          UPDATE public.product_variants pv
          SET stock_quantity = pv.stock_quantity - v_item.quantity
          WHERE pv.id = v_item.variant_id
          RETURNING pv.stock_quantity INTO v_new_var_stock;

          UPDATE public.products p
          SET stock_quantity = p.stock_quantity - v_item.quantity
          WHERE p.id = v_item.product_id
          RETURNING p.stock_quantity INTO v_new_prod_stock;

          -- Insert inventory transaction
          INSERT INTO public.inventory_transactions (
            product_id, 
            variant_id,
            transaction_type, 
            quantity, 
            reference_type, 
            reference_id, 
            notes, 
            created_by
          )
          VALUES (
            v_item.product_id,
            v_item.variant_id,
            'out',
            -v_item.quantity,
            'order',
            NEW.id,
            'Xuat kho theo don hang ' || NEW.order_number,
            NEW.created_by
          );

          PERFORM public.sync_default_warehouse_stock(
            v_company_id,
            v_item.product_id,
            v_new_prod_stock,
            NULL
          );
        END IF;

      ELSE
        -- No variant selected: fallback to standard product stock deduction
        UPDATE public.products p
        SET stock_quantity = p.stock_quantity - v_item.quantity
        WHERE p.id = v_item.product_id
        RETURNING p.stock_quantity INTO v_new_prod_stock;

        -- Insert inventory transaction
        INSERT INTO public.inventory_transactions (
          product_id, 
          transaction_type, 
          quantity, 
          reference_type, 
          reference_id, 
          notes, 
          created_by
        )
        VALUES (
          v_item.product_id,
          'out',
          -v_item.quantity,
          'order',
          NEW.id,
          'Xuat kho theo don hang ' || NEW.order_number,
          NEW.created_by
        );

        PERFORM public.sync_default_warehouse_stock(
          v_company_id,
          v_item.product_id,
          v_new_prod_stock,
          NULL
        );
      END IF;

    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- 7. Add increment_variant_stock_quantity RPC function
CREATE OR REPLACE FUNCTION public.increment_variant_stock_quantity(p_variant_id uuid, p_quantity numeric) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE public.product_variants
  SET stock_quantity = stock_quantity + p_quantity
  WHERE id = p_variant_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_variant_stock_quantity(uuid, numeric) TO authenticated;

