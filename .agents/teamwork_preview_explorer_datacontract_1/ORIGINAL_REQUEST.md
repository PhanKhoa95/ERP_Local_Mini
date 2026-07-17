## 2026-07-17T05:17:36Z
Explore the codebase to design and prepare for the Data Contract milestone.
1. Find and analyze the exact schema and type definitions of these 9 tables in the frontend (such as in src/integrations/supabase/types.ts or hook files) and in database migrations (supabase/migrations/):
   - products
   - orders
   - order_items
   - payment_transactions
   - journal_entries
   - journal_lines
   - product_bom
   - memberships
   - membership_transactions
2. Identify all fields, types, constraints (e.g. required, unique, foreign keys) for these tables.
3. Search for any existing datacontract-cli setups, package.json test scripts, or python tools in the project. Check if 'datacontract' command is installed and how it can be run (e.g., via python, pip, or virtualenv).
4. Analyze the test file src/lib/__tests__/data-integrity-operator.test.ts to understand how it performs data verification and how it should be verified.
Write your findings to handoff.md in your working directory and notify the parent orchestrator (id: f6ebeba4-61a7-4922-8e0c-b93106021123).
