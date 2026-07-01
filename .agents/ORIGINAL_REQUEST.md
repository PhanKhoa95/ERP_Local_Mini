# Original User Request

## Initial Request — 2026-06-30T04:27:44Z

Thiết kế và triển khai giải pháp đồng bộ hóa và nhất quán dữ liệu tập trung (Centralized Event-Driven Observer) cho hệ thống ERP Local Demo. Khi dữ liệu của một phân hệ thay đổi (ví dụ: tạo đơn hàng POS mới), hệ thống sẽ phát event tập trung để tự động cập nhật đồng bộ các phân hệ liên quan (Tồn kho, Công nợ đối tác, Bút toán Sổ cái Kế toán) và làm mới cache giao diện tức thì.

Working directory: y:\ERP_Local_Mini
Integrity mode: development

## Requirements

### R1. Bộ phát sự kiện tập trung (Centralized Event Bus)
- Xây dựng module phát sự kiện dùng chung `src/lib/erpEventBus.ts` hỗ trợ cơ chế Publish/Subscribe.
- Tích hợp vào các Hook ghi dữ liệu (`useOrders.ts`, `usePaymentTransactions.ts`, `useContracts.ts`) để phát ra các sự kiện nghiệp vụ (ví dụ: `ORDER_CREATED`, `PAYMENT_RECORDED`, `CONTRACT_SIGNED`).

### R2. Bộ xử lý đồng bộ nghiệp vụ liên phân hệ (Subscribers / Operations Handlers)
- **Tồn kho (Inventory Handler)**: Đăng ký nhận sự kiện đơn hàng, tự động đối chiếu trừ số lượng tồn kho (`stock_quantity`) của sản phẩm tương ứng trong localStorage.
- **Kế toán Sổ cái (Accounting Handler)**: Đăng ký nhận sự kiện, tự động sinh bút toán kép ghi Nợ/Có (Ví dụ: Đơn hàng mới -> Nợ 131 / Có 511 và Nợ 632 / Có 156; Giao dịch thu tiền -> Nợ 1111/1121 / Có 131) vào sổ nhật ký bút toán sổ cái.
- **Công nợ đối tác (Partner Debt Handler)**: Tự động tính toán và cập nhật lại trường số dư công nợ `debt_amount` của đối tác khách hàng hoặc nhà cung cấp tương ứng.

### R3. Đồng bộ hóa UI (State Synchronization & Query Invalidation)
- Đảm bảo sau khi xử lý các thay đổi dữ liệu ngầm từ Event Bus, hệ thống sẽ thực hiện làm mới (invalidate queries) các React Query tương ứng (như `["products"]`, `["orders"]`, `["journal-entries"]`, `["partners"]`), đảm bảo toàn bộ biểu đồ, thẻ tóm tắt và bảng số liệu trên màn hình đồng bộ ngay làm tức.

## Verification Plan

### Automated Tests
- Thiết lập file kiểm thử tích hợp chuyên biệt (ví dụ: `src/lib/__tests__/erpEventBus.test.ts`) giả lập các hành vi tạo đơn hàng, thanh toán và xác thực tính đồng bộ.
- Chạy lệnh kiểm tra: `npm run test` hoặc `npx vitest src/lib/__tests__/erpEventBus.test.ts`.

## Acceptance Criteria

### Event Bus & Triggers
- [ ] Module `erpEventBus.ts` hoạt động ổn định và đăng ký thành công các subscribers.
- [ ] Khi thêm một đơn hàng POS mới, tồn kho của sản phẩm trong đơn hàng tự động giảm xuống đúng số lượng đã bán.
- [ ] Khi thêm một đơn hàng POS mới, một bút toán kép (journal entry) mới ở trạng thái `posted` tự động sinh ra trong sổ cái với tổng số tiền Debits = Credits khớp trị giá đơn hàng.
- [ ] Khi thêm một đơn hàng POS mới, công nợ khách hàng (`debt_amount`) tự động tăng lên đúng bằng giá trị đơn hàng.
- [ ] Khi tạo giao dịch thu tiền thanh toán đơn hàng, công nợ khách hàng giảm tương ứng và tăng số dư Tiền mặt/Ngân hàng trong Sổ cái.

### Đồng bộ hóa UI
- [ ] Toàn bộ UI (Biểu đồ doanh thu, Thẻ tổng quan tài sản, Danh mục công nợ) tự làm mới đồng loạt mà không cần F5 tải lại trang sau khi một sự kiện Event Bus hoàn tất.

### Kiểm thử
- [ ] Bộ test case `erpEventBus.test.ts` chạy thành công và pass 100%.

## Follow-up — 2026-06-30T05:59:52Z

Kiểm thử tính chính xác và logic tính toán của các phân hệ báo cáo (Doanh thu, Bán hàng, Sản phẩm, Tồn kho, Đối tác, Chiết tính & Dòng tiền) trong hệ thống ERP Local Mini để đảm bảo các công thức tổng hợp số liệu không bị sai lệch khi dữ liệu phình to.

Working directory: y:\ERP_Local_Mini
Integrity mode: development

## Requirements

