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
- Đảm bảo sau khi xử lý các thay đổi dữ liệu ngầm từ Event Bus, hệ thống sẽ thực hiện làm mới (invalidate queries) các React Query tương ứng (như `["products"]`, `["orders"]`, `["journal-entries"]`, `["partners"]`), đảm bảo toàn bộ biểu đồ, thẻ tóm tắt và bảng số liệu trên màn hình đồng bộ ngay lập tức.

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

## Follow-up — 2026-07-01T05:00:52Z

Rà soát toàn diện hệ thống cấu hình, danh mục, chính sách và trải nghiệm người dùng (UX) trên ERP Local Mini để loại bỏ hoàn toàn các trường thông tin trùng lặp, đồng bộ hóa dữ liệu và tối ưu hóa giao diện.

Working directory: y:\ERP_Local_Mini
Integrity mode: development

## Requirements

### R1. Rà soát & Loại bỏ Trùng lặp Cấu hình (Configuration Clean-up)
- Đảm bảo trường cấu hình "Thời gian bảo hành" đã được gỡ bỏ hoàn toàn khỏi Form thêm/sửa danh mục sản phẩm tại tab `CategoriesTab` để tránh nhập liệu trùng lặp.
- Đảm bảo tab `SalesPoliciesTab` hoạt động như một trung tâm cấu hình chính sách duy nhất: bao gồm chính sách bán hàng theo phân khúc đối tác và bảng cấu hình thời gian bảo hành theo ngành hàng (danh mục).

### R2. Đồng bộ hiển thị Hồ sơ Khách hàng & Bảo hành
- Kiểm tra tab "Bảo hành & CS" trong `PartnerDetailDialog.tsx`. Đảm bảo:
  - Cột chính sách mua hàng hiển thị các chính sách động được cấu hình từ tab Chính sách.
  - Cột thời gian bảo hành sản phẩm tính toán chính xác số tháng bảo hành dựa trên danh mục của sản phẩm đã mua (tra cứu động từ danh sách danh mục).
  - Giao diện thân thiện, có phân chia bố cục rõ ràng, không bị chồng chéo hay rối mắt trên cả màn hình Desktop và Mobile.

### R3. Kiểm thử Toàn bộ Hệ thống (Verification Pipeline)
- Chạy toàn bộ các quy trình kiểm tra chất lượng mã nguồn: typecheck, lint và bộ test E2E để đảm bảo không phát sinh bất kỳ lỗi logic hay đứt gãy luồng nghiệp vụ nào.

## Acceptance Criteria

### UX & Code Cleanliness
- [ ] Form thêm/sửa danh mục tại `CategoriesTab` không còn trường nhập "Thời gian bảo hành".
- [ ] Tab `SalesPoliciesTab` hiển thị đầy đủ 2 phần: chính sách theo phân khúc và thời gian bảo hành theo danh mục.
- [ ] Hồ sơ khách hàng (`PartnerDetailDialog`) hiển thị chính sách động và tính toán bảo hành động một cách chính xác.

### Test & Stability
- [ ] Toàn bộ 18 kịch bản test Playwright E2E vượt qua 100% (`npx playwright test`).
- [ ] Lệnh kiểm tra tổng thể `npm run typecheck` chạy hoàn tất không có lỗi biên dịch.

## Follow-up — 2026-07-01T07:23:17Z

Kiểm thử toàn diện và đánh giá độ sẵn sàng vận hành của hệ thống ERP_Local_Mini, bao gồm kiểm tra tĩnh mã nguồn, chạy unit/integration tests và thực hiện e2e tests trên các luồng nghiệp vụ cốt lõi.

Working directory: y:\ERP_Local_Mini
Integrity mode: development

## Requirements

### R1. Kiểm tra tĩnh mã nguồn (Static Verification)
Hệ thống phải vượt qua các bước kiểm tra kiểu tĩnh (TypeScript typecheck) và định dạng mã nguồn (Lint) mà không phát sinh bất kỳ lỗi cảnh báo hoặc lỗi biên dịch nào.

### R2. Kiểm thử Unit và Integration (Vitest Tests)
Chạy toàn bộ bộ kiểm thử Vitest hiện có trong dự án. Tất cả các ca kiểm thử unit và integration (đối soát Casso, định mức BOM, tính toán số liệu báo cáo...) phải vượt qua 100%.

