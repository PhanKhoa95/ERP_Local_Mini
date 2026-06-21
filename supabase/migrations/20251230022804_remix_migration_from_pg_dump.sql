CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'manager',
    'staff',
    'viewer'
);


--
-- Name: order_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.order_status AS ENUM (
    'pending',
    'confirmed',
    'processing',
    'shipping',
    'delivered',
    'cancelled',
    'returned'
);


--
-- Name: order_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.order_type AS ENUM (
    'b2b',
    'b2c'
);


--
-- Name: partner_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.partner_type AS ENUM (
    'customer',
    'supplier',
    'both'
);


--
-- Name: backflush_bom_materials(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.backflush_bom_materials() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  order_item RECORD;
  bom_item RECORD;
  material_consumption NUMERIC;
  product_is_service BOOLEAN;
BEGIN
  -- Only trigger when order status changes to 'confirmed'
  IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
    -- Loop through all order items
    FOR order_item IN 
      SELECT oi.product_id, oi.quantity, p.is_service
      FROM public.order_items oi 
      JOIN public.products p ON p.id = oi.product_id
      WHERE oi.order_id = NEW.id
    LOOP
      -- Skip if product is a service item
      IF order_item.is_service = true THEN
        CONTINUE;
      END IF;
      
      -- Check if product has BOM
      FOR bom_item IN 
        SELECT pb.material_id, pb.quantity as bom_qty, p.name as material_name, p.is_service as material_is_service
        FROM public.product_bom pb
        JOIN public.products p ON p.id = pb.material_id
        WHERE pb.product_id = order_item.product_id 
          AND pb.is_active = true
          AND p.is_active = true
      LOOP
        -- Skip if material is a service item
        IF bom_item.material_is_service = true THEN
          CONTINUE;
        END IF;
        
        -- Calculate material consumption
        material_consumption := order_item.quantity * bom_item.bom_qty;
        
        -- Insert inventory transaction for material consumption
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
          bom_item.material_id,
          'out',
          -material_consumption,
          'bom_backflush',
          NEW.id,
          'Tiêu hao NVL theo BOM - Đơn hàng ' || NEW.order_number || ' - ' || bom_item.material_name,
          NEW.created_by
        );
        
        -- Update material stock
        UPDATE public.products
        SET stock_quantity = stock_quantity - material_consumption
        WHERE id = bom_item.material_id;
      END LOOP;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: deduct_inventory_on_order_confirm(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.deduct_inventory_on_order_confirm() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
    -- Only insert inventory transactions for non-service products
    INSERT INTO public.inventory_transactions (product_id, transaction_type, quantity, reference_type, reference_id, notes, created_by)
    SELECT 
      oi.product_id,
      'out',
      -oi.quantity,
      'order',
      NEW.id,
      'Xuất kho theo đơn hàng ' || NEW.order_number,
      NEW.created_by
    FROM public.order_items oi
    JOIN public.products p ON p.id = oi.product_id
    WHERE oi.order_id = NEW.id 
      AND (p.is_service IS NULL OR p.is_service = false);
    
    -- Only update stock for non-service products
    UPDATE public.products p
    SET stock_quantity = p.stock_quantity - oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id 
      AND p.id = oi.product_id
      AND (p.is_service IS NULL OR p.is_service = false);
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: update_partner_debt(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_partner_debt() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.transaction_type IN ('receivable', 'payable') THEN
    UPDATE public.partners
    SET debt_amount = debt_amount + NEW.amount
    WHERE id = NEW.partner_id;
  ELSIF NEW.transaction_type IN ('payment_in', 'payment_out') THEN
    UPDATE public.partners
    SET debt_amount = debt_amount - NEW.amount
    WHERE id = NEW.partner_id;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: update_product_categories_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_product_categories_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    action text NOT NULL,
    table_name text NOT NULL,
    record_id uuid,
    old_data jsonb,
    new_data jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: customer_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    discount_percent numeric DEFAULT 0,
    min_total_orders numeric DEFAULT 0,
    color text DEFAULT '#3B82F6'::text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: inventory_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    transaction_type text NOT NULL,
    quantity integer NOT NULL,
    reference_type text,
    reference_id uuid,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: loyalty_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loyalty_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    partner_id uuid NOT NULL,
    points integer NOT NULL,
    transaction_type text NOT NULL,
    reference_type text,
    reference_id uuid,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT loyalty_transactions_transaction_type_check CHECK ((transaction_type = ANY (ARRAY['earn'::text, 'redeem'::text, 'adjust'::text])))
);


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(15,2) NOT NULL,
    discount numeric(15,2) DEFAULT 0,
    total numeric(15,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_number text NOT NULL,
    channel_id uuid,
    partner_id uuid,
    order_type public.order_type DEFAULT 'b2c'::public.order_type NOT NULL,
    status public.order_status DEFAULT 'pending'::public.order_status NOT NULL,
    order_date timestamp with time zone DEFAULT now() NOT NULL,
    subtotal numeric(15,2) DEFAULT 0,
    discount numeric(15,2) DEFAULT 0,
    shipping_fee numeric(15,2) DEFAULT 0,
    total numeric(15,2) DEFAULT 0,
    shipping_address text,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    voucher_id uuid,
    voucher_discount numeric DEFAULT 0,
    paid_amount numeric DEFAULT 0,
    payment_status text DEFAULT 'unpaid'::text,
    CONSTRAINT orders_payment_status_check CHECK ((payment_status = ANY (ARRAY['unpaid'::text, 'partial'::text, 'paid'::text])))
);


--
-- Name: partners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partners (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    partner_type public.partner_type DEFAULT 'customer'::public.partner_type NOT NULL,
    email text,
    phone text,
    address text,
    tax_id text,
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    group_id uuid,
    loyalty_points integer DEFAULT 0,
    total_spent numeric DEFAULT 0,
    debt_amount numeric DEFAULT 0
);


--
-- Name: payment_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    partner_id uuid NOT NULL,
    order_id uuid,
    transaction_type text NOT NULL,
    amount numeric DEFAULT 0 NOT NULL,
    payment_method text,
    reference_number text,
    notes text,
    transaction_date timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT payment_transactions_transaction_type_check CHECK ((transaction_type = ANY (ARRAY['receivable'::text, 'payable'::text, 'payment_in'::text, 'payment_out'::text])))
);