### R1. Bộ kiểm thử logic Báo cáo Doanh thu & Bán hàng (Revenue & Sales Report Tests)
- Kiểm tra tính chính xác của `totalRevenue` (tổng doanh thu), `totalCOGS` (tổng giá vốn), `grossProfit` (lợi nhuận gộp), và `profitMargin` (tỷ suất lợi nhuận).
- Xác thực tính chính xác của việc gom nhóm doanh thu theo ngày (`dailyChart`) và gom nhóm theo kênh bán hàng (`channelChart`).

### R2. Bộ kiểm thử logic Báo cáo Sản phẩm & Kho hàng (Product & Inventory Report Tests)
- Xác thực thống kê các sản phẩm bán chạy nhất (Top Products by Quantity/Revenue).
- Kiểm tra cách tính giá trị tồn kho tổng quát (Inventory valuation, average unit cost).

### R3. Bộ kiểm thử Báo cáo Đối tác & Phân tích Đơn hàng (Partner & Order Report Tests)
- Đảm bảo tính toán công nợ và tổng chi tiêu của đối tác khách hàng/nhà cung cấp khớp với các đơn hàng liên quan.
- Xác thực phân loại trạng thái đơn hàng (pending, confirmed, processing, shipping, delivered, cancelled) và phương thức thanh toán.

## Verification Plan

### Automated Tests
- Thiết lập file kiểm thử Vitest tại `src/hooks/__tests__/useReportStats.test.ts` giả lập dữ liệu local storage và chạy kiểm thử.
- Chạy lệnh kiểm tra: `npx vitest run src/hooks/__tests__/useReportStats.test.ts`.

## Acceptance Criteria

### Test Coverage & Assertions
- [ ] Thiết lập test suite `useReportStats.test.ts` đầy đủ các nhóm test case cho doanh thu, sản phẩm, tồn kho và đối tác.
- [ ] Tất cả các test cases chạy độc lập thành công 100% (Pass).
- [ ] Đảm bảo mock `localStorage` hoạt động ổn định và dọn dẹp sạch sau mỗi test case.

## Follow-up — 2026-06-30T17:02:23+07:00

Complete and expand the ERP Local Mini system's test suite to support sustainable development. Ensure all E2E (Playwright) and Unit/Integration (Vitest) test suites are robust, clean of hardcoded environment paths, and cover the core business workflows.

Working directory: y:\ERP_Local_Mini
Integrity mode: development

## Requirements

### R1. Complete and Clean Existing E2E Test Cases
Refactor existing Playwright E2E test suites:
- `tests/e2e/role_verification/role_verification.spec.ts`
- `tests/e2e/casso_test.spec.ts`
- `tests/e2e/kpi_data_quality.spec.ts`
- `tests/e2e/responsive_test.spec.ts`
Remove any hardcoded conversation-specific screenshot output directories (e.g., paths containing the old conversation ID `81091271-6a4a-4083-9787-ff9d6e09437c`). Use relative paths or dynamic output paths to write screenshots to the current conversation brain directory: `C:/Users/KHOA MEDIA/.gemini/antigravity/brain/0981d539-feb1-4def-9660-a5731a4a4b16`.

### R2. Core ERP Flow E2E Tests
Create new or expand E2E tests under `tests/e2e/core_erp_flows.spec.ts` (or similar location) to cover the core ERP business workflows:
- **Sales/Orders (Bán hàng)**: Creating an order, verifying order status, and completing payment.
- **Purchasing (Mua hàng)**: Creating a purchase request or supplier record, simulating the purchasing process.
- **Inventory/Warehouse (Kho)**: Checking inventory levels, simulating stock-in / stock-out transactions, and verifying inventory adjustments.
- **Finance (Tài chính)**: Verifying basic financial records or transactions, cash flows, and auto-matching.

### R3. Unit & Integration Tests Verification
Verify the existing Vitest test suite under `src/.../__tests__/`. Make sure all tests run and pass. If there are missing unit test coverage areas for the core logic (such as calculations, formatting helpers, and business hooks), add tests to ensure code quality.

### R4. Integrated Verification Pipeline
Ensure the project's local smoke test script or standard verification pipeline (`npm run test:local`) runs successfully from end to end.

## Acceptance Criteria

### Execution & Passing Rates
- [ ] 100% of Vitest unit/integration tests must compile, run, and pass (`npm run test`).
- [ ] 100% of Playwright E2E tests must compile, run, and pass (`npx playwright test`).
- [ ] The full verification command `npm run test:local` (runs typecheck, lint, tests, build) must complete successfully without any errors.

### Code Quality & Standards
- [ ] No hardcoded absolute screenshots directories targeting inactive conversation folders in the test code.
- [ ] All screenshot outputs are generated and saved correctly in `C:/Users/KHOA MEDIA/.gemini/antigravity/brain/0981d539-feb1-4def-9660-a5731a4a4b16` (or subdirectories therein).

### Coverage of Core ERP Workflows
- [ ] E2E testcases exists and passes for Sales (Bán hàng), Purchasing (Mua hàng), Inventory (Kho), and Finance (Tài chính).
- [ ] Unit tests cover order number auto-generation, BOM backflush calculation, and role-based route access controls.
