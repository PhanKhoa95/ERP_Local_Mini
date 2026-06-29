-- Keep BOM production stock movements accurate for decimal material norms.

ALTER TABLE public.product_bom
  ALTER COLUMN quantity TYPE numeric(15,4) USING COALESCE(quantity, 0)::numeric(15,4);

ALTER TABLE public.production_orders
  ALTER COLUMN quantity TYPE numeric(15,4) USING COALESCE(quantity, 0)::numeric(15,4);

ALTER TABLE public.products
  ALTER COLUMN stock_quantity TYPE numeric(15,4) USING COALESCE(stock_quantity, 0)::numeric(15,4),
  ALTER COLUMN min_stock TYPE numeric(15,4) USING COALESCE(min_stock, 0)::numeric(15,4);

ALTER TABLE public.product_variants
  ALTER COLUMN stock_quantity TYPE numeric(15,4) USING COALESCE(stock_quantity, 0)::numeric(15,4);

ALTER TABLE public.inventory_transactions
  ALTER COLUMN quantity TYPE numeric(15,4) USING COALESCE(quantity, 0)::numeric(15,4);

ALTER TABLE public.warehouse_stock
  ALTER COLUMN quantity TYPE numeric(15,4) USING COALESCE(quantity, 0)::numeric(15,4),
  ALTER COLUMN min_stock TYPE numeric(15,4) USING COALESCE(min_stock, 0)::numeric(15,4);

ALTER TABLE public.stock_transfer_items
  ALTER COLUMN quantity TYPE numeric(15,4) USING COALESCE(quantity, 0)::numeric(15,4);

DROP FUNCTION IF EXISTS public.increment_stock_quantity(uuid, integer);
DROP FUNCTION IF EXISTS public.increment_stock_quantity(uuid, numeric);

