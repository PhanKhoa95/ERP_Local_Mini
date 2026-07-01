# Original User Request

## Initial Request — 2026-06-30T13:00:24+07:00

Kiểm thử tính chính xác và logic tính toán của các phân hệ báo cáo (Doanh thu, Bán hàng, Sản phẩm, Tồn kho, Đối tác, Chiết tính & Dòng tiền) trong hệ thống ERP Local Mini để đảm bảo các công thức tổng hợp số liệu không bị sai lệch khi dữ liệu phình to.

Requirements:
- R1. Bộ kiểm thử logic Báo cáo Doanh thu & Bán hàng (Revenue & Sales Report Tests)
  - Kiểm tra tính chính xác của `totalRevenue` (tổng doanh thu), `totalCOGS` (tổng giá vốn), `grossProfit` (lợi nhuận gộp), và `profitMargin` (tỷ suất lợi nhuận).
  - Xác thực tính chính xác của việc gom nhóm doanh thu theo ngày (`dailyChart`) và gom nhóm theo kênh bán hàng (`channelChart`).
- R2. Bộ kiểm thử logic Báo cáo Sản phẩm & Kho hàng (Product & Inventory Report Tests)
  - Xác thực thống kê các sản phẩm bán chạy nhất (Top Products by Quantity/Revenue).
  - Kiểm tra cách tính giá trị tồn kho tổng quát (Inventory valuation, average unit cost).
- R3. Bộ kiểm thử Báo cáo Đối tác & Phân tích Đơn hàng (Partner & Order Report Tests)
  - Đảm bảo tính toán công nợ và tổng chi tiêu của đối tác khách hàng/nhà cung cấp khớp với các đơn hàng liên quan.
  - Xác thực phân loại trạng thái đơn hàng (pending, confirmed, processing, shipping, delivered, cancelled) và phương thức thanh toán.
- Verification Plan:
  - Thiết lập file kiểm thử Vitest tại `src/hooks/__tests__/useReportStats.test.ts` giả lập dữ liệu local storage và chạy kiểm thử.
  - Chạy lệnh kiểm tra: `npx vitest run src/hooks/__tests__/useReportStats.test.ts`.
- Acceptance Criteria:
  - [ ] Thiết lập test suite `useReportStats.test.ts` đầy đủ các nhóm test case cho doanh thu, sản phẩm, tồn kho và đối tác.
  - [ ] Tất cả các test cases chạy độc lập thành công 100% (Pass).
  - [ ] Đảm bảo mock `localStorage` hoạt động ổn định và dọn dẹp sạch sau mỗi test case.
