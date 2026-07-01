## 2026-06-30T10:07:07Z
You are teamwork_preview_worker for milestone M2 (Create Core ERP Flow E2E Tests).
Your working directory is: y:\ERP_Local_Mini\.agents\worker_m2_core_e2e.

Your task:
Create a new Playwright E2E test file: `tests/e2e/core_erp_flows.spec.ts`.

Requirements:
1. The test suite must cover the four core ERP flows:
   - Sales/Orders (Bán hàng): Login, go to POS, add a product to cart, checkout (Cash/Tiền mặt or Transfer/Chuyển khoản), and verify order status.
   - Purchasing (Mua hàng): Login, go to Partners page, click "Nhà cung cấp" (Suppliers) tab, click "Thêm mới", fill the form with a new supplier, and save.
   - Inventory/Warehouse (Kho): Login, go to Inventory page, perform "Nhập kho" (Stock in) or "Xuất kho" (Stock out) adjustment.
   - Finance (Tài chính): Login, go to Finance page, verify that basic financial stats cards / Casso integration panel are visible.
2. In all E2E test steps, capture screenshots at key validation points and save them using `getBrainPath()` and `ensureDir()` from `tests/e2e/helpers.ts`. Make sure to avoid any hardcoded output directories.
3. The screenshots must be saved dynamically under:
   - `core_erp_sales.png`
   - `core_erp_purchasing.png`
   - `core_erp_inventory.png`
   - `core_erp_finance.png`
   (inside the brain folder resolved by `getBrainPath()`).
4. Verify compilation by running: `npx playwright test --list`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT
hardcode test results, create dummy/facade implementations, or
circumvent the intended task. A Forensic Auditor will independently
verify your work. Integrity violations WILL be detected and your
work WILL be rejected.

Write a handoff report in your working directory when finished.
