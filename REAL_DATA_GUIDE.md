# Hướng dẫn Chuẩn hóa Hệ thống chạy Dữ liệu thật (Supabase Real Data Mode)

Hệ thống ERP Mini đã được tích hợp đầy đủ hai chế độ hoạt động:
1.  **Chế độ Demo (Local Demo Mode)**: Chạy giả lập toàn bộ trên LocalStorage của trình duyệt bằng tài khoản đăng nhập nhanh `admin` / `admin`.
2.  **Chế độ Dữ liệu thật (Real Supabase Data Mode)**: Kết nối và đọc/ghi dữ liệu thời gian thực thông qua Supabase Database, Supabase Auth và các Edge Functions.

Dưới đây là các bước chi tiết để chuẩn hóa và kích hoạt chế độ Dữ liệu thật 100%.

---

## 1. Thiết lập biến môi trường (Environment Variables)

Hãy kiểm tra file cấu hình `.env` ở thư mục gốc của dự án. File này phải chứa thông số của project Supabase thực tế mà bạn muốn trỏ tới:

```env
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-supabase-anon-key"
```

*   **VITE_SUPABASE_PROJECT_ID**: ID của project Supabase.
*   **VITE_SUPABASE_URL**: Địa chỉ API URL của project Supabase của bạn (lấy tại `Settings > API > Project URL`).
*   **VITE_SUPABASE_PUBLISHABLE_KEY**: Khóa public nặc danh (lấy tại `Settings > API > Project API keys > anon public`).

---

## 2. Thiết lập cấu trúc cơ sở dữ liệu (SQL Migrations)

Các file SQL migration chứa toàn bộ định nghĩa bảng, quan hệ khóa ngoại, triggers, chức năng và chính sách bảo mật cấp dòng (Row Level Security - RLS) nằm tại thư mục [supabase/migrations/](file:///y:/ERP_Local_Mini/supabase/migrations).

### Cách 1: Sử dụng Supabase CLI (Khuyến nghị)
Nếu máy bạn đã cài đặt Supabase CLI, hãy mở terminal tại thư mục gốc và chạy lệnh sau để tự động đẩy toàn bộ migration lên database thật:
```bash
supabase db push
```

### Cách 2: Chạy trực tiếp qua SQL Editor trên Dashboard
Nếu không dùng CLI:
1.  Mở Dashboard Supabase của bạn tại `https://supabase.com`.
2.  Truy cập mục **SQL Editor**.
3.  Copy và Paste nội dung của các file SQL trong thư mục [supabase/migrations/](file:///y:/ERP_Local_Mini/supabase/migrations) theo thứ tự thời gian (hoặc tạo một truy vấn SQL lớn gộp lại) rồi nhấn **Run**.

---

## 3. Cơ chế tự động khởi tạo dữ liệu doanh nghiệp (Trigger auto-setup)

Hệ thống đã tích hợp một trigger tự động cực kỳ thông minh ở tầng PostgreSQL.
Khi một người dùng mới đăng ký tài khoản thực trên website:
1.  Supabase Auth tạo user mới trong bảng `auth.users`.
2.  Trigger `on_auth_user_created_auto_setup` (định nghĩa trong file [20260106005556_6f705912-f38e-4cf8-a581-ae53dc9b3b09.sql](file:///y:/ERP_Local_Mini/supabase/migrations/20260106005556_6f705912-f38e-4cf8-a581-ae53dc9b3b09.sql)) sẽ tự động:
    *   Tạo mới doanh nghiệp (`public.companies`) với tên mặc định dựa theo email.
    *   Gán người dùng này làm `admin` của doanh nghiệp mới (`public.company_members`).
    *   Tạo mới một **Kho chính** mặc định (`public.warehouses`).
    *   Tạo mới một **Kênh bán lẻ** mặc định (`public.sales_channels`).

Nhờ cơ chế này, người dùng đăng ký mới hoàn toàn không bị lỗi trống dữ liệu công ty và có thể ngay lập tức tạo sản phẩm, bán lẻ, v.v.

---

## 4. Deploy các Edge Functions (AI & Webhooks)

ERP Mini sử dụng 38 Edge Functions để phục vụ các tác vụ AI (cashflow forecast, risk detection, v.v.) và đồng bộ hóa đơn hàng sàn TMĐT (`sync-platform-orders`, `integration-sync`).

Để triển khai các Edge Functions này lên Supabase của bạn:
1.  Cài đặt Supabase CLI và đăng nhập (`supabase login`).
2.  Liên kết CLI với project của bạn:
    ```bash
    supabase link --project-ref your-project-id
    ```
3.  Deploy toàn bộ Edge Functions bằng lệnh:
    ```bash
    supabase functions deploy
    ```
4.  Cấu hình các API key cần thiết cho các function (ví dụ OpenRouter API Key cho AI hoặc App Secret cho webhook của Lazada/Shopee/TikTok Shop) bằng cách set Secret trong Supabase Dashboard hoặc qua CLI:
    ```bash
    supabase secrets set OPENROUTER_API_KEY=sk-or-v1-...
    ```

---

## 5. Bật/Tắt chế độ Demo từ giao diện Web

*   **Để chạy data thật**: Chỉ cần bấm **Đăng xuất** (Sign Out) ở góc dưới Sidebar nếu bạn đang dùng tài khoản `admin` demo. Sau đó, ở màn hình đăng nhập, hãy chuyển qua tab **Đăng ký** để tạo tài khoản mới bằng email thật của bạn.
*   Khi bạn đăng nhập bằng tài khoản email thực, ứng dụng sẽ phát hiện cờ demo tắt (`isLocalDemoAuthEnabled` là `false`) và tự động tương tác với database Supabase thật thông qua API endpoint của bạn.
