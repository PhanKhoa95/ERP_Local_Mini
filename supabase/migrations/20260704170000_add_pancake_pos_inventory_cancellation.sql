-- Migration: Handle stock restoration/refund upon order cancellation for composite variants and standard items

CREATE OR REPLACE FUNCTION public.deduct_inventory_on_order_confirm() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_item RECORD;
  v_component RECORD;
  v_qty_to_change numeric(15,4);
  v_new_var_stock numeric(15,4);
  v_new_prod_stock numeric(15,4);
  v_company_id uuid;
  v_is_confirming boolean;
  v_is_cancelling boolean;
BEGIN
  v_company_id := NEW.company_id;
  v_is_confirming := (NEW.status = 'confirmed' AND OLD.status = 'pending');
  v_is_cancelling := (NEW.status = 'cancelled' AND OLD.status IN ('confirmed', 'shipping', 'completed', 'waiting_transfer'));

  IF v_is_confirming OR v_is_cancelling THEN
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

      -- If confirming: we deduct stock (-). If cancelling: we restore stock (+)
      IF v_is_confirming THEN
        v_qty_to_change := -v_item.quantity;
      ELSE
        v_qty_to_change := v_item.quantity;
      END IF;

      -- Check if we have variant_id selected
      IF v_item.variant_id IS NOT NULL THEN
        -- Check if variant has components (Composite Product)
        IF EXISTS (
          SELECT 1 
          FROM public.product_variant_components 
          WHERE parent_variant_id = v_item.variant_id
        ) THEN
          -- Composite variant: modify inventory of child variants instead of the parent
          FOR v_component IN 
            SELECT pvc.child_variant_id, pvc.quantity AS component_qty, pv.product_id AS child_product_id, pv.sku AS child_sku, p.name AS child_name
            FROM public.product_variant_components pvc
            JOIN public.product_variants pv ON pv.id = pvc.child_variant_id
            JOIN public.products p ON p.id = pv.product_id
            WHERE pvc.parent_variant_id = v_item.variant_id
          LOOP
            -- Update child variant stock
            UPDATE public.product_variants pv
            SET stock_quantity = pv.stock_quantity + (v_qty_to_change * v_component.component_qty)
            WHERE pv.id = v_component.child_variant_id
            RETURNING pv.stock_quantity INTO v_new_var_stock;

            -- Update child product stock
            UPDATE public.products p
            SET stock_quantity = p.stock_quantity + (v_qty_to_change * v_component.component_qty)
            WHERE p.id = v_component.child_product_id
            RETURNING p.stock_quantity INTO v_new_prod_stock;

            -- Insert inventory transaction for the child variant consumption/restoration
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
              CASE WHEN v_is_confirming THEN 'out' ELSE 'in' END,
              v_qty_to_change * v_component.component_qty,
              CASE WHEN v_is_confirming THEN 'composite_consumption' ELSE 'composite_restoration' END,
              NEW.id,
              CASE WHEN v_is_confirming THEN 'Tieu hao thanh phan cua Set/Combo - Don ' ELSE 'Hoan tra thanh phan cua Set/Combo - Don ' END || NEW.order_number || ' - ' || COALESCE(v_component.child_name, v_component.child_sku),
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
          -- Standard variant: modify stock directly on parent variant and product
          UPDATE public.product_variants pv
          SET stock_quantity = pv.stock_quantity + v_qty_to_change
          WHERE pv.id = v_item.variant_id
          RETURNING pv.stock_quantity INTO v_new_var_stock;

          UPDATE public.products p
          SET stock_quantity = p.stock_quantity + v_qty_to_change
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
            CASE WHEN v_is_confirming THEN 'out' ELSE 'in' END,
            v_qty_to_change,
            CASE WHEN v_is_confirming THEN 'order' ELSE 'order_cancellation' END,
            NEW.id,
            CASE WHEN v_is_confirming THEN 'Xuat kho theo don hang ' ELSE 'Hoan kho do huy don hang ' END || NEW.order_number,
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
        -- No variant selected: fallback to standard product stock modification
        UPDATE public.products p
        SET stock_quantity = p.stock_quantity + v_qty_to_change
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
          CASE WHEN v_is_confirming THEN 'out' ELSE 'in' END,
          v_qty_to_change,
          CASE WHEN v_is_confirming THEN 'order' ELSE 'order_cancellation' END,
          NEW.id,
          CASE WHEN v_is_confirming THEN 'Xuat kho theo don hang ' ELSE 'Hoan kho do huy don hang ' END || NEW.order_number,
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