### R3. Kiểm thử đầu-cuối (Playwright E2E Tests)
Kích hoạt môi trường thử nghiệm cục bộ và chạy toàn bộ các bài test E2E bằng Playwright để xác minh các luồng giao diện người dùng cốt lõi (Phân quyền vai trò, đối soát giao dịch, responsive layouts, quy trình bán hàng/kho/tài chính).

### R4. Đóng gói sản phẩm (Production Build)
Đảm bảo dự án có thể build thành công cho môi trường production bằng công cụ Vite mà không gặp bất kỳ lỗi đóng gói nào.

## Acceptance Criteria

### Static Quality
- [ ] Lệnh `npm run typecheck` hoàn thành thành công (exit code = 0).
- [ ] Lệnh `npm run lint` hoàn thành không phát sinh lỗi nghiêm trọng.

### Test Automation
- [ ] 100% các test suite trong Vitest vượt qua thành công (`npm run test` hoặc `npm run test:local` có exit code = 0).
- [ ] 100% các ca kiểm thử Playwright E2E vượt qua thành công (`npx playwright test` có exit code = 0).

### Build & Package
- [ ] Lệnh `npm run build` hoàn thành thành công và tạo ra thư mục `dist` chứa đầy đủ tài nguyên tĩnh (exit code = 0).

## Follow-up — 2026-07-01T07:45:47Z

Nghiên cứu và khắc phục các điểm hạn chế về logic nghiệp vụ (10 lỗi logic) và sự không đồng nhất dữ liệu (10 lỗi mất đồng bộ) trên hệ thống ERP_Local_Mini nhằm đảm bảo an toàn tài chính và tính chính xác của số liệu báo cáo.

Working directory: y:\ERP_Local_Mini
Integrity mode: development

## Requirements

### R1. Khắc phục các lỗi logic nghiệp vụ (Logic Resolution)
Sửa đổi các lỗi logic trong các module Tài chính, Kho hàng (BOM), Cài đặt và Báo cáo để ngăn chặn rủi ro thất thoát dòng tiền, bao gồm:
- Ràng buộc trạng thái `paid` dựa trên số tiền thực thu `paid_amount` so với tổng tiền đơn hàng.
- Bổ dung giao diện khớp thủ công (Manual Match) cho các giao dịch Casso `unmatched`.
- Ngăn chặn/cảnh báo bán hàng thấp hơn giá vốn.
- Chặn việc xoá sản phẩm đang tồn tại trong định mức BOM của thành phẩm khác.
- Cho phép quản lý số lượng đối với các gói dịch vụ có giới hạn.
- Tự động bỏ qua các kênh bán hàng ngưng hoạt động khi tính toán hạn ngạch gói cước.
- Kiểm tra hạn mức ngân sách dự án khi tạo phiếu chi tiêu liên quan.
- Chặn đệ quy vòng lặp nguyên vật liệu trong định mức BOM.

### R2. Khắc phục các lỗi mất đồng bộ dữ liệu (Data Synchronization)
Bảo đảm tính toàn vẹn dữ liệu thời gian thực giữa các phân hệ:
- Tự động đồng bộ giá vốn thành phẩm khi thay đổi giá nguyên vật liệu BOM.
- Đồng bộ số lượng tồn kho tổng sản phẩm (`products.stock_quantity`) khớp với tổng tồn vị trí (`warehouse_stock.quantity`).
- Đồng bộ tự động bút toán Nợ/Có đối ứng khi có giao dịch xuất/nhập kho vật tư.
- Đồng bộ múi giờ GMT+7 của giao dịch ngân hàng Casso khớp với giờ lưu trữ UTC của hệ thống.
- Ghi nhận lịch sử thay đổi cấu hình dự án (Project Health) vào nhật ký hệ thống `audit_logs`.

### R3. Xác minh chất lượng (Verification)
Đảm bảo tất cả các thay đổi không phá vỡ các chức năng hiện có của dự án và vượt qua các bộ kiểm thử tĩnh và động.

## Acceptance Criteria

### Quality Assurance
- [ ] Lệnh `npm run typecheck` hoàn thành thành công không lỗi (exit code = 0).
- [ ] Lệnh `npm run build` hoàn thành thành công không lỗi (exit code = 0).
- [ ] 100% các ca kiểm thử Vitest và Playwright E2E vượt qua thành công.