CREATE OR REPLACE FUNCTION public.increment_stock_quantity(p_product_id uuid, p_quantity numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product public.products%ROWTYPE;
  v_new_quantity numeric(15,4);
BEGIN
  SELECT *
  INTO v_product
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product % not found', p_product_id;
  END IF;

  IF auth.uid() IS NULL OR NOT public.is_company_member(v_product.company_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized to update stock for product %', p_product_id;
  END IF;

  v_new_quantity := round((COALESCE(v_product.stock_quantity, 0) + COALESCE(p_quantity, 0))::numeric, 4);
  IF v_new_quantity < 0 THEN
    RAISE EXCEPTION 'Insufficient stock for product %. Available %, delta %',
      p_product_id,
      COALESCE(v_product.stock_quantity, 0),
      COALESCE(p_quantity, 0);
  END IF;

  UPDATE public.products
  SET stock_quantity = v_new_quantity,
      updated_at = now()
  WHERE id = p_product_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_default_warehouse_stock(
  p_company_id uuid,
  p_product_id uuid,
  p_quantity numeric,
  p_min_stock numeric DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_default_warehouse_id uuid;
BEGIN
  SELECT id
  INTO v_default_warehouse_id
  FROM public.warehouses
  WHERE company_id = p_company_id
    AND is_default = true
    AND is_active = true
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_default_warehouse_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.warehouse_stock (warehouse_id, product_id, quantity, min_stock)
  VALUES (
    v_default_warehouse_id,
    p_product_id,
    GREATEST(round(COALESCE(p_quantity, 0)::numeric, 4), 0),
    GREATEST(round(COALESCE(p_min_stock, 0)::numeric, 4), 0)
  )
  ON CONFLICT (warehouse_id, product_id)
  DO UPDATE SET
    quantity = EXCLUDED.quantity,
    min_stock = CASE
      WHEN p_min_stock IS NULL THEN public.warehouse_stock.min_stock
      ELSE EXCLUDED.min_stock
    END,
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_production_order(p_production_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.production_orders%ROWTYPE;
  v_finished public.products%ROWTYPE;
  v_component RECORD;
  v_required numeric(15,4);
  v_new_material_stock numeric(15,4);
  v_old_finished_stock numeric(15,4);
  v_new_finished_stock numeric(15,4);
  v_total_material_cost numeric(20,4) := 0;
  v_new_cost_price numeric(15,2);
  v_already_posted boolean := false;
BEGIN
  SELECT *
  INTO v_order
  FROM public.production_orders
  WHERE id = p_production_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Production order % not found', p_production_order_id;
  END IF;

  IF auth.uid() IS NULL OR NOT public.is_company_member(v_order.company_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized to complete production order %', p_production_order_id;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.inventory_transactions
    WHERE reference_id = p_production_order_id
      AND reference_type IN ('production_bom', 'production_finished_good')
  )
  INTO v_already_posted;

  IF v_order.status = 'completed' AND v_already_posted THEN
    RETURN;
  END IF;

  IF v_order.status = 'cancelled' THEN
    RAISE EXCEPTION 'Cancelled production order % cannot be completed', p_production_order_id;
  END IF;

  IF COALESCE(v_order.quantity, 0) <= 0 THEN
    RAISE EXCEPTION 'Production order % quantity must be greater than zero', p_production_order_id;
  END IF;

  SELECT *
  INTO v_finished
  FROM public.products
  WHERE id = v_order.product_id
    AND company_id = v_order.company_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Finished product % not found for production order %',
      v_order.product_id,
      p_production_order_id;
  END IF;

  IF COALESCE(v_finished.is_service, false) THEN
    RAISE EXCEPTION 'Service product % cannot be completed as production stock', v_finished.id;
  END IF;

  FOR v_component IN
    SELECT
      pb.material_id,
      pb.quantity AS bom_quantity,
      m.name,
      m.sku,
      m.unit,
      m.company_id,
      COALESCE(m.stock_quantity, 0) AS stock_quantity,
      COALESCE(m.cost_price, 0) AS cost_price
    FROM public.product_bom pb
    JOIN public.products m ON m.id = pb.material_id
    WHERE pb.product_id = v_order.product_id
      AND COALESCE(pb.is_active, true) = true
      AND COALESCE(m.is_service, false) = false
    ORDER BY pb.created_at ASC, pb.id ASC
    FOR UPDATE OF m
  LOOP
    IF v_component.company_id IS DISTINCT FROM v_order.company_id THEN
      RAISE EXCEPTION 'BOM material % belongs to another company', v_component.material_id;
    END IF;

    v_required := round((v_order.quantity * v_component.bom_quantity)::numeric, 4);
    IF v_required <= 0 THEN
      CONTINUE;
    END IF;

    IF v_component.stock_quantity < v_required THEN
      RAISE EXCEPTION 'Insufficient BOM material %. Need %, available %',
        COALESCE(v_component.sku, v_component.material_id::text),
        v_required,
        v_component.stock_quantity;
    END IF;

    v_new_material_stock := round((v_component.stock_quantity - v_required)::numeric, 4);

    UPDATE public.products
    SET stock_quantity = v_new_material_stock,
        updated_at = now()
    WHERE id = v_component.material_id;

    PERFORM public.sync_default_warehouse_stock(
      v_order.company_id,
      v_component.material_id,
      v_new_material_stock,
      NULL
    );

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
      v_component.material_id,
      'out',
      -v_required,
      'production_bom',
      p_production_order_id,
      'BOM consumption - Production ' || v_order.production_number || ' - ' || COALESCE(v_component.name, v_component.sku, v_component.material_id::text),
      COALESCE(auth.uid(), v_order.created_by)
    );

    v_total_material_cost := v_total_material_cost + (v_required * v_component.cost_price);
  END LOOP;

  v_old_finished_stock := round(COALESCE(v_finished.stock_quantity, 0)::numeric, 4);
  v_new_finished_stock := round((v_old_finished_stock + v_order.quantity)::numeric, 4);

  IF v_total_material_cost > 0 AND v_new_finished_stock > 0 THEN
    v_new_cost_price := round(
      ((v_old_finished_stock * COALESCE(v_finished.cost_price, 0)) + v_total_material_cost)
      / v_new_finished_stock,
      2
    );
  ELSE
    v_new_cost_price := COALESCE(v_finished.cost_price, 0);
  END IF;

  UPDATE public.products
  SET stock_quantity = v_new_finished_stock,
      cost_price = v_new_cost_price,
      updated_at = now()
  WHERE id = v_finished.id;

  PERFORM public.sync_default_warehouse_stock(
    v_order.company_id,
    v_finished.id,
    v_new_finished_stock,
    v_finished.min_stock
  );

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
    v_finished.id,
    'in',
    v_order.quantity,
    'production_finished_good',
    p_production_order_id,
    'Finished goods receipt - Production ' || v_order.production_number,
    COALESCE(auth.uid(), v_order.created_by)
  );

  UPDATE public.production_orders
  SET status = 'completed',
      actual_start = COALESCE(actual_start, now()),
      actual_end = COALESCE(actual_end, now()),
      updated_at = now()
  WHERE id = p_production_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_stock_quantity(uuid, numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_default_warehouse_stock(uuid, uuid, numeric, numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_production_order(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.increment_stock_quantity(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_production_order(uuid) TO authenticated;
