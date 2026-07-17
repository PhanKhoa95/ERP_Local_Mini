---
id: RAW-004-packing-workflow
type: raw
status: refined
target_agent: BA_Agent
created_at: 2026-07-15
---

# Yêu cầu thô: Quy trình Đóng hàng Pancake POS và Thanh Bulk Action Bar

## Nguồn
Yêu cầu tích hợp tính năng đóng hàng nâng cao và thanh hành động hàng loạt từ `ORIGINAL_REQUEST.md`.

## Nội dung đã phân loại
1. **Thanh Bulk Action Bar**:
   - Xuất hiện trên đầu bảng danh sách đơn hàng (`Orders.tsx`) khi chọn từ một đơn hàng trở lên.
   - Chứa các nút thao tác nhanh: In đơn, Cập nhật nhanh, Đóng hàng, Xuất excel, In nhãn, v.v.
2. **Quy trình Đóng hàng & Kiểm hàng (Packing Dialog)**:
   - Hỗ trợ nhập mã/quét mã đơn hàng để tải đơn hàng cần đóng.
   - Hiển thị danh sách sản phẩm cần nhặt (Picking List).
   - Khi hoàn tất nhặt đủ hàng, đơn hàng chuyển trạng thái sang Chờ chuyển hàng (`waiting_transfer`), tự trừ tồn kho ở kho chỉ định.
   - Tự động in hóa đơn K80 nếu bật cấu hình.
   - Tự động chuyển tiếp sang đơn tiếp theo trong danh sách đơn hàng đã chọn trước đó.
