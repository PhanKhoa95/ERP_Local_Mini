## 2026-07-05T14:30:51Z

Hoàn thiện, tối ưu hóa và tích hợp toàn diện quy trình nghiệp vụ Pancake POS (M.A.T.R.I.X Workflow) cùng với hệ thống tự động hóa quản lý dự án (Auto Project Manager) cho ERP Mini để triển khai production thực tế và đánh giá chất lượng toàn diện.

Working directory: e:\ERP_Local_Mini
Integrity mode: development

## Requirements

### R1. Kiểm thử và Tối ưu hóa Toàn cục (Local Verification Baseline)
Đảm bảo mã nguồn đạt trạng thái sạch và ổn định tối đa trên môi trường cục bộ bao gồm:
- Toàn bộ các kiểm thử đơn vị và tích hợp (Vitest) phải vượt qua 100%.
- Toàn bộ các kiểm thử đầu-cuối (Playwright E2E) bao gồm Casso, RBAC, Core ERP Flows và Responsive phải chạy thành công trên cả Desktop và Mobile.
- Sửa triệt để các lỗi biên dịch TypeScript (Typecheck) và các lỗi cú pháp nghiêm trọng (Lint).
- Đóng gói (Build) production chạy thành công không có lỗi.

### R2. Kiểm tra và Đồng bộ Supabase Remote Database
Đảm bảo cơ sở dữ liệu Supabase được đồng bộ chính xác với remote:
- Kết nối và kiểm tra danh sách migration với remote project `raomfcglvrhtfvkuyyou`.
- Đẩy toàn bộ các migration cục bộ đang bị thiếu/chưa áp dụng lên cơ sở dữ liệu remote bằng Supabase CLI.
- Tạo hoặc đồng bộ các kiểu dữ liệu của Supabase (`src/integrations/supabase/types.ts`) để khớp chính xác với cấu trúc cơ sở dữ liệu trên cloud.

### R3. Tự động hóa Quy trình Quản lý Dự án (Autopilot Workflow)
Tự động hóa hoàn toàn luồng quản lý và phát triển bằng Git:
- Đảm bảo thực hiện trên nhánh `develop`.
- Chạy toàn bộ các bước kiểm tra thông qua công cụ tự động hóa `node .agents/skills/auto-project-manager/scripts/run_automation.js --all`.
- Xuất báo cáo chi tiết trạng thái kiểm thử tại tệp `.agents/auto_report.md`.
- Thực hiện commit các thay đổi hợp lệ với thông điệp git rõ ràng, chuẩn hóa.

### R4. Audit An toàn Bảo mật Edge Functions
Đảm bảo không rò rỉ thông tin nhạy cảm hoặc cấu hình sai quyền vai trò:
- Chạy script kiểm tra bảo mật Edge Functions `node scripts/audit-edge-functions.mjs`.
- Báo cáo kết quả kiểm tra được cập nhật tại `docs/EDGE_FUNCTIONS_AUDIT.md`.

## Acceptance Criteria

### Tính chính xác của Nghiệp vụ & Kỹ thuật
- [ ] Lệnh `npm run typecheck` chạy thành công không có lỗi kiểu TypeScript.
- [ ] Lệnh `npm run lint` chạy thành công mà không phát sinh thêm bất kỳ lỗi (errors) mới nào.
- [ ] Tất cả 22 bộ kiểm thử Vitest (chạy qua `npx vitest run`) phải đạt trạng thái PASS 100%.
- [ ] Tất cả các kịch bản kiểm thử E2E Playwright (chạy qua `npx playwright test`) phải đạt trạng thái PASS 100%.
- [ ] Quá trình đóng gói sản phẩm (`npm run build`) hoàn thành và xuất bản dựng sạch vào thư mục `dist/`.

### Đồng bộ Database
- [ ] Lệnh `npx supabase migration list` báo cáo không còn migration nào ở trạng thái pending đối với dự án remote.
- [ ] Tệp `src/integrations/supabase/types.ts` được cập nhật và khớp hoàn toàn với cấu trúc cơ sở dữ liệu thực tế trên remote.

### Tự động hóa & Báo cáo
- [ ] Tạo thành công báo cáo kiểm thử tự động tại tệp `.agents/auto_report.md` sau khi chạy script `run_automation.js`.
- [ ] Tệp `docs/EDGE_FUNCTIONS_AUDIT.md` được cập nhật thành công với kết quả audit bảo mật từ script `audit-edge-functions.mjs`.
- [ ] Tất cả các thay đổi được commit thành công trên nhánh `develop` của Git.
