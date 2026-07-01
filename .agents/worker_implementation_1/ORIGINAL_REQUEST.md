## 2026-06-30T03:16:32Z
Implement the Backup JSON Import and Auto Audit features:
1. Update `src/components/settings/BackupTab.tsx` to handle exporting and importing correctly in both Local Demo and Supabase Cloud modes.
2. In Local Demo mode:
   - Export: Read tables (products, orders, partners, documents, perf_employees, inventory_transactions, payment_transactions, journal_entries, journal_lines, warehouse_stock, product_bom) from their corresponding `localStorage` keys prefixed with `erp-mini-local-demo-` and format them.
   - Import: Parse the JSON file. If the file contains these keys, write them to `localStorage` under `erp-mini-local-demo-${key}`. If "Ghi đè hoàn toàn" is selected, clear existing data using `resetLocalDemoData()` first.
3. In Supabase Cloud mode:
   - Sanitize all rows by forcing `company_id` to be the current logged-in user's company context ID.
   - If "Ghi đè hoàn toàn" (Overwrite) is selected, bulk delete existing records for the company in reverse dependency order:
     `payment_transactions`, `inventory_transactions`, `order_items`, `orders`, `journal_lines`, `journal_entries`, `product_bom`, `warehouse_stock`, `products`, `partners`, `perf_employees`, `documents`.
   - Bulk insert/upsert the rows from the backup file in forward dependency order:
     `partners`, `products`, `warehouse_stock`, `product_bom`, `perf_employees`, `documents`, `orders`, `order_items`, `inventory_transactions`, `payment_transactions`, `journal_entries`, `journal_lines`.
     Use `.upsert(rows, { onConflict: 'id' })` to support merging/upserting.
4. Auto Audit Integration:
   - Call `runSystemDataAudit` immediately after successful restore.
   - Display a toast notification with the audit health score, e.g., "Khôi phục dữ liệu thành công! Điểm sức khỏe dữ liệu: 100% (Cảnh báo: 0, Lỗi: 0)".
5. UI Layout:
   - Add a file input/drag-and-drop area for uploading JSON backup files.
   - Add a selector for Import Strategy: "Gộp dữ liệu (Merge)" or "Ghi đè hoàn toàn (Overwrite)".
   - Invalidate React Query cache via `queryClient.invalidateQueries()` and trigger `window.location.reload()` after a short delay (e.g. 1000ms).
6. Run `npm run build` and `npm run test` to verify everything compiles and passes tests.
