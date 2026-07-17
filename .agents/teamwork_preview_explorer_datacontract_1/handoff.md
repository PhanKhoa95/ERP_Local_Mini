# Data Contract Milestone Investigation Report

This handoff report summarizes the findings from exploring the codebase of Y:\ERP_Local_Mini to prepare for the Data Contract and CI Integration milestone.

## 1. Observation
### Exact Schema and Type Definitions of the 9 Core Tables

We analyzed the definitions across `src/integrations/supabase/types.ts` (frontend types), `supabase/migrations/` (actual DDL), and frontend hooks.

#### 1. `products`
*   **DDL Location**: `supabase/migrations/20251230022804_remix_migration_from_pg_dump.sql` (Line 522-539) & `20260308115955_2fa470a0-150e-4139-bcbb-aaab3856bc7c.sql` (Line 2)
*   **Schema**:
    ```sql
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
        is_service boolean DEFAULT false,
        company_id uuid REFERENCES public.companies(id)
    );
    ```
*   **Constraints**:
    *   Primary Key: `id` (uuid)
    *   Unique Constraint: `products_sku_key` UNIQUE (`sku`)

#### 2. `orders`
*   **DDL Location**: `20251230022804_remix_migration_from_pg_dump.sql` (Line 376-398), `20260308115955_2fa470a0-150e-4139-bcbb-aaab3856bc7c.sql` (Line 4), `20260519093000_add_order_control_fields.sql` (Line 2-23), `20260703090000_add_pancake_pos_features.sql` (Line 35), and `20260704120000_add_loyalty_and_referral.sql` (Line 51).
*   **Schema**:
    ```sql
    CREATE TABLE public.orders (
        id uuid DEFAULT gen_random_uuid() NOT NULL,
        order_number text NOT NULL,
        channel_id uuid REFERENCES public.sales_channels(id),
        partner_id uuid REFERENCES public.partners(id),
        order_type public.order_type DEFAULT 'b2c'::public.order_type NOT NULL,
        status public.order_status DEFAULT 'pending'::public.order_status NOT NULL,
        order_date timestamp with time zone DEFAULT now() NOT NULL,
        subtotal numeric(15,2) DEFAULT 0,
        discount numeric(15,2) DEFAULT 0,
        shipping_fee numeric(15,2) DEFAULT 0,
        total numeric(15,2) DEFAULT 0,
        shipping_address text,
        notes text,
        created_by uuid REFERENCES auth.users(id),
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL,
        voucher_id uuid REFERENCES public.vouchers(id),
        voucher_discount numeric DEFAULT 0,
        paid_amount numeric DEFAULT 0,
        payment_status text DEFAULT 'unpaid'::text,
        company_id uuid REFERENCES public.companies(id),
        source_type text NOT NULL DEFAULT 'manual',
        customer_name text,
        customer_phone text,
        customer_email text,
        customer_address text,
        shipping_province text,
        shipping_district text,
        shipping_ward text,
        payment_method text,
        payment_reference text,
        warehouse_id uuid REFERENCES public.warehouses(id),
        shipping_zone_id uuid REFERENCES public.shipping_zones(id),
        priority text NOT NULL DEFAULT 'normal',
        internal_notes text,
        confirmed_at timestamptz,
        shipped_at timestamptz,
        delivered_at timestamptz,
        cancelled_at timestamptz,
        cancelled_reason text,
        external_created_at timestamptz,
        last_synced_at timestamptz,
        tags text[] DEFAULT '{}'::text[],
        points_earned integer DEFAULT 0,
        points_used integer DEFAULT 0,
        referral_discount numeric(15,2) DEFAULT 0.00
    );
    ```
*   **Constraints**:
    *   Primary Key: `id` (uuid)
    *   Unique Constraint: `orders_order_number_key` UNIQUE (`order_number`)
    *   Checks:
        *   `orders_payment_status_check`: `payment_status` IN ('unpaid', 'partial', 'paid')
        *   `orders_source_type_check`: `source_type` IN ('manual', 'pos', 'public_store', 'platform')
        *   `orders_priority_check`: `priority` IN ('low', 'normal', 'high', 'urgent')

#### 3. `order_items`
*   **DDL Location**: `20251230022804_remix_migration_from_pg_dump.sql` (Line 360-369) & `20260703090000_add_pancake_pos_features.sql` (Line 31)
*   **Schema**:
    ```sql
    CREATE TABLE public.order_items (
        id uuid DEFAULT gen_random_uuid() NOT NULL,
        order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
        product_id uuid NOT NULL REFERENCES public.products(id),
        quantity integer DEFAULT 1 NOT NULL,
        unit_price numeric(15,2) NOT NULL,
        discount numeric(15,2) DEFAULT 0,
        total numeric(15,2) NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL
    );
    ```
*   **Constraints**:
    *   Primary Key: `id` (uuid)

