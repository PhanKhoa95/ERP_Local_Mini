CREATE OR REPLACE FUNCTION public.increment_stock_quantity(p_product_id uuid, p_quantity integer)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE products
  SET stock_quantity = COALESCE(stock_quantity, 0) + p_quantity,
      updated_at = now()
  WHERE id = p_product_id;
$$;