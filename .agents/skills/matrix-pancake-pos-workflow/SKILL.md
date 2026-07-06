---
name: matrix-pancake-pos-workflow
description: Quy trình tích hợp nghiệp vụ, tự động cập nhật logic và quét toàn bộ tính năng hệ thống Pancake POS & ERP Mini thông qua Vitest, Playwright E2E và Vite build.
---

# Quy trình kiểm tra & Tích hợp Nghiệp vụ Pancake POS Toàn diện (M.A.T.R.I.X Workflow)

Sử dụng skill này để tích hợp, nâng cấp, kiểm thử và quét tự động tất cả các tính năng nghiệp vụ của hệ thống ERP Mini & Pancake POS.

---

## 1. Bản đồ Tính năng Hệ thống (Feature Map)

Quy trình M.A.T.R.I.X yêu cầu quét và xác thực 6 nhóm tính năng cốt lõi sau:

### 📦 A. Sản phẩm cấu thành & Giá sỉ (Combo & Wholesale)
- **Định mức thành phần (BOM)**: Quản lý biến thể cấu thành Combo/Set, tồn kho khả dụng tính theo công thức: `Min(Tồn_kho_thành_phần / Số_lượng_định_mức)`.
- **Giá sỉ bậc thang (Wholesale Pricing)**: Áp dụng giá sỉ tự động theo số lượng mua, nhóm khách hàng, hoặc thẻ khách hàng.
- **Tập tin liên quan**: `src/lib/wholesaleControl.ts`, `src/pages/POS.tsx`, `src/components/orders/CreateOrderDialog.tsx`.

### 🏦 B. Đối soát ngân hàng tự động (Casso.vn Ingestion)
- **Regex trích xuất mã đơn**: Tự động nhận diện mã đơn `POS-ORD-XXXX` và `ORD-WS-XXXX` từ nội dung chuyển khoản.
- **Double-entry Accounting**: Tự động ghi nhận sổ cái (Nợ TK 112 / Có TK 131) khi nhận webhook chuyển khoản hợp lệ.
- **Tập tin liên quan**: `src/pages/Finance.tsx`, `supabase/functions/webhook-ingest/`.

### 🔐 C. Ma trận Phân quyền Động (Dynamic RBAC/ABAC Matrix)
- **Phân quyền vai trò**: Admin xem 100% tài nguyên; Manager bị chặn `/performance/setup`; Staff chỉ xem Dashboard, POS, Orders, Documents và bị chặn `/accounting`.
- **Ẩn trường nhạy cảm**: Ẩn giá vốn (Cost Price) trong Inventory và Reports đối với Staff.
- **Tập tin liên quan**: `src/components/settings/DynamicRbacTab.tsx`, `src/pages/HelpCenter.tsx`.

### 🤖 D. Trợ lý AI (MCP Server) & Attributions
- **Giao thức MCP**: Kết nối Claude vào shop qua API Key Pancake POS tại `/digital-assets` để truy vấn doanh thu, tồn kho.
- **Kênh phân bổ**: Lưu trữ và tính toán attribution của khách hàng qua Data Hub.
- **Tập tin liên quan**: `src/components/digital-assets/AiMcpTab.tsx`, `src/hooks/useAnalytics.ts`.

### 📊 E. Data Hub & Đồng bộ Đa kênh (Multi-channel Data Hub)
- **Raw Events & Identity Resolution**: Gom luồng dữ liệu từ POS, Web, sàn TMĐT, Webhook. Tự động gộp khách hàng trùng Số điện thoại hoặc Email.
- **CSV/Excel Import**: Tải lên danh sách đơn hàng kèm tính năng phân tích tự động cột và ánh xạ SKU.
- **Tập tin liên quan**: `src/lib/identityResolution.ts`, `src/components/orders/ImportOrdersDialog.tsx`, `src/pages/DataHub.tsx`.

### 📚 F. Trung tâm trợ giúp & Đọc tài liệu (Help Center Reader)
- **Help Center Modal**: Đọc tài liệu hướng dẫn (`st-f12`) trực quan bằng Glassmorphism Drawer có backdrop-blur.
- **Tập tin liên quan**: `src/pages/HelpCenter.tsx`, `src/data/helpArticles.ts`.

---

## 2. Quy trình Quét và Kiểm thử Toàn bộ Tính năng

Khi chạy nâng cấp hoặc quét hệ thống, thực hiện tuần tự các bước sau:

### Bước 0: Quét tài liệu 5 cấp độ và đối soát hình ảnh (Documentation Deep Crawl)
Trước khi nâng cấp phân hệ, chạy kịch bản quét tự động để thu thập cấu trúc sơ đồ liên kết hoặc trích xuất văn bản nghiệp vụ chi tiết:
1.  **Quét cấu trúc liên kết và danh sách ảnh (5 cấp độ)**:
    ```bash
    node .agents/scratch/crawler_5_levels.js https://docs.pancake.biz/fintab 5
    ```
    Kết quả được xuất ra tệp tin JSON `.agents/scratch/crawled_report.json`.
