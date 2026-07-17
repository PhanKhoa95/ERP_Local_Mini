## 2026-07-17T12:20:47Z
You are teamwork_preview_worker. Your working directory is y:\ERP_Local_Mini\.agents\teamwork_preview_worker_datacontract_impl.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Task: Implement the Data Contract and CI Gate Integration.
1. Create a `datacontract.yaml` file in the project root containing the schemas for the 9 core tables (products, orders, order_items, payment_transactions, journal_entries, journal_lines, product_bom, memberships, membership_transactions) based on the Explorer's findings:
   - products: id (uuid), sku (text, unique), name (text), description (text), category (text), unit (text), cost_price (numeric), selling_price (numeric), stock_quantity (integer), min_stock (integer), image_url (text), is_active (boolean), created_at (timestamptz), updated_at (timestamptz), has_variants (boolean), is_service (boolean), company_id (uuid)
   - orders: id (uuid), order_number (text, unique), channel_id (uuid), partner_id (uuid), order_type (text), status (text), order_date (timestamptz), subtotal (numeric), discount (numeric), shipping_fee (numeric), total (numeric), shipping_address (text), notes (text), created_by (uuid), created_at (timestamptz), updated_at (timestamptz), voucher_id (uuid), voucher_discount (numeric), paid_amount (numeric), payment_status (text), company_id (uuid), source_type (text), customer_name (text), customer_phone (text), customer_email (text), customer_address (text), shipping_province (text), shipping_district (text), shipping_ward (text), payment_method (text), payment_reference (text), warehouse_id (uuid), shipping_zone_id (uuid), priority (text), internal_notes (text), confirmed_at (timestamptz), shipped_at (timestamptz), delivered_at (timestamptz), cancelled_at (timestamptz), cancelled_reason (text), external_created_at (timestamptz), last_synced_at (timestamptz), tags (text[]), points_earned (integer), points_used (integer), referral_discount (numeric)
   - order_items: id (uuid), order_id (uuid), product_id (uuid), quantity (integer), unit_price (numeric), discount (numeric), total (numeric), created_at (timestamptz), variant_id (uuid)
   - payment_transactions: id (uuid), partner_id (uuid), order_id (uuid), transaction_type (text), amount (numeric), payment_method (text), reference_number (text), notes (text), transaction_date (timestamptz), created_by (uuid), created_at (timestamptz), company_id (uuid)
   - journal_entries: id (uuid), company_id (uuid), entry_date (date), description (text), source_type (text), source_id (uuid), status (text), vneid_signature (text), created_by (uuid), posted_by (uuid), created_at (timestamptz), updated_at (timestamptz)
   - journal_lines: id (uuid), entry_id (uuid), account_id (uuid), debit (numeric), credit (numeric), asset_type (text), memo (text), created_at (timestamptz)
   - product_bom: id (uuid), product_id (uuid), material_id (uuid), quantity (numeric), unit (text), notes (text), is_active (boolean), created_at (timestamptz), updated_at (timestamptz)
   - memberships: id (uuid), partner_id (uuid), card_number (text, unique), tier (text), balance (numeric), points (integer), status (text), issue_date (timestamptz), expiry_date (timestamptz), notes (text), card_image (text), created_at (timestamptz), updated_at (timestamptz)
   - membership_transactions: id (uuid), membership_id (uuid), transaction_type (text), amount (numeric), points_delta (integer), description (text), created_at (timestamptz)

2. Set up `datacontract-cli`.
   - Setup a Python virtual environment `.venv` at project root if it doesn't exist.
   - Install `datacontract-cli` in it (e.g. using `pip install datacontract-cli`).
   - Create a helper script (e.g. `scripts/run-datacontract.js` or `scripts/run-datacontract.py`) that uses the virtual environment python/pip to run `datacontract test datacontract.yaml` offline, verifying the syntax/compatibility of the contract.
   - Integrate this validation check as a script in `package.json` (e.g., `npm run test:datacontract` or `npm run datacontract:test`). Make sure that when the script runs, it exits successfully (exit code 0) if the validation passes.

3. Run and verify the tests:
   - Run the Vitest integration test `src/lib/__tests__/data-integrity-operator.test.ts` to ensure it passes 100%. If any adjustments are needed to that test file or the underlying logic to ensure data integrity audit compatibility with the new datacontract setup, implement them.
   - Run `npm run typecheck`, `npm run lint`, and `npm run build` to verify no regressions were introduced.

Write your handoff report to handoff.md in your working directory including:
- Actions taken (creation of datacontract.yaml, virtualenv setup, npm script config, test updates)
- Execution logs of typecheck, lint, vitest tests, build, and the datacontract CLI check.
Notify the parent orchestrator (id: f6ebeba4-61a7-4922-8e0c-b93106021123) when done.
