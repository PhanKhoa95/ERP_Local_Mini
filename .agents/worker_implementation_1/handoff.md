# Handoff Report — Backup JSON Import and Auto Audit

## 1. Observation
- File Modified: `y:\ERP_Local_Mini\src\components\settings\BackupTab.tsx`
- The file is updated to handle both Local Demo and Supabase Cloud modes under the same UI components.
- Standard tools/commands executed:
  - `npm run build` returned:
    `✓ built in 13.27s` (Task ID `aaf4c642-7822-4f85-b21c-06f777e2fafb/task-110`)
  - `npm run test` returned:
    `Test Files  22 passed (22)`
    `Tests  184 passed (184)` (Task ID `aaf4c642-7822-4f85-b21c-06f777e2fafb/task-119`)
- Verification paths:
  - Export lists of 11 tables for Local Demo mode.
  - Export lists of 12 tables for Supabase Cloud mode.
  - Sanitize `company_id` for Supabase insertion, delete tables in reverse dependency order, and upsert in forward dependency order.
  - Post-import: calls `runSystemDataAudit` and shows audit health score in a toast.

## 2. Logic Chain
- **Step 1**: In Local Demo mode, database tables are stored as JSON-stringified arrays in `localStorage` under keys prefixed with `erp-mini-local-demo-`. Therefore, the export logic reads from these keys and parses them into JSON arrays, and the import logic parses the backup JSON file and writes them back (merging by matching `id` values if Strategy is "merge", or clearing existing data via `resetLocalDemoData` first if Strategy is "overwrite").
- **Step 2**: In Supabase Cloud mode, tables are managed via Supabase client. Some tables contain `company_id` directly, while others are child entities (`order_items`, `journal_lines`, `warehouse_stock`, `product_bom`, `inventory_transactions`). When exporting, we query tables with `company_id` directly, and filter the other tables in memory using product, order, or journal entry context to avoid complex and error-prone joins.
- **Step 3**: During import in Supabase Cloud mode, if Strategy is "overwrite", we clear records for the current `company_id` in reverse dependency order, resolving table references. If Strategy is "merge" or "overwrite", we clean row properties by stripping out joined relation objects/arrays, sanitizing/forcing the `company_id` for appropriate tables, and then upserting the flat rows in forward dependency order.
- **Step 4**: To ensure immediate feedback on data integrity, `runSystemDataAudit` is invoked right after restore. The resulting score, warning, and error counts are parsed and displayed using the toast notification. The React Query cache is invalidated and page reloads after 1000ms.
- **Step 5**: Building and testing the repository verifies that everything compiles and passes all checks.

## 3. Caveats
- Checked and confirmed that tables like `order_items`, `journal_lines`, `warehouse_stock`, `product_bom` and `inventory_transactions` do not contain `company_id` columns, so we avoid setting `company_id` on them during upsert/insert.
- Relationship properties like `order_items` array in `orders` or `product` object in `product_bom` are stripped to prevent database execution errors.

## 4. Conclusion
- The Backup JSON Import and Auto Audit features are fully implemented, robustly covering both Local Demo and Supabase Cloud environments, sanitizing data fields properly, executing audits, reporting results, and updating the React Query cache.

## 5. Verification Method
- Code compilation check: Run `npm run build`
- Unit tests execution: Run `npm run test`
- Inspect `src/components/settings/BackupTab.tsx` to verify standard UI layout (Strategy select dropdown, file input area, drag-and-drop support) and import/export handler logic.
