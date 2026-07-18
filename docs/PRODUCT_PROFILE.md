# Hồ sơ sản phẩm ERP Local Mini

ERP Local Mini là ứng dụng quản trị bán hàng đa kênh chạy trên React, TypeScript, Vite và Supabase. Hệ thống hỗ trợ vận hành cục bộ bằng tài khoản demo; khi kết nối môi trường thật, xác thực và dữ liệu được xử lý qua Supabase.

## Người dùng chính

- Chủ doanh nghiệp và quản trị viên cần theo dõi doanh thu, tồn kho, tài chính, nhân sự và cấu hình hệ thống.
- Quản lý cần điều phối đơn hàng, kho, đối tác, hiệu suất và báo cáo.
- Nhân viên cần thao tác POS, đơn hàng, tài liệu và các luồng được phân quyền.
- Khách hàng cần đặt hàng công khai và tra cứu trạng thái giao hàng.

## Năng lực cốt lõi

- POS, đơn hàng, khuyến mãi, thành viên và bán hàng đa kênh.
- Kho, biến thể sản phẩm, BOM, sản xuất và giá bán sỉ.
- Đối tác, CRM, chăm sóc khách hàng và bảo hành.
- Tài chính, kế toán, đối soát giao dịch và báo cáo.
- RBAC/ABAC, audit log, Data Hub và các tích hợp Supabase Edge Functions.

## Chế độ vận hành

- `local`: dữ liệu demo và lối tắt đăng nhập chỉ dùng cho phát triển/kiểm thử.
- `connected`: dùng dự án Supabase được cấu hình qua biến môi trường.
- `production`: yêu cầu xác thực thật, migrations đã đồng bộ, secrets được đặt tại nhà cung cấp và các cổng chất lượng đều đạt.

## Cổng chất lượng

Trước khi bàn giao, chạy `npm run test:local`, Playwright E2E, kiểm tra data contract, release/version và audit Supabase Edge Functions. Không xem môi trường online là sẵn sàng nếu chưa xác minh migration, RLS, secrets và payload tích hợp thật.
