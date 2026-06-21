-- Migration: Add BigData analytics views, scheduled data quality checks and PII minimization governance.

-- 1. Analytics Views

-- Channel Attribution View
CREATE OR REPLACE VIEW public.analytics_channel_attribution AS
SELECT
  o.company_id,
  o.source_type,
  sc.name AS channel_name,
  sc.code AS channel_code,
  sc.color AS channel_color,
  COUNT(o.id) AS total_orders,
  COALESCE(SUM(o.total), 0) AS total_revenue,
  COALESCE(AVG(o.total), 0) AS avg_order_value,
  COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) AS completed_orders,
  COUNT(CASE WHEN o.status = 'cancelled' THEN 1 END) AS cancelled_orders,
  COALESCE(SUM(o.total) FILTER (WHERE o.status = 'delivered'), 0) AS completed_revenue
FROM public.orders o
LEFT JOIN public.sales_channels sc ON o.channel_id = sc.id
GROUP BY o.company_id, o.source_type, sc.name, sc.code, sc.color;

-- Customer Lifetime Value View
CREATE OR REPLACE VIEW public.analytics_customer_lifetime_value AS
SELECT
  o.company_id,
  COALESCE(o.customer_phone, 'unknown') AS customer_phone,
  MAX(o.customer_name) AS customer_name,
  MAX(o.customer_email) AS customer_email,
  COUNT(o.id) AS total_orders,
  COALESCE(SUM(o.total), 0) AS total_spent,
  COALESCE(AVG(o.total), 0) AS avg_order_value,
  MIN(o.order_date) AS first_purchase_date,
  MAX(o.order_date) AS last_purchase_date,
  COALESCE((EXTRACT(EPOCH FROM (MAX(o.order_date) - MIN(o.order_date))) / 86400)::numeric(10,2), 0) AS customer_lifespan_days
FROM public.orders o
WHERE o.status IN ('delivered', 'confirmed', 'processing', 'shipping')
GROUP BY o.company_id, o.customer_phone;

-- Cohort Retention View
CREATE OR REPLACE VIEW public.analytics_customer_cohorts AS
WITH customer_first_purchase AS (
  SELECT
    company_id,
    customer_phone,
    DATE_TRUNC('month', MIN(order_date)) AS first_purchase_month
  FROM public.orders
  WHERE status IN ('delivered', 'confirmed', 'processing', 'shipping')
    AND customer_phone IS NOT NULL
  GROUP BY company_id, customer_phone
),
order_months AS (
  SELECT
    o.company_id,
    o.customer_phone,
    DATE_TRUNC('month', o.order_date) AS order_month,
    o.total,
    (EXTRACT(YEAR FROM o.order_date) - EXTRACT(YEAR FROM cfp.first_purchase_month)) * 12 +
    (EXTRACT(MONTH FROM o.order_date) - EXTRACT(MONTH FROM cfp.first_purchase_month)) AS cohort_index
  FROM public.orders o
  JOIN customer_first_purchase cfp ON o.customer_phone = cfp.customer_phone AND o.company_id = cfp.company_id
  WHERE o.status IN ('delivered', 'confirmed', 'processing', 'shipping')
)
SELECT
  company_id,
  first_purchase_month,
  cohort_index,
  COUNT(DISTINCT customer_phone) AS active_customers,
  SUM(total) AS total_revenue
FROM order_months
GROUP BY company_id, first_purchase_month, cohort_index;

-- 2. Governance Functions (PII Anonymization)

CREATE OR REPLACE FUNCTION public.apply_pii_minimization(
  p_company_id uuid,
  p_inactive_days int DEFAULT 180
)
RETURNS int AS $$
DECLARE
  v_rows_updated int;
BEGIN
  -- Anonymize customer data in orders that are older than p_inactive_days and have no recent orders
  WITH inactive_customers AS (
    SELECT customer_phone
    FROM public.orders
    WHERE company_id = p_company_id
      AND customer_phone IS NOT NULL
    GROUP BY customer_phone
    HAVING MAX(order_date) < (now() - (p_inactive_days || ' days')::interval)
  )
  UPDATE public.orders
  SET
    customer_name = 'Anonymized Customer',
    customer_email = 'anonymized@example.com',
    customer_address = 'Anonymized Address',
    shipping_province = NULL,
    shipping_district = NULL,
    shipping_ward = NULL
  WHERE company_id = p_company_id
    AND customer_phone IN (SELECT customer_phone FROM inactive_customers);
     
  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  RETURN v_rows_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Scheduled Data Quality Checks

CREATE OR REPLACE FUNCTION public.run_scheduled_data_quality_checks(p_company_id uuid)
RETURNS int AS $$
DECLARE
  v_issues_created int := 0;
  r RECORD;
BEGIN
  -- Check 1: Find orders with duplicate external_id (platform_order_id)
  FOR r IN (
    SELECT o1.id, o1.order_number, o1.platform_order_id
    FROM public.orders o1
    JOIN (
      SELECT platform_order_id
      FROM public.orders
      WHERE company_id = p_company_id
        AND platform_order_id IS NOT NULL
      GROUP BY platform_order_id
      HAVING COUNT(*) > 1
    ) o2 ON o1.platform_order_id = o2.platform_order_id
    WHERE o1.company_id = p_company_id
  ) LOOP
    -- Check if issue already exists
    IF NOT EXISTS (
      SELECT 1 FROM public.data_quality_issues
      WHERE company_id = p_company_id
        AND issue_type = 'duplicate_platform_order_id'
        AND message LIKE '%' || r.order_number || '%'
    ) THEN
      INSERT INTO public.data_quality_issues (company_id, severity, issue_type, message, status)
      VALUES (p_company_id, 'high', 'duplicate_platform_order_id', 'Đơn hàng ' || r.order_number || ' có Platform Order ID trùng lặp: ' || r.platform_order_id, 'open');
      v_issues_created := v_issues_created + 1;
    END IF;
  END LOOP;

  -- Check 2: Find orders with total = 0 (and status is not cancelled)
  FOR r IN (
    SELECT id, order_number
    FROM public.orders
    WHERE company_id = p_company_id
      AND total = 0
      AND status != 'cancelled'
  ) LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.data_quality_issues
      WHERE company_id = p_company_id
        AND issue_type = 'suspicious_zero_total'
        AND message LIKE '%' || r.order_number || '%'
    ) THEN
      INSERT INTO public.data_quality_issues (company_id, severity, issue_type, message, status)
      VALUES (p_company_id, 'medium', 'suspicious_zero_total', 'Đơn hàng ' || r.order_number || ' có giá trị bằng 0 bất thường.', 'open');
      v_issues_created := v_issues_created + 1;
    END IF;
  END LOOP;

  -- Check 3: Missing phone number for delivered orders
  FOR r IN (
    SELECT id, order_number
    FROM public.orders
    WHERE company_id = p_company_id
      AND status = 'delivered'
      AND (customer_phone IS NULL OR trim(customer_phone) = '')
  ) LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.data_quality_issues
      WHERE company_id = p_company_id
        AND issue_type = 'missing_phone_delivered'
        AND message LIKE '%' || r.order_number || '%'
    ) THEN
      INSERT INTO public.data_quality_issues (company_id, severity, issue_type, message, status)
      VALUES (p_company_id, 'medium', 'missing_phone_delivered', 'Đơn hàng đã giao ' || r.order_number || ' thiếu số điện thoại khách hàng.', 'open');
      v_issues_created := v_issues_created + 1;
    END IF;
  END LOOP;

  RETURN v_issues_created;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