2.  **Quét sâu và trích xuất toàn bộ văn bản nội dung nghiệp vụ (Next.js RSC Decryption)**:
    Sử dụng script giải mã byte buffer RSC để dịch ngược luồng dữ liệu của docs.pancake.biz thành tài liệu markdown chi tiết:
    ```bash
    node .agents/skills/matrix-pancake-pos-workflow/scripts/crawler_deep_rsc.js https://docs.pancake.biz/pancakework/ .agents/scratch/pancakework_deep_report.md
    ```
    Thay thế `https://docs.pancake.biz/pancakework/` bằng phân hệ tương ứng cần đối soát (ví dụ: `/fintab/` hoặc `/crm/`).

### Bước 1: Kiểm tra Biên dịch và Kiểu (Typecheck & Lint)
Đảm bảo mã nguồn không bị lỗi kiểu và tuân thủ chuẩn code:
```bash
# Quét kiểu TypeScript
cmd /c npm run typecheck

# Quét lỗi cú pháp & cảnh báo code
cmd /c npm run lint
```

### Bước 2: Chạy bộ Unit & Integration Tests (Vitest)
Chạy tất cả 22 bộ kiểm thử nghiệp vụ để đảm bảo logic vận hành chính xác:
```bash
# Quét toàn bộ Unit Test
cmd /c npx vitest run
```
*Lưu ý: Các bài test quan trọng cần kiểm tra kỹ gồm:*
- `wholesaleAndComposite.test.ts` (Nghiệp vụ Combo & Giá sỉ)
- `productReviews.test.ts` (Nghiệp vụ đồng bộ sàn và phản hồi)
- `paymentSettings.test.ts` (Cấu hình thanh toán)
- `loyaltyAndReferral.test.ts` (Ví điểm và giới thiệu)

### Bước 3: Chạy bộ End-to-End Tests (Playwright)
Quét toàn bộ luồng tương tác của người dùng trên giao diện thực tế (cả màn hình Desktop và Mobile):
```bash
# Quét luồng Casso đối soát tự động
cmd /c npx playwright test tests/e2e/casso_test.spec.ts

# Quét phân quyền RBAC/ABAC trên Sidebar và URL Redirects
cmd /c npx playwright test tests/e2e/role_verification/

# Quét luồng nghiệp vụ Core ERP (Bán hàng, Mua hàng, Kho, Tài chính)
cmd /c npx playwright test tests/e2e/core_erp_flows.spec.ts

# Quét giao diện tương thích Mobile/Desktop
cmd /c npx playwright test tests/e2e/responsive_test.spec.ts
```

### Bước 4: Kiểm tra Audit Bảo mật & Phiên bản
Đảm bảo cấu hình bảo mật môi trường và phiên bản đồng nhất:
```bash
# Quét rò rỉ secret hoặc dịch vụ vai trò của Edge Functions
cmd /c node scripts/audit-edge-functions.mjs
```

### Bước 5: Build Production xác thực
Xác thực cuối cùng để đóng gói sản phẩm:
```bash
cmd /c npm run build
```
Đảm bảo toàn bộ asset chunks được tạo lập thành công trong thư mục `dist/`.

---

## 3. Nguyên tắc vận hành dòng chảy M.A.T.R.I.X (Flow Execution Principles)

1.  **Quét toàn diện & Báo cáo đầy đủ**: Mỗi khi người dùng yêu cầu quét, nâng cấp, kiểm tra bất cứ thành phần nào trong hệ thống, tác nhân (agent) bắt buộc phải thực hiện quét toàn diện mã nguồn, tìm kiếm tận gốc lỗi và viết báo cáo đầy đủ (Full Coverage Report) trong các tài liệu Artifact. Tuyệt đối không trả lời qua loa hoặc bỏ sót lỗi.
2.  **Sửa lỗi triệt để**: Không chỉ đề xuất cách sửa, tác nhân phải trực tiếp cập nhật các file code bị ảnh hưởng và chạy kiểm thử tự động để xác nhận lỗi đã được xử lý triệt để.
3.  **Bản dựng sạch (Green Builds Only)**: Sau mỗi lần thay đổi code, bắt buộc chạy lại `run_automation.js` để kiểm tra build và kiểm thử, đảm bảo nhánh `develop` luôn có trạng thái xanh (Clean Build/All Tests Green).
4.  **Bảo toàn dữ liệu & Cấu trúc**: Giữ nguyên vẹn comment và các tài liệu docstring không liên quan để tránh phá vỡ kiến trúc mã nguồn hiện tại.