--
-- Name: product_bom; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_bom (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    material_id uuid NOT NULL,
    quantity numeric DEFAULT 1 NOT NULL,
    unit text,
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT product_bom_no_self_reference CHECK ((product_id <> material_id)),
    CONSTRAINT product_bom_quantity_positive CHECK ((quantity > (0)::numeric))
);


--
-- Name: product_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    color text DEFAULT '#3B82F6'::text,
    icon text,
    parent_id uuid,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: product_mappings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_mappings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    channel_id uuid NOT NULL,
    channel_sku text NOT NULL,
    channel_product_name text,
    channel_price numeric(15,2),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: product_variants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_variants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    sku text NOT NULL,
    name text NOT NULL,
    attributes jsonb DEFAULT '{}'::jsonb NOT NULL,
    cost_price numeric DEFAULT 0,
    selling_price numeric DEFAULT 0,
    stock_quantity integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sku text NOT NULL,
    name text NOT NULL,
    description text,
    category text,
    unit text DEFAULT 'cái'::text,
    cost_price numeric(15,2) DEFAULT 0,
    selling_price numeric(15,2) DEFAULT 0,
    stock_quantity integer DEFAULT 0,
    min_stock integer DEFAULT 0,
    image_url text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    has_variants boolean DEFAULT false,
    is_service boolean DEFAULT false
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text,
    avatar_url text,
    phone text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sales_channels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_channels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    description text,
    color text DEFAULT '#3B82F6'::text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: shipping_zones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shipping_zones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    provinces text[] DEFAULT '{}'::text[] NOT NULL,
    base_fee numeric DEFAULT 0 NOT NULL,
    free_shipping_threshold numeric,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: shop_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shop_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    value jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: stock_transfer_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_transfer_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    transfer_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: stock_transfers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_transfers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    transfer_number text NOT NULL,
    from_warehouse_id uuid NOT NULL,
    to_warehouse_id uuid NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    CONSTRAINT stock_transfers_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'in_transit'::text, 'completed'::text, 'cancelled'::text])))
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'staff'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vouchers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vouchers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    discount_type text DEFAULT 'percentage'::text NOT NULL,
    discount_value numeric DEFAULT 0 NOT NULL,
    min_order_value numeric DEFAULT 0,
    max_discount numeric,
    usage_limit integer,
    used_count integer DEFAULT 0,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT vouchers_discount_type_check CHECK ((discount_type = ANY (ARRAY['percentage'::text, 'fixed'::text])))
);


