---
id: TECH-004-packing-workflow
type: technical
status: current
target_agent: Dev_Agent
created_at: 2026-07-15
source_ids:
  - SPEC-004-packing-workflow
---

# Tài liệu kỹ thuật: Quy trình Đóng hàng Pancake POS và Thanh Bulk Action Bar

## Kiến trúc và luồng dữ liệu
Quy trình đóng hàng tích hợp chặt chẽ giữa bảng danh sách đơn hàng và hộp thoại xử lý chi tiết:

1. **Chọn hàng loạt**: File [Orders.tsx](file:///y:/ERP_Local_Mini/src/pages/Orders.tsx) theo dõi trạng thái `selectedOrderIds`. Khi mảng này có độ dài > 0, thanh Bulk Action Bar xuất hiện.
2. **Hộp thoại đóng hàng**: File [PackingDialog.tsx](file:///y:/ERP_Local_Mini/src/components/orders/PackingDialog.tsx) nhận danh sách `orderIds`.
3. **Mã đơn hàng & Picking**:
   - `PackingDialog` tải thông tin đơn hàng hiện tại dựa trên chỉ số index trong mảng `orderIds`.
   - Nhân viên quét hoặc tích chọn các sản phẩm.
   - Khi bấm **Đã đủ hàng**:
     - Cập nhật trạng thái đơn hàng sang `waiting_transfer` trong database / localStorage.
     - Gọi cơ chế trừ tồn kho sản phẩm từ kho chỉ định của đơn hàng đó.
     - Nếu cấu hình in tự động được bật, khởi chạy cửa sổ in hóa đơn K80.
     - Tăng chỉ số index để chuyển sang đơn hàng tiếp theo.

## Mô-đun hoặc tệp sở hữu
- Danh sách đơn hàng: [Orders.tsx](file:///y:/ERP_Local_Mini/src/pages/Orders.tsx)
- Hộp thoại đóng hàng: [PackingDialog.tsx](file:///y:/ERP_Local_Mini/src/components/orders/PackingDialog.tsx)

## Kiểm thử và bằng chứng triển khai
- Thư mục kiểm thử: [PackingDialog.challenge.test.tsx](file:///y:/ERP_Local_Mini/src/components/__tests__/PackingDialog.challenge.test.tsx)
- Lệnh chạy: `npx vitest run src/components/__tests__/PackingDialog.challenge.test.tsx`
