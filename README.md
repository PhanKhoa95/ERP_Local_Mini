# Multi Sale Organizer

Local Vite + React + Supabase test build.

## Local setup

Để khởi chạy ứng dụng nhanh nhất trên máy cá nhân, bạn có thể lựa chọn một trong các phương án sau:

### Cách 1: Sử dụng Docker Compose (Không cần Node.js)
```sh
docker compose up -d --build
```
Ứng dụng sẽ hoạt động tại địa chỉ: `http://localhost:8017/` ở chế độ Local Demo Auth.

### Cách 2: Sử dụng Script Helper khởi chạy nhanh (1-Click)
* **Windows:** Chạy file `run.bat`
* **macOS / Linux:** Chạy script `run.sh` (cần `chmod +x run.sh` trước)

*Mặc định các helper script sẽ tự kiểm tra Node, cài đặt thư viện phụ thuộc và khởi chạy dev server trên cổng `8017`.*

### Cách 3: Chạy thủ công bằng npm
1. Cài đặt các thư viện:
```sh
npm ci
```
2. Tạo tệp `.env` từ mẫu `.env.example` và nhập thông tin kết nối Supabase (nếu dùng chế độ online).
3. Chạy dev server:
```sh
npm run dev
```

---

## ☁️ Cloud Deployment

Để triển khai hệ thống chi tiết lên môi trường Cloud (bao gồm cả cơ sở dữ liệu Supabase thông qua CLI Migration, Edge Functions AI, và Hosting Frontend), vui lòng tham khảo cẩm nang hướng dẫn tại:
👉 **[Hướng dẫn triển khai chi tiết (DEPLOY.md)](file:///c:/Users/KHOA%20MEDIA/OneDrive/Documents/multi-sale-organizer-main/multi-sale-organizer-main/DEPLOY.md)**


## Test Account

For the local Vite dev server, you can use the demo shortcut:

```txt
username: admin
password: admin
```

This is a local-only demo session for UI testing and is only enabled in `npm run dev`.

The real authentication flow uses Supabase Auth from the project configured in `.env`.

For local testing:

1. Open `/auth`.
2. Register with a real email address.
3. Open the confirmation email from Supabase.
4. Return to the app and sign in with the same email and password.

If sign-in shows `Email not confirmed`, the account exists but the email confirmation step has not been completed yet.

## Local Verification

Run the full local verification:

```sh
npm run test:local
```

This runs TypeScript checking, ESLint, Vitest, and a production build.

## AI Provider

AI Edge Functions now prefer OpenRouter when `OPENROUTER_API_KEY` is configured. If OpenRouter is not configured, the existing Lovable AI fallback remains available through `LOVABLE_API_KEY`.

For production Edge Functions, set secrets in Supabase:

```sh
npx supabase secrets set OPENROUTER_API_KEY=<your-openrouter-key>
npx supabase secrets set OPENROUTER_MODEL=google/gemini-2.5-flash
```

## Project Documentation

- [Local testing guide](docs/LOCAL_TESTING.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Structure standard](docs/STRUCTURE_STANDARD.md)
- [Module map](docs/MODULE_MAP.md)
- [Data Hub and BigData foundation](docs/DATA_HUB.md)
- [Supabase operations](docs/SUPABASE_OPERATIONS.md)
- [Roadmap](docs/ROADMAP.md)
- [MATRIX future standard](MATRIX_FUTURE.md)
- [Codex handoff](MATRIX_HANDOFF.md)

## Stack

- React
- TypeScript
- Vite
- shadcn/ui
- Tailwind CSS
- Supabase