#### 4. `payment_transactions`
*   **DDL Location**: `20251230022804_remix_migration_from_pg_dump.sql` (Line 429-442) & alterations adding `company_id`.
*   **Schema**:
    ```sql
    CREATE TABLE public.payment_transactions (
        id uuid DEFAULT gen_random_uuid() NOT NULL,
        partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
        order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
        transaction_type text NOT NULL,
        amount numeric DEFAULT 0 NOT NULL,
        payment_method text,
        reference_number text,
        notes text,
        transaction_date timestamp with time zone DEFAULT now() NOT NULL,
        created_by uuid,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        company_id uuid REFERENCES public.companies(id)
    );
    ```
*   **Constraints**:
    *   Primary Key: `id` (uuid)
    *   Check: `payment_transactions_transaction_type_check` CHECK (transaction_type = ANY (ARRAY['receivable'::text, 'payable'::text, 'payment_in'::text, 'payment_out'::text]))

#### 5. `journal_entries`
*   **DDL Location**: `supabase/migrations/20260309050353_9d75c5ab-52f9-4219-8b56-dd912af88692.sql` (Line 29-42)
*   **Schema**:
    ```sql
    CREATE TABLE public.journal_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
        entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
        description TEXT,
        source_type VARCHAR(30) DEFAULT 'manual',
        source_id UUID,
        status VARCHAR(10) DEFAULT 'draft' CHECK (status IN ('draft','posted','voided')),
        vneid_signature TEXT,
        created_by UUID,
        posted_by UUID,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
    );
    ```

#### 6. `journal_lines`
*   **DDL Location**: `supabase/migrations/20260309050353_9d75c5ab-52f9-4219-8b56-dd912af88692.sql` (Line 56-65)
*   **Schema**:
    ```sql
    CREATE TABLE public.journal_lines (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
        account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id),
        debit NUMERIC DEFAULT 0,
        credit NUMERIC DEFAULT 0,
        asset_type VARCHAR(20) DEFAULT 'cash' CHECK (asset_type IN ('cash','token','share','bnpl')),
        memo TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
    );
    ```

#### 7. `product_bom`
*   **DDL Location**: `20251230022804_remix_migration_from_pg_dump.sql` (Line 449-461)
*   **Schema**:
    ```sql
    CREATE TABLE public.product_bom (
        id uuid DEFAULT gen_random_uuid() NOT NULL,
        product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
        material_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
        quantity numeric DEFAULT 1 NOT NULL,
        unit text,
        notes text,
        is_active boolean DEFAULT true,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT product_bom_no_self_reference CHECK ((product_id <> material_id)),
        CONSTRAINT product_bom_quantity_positive CHECK ((quantity > (0)::numeric))
    );
    ```
*   **Constraints**:
    *   Primary Key: `id` (uuid)
    *   Unique Constraint: `product_bom_unique` UNIQUE (`product_id`, `material_id`)

#### 8. `memberships`
*   **Source / Existing Definition**: Defined as a TypeScript interface in `src/hooks/useMemberships.ts` (Line 21-33) and stored/mocked in frontend `localStorage` (key: `erp-mini-local-demo-memberships`). Not yet defined in database migrations.
*   **TypeScript Definition**:
    ```typescript
    export interface Membership {
        id: string;
        partner_id: string;
        card_number: string;
        tier: MembershipTier; // 'bronze' | 'silver' | 'gold' | 'diamond'
        balance: number; // Tài khoản ví mua hàng
        points: number; // Điểm tích luỹ
        status: MembershipStatus; // 'active' | 'locked' | 'expired'
        issue_date: string;
        expiry_date: string;
        notes: string;
        card_image?: string;
    }
    ```
*   **Proposed DDL Schema for Milestone Draft**:
    ```sql
    CREATE TABLE public.memberships (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
        card_number TEXT NOT NULL UNIQUE,
        tier TEXT NOT NULL DEFAULT 'bronze',
        balance NUMERIC(15,2) NOT NULL DEFAULT 0.00,
        points INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'locked', 'expired')),
        issue_date TIMESTAMPTZ NOT NULL DEFAULT now(),
        expiry_date TIMESTAMPTZ,
        notes TEXT,
        card_image TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    ```

#### 9. `membership_transactions`
*   **Source / Existing Definition**: Defined as a TypeScript interface in `src/hooks/useMemberships.ts` (Line 35-42) and stored/mocked in frontend `localStorage` (key: `erp-mini-local-demo-membership-transactions`). Not yet defined in database migrations.
*   **TypeScript Definition**:
    ```typescript
    export interface MembershipTransaction {
        id: string;
        membership_id: string;
        type: TransactionType; // 'deposit' | 'payment' | 'refund' | 'adjust'
        amount: number;
        description: string;
        created_at: string;
    }
    ```
