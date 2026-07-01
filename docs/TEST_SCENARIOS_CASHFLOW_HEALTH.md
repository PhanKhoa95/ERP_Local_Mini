# Đặc Tả Kịch Bản Kiểm Thử Dòng Tiền & Sức Khỏe Hệ Thống (ERP_Local_Mini)

Tài liệu này cung cấp các kịch bản kiểm thử (Test Scenarios) chi tiết để xác minh hoạt động và độ ổn định của hai phân hệ cốt lõi: **Dòng tiền & Đối soát tài chính** và **Giám sát Sức khỏe & Tính toàn vẹn của hệ thống**.

---

## PHẦN I: KỊCH BẢN KIỂM THỬ DÒNG TIỀN & ĐỐI SOÁT TÀI CHÍNH

Phân hệ tài chính quản lý hoạt động dòng tiền, tích hợp cổng đối soát ngân hàng tự động (Casso API) và đưa ra dự báo dòng tiền dựa trên AI.

### Kịch bản 1: Đối soát tự động ngân hàng qua Casso API (VietQR)
- **Mục tiêu:** Xác minh hệ thống nhận diện đúng giao dịch ngân hàng chuyển khoản, tự động trích xuất mã đơn hàng và khớp trạng thái đơn.
- **Mã nguồn liên quan:** [CassoReconciliation.tsx](file:///y:/ERP_Local_Mini/src/components/finance/CassoReconciliation.tsx)
- **Các bước thực hiện:**
  1. Truy cập **Cài đặt hệ thống** -> chọn tab **Casso Integration**.
  2. Kiểm tra API Key mặc định (`casso_api_live_***89f2`). Nhập API Key hợp lệ nếu cần thay thế.
  3. Quan sát danh sách giao dịch hiện tại (ví dụ: giao dịch `FT26128038102` đã được khớp tự động với đơn hàng `DH9812`).
  4. Nhấp nút **Đồng bộ giao dịch**.
- **Kết quả kỳ vọng:**
  - Hệ thống hiển thị hiệu ứng xoay đồng bộ (syncing state).
  - Sau 1.5 giây, một thông báo Toast thành công hiển thị: *"Đã đồng bộ thành công với cổng Casso! Phát hiện 1 giao dịch mới đã được đối soát tự động."*
  - Một dòng giao dịch mới xuất hiện ở đầu bảng với trạng thái `matched` (Đã khớp), hiển thị đúng mã đơn hàng được trích xuất từ nội dung chuyển khoản (ví dụ: `DH7731`).

### Kịch bản 2: Dự báo dòng tiền thông minh bằng AI
- **Mục tiêu:** Kiểm tra chức năng dự báo doanh thu và dòng tiền trong 30 ngày tiếp theo bằng mô hình học máy (AI/Edge Function hoặc local fallback).
- **Mã nguồn liên quan:** [CashFlowForecast.tsx](file:///y:/ERP_Local_Mini/src/components/dashboard/CashFlowForecast.tsx) và [localAIService.ts](file:///y:/ERP_Local_Mini/src/lib/localAIService.ts)
- **Các bước thực hiện:**
  1. Truy cập **Dashboard chính** -> tìm đến widget **Dự báo dòng tiền AI (30 ngày)**.
  2. Bấm nút **Chạy dự báo AI**.
  3. Chọn các tham số đầu vào (ví dụ: Hệ số biến động thị trường, Kế hoạch chi tiêu).
- **Kết quả kỳ vọng:**
  - Biểu đồ dự báo trực quan hóa 2 đường: Đường thực tế (Actual Cash) và Đường dự báo (Forecasted Cash) trong 30 ngày tiếp theo.
  - Hiển thị nhận xét từ trợ lý AI về rủi ro dòng tiền (ví dụ: *"Dòng tiền có nguy cơ âm vào tuần thứ 3 do lịch thanh toán nhà cung cấp tập trung"*).
  - Tự động chuyển đổi mượt mà sang dịch vụ AI cục bộ (Local Fallback) nếu kết nối Supabase Edge Function bị gián đoạn.

### Kịch bản 3: Hạch toán thu chi và kiểm tra công nợ đối tác
- **Mục tiêu:** Xác minh các phiếu thu/chi thực tế làm thay đổi số dư quỹ và công nợ nhà cung cấp / khách hàng một cách chính xác.
- **Mã nguồn liên quan:** [Finance.tsx](file:///y:/ERP_Local_Mini/src/pages/Finance.tsx)
- **Các bước thực hiện:**
  1. Truy cập trang **Tài chính - Kế toán**.
  2. Tạo mới 1 Phiếu chi thanh toán công nợ nhà cung cấp trị giá `5.000.000 VND`.
  3. Kiểm tra số dư quỹ tiền mặt/tiền gửi và kiểm tra số dư công nợ của nhà cung cấp đó.
- **Kết quả kỳ vọng:**
  - Số dư quỹ giảm đi đúng `5.000.000 VND`.
  - Công nợ phải trả của nhà cung cấp tương ứng giảm đi `5.000.000 VND`.
  - Một dòng lịch sử giao dịch kế toán được ghi nhận tự động vào Sổ nhật ký chung.

---

## PHẦN II: MA TRẬN KIỂM TRA ĐỐI TƯỢNG DÒNG TIỀN (KHÔNG BỎ SÓT)

Để đảm bảo dòng tiền được đối chiếu chính xác, kịch bản kiểm thử bắt buộc phải đi qua 100% các đối tượng thụ hưởng và chi trả trong hệ thống:

| Đối tượng dòng tiền | Loại giao dịch | Phân hệ tương tác | Điểm kiểm tra bắt buộc (Checkpoint) |
| :--- | :--- | :--- | :--- |
| **1. Khách hàng (Customers)** | Thu (Inflow) | Đơn hàng bán lẻ, POS, Đối soát Casso | - Số tiền thu khớp với tổng thanh toán thực tế của hóa đơn.<br>- Tự động khấu trừ công nợ khách hàng (nếu mua nợ).<br>- Ghi nhận đúng mã khuyến mãi/voucher giảm trừ dòng tiền. |
| **2. Nhà cung cấp (Suppliers / Partners)** | Chi (Outflow) | Nhập kho, Mua nguyên vật liệu (BOM) | - Phiếu chi làm giảm công nợ phải trả nhà cung cấp tương ứng.<br>- Giá trị nguyên vật liệu nhập kho khớp với giá trị hạch toán dòng chi.<br>- Ghi nhận thuế GTGT đầu vào nếu có hóa đơn VAT. |
| **3. Nhân sự (Employees / Members)** | Chi (Outflow) | Bảng lương, Tạm ứng, Hoa hồng | - Khớp tiền lương thực lĩnh của từng nhân viên qua danh sách thành viên.<br>- Kiểm tra số dư tài khoản tạm ứng nhân viên giảm khi hoàn ứng.<br>- Tự động tính tỷ lệ hoa hồng doanh số bán hàng vào dòng chi lương. |
| **4. Kênh bán hàng (Sales Channels)** | Thu/Chi | Shopee, Lazada, TikTok Shop, POS | - Thu nhập dòng tiền thực nhận sau khi khấu trừ phí sàn (Commission Fee).<br>- Phí vận chuyển do người mua trả vs phí sàn thu hộ.<br>- Đối soát dòng tiền ví điện tử của từng kênh (Momo, VNPay). |
| **5. Dự án / Chiến dịch (Projects)** | Chi (Outflow) | Quản lý dự án, Marketing | - Dòng chi phí (quảng cáo, nguyên liệu thử) được phân bổ đúng mã dự án.<br>- Tổng chi tiêu thực tế không vượt quá hạn mức ngân sách dự án (Budget Gate).<br>- Tính ROI dự án tự động (Doanh thu dự án mang lại / Chi phí dòng tiền). |
| **6. Đơn vị vận chuyển (Carriers)** | Chi (Outflow) | Giao hàng nhanh (GHN), GHTK | - Đối soát COD (thu hộ) từ đơn vị vận chuyển đổ về tài khoản.<br>- Chi phí vận chuyển thực tế phải trả đơn vị vận chuyển định kỳ.<br>- Xử lý chênh lệch phí giao hàng thực tế vs phí tạm tính trên đơn. |
| **7. Quỹ nội bộ (Internal Funds)** | Thu/Chi | Tiền mặt (Cash), Ngân hàng (Bank) | - Chuyển tiền nội bộ giữa Quỹ tiền mặt và Tài khoản ngân hàng.<br>- Số dư các tài khoản quỹ phải khớp 100% với số dư hiển thị tại Dashboard.<br>- Cảnh báo số dư tối thiểu của các tài khoản ngân hàng hoạt động. |

---

## PHẦN III: KỊCH BẢN KIỂM THỬ SỨC KHỎE HỆ THỐNG & ĐỘ AN TOÀN VẬN HÀNH

Phân hệ giám sát kỹ thuật cho phép quản trị viên theo dõi tải hệ thống, kiểm tra tính toàn vẹn của dữ liệu và quản lý sao lưu.

### Kịch bản 4: Giả lập lỗi API của bên thứ ba và khả năng tự phục hồi
- **Mục tiêu:** Đảm bảo hệ thống ERP vẫn hoạt động ổn định (Graceful Degradation) khi các API tích hợp (Shopee, Lazada, Giao Hàng Nhanh...) bị sập.
- **Mã nguồn liên quan:** [SystemHealthTab.tsx](file:///y:/ERP_Local_Mini/src/components/settings/SystemHealthTab.tsx)
- **Các bước thực hiện:**
  1. Truy cập **Cấu hình** -> **Sức khỏe hệ thống** -> chọn tab **Trạng thái API bên thứ 3**.
  2. Gạt Switch tắt API Shopee hoặc API giao hàng (GHN/GHTK) để chuyển trạng thái sang `down` (Mất kết nối).
  3. Quay lại trang tạo đơn hàng hoặc trang đồng bộ đa kênh và thực hiện thao tác.
- **Kết quả kỳ vọng:**
  - Trên giao diện giám sát sức khỏe, biểu tượng API tương ứng chuyển sang màu đỏ kèm cảnh báo `Mất kết nối (Down)`.
  - Khi thực hiện đồng bộ, hệ thống không bị crash màn hình trắng mà hiển thị thông báo lỗi thân thiện: *"Không thể kết nối đến máy chủ Shopee lúc này. Dữ liệu sẽ được lưu tạm và đồng bộ lại khi kết nối phục hồi."*
  - Gạt bật lại API -> Trạng thái chuyển sang `up` (Bình thường), các thao tác đồng bộ hoạt động trở lại bình thường.

### Kịch bản 5: Chạy công cụ Đánh giá tính toàn vẹn dữ liệu (System Data Audit)
- **Mục tiêu:** Phát hiện các lỗi sai lệch dữ liệu giữa các bảng (ví dụ: lệch giá trị BOM sản phẩm, đơn hàng chưa hạch toán sổ cái...).
- **Mã nguồn liên quan:** [SystemHealthTab.tsx](file:///y:/ERP_Local_Mini/src/components/settings/SystemHealthTab.tsx) và [systemDataAudit.ts](file:///y:/ERP_Local_Mini/src/lib/systemDataAudit.ts)
- **Các bước thực hiện:**
  1. Truy cập tab **Sức khỏe hệ thống** -> mục **Data Integrity Audits**.
  2. Bấm nút **Khởi chạy Kiểm toán Dữ liệu (Run Audit)**.
- **Kết quả kỳ vọng:**
  - Vòng tròn xoay tiến độ chạy kiểm toán hiển thị.
  - Trả về báo cáo chi tiết gồm các đầu mục:
    - *Số dư sổ cái kế toán khớp với tổng thu chi thực tế.*
    - *Định mức nguyên vật liệu (BOM) khớp với giá vốn sản phẩm.*
    - *Trạng thái tồn kho thực so với lượng đặt hàng tồn đọng.*
  - Nếu phát hiện lỗi lệch giá vốn (BOM cost mismatch), hệ thống cung cấp nút **Khắc phục nhanh (Auto-Fix)** để tự động chạy đồng bộ giá vốn nguyên vật liệu vào giá thành sản phẩm (`syncBomCostToProducts`).

### Kịch bản 6: Nhật ký kiểm toán (Audit Logs) & Sao lưu, Khôi phục (Backup)
- **Mục tiêu:** Xác minh mọi hành động nhạy cảm đều được ghi log kiểm vết và dữ liệu có thể được backup/restore an toàn.
- **Mã nguồn liên quan:** [AuditLogsTab.tsx](file:///y:/ERP_Local_Mini/src/components/settings/AuditLogsTab.tsx) và [BackupTab.tsx](file:///y:/ERP_Local_Mini/src/components/settings/BackupTab.tsx)
- **Các bước thực hiện:**
  1. Thực hiện một hành động nhạy cảm như xóa một đơn hàng nháp hoặc cập nhật cài đặt Casso API Key.
  2. Vào **Cấu hình** -> chọn tab **Audit Logs** để kiểm tra lịch sử.
  3. Chọn tab **Backup & Restore**, bấm **Tạo bản sao lưu mới (Backup Now)**.
  4. Sau đó thử bấm **Khôi phục bản sao lưu (Restore)** từ danh sách.
- **Kết quả kỳ vọng:**
  - Tab **Audit Logs** ghi nhận chính xác: *Thời gian, Tên tài khoản thực hiện, Hành động, Thiết bị/IP và Dữ liệu trước/sau khi thay đổi*.
  - Quá trình **Backup** hoàn thành, xuất hiện một bản ghi sao lưu định dạng `.json` chứa toàn bộ snapshot dữ liệu trong `localStorage` hoặc Database của shop.
  - Khi thực hiện **Restore**, hệ thống yêu cầu xác nhận mật khẩu/mã xác thực, sau đó tải dữ liệu thành công và reload lại trang mà không làm mất tính toàn vẹn của phiên làm việc.
