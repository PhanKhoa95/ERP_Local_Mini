# Release Checklist

Project: Multi Sale Organizer
Profile: webapp
Goal: Đảm bảo quy trình phát hành phiên bản mới diễn ra an toàn, có hệ thống và giảm thiểu rủi ro gián đoạn dịch vụ.

---

## 1. Pre-Release Verification (Kiểm tra trước phát hành)

Trước khi bắt đầu quy trình build và release, cần đảm bảo chất lượng code và tính đồng nhất thông tin:

- [ ] **Typecheck**: Không có lỗi TypeScript (`npm run typecheck` thành công).
- [ ] **Linter**: Không có lỗi ESLint (`npm run lint` thành công).
- [ ] **Unit Tests**: Tất cả test case phải vượt qua (`npm run test` thành công, đạt 159/159 pass).
- [ ] **Local Build**: Build cục bộ thành công không có lỗi bundle (`npm run build` thành công).

---

## 2. Version Alignment (Đồng bộ phiên bản)

Đảm bảo phiên bản phát hành khớp nhau trên toàn bộ hệ thống:

- [ ] **VERSION**: Cập nhật tệp `VERSION` chứa đúng chuỗi phiên bản dạng SemVer (ví dụ: `0.1.0`).
- [ ] **package.json**: Trường `version` phải khớp chính xác với `VERSION`.
- [ ] **package-lock.json**: Phiên bản root package (`lockJson.version` và `lockJson.packages[""].version`) phải khớp chính xác với `VERSION`.
- [ ] **CHANGELOG.md**: Thêm tiêu đề cho phiên bản mới (ví dụ: `## [0.1.0] - YYYY-MM-DD`) và ghi nhận đầy đủ các mục `Added`, `Changed`, `Fixed`, `Security`.
- [ ] **Chạy Validation**: Thực thi script xác minh phiên bản:
  ```sh
  node scripts/validate-versioning.mjs
  ```
  Kết quả phải hiển thị: `version check passed: multi-sale-organizer@<version>`.

---

## 3. Database Migration Checklist (Kiểm tra di trú Database)

Đồng bộ schema dữ liệu cục bộ với cơ sở dữ liệu remote Supabase:

- [ ] **Tạo Migration mới**: Nếu có thay đổi database cục bộ, tạo file SQL có timestamp trong `supabase/migrations`.
- [ ] **Xác nhận Schema Types**: Cập nhật định nghĩa TypeScript của Supabase:
  ```sh
  src/integrations/supabase/types.ts
  ```
- [ ] **Kiểm tra trạng thái di trú remote**: Chạy script schema check để xác định các thay đổi chưa được áp dụng:
  ```sh
  node scratch/verify-supabase.js
  ```
- [ ] **Áp dụng Migrations**: Thực thi đẩy migrations lên remote:
  ```sh
  npx supabase link --project-ref raomfcglvrhtfvkuyyou
  npx supabase db push
  ```
- [ ] **Verify Remote Schema**: Chạy lại script check để chắc chắn phản hồi PostgREST trả về mã `200` thành công cho các thực thể mới.

---

## 4. Edge Functions Deployment (Triển khai Serverless Functions)

- [ ] **Biến môi trường / Secrets**: Xác nhận các secrets quan trọng đã được cấu hình đầy đủ trên remote:
  ```sh
  npx supabase secrets list
  ```
  Đảm bảo có: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `OPENROUTER_BASE_URL` (nếu dùng AI).
- [ ] **Deploy Edge Functions**:
  ```sh
  npx supabase functions deploy sync-platform-orders
  npx supabase functions deploy webhook-ingest
  ```

---

## 5. Deployment & Post-Release Smoke Test

- [ ] **Deploy Frontend Static Files**: Tải thư mục `dist` lên dịch vụ hosting (Vercel, Netlify, Cloudflare Pages, v.v.).
- [ ] **Smoke Test Public Routes**:
  - Truy cập `/tracking` để kiểm tra trang tra cứu đơn hàng công khai.
  - Truy cập `/order-tracking` để kiểm tra luồng tìm kiếm theo số điện thoại và ID đơn hàng.
- [ ] **Smoke Test Authenticated Routes**:
  - Đăng nhập vào trang quản trị (POS, Orders, Inventory).
  - Thử tải lên một tệp Excel đơn hàng để xác minh SKU/Identity Resolution.
- [ ] **Kiểm tra Data Hub**: Vào `/data-hub`, xác nhận Dashboard hiển thị bình thường, số lượng failed-event cập nhật chính xác và có thể thực hiện retry.

---

## 6. Rollback Plan (Phương án khôi phục)

Nếu gặp sự cố nghiêm trọng sau khi phát hành:

- [ ] **Frontend**: Quay lại bản build Git commit ổn định trước đó trên hosting provider.
- [ ] **Database**: Vì migrations của Supabase là forward-only, nếu cần rollback schema, cần chạy script migration sửa đổi hoặc khôi phục dữ liệu từ bản backup tự động gần nhất qua Supabase Dashboard.
