CREATE OR REPLACE FUNCTION public.get_dashboard_stats(p_company_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
  v_total_revenue numeric := 0;
  v_total_orders integer := 0;
  v_total_products integer := 0;
  v_total_customers integer := 0;
  v_low_stock integer := 0;
  v_channels jsonb := '[]'::jsonb;
  v_recent jsonb := '[]'::jsonb;
BEGIN
  IF NOT public.is_company_member(auth.uid(), p_company_id) THEN
    RAISE EXCEPTION 'access denied';
  END IF;

  SELECT
    COALESCE(SUM(CASE WHEN status = 'delivered' THEN total ELSE 0 END), 0),
    COUNT(*)
  INTO v_total_revenue, v_total_orders
  FROM public.orders WHERE company_id = p_company_id;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE COALESCE(stock_quantity,0) <= COALESCE(min_stock,0))
  INTO v_total_products, v_low_stock
  FROM public.products WHERE company_id = p_company_id;

  SELECT COUNT(*) INTO v_total_customers
  FROM public.partners
  WHERE company_id = p_company_id AND partner_type IN ('customer','both');

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', c.id, 'name', c.name, 'color', c.color,
    'revenue', COALESCE(o.rev,0), 'orderCount', COALESCE(o.cnt,0)
  )), '[]'::jsonb)
  INTO v_channels
  FROM public.sales_channels c
  LEFT JOIN (
    SELECT channel_id, SUM(total) AS rev, COUNT(*) AS cnt
    FROM public.orders
    WHERE company_id = p_company_id AND status = 'delivered'
    GROUP BY channel_id
  ) o ON o.channel_id = c.id
  WHERE c.company_id = p_company_id;

  SELECT COALESCE(jsonb_agg(row_to_json(r)), '[]'::jsonb) INTO v_recent FROM (
    SELECT id, order_number, total, status, created_at, channel_id
    FROM public.orders
    WHERE company_id = p_company_id
    ORDER BY created_at DESC
    LIMIT 5
  ) r;

  v_result := jsonb_build_object(
    'totalRevenue', v_total_revenue,
    'totalOrders', v_total_orders,
    'totalProducts', v_total_products,
    'totalCustomers', v_total_customers,
    'lowStockCount', v_low_stock,
    'revenueByChannel', v_channels,
    'recentOrders', v_recent
  );
  RETURN v_result;
END;
$$;