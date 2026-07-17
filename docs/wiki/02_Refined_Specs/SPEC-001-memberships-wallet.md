---
id: SPEC-001-memberships-wallet
type: spec
status: approved
target_agent: BA_Agent
created_at: 2026-07-15
source_ids:
  - RAW-001-memberships-wallet
approved_by: Human_Owner
approved_at: 2026-07-15
---

# Đặc tả tính năng: Thẻ Thành viên và Hạch toán Ví

## Mục tiêu và phi mục tiêu
- **Mục tiêu**: Cho phép khách hàng quản lý nhiều thẻ thành viên vật lý/ảo và nạp tiền mặt vào một ví điện tử cục bộ trên hệ thống ERP để mua hàng sau.
- **Phi mục tiêu**: Tích hợp cổng thanh toán trực tuyến thực tế (chỉ mô phỏng nạp tiền cục bộ bằng tiền mặt/chuyển khoản).

## User stories
- **US1**: Là khách hàng, tôi muốn sở hữu nhiều thẻ thành viên khác nhau để phân chia các hạng mục khuyến mãi/tích điểm.
- **US2**: Là kế toán, tôi muốn thao tác nạp tiền/thanh toán bằng ví của khách hàng tự động sinh ra bút toán tương ứng trong Sổ cái.

## Acceptance criteria
1. **Quản lý nhiều thẻ**: Đối tác có thuộc tính `memberships` chứa danh sách thẻ thành viên. Giao diện dạng Glassmorphism hiển thị đẹp mắt.
2. **Chọn tài khoản đối ứng**: Cấu hình lưu trữ trong localStorage với khoá `erp-mini-membership-offset-account` (mặc định: `"3387"`).
3. **Bút toán nạp tiền**: Nợ `111` / Có `3387` với số tiền nạp tương ứng.
4. **Bút toán thanh toán**: Nợ `3387` / Có `511` khi mua đơn hàng và trừ số dư ví tức thời.
5. **Nhật ký hệ thống**: `audit_logs` lưu trữ mọi hoạt động nạp/chi tiêu tiền.