--
-- Name: warehouse_stock; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.warehouse_stock (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    warehouse_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    min_stock integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: warehouses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.warehouses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    address text,
    phone text,
    manager_name text,
    is_active boolean DEFAULT true,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: customer_groups customer_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_groups
    ADD CONSTRAINT customer_groups_pkey PRIMARY KEY (id);


--
-- Name: inventory_transactions inventory_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_pkey PRIMARY KEY (id);


--
-- Name: loyalty_transactions loyalty_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT loyalty_transactions_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: partners partners_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT partners_code_key UNIQUE (code);


--
-- Name: partners partners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT partners_pkey PRIMARY KEY (id);


--
-- Name: payment_transactions payment_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_pkey PRIMARY KEY (id);


--
-- Name: product_bom product_bom_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_bom
    ADD CONSTRAINT product_bom_pkey PRIMARY KEY (id);


--
-- Name: product_bom product_bom_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_bom
    ADD CONSTRAINT product_bom_unique UNIQUE (product_id, material_id);


--
-- Name: product_categories product_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_name_key UNIQUE (name);


--
-- Name: product_categories product_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_pkey PRIMARY KEY (id);


--
-- Name: product_mappings product_mappings_channel_id_channel_sku_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_mappings
    ADD CONSTRAINT product_mappings_channel_id_channel_sku_key UNIQUE (channel_id, channel_sku);


--
-- Name: product_mappings product_mappings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_mappings
    ADD CONSTRAINT product_mappings_pkey PRIMARY KEY (id);


--
-- Name: product_variants product_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_sku_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key UNIQUE (sku);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: sales_channels sales_channels_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_channels
    ADD CONSTRAINT sales_channels_code_key UNIQUE (code);


--
-- Name: sales_channels sales_channels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_channels
    ADD CONSTRAINT sales_channels_pkey PRIMARY KEY (id);


--
-- Name: shipping_zones shipping_zones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipping_zones
    ADD CONSTRAINT shipping_zones_pkey PRIMARY KEY (id);


--
-- Name: shop_settings shop_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_settings
    ADD CONSTRAINT shop_settings_key_key UNIQUE (key);


--
-- Name: shop_settings shop_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_settings
    ADD CONSTRAINT shop_settings_pkey PRIMARY KEY (id);


--
-- Name: stock_transfer_items stock_transfer_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transfer_items
    ADD CONSTRAINT stock_transfer_items_pkey PRIMARY KEY (id);


--
-- Name: stock_transfers stock_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT stock_transfers_pkey PRIMARY KEY (id);


--
-- Name: stock_transfers stock_transfers_transfer_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT stock_transfers_transfer_number_key UNIQUE (transfer_number);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: vouchers vouchers_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT vouchers_code_key UNIQUE (code);


--
-- Name: vouchers vouchers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT vouchers_pkey PRIMARY KEY (id);


--
-- Name: warehouse_stock warehouse_stock_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouse_stock
    ADD CONSTRAINT warehouse_stock_pkey PRIMARY KEY (id);


--
-- Name: warehouse_stock warehouse_stock_warehouse_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouse_stock
    ADD CONSTRAINT warehouse_stock_warehouse_id_product_id_key UNIQUE (warehouse_id, product_id);


--
-- Name: warehouses warehouses_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_code_key UNIQUE (code);


--
-- Name: warehouses warehouses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_pkey PRIMARY KEY (id);


--
-- Name: idx_payment_transactions_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_transactions_date ON public.payment_transactions USING btree (transaction_date DESC);


--
-- Name: idx_payment_transactions_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_transactions_order_id ON public.payment_transactions USING btree (order_id);


--
-- Name: idx_payment_transactions_partner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_transactions_partner_id ON public.payment_transactions USING btree (partner_id);


--
-- Name: idx_product_bom_material_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_bom_material_id ON public.product_bom USING btree (material_id);


--
-- Name: idx_product_bom_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_bom_product_id ON public.product_bom USING btree (product_id);


--
-- Name: orders on_order_status_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_order_status_change AFTER UPDATE OF status ON public.orders FOR EACH ROW EXECUTE FUNCTION public.deduct_inventory_on_order_confirm();


--
-- Name: orders trigger_backflush_bom_materials; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_backflush_bom_materials AFTER UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.backflush_bom_materials();


--
-- Name: payment_transactions trigger_update_partner_debt; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_partner_debt AFTER INSERT ON public.payment_transactions FOR EACH ROW EXECUTE FUNCTION public.update_partner_debt();


--
-- Name: customer_groups update_customer_groups_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_customer_groups_updated_at BEFORE UPDATE ON public.customer_groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: orders update_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: partners update_partners_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON public.partners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: product_bom update_product_bom_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_product_bom_updated_at BEFORE UPDATE ON public.product_bom FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: product_categories update_product_categories_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON public.product_categories FOR EACH ROW EXECUTE FUNCTION public.update_product_categories_updated_at();


--
-- Name: product_mappings update_product_mappings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_product_mappings_updated_at BEFORE UPDATE ON public.product_mappings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: product_variants update_product_variants_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: sales_channels update_sales_channels_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_sales_channels_updated_at BEFORE UPDATE ON public.sales_channels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: shipping_zones update_shipping_zones_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_shipping_zones_updated_at BEFORE UPDATE ON public.shipping_zones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: shop_settings update_shop_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_shop_settings_updated_at BEFORE UPDATE ON public.shop_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: vouchers update_vouchers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_vouchers_updated_at BEFORE UPDATE ON public.vouchers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: warehouse_stock update_warehouse_stock_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_warehouse_stock_updated_at BEFORE UPDATE ON public.warehouse_stock FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: warehouses update_warehouses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON public.warehouses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: inventory_transactions inventory_transactions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: inventory_transactions inventory_transactions_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: loyalty_transactions loyalty_transactions_partner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT loyalty_transactions_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: orders orders_channel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.sales_channels(id);


--
-- Name: orders orders_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: orders orders_partner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.partners(id);


--
-- Name: orders orders_voucher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_voucher_id_fkey FOREIGN KEY (voucher_id) REFERENCES public.vouchers(id);


--
-- Name: partners partners_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT partners_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.customer_groups(id);


--
-- Name: payment_transactions payment_transactions_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- Name: payment_transactions payment_transactions_partner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE CASCADE;


--
-- Name: product_bom product_bom_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_bom
    ADD CONSTRAINT product_bom_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.products(id) ON DELETE RESTRICT;


--
-- Name: product_bom product_bom_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_bom
    ADD CONSTRAINT product_bom_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_categories product_categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.product_categories(id) ON DELETE SET NULL;


--
-- Name: product_mappings product_mappings_channel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_mappings
    ADD CONSTRAINT product_mappings_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.sales_channels(id) ON DELETE CASCADE;


--
-- Name: product_mappings product_mappings_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_mappings
    ADD CONSTRAINT product_mappings_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_variants product_variants_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: stock_transfer_items stock_transfer_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transfer_items
    ADD CONSTRAINT stock_transfer_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: stock_transfer_items stock_transfer_items_transfer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transfer_items
    ADD CONSTRAINT stock_transfer_items_transfer_id_fkey FOREIGN KEY (transfer_id) REFERENCES public.stock_transfers(id) ON DELETE CASCADE;


--
-- Name: stock_transfers stock_transfers_from_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT stock_transfers_from_warehouse_id_fkey FOREIGN KEY (from_warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: stock_transfers stock_transfers_to_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT stock_transfers_to_warehouse_id_fkey FOREIGN KEY (to_warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: warehouse_stock warehouse_stock_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouse_stock
    ADD CONSTRAINT warehouse_stock_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: warehouse_stock warehouse_stock_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouse_stock
    ADD CONSTRAINT warehouse_stock_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id) ON DELETE CASCADE;


--
-- Name: user_roles Admins can manage user_roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage user_roles" ON public.user_roles USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: audit_logs Admins can view audit_logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view audit_logs" ON public.audit_logs FOR SELECT TO authenticated USING (true);


--
-- Name: customer_groups Authenticated users can manage customer_groups; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage customer_groups" ON public.customer_groups TO authenticated USING (true) WITH CHECK (true);


--
-- Name: inventory_transactions Authenticated users can manage inventory_transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage inventory_transactions" ON public.inventory_transactions TO authenticated USING (true) WITH CHECK (true);


--
-- Name: loyalty_transactions Authenticated users can manage loyalty_transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage loyalty_transactions" ON public.loyalty_transactions TO authenticated USING (true) WITH CHECK (true);


--
-- Name: order_items Authenticated users can manage order_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage order_items" ON public.order_items TO authenticated USING (true) WITH CHECK (true);


--
-- Name: orders Authenticated users can manage orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage orders" ON public.orders TO authenticated USING (true) WITH CHECK (true);


--
-- Name: partners Authenticated users can manage partners; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage partners" ON public.partners TO authenticated USING (true) WITH CHECK (true);


--
-- Name: payment_transactions Authenticated users can manage payment_transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage payment_transactions" ON public.payment_transactions USING (true) WITH CHECK (true);


--
-- Name: product_bom Authenticated users can manage product_bom; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage product_bom" ON public.product_bom USING (true) WITH CHECK (true);


--
-- Name: product_categories Authenticated users can manage product_categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage product_categories" ON public.product_categories USING (true) WITH CHECK (true);


--
-- Name: product_mappings Authenticated users can manage product_mappings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage product_mappings" ON public.product_mappings TO authenticated USING (true) WITH CHECK (true);


--
-- Name: product_variants Authenticated users can manage product_variants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage product_variants" ON public.product_variants TO authenticated USING (true) WITH CHECK (true);


--
-- Name: products Authenticated users can manage products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage products" ON public.products TO authenticated USING (true) WITH CHECK (true);


--
-- Name: sales_channels Authenticated users can manage sales_channels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage sales_channels" ON public.sales_channels TO authenticated USING (true) WITH CHECK (true);


--
-- Name: shipping_zones Authenticated users can manage shipping_zones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage shipping_zones" ON public.shipping_zones TO authenticated USING (true) WITH CHECK (true);


--
-- Name: shop_settings Authenticated users can manage shop_settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage shop_settings" ON public.shop_settings USING (true) WITH CHECK (true);


--
-- Name: stock_transfer_items Authenticated users can manage stock_transfer_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage stock_transfer_items" ON public.stock_transfer_items USING (true) WITH CHECK (true);


--
-- Name: stock_transfers Authenticated users can manage stock_transfers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage stock_transfers" ON public.stock_transfers USING (true) WITH CHECK (true);


--
-- Name: vouchers Authenticated users can manage vouchers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage vouchers" ON public.vouchers TO authenticated USING (true) WITH CHECK (true);


--
-- Name: warehouse_stock Authenticated users can manage warehouse_stock; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage warehouse_stock" ON public.warehouse_stock USING (true) WITH CHECK (true);


--
-- Name: warehouses Authenticated users can manage warehouses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage warehouses" ON public.warehouses USING (true) WITH CHECK (true);


--
-- Name: inventory_transactions Authenticated users can view inventory_transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view inventory_transactions" ON public.inventory_transactions FOR SELECT TO authenticated USING (true);


--
-- Name: order_items Authenticated users can view order_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view order_items" ON public.order_items FOR SELECT TO authenticated USING (true);


--
-- Name: orders Authenticated users can view orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view orders" ON public.orders FOR SELECT TO authenticated USING (true);


--
-- Name: partners Authenticated users can view partners; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view partners" ON public.partners FOR SELECT TO authenticated USING (true);


--
-- Name: payment_transactions Authenticated users can view payment_transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view payment_transactions" ON public.payment_transactions FOR SELECT USING (true);


--
-- Name: product_bom Authenticated users can view product_bom; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view product_bom" ON public.product_bom FOR SELECT USING (true);


--
-- Name: product_mappings Authenticated users can view product_mappings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view product_mappings" ON public.product_mappings FOR SELECT TO authenticated USING (true);


--
-- Name: products Authenticated users can view products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view products" ON public.products FOR SELECT TO authenticated USING (true);


--
-- Name: sales_channels Authenticated users can view sales_channels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view sales_channels" ON public.sales_channels FOR SELECT TO authenticated USING (true);


--
-- Name: stock_transfer_items Authenticated users can view stock_transfer_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view stock_transfer_items" ON public.stock_transfer_items FOR SELECT USING (true);


--
-- Name: stock_transfers Authenticated users can view stock_transfers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view stock_transfers" ON public.stock_transfers FOR SELECT USING (true);


--
-- Name: warehouse_stock Authenticated users can view warehouse_stock; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view warehouse_stock" ON public.warehouse_stock FOR SELECT USING (true);


--
-- Name: warehouses Authenticated users can view warehouses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view warehouses" ON public.warehouses FOR SELECT USING (true);


--
-- Name: order_items Public can create order_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can create order_items" ON public.order_items FOR INSERT WITH CHECK (true);


--
-- Name: orders Public can create orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can create orders" ON public.orders FOR INSERT WITH CHECK (true);


--
-- Name: shop_settings Public can read shop_settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can read shop_settings" ON public.shop_settings FOR SELECT USING (true);


--
-- Name: product_categories Public can view active categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view active categories" ON public.product_categories FOR SELECT USING ((is_active = true));


--
-- Name: products Public can view active products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view active products" ON public.products FOR SELECT USING ((is_active = true));


--
-- Name: product_variants Public can view active variants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view active variants" ON public.product_variants FOR SELECT USING ((is_active = true));


--
-- Name: vouchers Public can view active vouchers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view active vouchers" ON public.vouchers FOR SELECT USING ((is_active = true));


--
-- Name: order_items Public can view order_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view order_items" ON public.order_items FOR SELECT USING (true);


--
-- Name: orders Public can view orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view orders" ON public.orders FOR SELECT USING (true);


--
-- Name: shipping_zones Public can view shipping_zones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view shipping_zones" ON public.shipping_zones FOR SELECT USING ((is_active = true));


--
-- Name: audit_logs System can insert audit_logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert audit_logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: user_roles Users can view own role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: customer_groups; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.customer_groups ENABLE ROW LEVEL SECURITY;

--
-- Name: inventory_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: loyalty_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: order_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

--
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

--
-- Name: partners; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

--
-- Name: payment_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: product_bom; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_bom ENABLE ROW LEVEL SECURITY;

--
-- Name: product_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: product_mappings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_mappings ENABLE ROW LEVEL SECURITY;

--
-- Name: product_variants; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: sales_channels; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sales_channels ENABLE ROW LEVEL SECURITY;

--
-- Name: shipping_zones; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;

--
-- Name: shop_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: stock_transfer_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stock_transfer_items ENABLE ROW LEVEL SECURITY;

--
-- Name: stock_transfers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: vouchers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

--
-- Name: warehouse_stock; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.warehouse_stock ENABLE ROW LEVEL SECURITY;

--
-- Name: warehouses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;