---
id: SPEC-002-event-bus
type: spec
status: approved
target_agent: BA_Agent
created_at: 2026-07-15
source_ids:
  - RAW-002-event-bus
approved_by: Human_Owner
approved_at: 2026-07-15
---

# Đặc tả tính năng: Bộ phát sự kiện tập trung và Đồng bộ liên phân hệ

## Mục tiêu và phi mục tiêu
- **Mục tiêu**: Xây dựng cơ chế giao tiếp không đồng bộ giữa các phân hệ thông qua mẫu Observer, đảm bảo tính nhất quán dữ liệu cuối cùng (Eventual Consistency) mà không làm nghẽn luồng xử lý chính.
- **Phi mục tiêu**: Đồng bộ thời gian thực qua WebSockets (chỉ đồng bộ cục bộ qua memory/localStorage).

## User stories
- **US1**: Là nhân viên bán hàng POS, khi tôi tạo đơn hàng thành công, hệ thống phải tự động trừ tồn kho mà tôi không cần thao tác thủ công.
- **US2**: Là kế toán trưởng, tôi muốn hệ thống tự động ghi nhận bút toán Nợ/Có tương ứng cho mỗi giao dịch bán hàng và thanh toán để làm báo cáo tài chính chính xác.

## Acceptance criteria
1. **Event Bus API**: Module `erpEventBus` cung cấp `.subscribe(event, handler)` và `.publish(event, payload)`.
2. **Xử lý tồn kho**: Khi `ORDER_CREATED`, tự động tìm sản phẩm và giảm `stock_quantity`.
3. **Bút toán sổ cái**:
   - Đơn hàng mới -> Nợ 131 (Phải thu KH) / Có 511 (Doanh thu) và Nợ 632 (Giá vốn) / Có 156 (Hàng hoá).
   - Thu tiền thanh toán -> Nợ 1111/1121 (Tiền mặt/Ngân quỹ) / Có 131 (Phải thu KH).
4. **Công nợ đối tác**: Tự động tính lại `debt_amount` của đối tác dựa trên chênh lệch đơn hàng và các giao dịch thanh toán đã thực hiện.
5. **Đồng bộ React Query**: Gọi `queryClient.invalidateQueries` cho các query key liên quan sau khi xử lý xong các sự kiện để làm mới UI tự động.
