---
id: RAW-002-event-bus
type: raw
status: refined
target_agent: BA_Agent
created_at: 2026-07-15
---

# Yêu cầu thô: Bộ phát sự kiện tập trung và Đồng bộ liên phân hệ

## Nguồn
Yêu cầu từ `ORIGINAL_REQUEST.md` - Thiết kế giải pháp đồng bộ và nhất quán dữ liệu tập trung (Centralized Event-Driven Observer) cho hệ thống ERP Local Demo.

## Nội dung đã phân loại
- Phát triển module event bus Publish/Subscribe dùng chung.
- Tích hợp vào các Hook thay đổi dữ liệu để phát event: `ORDER_CREATED`, `PAYMENT_RECORDED`, `CONTRACT_SIGNED`.
- Đồng bộ tự động ngầm:
  - Tồn kho: giảm `stock_quantity` khi có đơn hàng.
  - Kế toán: sinh bút toán kép Nợ/Có.
  - Công nợ đối tác: cập nhật `debt_amount` tương ứng.
- Đồng bộ UI: làm mới (invalidate queries) các cache React Query (`products`, `orders`, `journal-entries`, `partners`).
