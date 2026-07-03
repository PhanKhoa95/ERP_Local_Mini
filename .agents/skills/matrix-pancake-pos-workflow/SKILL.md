---
name: matrix-pancake-pos-workflow
description: Quy trình tích hợp, tự động cập nhật logic nghiệp vụ Pancake POS, viết unit test qua Vitest và chạy Vite build xác thực toàn dự án.
---

# Quy trình tích hợp nghiệp vụ Pancake POS (M.A.T.R.I.X Workflow)

Sử dụng skill này khi cần tích hợp hoặc nâng cấp các tính năng quản lý sản phẩm cấu thành (Combo/Set), giá bán sỉ bậc thang, kiểm thử tự động và build xác thực dự án theo chuẩn Pancake POS.

## Workflow Chi tiết

### Bước 1: M.A.T.R.I.X Workflow (Chuẩn bị & Đồng bộ)
1. **Database Schema**: Tạo file migration trong thư mục `supabase/migrations/` định nghĩa cấu trúc bảng:
   * `product_variant_components` (Sản phẩm cấu thành).
   * `product_wholesale_prices` (Giá bán sỉ bậc thang).
   * `wholesale_settings` (Các luật cấu hình sỉ và cờ chống chồng khuyến mãi).
   * Thêm các cột metadata cần thiết (`variant_id`, `tags`).
2. **Database Trigger**: Viết hoặc cập nhật trigger trừ/hoàn kho động ở mức database (ví dụ: `deduct_inventory_on_order_confirm`).
3. **TypeScript Types**: Chạy script đồng bộ types database vào `src/integrations/supabase/types.ts`.
4. **UI Cấu hình**: Phát triển/Tích hợp giao diện quản lý định mức thành phần và bậc giá sỉ trong dialog sản phẩm (`ProductDialog`, `ProductVariantsDialog`) và cài đặt hệ thống.

### Bước 2: Autopilot Processor (Cập nhật Logic Bán hàng & Trừ kho)
1. **Helper Logic ([wholesaleControl.ts](file:///y:/ERP_Local_Mini/src/lib/wholesaleControl.ts))**:
   * Tính toán tồn kho khả dụng Combo động: `Min(child_variant_stock / component_quantity)`.
   * Tự động áp dụng giá bán sỉ theo 5 loại điều kiện khi giỏ hàng/khách hàng/thẻ thay đổi, hỗ trợ fallback từ biến thể về sản phẩm chính.
2. **POS Integration ([POS.tsx](file:///y:/ERP_Local_Mini/src/pages/POS.tsx))**:
   * Tích hợp dialog chọn biến thể (`POSVariantSelectDialog`) trước khi thêm vào giỏ.
   * Áp dụng giá sỉ lập tức trong `useEffect`, tự động xử lý xoá voucher nếu `no_other_discounts` bật.
   * Lưu `variant_id` và `tags` vào payload checkout.
3. **Order Manager Integration ([CreateOrderDialog.tsx](file:///y:/ERP_Local_Mini/src/components/orders/CreateOrderDialog.tsx))**:
   * Tích hợp tương tự POS khi nhân viên thêm/sửa dòng sản phẩm và tạo đơn hàng.

### Bước 3: Vitest Unit Testing (Kiểm thử Tự động)
1. Tạo file unit test tại thư mục `src/lib/__tests__/` (ví dụ: `wholesaleAndComposite.test.ts`).
2. Viết các test case kiểm tra:
   * Thuật toán tính tồn kho set/combo.
   * Logic tự động áp giá sỉ theo các điều kiện sỉ và fallback.
3. Chạy test kiểm chứng:
   ```bash
   npx vitest run src/lib/__tests__/wholesaleAndComposite.test.ts
   ```

### Bước 4: Vite Build Verification (Xác thực Biên dịch)
1. Chạy build kiểm tra lỗi biên dịch TypeScript, JSX/TSX trên toàn hệ thống trước khi bàn giao:
   ```bash
   npm run build
   ```
2. Đảm bảo toàn bộ asset chunks được sinh ra thành công không có bất kỳ cảnh báo nghiêm trọng nào.
