# Commercial Readiness

Project: Multi Sale Organizer
Online target: public web SaaS
Revenue model: subscription

## Mục đích

Chuẩn bị để sản phẩm có thể bán, thu phí, hỗ trợ người dùng và vận hành có trách nhiệm. File này là checklist sản phẩm, không phải tư vấn pháp lý hoặc tài chính.

## Checklist thương mại

| Nhóm | Chi tiết quyết định thương mại | Trạng thái |
| --- | --- | --- |
| **Khách hàng** | - **Đối tượng**: Doanh nghiệp bán lẻ đa kênh vừa & nhỏ (SMEs) tại Đông Nam Á.<br>- **Nỗi đau**: Mất kiểm soát tồn kho, lệch kho giữa Shopee/TikTok/Lazada/POS, trễ xử lý đơn hàng.<br>- **Giá trị**: Đồng bộ tồn kho thời gian thực tự động, xử lý đơn tập trung, giảm 90% lỗi sai sót. | Hoàn thành |
| **Gói giá** | - **Starter**: 14 ngày dùng thử miễn phí. Sau đó 350.000đ/tháng (1 kênh sync, tối đa 500 đơn/tháng).<br>- **Growth**: 850.000đ/tháng (3 kênh sync, tối đa 2.000 đơn/tháng, báo cáo tài chính/Gamification).<br>- **Enterprise**: Từ 2.000.000đ/tháng (Không giới hạn sync, độ trễ sync cực thấp, hỗ trợ riêng, API riêng). | Hoàn thành |
| **Thanh toán** | - **Cổng tích hợp**: PayOS (quét mã QR VietQR tự động) và Stripe (thanh toán quốc tế).<br>- **Chính sách**: Gia hạn tự động hàng tháng/hàng năm. Hoàn trả 100% trong 7 ngày đầu nếu gặp lỗi hệ thống. | Hoàn thành |
| **Điều khoản** | - **ToS & Privacy**: Quy định rõ quyền sở hữu dữ liệu đơn hàng thuộc về merchant. Mã hóa AES-256 đối với thông tin nhạy cảm của khách hàng.<br>- **Data policy**: Tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân tại Việt Nam. | Hoàn thành |
| **Onboarding** | - **Quy trình 4 bước**: 1. Tạo tài khoản & Kích hoạt email -> 2. Kết nối kênh bán đầu tiên (API/Webhook) -> 3. Import danh mục hàng hóa qua Excel -> 4. Cấu hình quy tắc đồng bộ và kho bãi. | Hoàn thành |
| **Admin** | - **Trang quản trị**: Quản lý gói đăng ký của merchant, kích hoạt/tạm khóa tài khoản, tra cứu log thanh toán qua cổng PayOS/Stripe, cấu hình khuyến mãi. | Hoàn thành |
| **Support** | - **Kênh**: Livechat trong ứng dụng, Zalo OA doanh nghiệp, email support@multisale.vn.<br>- **SLA**: Lỗi nghiêm trọng (đồng bộ lỗi hàng loạt) phản hồi < 2 giờ; thắc mắc thông thường < 12 giờ. | Hoàn thành |
| **Analytics** | - **Đo lường**: MRR, Churn Rate, LTV, tỷ lệ sync thành công của connector, số sự kiện Data Hub bị lỗi để liên tục tối ưu hóa hệ thống. | Hoàn thành |

## Product Readiness Added

- Public storefront, public order tracking and help center are present for customer-facing use.
- Data Hub now includes connector health and retry controls so operators can recover failed sync events without manual database edits.
- Settings already covers roles, members, audit logs, backup, AI, shipping, vouchers and channel setup, which are core SaaS administration surfaces.

## Điều cần người phụ trách kiểm tra

- Giá bán và mô hình thu phí có phù hợp thị trường không.
- Điều khoản sử dụng, quyền riêng tư và yêu cầu pháp lý theo nơi bán.
- Quy trình hoàn tiền, hỗ trợ, khóa/mở tài khoản.
- Dữ liệu người dùng nào được lưu và ai có quyền xem.

## Handoff cho Codex

- Tạo cấu trúc màn hình pricing/onboarding/admin nếu dự án cần thương mại hóa.
- Tạo placeholder config cho payment provider, không dùng key thật.
- Tạo event tracking plan nếu người dùng yêu cầu analytics.
- Ghi rõ phần nào cần người phụ trách kinh doanh/pháp lý xác nhận.
