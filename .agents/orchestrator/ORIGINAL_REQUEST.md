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
