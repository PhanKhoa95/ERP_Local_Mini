## 2026-07-01T07:57:28Z

You are a read-only codebase investigator explorer subagent.
Your task is to analyze the codebase for the Logic Resolution & Data Sync milestone.
Your working directory is: y:\ERP_Local_Mini\.agents\explorer_logic_sync_gen3_1

Please:
1. Inspect the rules checked in `src/lib/systemDataAudit.ts` and `src/lib/__tests__/systemDataAudit.test.ts`. 
2. Search the codebase to locate where the following business logic limitations and synchronization issues are currently implemented or checked, or where they need to be implemented:
   Business Logic Resolutions (R1):
   - Trạng thái `paid` based on `paid_amount` vs `total`.
   - Manual Match UI/Backend for unmatched Casso transactions.
   - Prevent/warn selling price lower than cost price.
   - Block deletion of product if it is in BOM of another product.
   - Manage quantity for limited services.
   - Ignore inactive sales channels in quota calculations.
   - Check project budget limit when creating expense vouchers.
   - Block circular dependency in BOM materials.
   Data Synchronization (R2):
   - Auto sync finished product cost price when material price in BOM changes.
   - Sync `products.stock_quantity` with sum of `warehouse_stock.quantity`.
   - Auto sync journal entries (Debit/Credit) for inventory stock in/out.
   - Sync Casso bank transaction timezone (GMT+7) with UTC system storage.
   - Record Project Health configuration change history in `audit_logs`.
3. Locate relevant code files, hooks (like useOrders, useProducts, useBOM, etc.), components (like ProductDialog, CategoriesTab, PartnerDetailDialog, ProjectExpense, CassoTab, etc.), and database schemas.
4. Produce a detailed analysis report at `y:\ERP_Local_Mini\.agents\explorer_logic_sync_gen3_1\analysis.md` outlining the exact files and lines that need modification, proposed fix details, and test coverage suggestions.
5. Write your `handoff.md` and then call `send_message` to report back.
