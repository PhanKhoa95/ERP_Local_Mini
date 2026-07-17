---
id: SPEC-003-dynamic-warranty
type: spec
status: approved
target_agent: BA_Agent
created_at: 2026-07-15
source_ids:
  - RAW-003-dynamic-warranty
approved_by: Human_Owner
approved_at: 2026-07-15
---

# Đặc tả tính năng: Đồng bộ Bảo hành động theo danh mục đối tác

## Mục tiêu và phi mục tiêu
- **Mục tiêu**: Đơn giản hoá quy trình khai báo danh mục sản phẩm bằng cách gỡ bỏ trường bảo hành tĩnh. Thay vào đó, thời gian bảo hành được quản lý tập trung theo chính sách và phân hạng của đối tác khách hàng/nhà cung cấp.
- **Phi mục tiêu**: Cấu hình bảo hành chi tiết cho từng mã SKU riêng lẻ (chỉ áp dụng theo danh mục chung).

## User stories
- **US1**: Là quản trị viên, tôi muốn cấu hình thời gian bảo hành tập trung cho từng nhóm danh mục sản phẩm ứng với từng phân hạng đối tác, thay vì nhập đi nhập lại cho mỗi sản phẩm.
- **US2**: Là nhân viên hỗ trợ khách hàng, tôi muốn xem nhanh thời gian bảo hành thực tế của các sản phẩm đối tác đã mua dựa trên chính sách hiện hành.

## Acceptance criteria
1. **Lược bỏ bảo hành tĩnh**: Form thêm/sửa danh mục sản phẩm tại `CategoriesTab` không hiển thị trường "Thời gian bảo hành".
2. **Cấu hình chính sách**: `SalesPoliciesTab` phải hiển thị rõ ràng bảng cấu hình bảo hành theo danh mục sản phẩm và chính sách phân khúc đối tác.
3. **Tính toán động**: Hồ sơ khách hàng (`PartnerDetailDialog`) hiển thị chính xác hạn bảo hành động của từng sản phẩm đã mua dựa trên chính sách phân hạng của khách hàng đó.
