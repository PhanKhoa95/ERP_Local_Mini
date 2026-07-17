---
id: TECH-003-dynamic-warranty
type: technical
status: current
target_agent: Dev_Agent
created_at: 2026-07-15
source_ids:
  - SPEC-003-dynamic-warranty
---

# Tài liệu kỹ thuật: Đồng bộ Bảo hành động theo danh mục đối tác

## Kiến trúc và luồng dữ liệu
Quy trình tính toán bảo hành động được thực hiện động trên client-side dựa trên dữ liệu chính sách trong hệ thống:

1. **Cấu hình**: Chính sách bảo hành được lưu trữ trong bảng `sales_policies` hoặc `categories` trong cơ sở dữ liệu.
2. **Loại bỏ trường nhập tĩnh**: File [CategoriesTab.tsx](file:///y:/ERP_Local_Mini/src/components/settings/CategoriesTab.tsx) đã bị lược bỏ input trường bảo hành.
3. **Giao diện cấu hình chính sách**: File [SalesPoliciesTab.tsx](file:///y:/ERP_Local_Mini/src/components/settings/SalesPoliciesTab.tsx) hiển thị các tuỳ chọn thiết lập bảo hành động theo danh mục.
4. **Hiển thị thông tin đối tác**: File [PartnerDetailDialog.tsx](file:///y:/ERP_Local_Mini/src/components/partners/PartnerDetailDialog.tsx) lấy thông tin phân khúc đối tác, so khớp danh mục sản phẩm của đơn hàng để tính toán `warranty_expiry_date = purchase_date + dynamic_warranty_months`.

## Mô-đun hoặc tệp sở hữu
- UI cấu hình: [CategoriesTab.tsx](file:///y:/ERP_Local_Mini/src/components/settings/CategoriesTab.tsx), [SalesPoliciesTab.tsx](file:///y:/ERP_Local_Mini/src/components/settings/SalesPoliciesTab.tsx)
- UI hiển thị đối tác: [PartnerDetailDialog.tsx](file:///y:/ERP_Local_Mini/src/components/partners/PartnerDetailDialog.tsx)

## Kiểm thử và bằng chứng triển khai
- Đã được kiểm thử E2E thông qua Playwright kiểm tra sự biến mất của trường bảo hành tĩnh và sự hiển thị chính xác của trường bảo hành động trên hồ sơ khách hàng.
- Lệnh chạy: `npx playwright test tests/e2e/role_verification.spec.ts`
