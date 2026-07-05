-- 1. Create Loyalty Settings Table
CREATE TABLE IF NOT EXISTS public.loyalty_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    point_ratio_money NUMERIC(15,2) NOT NULL DEFAULT 10000.00,
    point_ratio_points INTEGER NOT NULL DEFAULT 1,
    redeem_ratio_points INTEGER NOT NULL DEFAULT 1,
    redeem_ratio_money NUMERIC(15,2) NOT NULL DEFAULT 1000.00,
    no_point_discounted BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_company_loyalty_settings UNIQUE (company_id)
);

-- Enable RLS for loyalty_settings
ALTER TABLE public.loyalty_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to authenticated users on loyalty_settings"
    ON public.loyalty_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow write access to authenticated users on loyalty_settings"
    ON public.loyalty_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Create Referral Settings Table
CREATE TABLE IF NOT EXISTS public.referral_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    referrer_reward_points INTEGER NOT NULL DEFAULT 50,
    referee_discount_amount NUMERIC(15,2) NOT NULL DEFAULT 50000.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_company_referral_settings UNIQUE (company_id)
);

-- Enable RLS for referral_settings
ALTER TABLE public.referral_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to authenticated users on referral_settings"
    ON public.referral_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow write access to authenticated users on referral_settings"
    ON public.referral_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Add columns to partners table
ALTER TABLE public.partners 
    ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS referred_by_id UUID REFERENCES public.partners(id) ON DELETE SET NULL;

-- 4. Add columns to orders table
ALTER TABLE public.orders 
    ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS points_used INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS referral_discount NUMERIC(15,2) DEFAULT 0.00;

-- 5. Create Loyalty Transactions Table
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    points INTEGER NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type = ANY (ARRAY['earn'::text, 'redeem'::text, 'refund'::text, 'manual_adjust'::text])),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for loyalty_transactions
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to authenticated users on loyalty_transactions"
    ON public.loyalty_transactions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow write access to authenticated users on loyalty_transactions"
    ON public.loyalty_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Trigger to sync partner.loyalty_points
CREATE OR REPLACE FUNCTION public.sync_partner_loyalty_points() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE public.partners
  SET loyalty_points = COALESCE(loyalty_points, 0) + NEW.points
  WHERE id = NEW.partner_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trigger_sync_partner_loyalty_points
AFTER INSERT ON public.loyalty_transactions
FOR EACH ROW EXECUTE FUNCTION public.sync_partner_loyalty_points();

-- 7. Trigger to award points on order complete or refund them on cancel
CREATE OR REPLACE FUNCTION public.award_loyalty_points_on_order_complete() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_loyalty_enabled boolean;
  v_point_ratio_money numeric;
  v_point_ratio_points integer;
  v_points_to_earn integer;
  v_referrer_id uuid;
  v_referrer_reward_points integer;
  v_first_order_count integer;
BEGIN
  -- 1. Earning points on complete
  IF NEW.status = 'delivered' AND (TG_OP = 'INSERT' OR OLD.status IS NULL OR OLD.status <> 'delivered') THEN
    SELECT is_enabled, point_ratio_money, point_ratio_points
    INTO v_loyalty_enabled, v_point_ratio_money, v_point_ratio_points
    FROM public.loyalty_settings
    WHERE company_id = NEW.company_id
    LIMIT 1;

    IF COALESCE(v_loyalty_enabled, false) = true AND COALESCE(v_point_ratio_money, 0) > 0 THEN
      v_points_to_earn := FLOOR(COALESCE(NEW.total, 0) / v_point_ratio_money) * COALESCE(v_point_ratio_points, 1);

      IF v_points_to_earn > 0 THEN
        NEW.points_earned := v_points_to_earn;

        INSERT INTO public.loyalty_transactions (partner_id, order_id, points, transaction_type, notes)
        VALUES (
          NEW.partner_id,
          NEW.id,
          v_points_to_earn,
          'earn',
          'Tích điểm đơn hàng #' || COALESCE(NEW.order_number, NEW.id::text)
        );
      END IF;
    END IF;

    -- Referral point reward for referrer
    SELECT referred_by_id INTO v_referrer_id
    FROM public.partners
    WHERE id = NEW.partner_id;

    IF v_referrer_id IS NOT NULL THEN
      SELECT COUNT(*) INTO v_first_order_count
      FROM public.orders
      WHERE partner_id = NEW.partner_id AND status = 'delivered' AND id <> NEW.id;

      IF v_first_order_count = 0 THEN
        SELECT referrer_reward_points INTO v_referrer_reward_points
        FROM public.referral_settings
        WHERE company_id = NEW.company_id
        LIMIT 1;

        v_referrer_reward_points := COALESCE(v_referrer_reward_points, 50);

        IF v_referrer_reward_points > 0 THEN
          INSERT INTO public.loyalty_transactions (partner_id, order_id, points, transaction_type, notes)
          VALUES (
            v_referrer_id,
            NEW.id,
            v_referrer_reward_points,
            'earn',
            'Thưởng giới thiệu khách hàng mới'
          );
        END IF;
      END IF;
    END IF;
  END IF;

  -- 2. Deduct points if order transitions FROM delivered to cancelled/refunded
  IF TG_OP = 'UPDATE' AND OLD.status = 'delivered' AND NEW.status <> 'delivered' AND COALESCE(NEW.points_earned, 0) > 0 THEN
    INSERT INTO public.loyalty_transactions (partner_id, order_id, points, transaction_type, notes)
    VALUES (
      NEW.partner_id,
      NEW.id,
      -NEW.points_earned,
      'refund',
      'Hủy điểm tích lũy đơn hàng #' || COALESCE(NEW.order_number, NEW.id::text)
    );
    NEW.points_earned := 0;
  END IF;

  -- 3. Refund used points back to customer if order becomes cancelled
  IF TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND OLD.status <> 'cancelled' AND COALESCE(NEW.points_used, 0) > 0 THEN
    INSERT INTO public.loyalty_transactions (partner_id, order_id, points, transaction_type, notes)
    VALUES (
      NEW.partner_id,
      NEW.id,
      NEW.points_used,
      'refund',
      'Hoàn trả điểm sử dụng từ đơn hàng hủy #' || COALESCE(NEW.order_number, NEW.id::text)
    );
  END IF;

  -- 4. Deduct used points on order insert or transition to confirmed/delivered if points were used
  IF (TG_OP = 'INSERT' AND COALESCE(NEW.points_used, 0) > 0) OR 
     (TG_OP = 'UPDATE' AND COALESCE(NEW.points_used, 0) > 0 AND COALESCE(OLD.points_used, 0) = 0) THEN
    INSERT INTO public.loyalty_transactions (partner_id, order_id, points, transaction_type, notes)
    VALUES (
      NEW.partner_id,
      NEW.id,
      -NEW.points_used,
      'redeem',
      'Tiêu điểm tại đơn hàng #' || COALESCE(NEW.order_number, NEW.id::text)
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trigger_award_loyalty_points_on_order_complete
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.award_loyalty_points_on_order_complete();
