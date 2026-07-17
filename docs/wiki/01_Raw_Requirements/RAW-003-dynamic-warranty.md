---
id: RAW-003-dynamic-warranty
type: raw
status: refined
target_agent: BA_Agent
created_at: 2026-07-15
---

# Yêu cầu thô: Đồng bộ Bảo hành động theo danh mục đối tác

## Nguồn
Yêu cầu Milestone 5, 6, 7 từ `PROJECT.md` - Loại bỏ trường nhập tĩnh "Thời gian bảo hành" tại biểu mẫu thêm/sửa danh mục, tự động áp dụng chính sách động và tính toán thời gian bảo hành cho đối tác.

## Nội dung đã phân loại
- Form thêm/sửa danh mục tại `CategoriesTab` không còn trường nhập "Thời gian bảo hành".
- Tab `SalesPoliciesTab` hiển thị 2 phần: chính sách theo phân khúc và thời gian bảo hành theo danh mục.
- Hồ sơ chi tiết đối tác (`PartnerDetailDialog`) tự động lấy chính sách động và hiển thị/tính toán thời gian bảo hành dựa theo phân hạng danh mục/chính sách áp dụng.
