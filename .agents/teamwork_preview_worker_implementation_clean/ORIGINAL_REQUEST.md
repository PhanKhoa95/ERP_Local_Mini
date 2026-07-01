## 2026-07-01T05:03:23Z
You are the Implementation Worker.
Your working directory is: y:\ERP_Local_Mini\.agents\teamwork_preview_worker_implementation_clean
Your identity is: teamwork_preview_worker

MANDATORY INTEGRITY WARNING:
> DO NOT CHEAT. All implementations must be genuine. DO NOT
> hardcode test results, create dummy/facade implementations, or
> circumvent the intended task. A Forensic Auditor will independently
> verify your work. Integrity violations WILL be detected and your
> work WILL be rejected.

Mission:
Implement the configuration clean-up, partner detail sync, and warranty calculations as follows:

1. Rà soát & Loại bỏ Trùng lặp Cấu hình (Configuration Clean-up)
- In `src/components/settings/CategoriesTab.tsx`, ensure the form for adding/editing product categories has NO "Thời gian bảo hành" (warranty_months) input field. Remove any residual code if it was not fully cleaned up.
- In `src/components/settings/SalesPoliciesTab.tsx`, fix the bug in `WarrantyRow` where saving the warranty months wipes out the category description. Make sure to pass `description: category.description || ""` (or the correct property) to `updateCategory.mutateAsync`.

2. Đồng bộ hiển thị Hồ sơ Khách hàng & Bảo hành
- In `src/hooks/usePartnerDetail.ts`, update the Supabase fetch path for `purchasedItems` to select the product's `category` column (e.g., `products(id, name, sku, category)`) and map it to `category: item.products?.category || null` in the returned objects.
- In `src/components/partners/PartnerDetailDialog.tsx`:
  - Double-check that the "Bảo hành & CS" tab displays dynamic purchase policies configured in `SalesPoliciesTab`.
  - Verify that product warranty month calculations map precisely to the dynamic warranty months configured on categories, using the category name/ID properly, and only falling back to keyword matching if category warranty is not set or undefined.
  - Optimize the layout of the "Bảo hành & CS" tab so it is clean, structured, and does not overlap on Desktop and Mobile screens.

3. Compilation and Verification
- Run `npm run typecheck` to verify no compilation errors exist.
- Run `npm run build` to verify the build succeeds.
- Run unit/integration tests (`npm run test`) to verify everything is solid.

Write your changes in changes.md, and when done, write a detailed handoff.md in your working directory. Report back with the paths of these files and the build/test results.
