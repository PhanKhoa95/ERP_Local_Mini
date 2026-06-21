# Operations Runbook

Project: Multi Sale Organizer
Profile: webapp

## Mục đích

Ghi cách vận hành sau khi sản phẩm chạy online để Codex không chỉ viết code xong rồi bỏ trống phần vận hành.

## Quy trình vận hành tối thiểu

| Tình huống | Cần làm | Người phụ trách |
| --- | --- | --- |
| Deploy bản mới | Chạy test/build, deploy, kiểm tra health | DevOps Engineer / Tech Lead |
| Lỗi production | Xem log, xác định phạm vi, rollback nếu cần | On-call Developer / SRE |
| Mất dữ liệu | Dừng ghi, kiểm tra backup, khôi phục có kiểm soát | Database Administrator (DBA) / SRE |
| Tăng chi phí | Kiểm tra usage, quota, plan, tối ưu tài nguyên | Project Manager / Lead Architect |
| Người dùng cần hỗ trợ | Kiểm tra account, log liên quan, phản hồi theo SLA | Customer Support Tier 2 / Support Lead |
| Lỗi đồng bộ kênh bán | Vào `/data-hub`, xem tab kết nối, retry event lỗi hoặc tạm dừng connector | Integration Engineer / On-call Developer |

## Tín hiệu cần theo dõi

- Uptime hoặc health check.
- Error rate.
- Latency chính.
- Chi phí hosting/API/database.
- Dung lượng database/storage.
- Tỷ lệ đăng ký, thanh toán, hủy gói nếu có thương mại.

## Handoff cho Codex

- Thêm health endpoint hoặc health page nếu phù hợp.
- Thêm logging tối thiểu cho lỗi quan trọng.
- Tài liệu hóa cách chạy test/build/deploy.
- Không tự động xóa dữ liệu production nếu chưa có xác nhận rõ.
