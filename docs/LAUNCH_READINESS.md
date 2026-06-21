# Launch Readiness

Project: Multi Sale Organizer
Profile: webapp
Online target: public web SaaS
Revenue model: subscription

## Mục đích

Chuẩn bị để dự án có thể chạy online một cách kiểm soát được. File này không tự deploy; nó giúp Codex và người phụ trách biết còn thiếu gì trước khi đưa sản phẩm ra môi trường thật.

## Điều kiện tối thiểu để online

| Nhóm | Cần có | Trạng thái |
| --- | --- | --- |
| Build | Lệnh build/test rõ ràng, không phụ thuộc máy cá nhân | Hoàn thành (`npm run test:local` check & build) |
| Runtime | Phiên bản Node/Python/runtime được ghi lại | Hoàn thành (Node.js 18+, Deno cho Edge Functions) |
| Environment | Danh sách biến môi trường và file `.env.example` | Hoàn thành (VITE_SUPABASE_*, OPENROUTER_*) |
| Hosting | Nơi deploy dự kiến, domain, SSL, vùng chạy | Hoàn thành (Static hosting cho SPA, Supabase Edge) |
| Data | Database/storage, migration, backup, restore | Hoàn thành (56 migrations trong `supabase/migrations`) |
| Security | Secret không commit, auth, permission, security headers | Hoàn thành (Bảo mật qua RLS & Secrets manager, audit thành công) |
| Monitoring | Error tracking, logs, uptime, alert cơ bản | Hoàn thành (Thông qua Supabase logs & màn hình Data Hub) |
| Rollback | Cách quay lại bản ổn định trước đó | Hoàn thành (Re-deploy bundle frontend, rollback migration) |

## Go/No-Go trước launch

- Tất cả test/build bắt buộc chạy được.
- `quality-gate` không còn lỗi chặn.
- UX/UI flow đã được kiểm tra nếu có frontend.
- Technology radar không còn quyết định stack đang ở trạng thái `assess` cho phần lõi.
- Có checklist backup/restore nếu dự án có dữ liệu người dùng.
- Có người phụ trách xác nhận bảo mật, dữ liệu, chi phí hosting và domain.

## Handoff cho Codex

- Tạo hoặc cập nhật `.env.example`, README chạy local, README deploy.
- Thêm lệnh build/test rõ ràng vào package/script tương ứng.
- Không thêm cloud provider cụ thể nếu người dùng chưa chọn.
- Nếu chọn provider, ghi lý do trong ADR và cập nhật `docs/TECH_RADAR.md`.
- Không ghi API key, secret, token hoặc thông tin thanh toán thật vào repo.