## Follow-up — 2026-07-01T08:38:19Z

Thiết kế, nâng cấp và hoàn thiện hệ thống phân quyền đa tầng động (Dynamic RBAC/ABAC) cho dự án ERP_Local_Mini hỗ trợ cả môi trường Local Demo và Supabase thật.

Working directory: y:\ERP_Local_Mini
Integrity mode: development

## Requirements

### R1. Cấu hình vai trò và ma trận phân quyền động (Dynamic Roles & Permission Matrix)
- Cung cấp giao diện tại tab Phân quyền (Settings) cho phép Admin tạo mới, chỉnh sửa và xóa các vai trò tùy chỉnh (Custom Roles).
- Thiết lập giao diện ma trận phân quyền (Permission Matrix) cho phép bật/tắt các quyền thao tác (Xem, Tạo, Sửa, Xóa) và quyền truy cập phân hệ đối với từng vai trò.

### R2. Áp dụng cơ chế phân quyền đa tầng (Phân hệ, Chức năng, Bản ghi, Trường dữ liệu)
- **Module-level:** Ẩn/hiện các menu điều hướng sidebar và tabs chính (ví dụ: Tài chính, Nhân sự, Báo cáo) tùy thuộc vào quyền truy cập phân hệ của vai trò hiện tại.
- **Action-level:** Ẩn hoặc disable các nút bấm Tạo mới, Sửa, Xóa trên các bảng dữ liệu nếu vai trò của người dùng không có quyền tương ứng.
- **Record-level:** Hỗ trợ lọc phạm vi dữ liệu bản ghi đơn hàng/doanh thu hiển thị trên giao diện theo thuộc tính Vùng miền (Region: Miền Bắc, Miền Trung, Miền Nam) được gán cho nhân sự.
- **Field-level:** Ẩn hiển thị cột giá vốn (`cost_price`) và các thông tin liên quan đến biên lợi nhuận của sản phẩm trong bảng Sản phẩm đối với nhân sự không được phân quyền xem thông tin nhạy cảm này.

### R3. Hoạt động trên cả Local Demo và Supabase
- Tích hợp lưu trữ cấu hình vai trò, gán quyền và ma trận phân quyền vào `localStorage` khi bật Local Demo, và đồng bộ/lưu trữ vào database Supabase khi chạy ở chế độ online.

### R4. Nhật ký kiểm toán phân quyền (Audit Logging)
- Tự động ghi nhận thông tin nhật ký chi tiết vào `audit_logs` khi có bất kỳ thay đổi nào liên quan đến việc thay đổi quyền của vai trò hoặc gán vai trò mới cho tài khoản nhân sự.

## Acceptance Criteria

### Giao diện cấu hình phân quyền động
- [ ] UI Settings hiển thị tab Quản lý Vai trò và Ma trận Quyền cho phép Admin tích chọn quyền Xem/Tạo/Sửa/Xóa động và cập nhật trực tiếp.
- [ ] Gán vai trò cho nhân sự cập nhật tức thì quyền hạn tương ứng của tài khoản đó.

### Thực thi phân quyền đa tầng
- [ ] Sidebar ẩn các phân hệ không được phép truy cập theo ma trận quyền đã cấu hình.
- [ ] Nút "Xóa" hoặc "Sửa" sản phẩm/đơn hàng bị ẩn hoặc vô hiệu hóa đối với nhân viên không có quyền tương ứng.
- [ ] Khi nhân viên được gán vùng miền "Miền Nam", danh sách đơn hàng và biểu đồ doanh thu chỉ hiển thị dữ liệu của "Miền Nam".
- [ ] Cột giá vốn (`cost_price`) trong danh sách sản phẩm bị ẩn đi (hoặc thay bằng dấu `***`) khi đăng nhập bằng vai trò không có quyền xem giá vốn.

### Tính tương thích và Audit log
- [ ] Hệ thống hoạt động mượt mà không lỗi cú pháp khi bật/tắt Local Demo.
- [ ] Mọi thay đổi ma trận quyền được ghi vào lịch sử Audit log thành công.
- [ ] Vượt qua kiểm tra kiểu tĩnh `npm run typecheck` và build production `npm run build` thành công.