*   **Proposed DDL Schema for Milestone Draft**:
    ```sql
    CREATE TABLE public.membership_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        membership_id UUID NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
        transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'payment', 'refund', 'adjust')),
        amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
        points_delta INTEGER NOT NULL DEFAULT 0,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    ```

---

### Command Environment Status (datacontract CLI)

We checked the availability of `datacontract-cli`:
*   `datacontract` is **NOT** installed globally in the Windows shell path.
*   `pip show datacontract` returned `Package(s) not found: datacontract`.
*   No `.venv` or local virtualenv directory exists in the project root.
*   No scripts or package.json items configuring `datacontract-cli` exist in the current folder.
*   Therefore, the environment is currently a **clean slate** with respect to Python-based `datacontract-cli` integration.

---

### Analysis of the Test File `src/lib/__tests__/data-integrity-operator.test.ts`

The test file executes a forensic validation of snapshots representing clean and anomalous systems.
1.  **Logic and Rules checked** (defined in `src/lib/systemDataAudit.ts`):
    *   **Stock Check**: Product stock quantity must match the sum of quantities across warehouses (`warehouse_stock`). Checks if stocks are negative.
    *   **Price Check**: `cost_price` and `selling_price` must be non-negative, and `selling_price` should be >= `cost_price` (warning only).
    *   **Order Calculations**: `order_item.total` must equal `quantity * unit_price`. Order `subtotal` must match sum of items. Order `total` must equal `subtotal - discount + shipping_fee`.
    *   **Payment Mappings**: Total amount of `payment_transactions` matching an order must match `orders.paid_amount`. Warns if marked `paid` but total paid amount < order total.
    *   **Ledger Balancing**: Debit and Credit sums in `journal_lines` for any non-voided `journal_entry` must match (accounting double-entry balance).
    *   **BOM Checks**: Products with BOM components must reference valid materials. Product cost price must match sum of its component cost prices multiplied by quantities (triggers error if > 5% mismatch, warning if <= 5%).
    *   **Membership Card Validation**:
        *   Unique card numbers across the system.
        *   Non-negative wallet balance.
        *   Accumulated balance from transactions (`deposit` (+) vs `payment`/`refund` (-)) matches current `membership.balance`.
2.  **Output Report**:
    *   Generates a markdown report `data_integrity_report.md` in `C:\Users\KHOA MEDIA\.gemini\antigravity\brain\1640b070-1132-4584-95c1-41f2663699bc\data_integrity_report.md` listing forensic checks and reliability scores (100% for baseline snapshot, ~76% for anomalous snapshot).
3.  **Command Execution**:
    *   Run using Vitest: `npx vitest run src/lib/__tests__/data-integrity-operator.test.ts`. Completed successfully (PASS) in 6.81s.

---

## 2. Logic Chain
1.  **DDL mapping to types**: In database schema dump (`20251230022804_remix_migration_from_pg_dump.sql` etc.) and `types.ts`, we see that 7 tables match database tables exactly.
2.  **Mock/localStorage detection**: We found no occurrence of `CREATE TABLE memberships` or `CREATE TABLE membership_transactions` in database migrations. In `src/hooks/useMemberships.ts`, we observed the data structures being populated and persisted to `localStorage` (via keys `erp-mini-local-demo-memberships` and `erp-mini-local-demo-membership-transactions`). Therefore, these two tables currently exist purely in frontend mockup code.
3.  **Audit reference**: In `systemDataAudit.ts`, `(supabase as any).from("memberships")` is cast to `any` because the frontend client lacks generated types for memberships and membership transactions.
4.  **CLI status check**: Running `where.exe` and `pip show` confirmed that `datacontract-cli` is not installed on this system. Therefore, setting up `datacontract-cli` in a python virtualenv will be required in the implementation step.

---

## 3. Caveats
*   **Alternative schema mappings**: The proposed PostgreSQL structures for `memberships` and `membership_transactions` are draft proposals based on frontend properties. Actual implementations may require extra columns like `company_id` for multi-tenant isolation, matching the style of other core tables.
*   **Virtualenv path**: The local system might require setting up a Python virtual environment (`.venv`) manually during implementation.

---

## 4. Conclusion
*   We have mapped all fields, types, and constraints for the 9 target tables (with 7 being actual DB tables and 2 being frontend-only entities).
*   The system data integrity operator tests are working fine and outputting correctness reports.
*   There is no pre-existing `datacontract` installation. A `.venv` virtualenv should be created and `pip install datacontract-cli` run.

---

## 5. Verification Method
To verify these findings:
1.  Verify the types in `src/integrations/supabase/types.ts` and the SQL files in `supabase/migrations/`.
2.  Verify the local membership structure in `src/hooks/useMemberships.ts`.
3.  Run the tests to confirm the validation behavior:
    `npx vitest run src/lib/__tests__/data-integrity-operator.test.ts`
