---
id: RAW-001-memberships-wallet
type: raw
status: refined
target_agent: BA_Agent
created_at: 2026-07-15
---

# Yêu cầu thô: Quản lý Thẻ thành viên & Số dư Ví thành viên

## Nguồn
Yêu cầu từ khách hàng tích hợp trong `ORIGINAL_REQUEST.md` liên quan đến việc bổ sung thẻ thành viên (memberships) và ví tiền thành viên (wallet balance) trong hệ thống ERP Local Mini.

## Nội dung đã phân loại
1. **Quản lý thẻ thành viên**:
   - Một đối tác (partner/khách hàng) có thể có nhiều thẻ thành viên.
   - Hỗ trợ tải lên hình ảnh thẻ và lưu trữ để hiển thị thumbnail trực quan.
   - Giao diện chi tiết đối tác hiển thị danh sách thẻ thành viên dạng Glassmorphism.
2. **Hạch toán ví thành viên**:
   - Cài đặt tài khoản đối ứng ví thành viên (ví dụ: `3387` - Doanh thu chưa thực hiện / nhận trước).
   - Nạp tiền vào ví: sinh bút toán Nợ 111 / Có 3387.
   - Chi tiêu từ ví thanh toán đơn hàng: sinh bút toán Nợ 3387 / Có 511 và cập nhật số dư tức thì.
   - Xem lịch sử giao dịch và liên kết bút toán.
3. **Audit**:
   - Ghi nhận mọi thay đổi cấu hình, nạp/tiêu tiền vào bảng `audit_logs`.
