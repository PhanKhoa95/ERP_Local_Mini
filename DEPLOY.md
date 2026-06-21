# Hướng dẫn Triển khai và Cài đặt (Deployment Guide)

Tài liệu này cung cấp hướng dẫn chi tiết từng bước để cài đặt, cấu hình và triển khai hệ thống **Multi Sale Organizer** từ môi trường phát triển cục bộ (Local Development) cho đến môi trường sản xuất (Production Cloud).

---

## 🚀 Phần 1: Khởi chạy nhanh ở Local (Offline / Demo Mode)

Hệ thống hỗ trợ cơ chế **Local Demo Auth** chạy ngoại tuyến hoàn toàn qua dữ liệu giả lập lưu trong `localStorage`. Bạn không cần phải cấu hình cơ sở dữ liệu Supabase để chạy thử nghiệm các tính năng cốt lõi (POS, Kho hàng, Kế toán, Đơn hàng, KPI).

### Phương án 1: Sử dụng Docker Compose (Khuyên dùng - Không cần cài Node.js)
Yêu cầu duy nhất là máy của bạn đã cài đặt **Docker** và **Docker Compose**.

1. Mở Terminal/Cmd tại thư mục dự án.
2. Chạy lệnh:
   ```bash
   docker compose up -d --build
   ```
3. Truy cập ứng dụng tại địa chỉ:
   ```txt
   http://localhost:8017/
   ```
4. Đăng nhập bằng tài khoản Demo mặc định:
   * **Username:** `admin`
   * **Password:** `admin`

### Phương án 2: Sử dụng Script Helper khởi chạy nhanh (1-Click Startup)
Yêu cầu máy tính đã cài đặt **Node.js (v18+)** và **npm**.

* **Trên Windows:** Click đúp chuột vào file `run.bat` hoặc chạy từ cmd:
  ```cmd
  run.bat
  ```
* **Trên macOS / Linux:** Mở terminal, phân quyền và chạy file `run.sh`:
  ```bash
  chmod +x run.sh
  ./run.sh
  ```

*Tiện ích này tự động kiểm tra môi trường, khởi tạo file `.env` nếu thiếu, tự động cài thư viện bằng `npm ci` và chạy dev server trên cổng `8017`.*

---

## ☁️ Phần 2: Triển khai Cơ sở dữ liệu Supabase (Production Cloud)

Để vận hành hệ thống thực tế với cơ chế lưu trữ tập trung và tài khoản người dùng thực, bạn cần kết nối hệ thống với dự án Supabase Cloud.

### Bước 1: Khởi tạo Project trên Supabase
1. Truy cập [Supabase Dashboard](https://supabase.com/) và tạo một Project mới.
2. Ghi lại các thông tin:
   * **Project Ref ID** (Ví dụ: `abcde12345`)
   * **Database Password**
   * **Project URL** (Ví dụ: `https://abcde12345.supabase.co`)
   * **Anon Public Key**

### Bước 2: Liên kết và Đẩy Database schema lên Cloud
Hệ thống sử dụng cơ chế **Database Migration** với 59 tệp tin cấu trúc SQL. Bạn **không nên** copy-paste thủ công mà hãy dùng **Supabase CLI** để tự động chạy migrations.

1. Cài đặt Supabase CLI trên máy cục bộ:
   ```bash
   npm install -g supabase
   ```
2. Đăng nhập vào tài khoản Supabase:
   ```bash
   supabase login
   ```
3. Di chuyển vào thư mục dự án chứa thư mục con `supabase` và thực hiện liên kết dự án:
   ```bash
   supabase link --project-ref <YOUR_PROJECT_REF_ID>
   ```
   *Nhập mật khẩu Database của bạn khi được yêu cầu.*
4. Đồng bộ hóa cấu trúc database lên Cloud (Đẩy toàn bộ 59 file migration lên dự án):
   ```bash
   supabase db push
   ```
   *Lệnh này sẽ tạo toàn bộ bảng, trigger, views, RLS (Row Level Security) và schema kế toán một cách chính xác.*

### Bước 3: Triển khai AI Edge Functions
Nếu bạn sử dụng các chức năng AI (Anomaly Detection, Replenishment AI, Chatbot), hãy deploy các Supabase Edge Functions:
1. Deploy các function có trong thư mục `supabase/functions`:
   ```bash
   supabase functions deploy <function-name> --project-ref <YOUR_PROJECT_REF_ID>
   ```
2. Thiết lập cấu hình API Keys AI (OpenRouter hoặc Lovable fallback) làm bí mật của dự án Supabase:
   ```bash
   supabase secrets set OPENROUTER_API_KEY=<your-openrouter-key>
   supabase secrets set OPENROUTER_MODEL=google/gemini-2.5-flash
   ```

---

## 🌐 Phần 3: Cấu hình biến môi trường & Deploy Frontend

### 1. Cấu hình file `.env` cho Frontend
Sau khi deploy database, tạo hoặc cập nhật file `.env` của frontend:
```env
VITE_SUPABASE_URL=https://<YOUR_PROJECT_REF_ID>.supabase.co
VITE_SUPABASE_ANON_KEY=<YOUR_SUPABASE_ANON_KEY>

# Cấu hình AI ở client (nếu không chạy qua Edge Functions)
OPENROUTER_API_KEY=
OPENROUTER_MODEL=google/gemini-2.5-flash
```

### 2. Triển khai Frontend lên Cloud
Ứng dụng frontend được xây dựng bằng Vite, xuất ra các file tĩnh HTML/JS/CSS. Bạn có thể deploy lên bất kỳ nền tảng tĩnh nào:

* **Phương án 1: Deploy lên Vercel**
  1. Kết nối kho lưu trữ Git của bạn với Vercel.
  2. Cấu hình build command: `npm run build`.
  3. Cấu hình output directory: `dist`.
  4. Thêm các biến môi trường `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`.
* **Phương án 2: Deploy lên Netlify**
  * Tương tự Vercel, trỏ thư mục phân phối về `dist` và cấu hình build command `npm run build`.
* **Phương án 3: Chạy trên Nginx Docker riêng biệt**
  * Sử dụng Dockerfile đi kèm trong dự án, build và push image lên registry cá nhân rồi deploy lên server của bạn.

---

## 🛠️ Khắc phục sự cố thường gặp (Troubleshooting)

1. **Lỗi RLS / Không đọc ghi được dữ liệu ở Local Demo:**
   * Hãy đảm bảo bạn đã tích chọn tùy chọn "Demo Mode" trên trang Đăng nhập hoặc đặt vai trò Admin để truy cập toàn bộ menu.
   * Xóa bộ nhớ cache localStorage của trình duyệt nếu dữ liệu mẫu bị xung đột: chạy `localStorage.clear()` từ DevTools console.

2. **Lỗi "Email not confirmed" khi đăng nhập online:**
   * Đây là cấu hình mặc định của Supabase Auth. Bạn cần tắt tùy chọn "Confirm email" trong phần **Auth Settings** trên trang Supabase Dashboard, hoặc thực hiện bấm xác nhận qua email test được gửi từ Supabase.

3. **Lỗi Edge Functions về AI trả về mã 500:**
   * Đảm bảo bạn đã set secret `OPENROUTER_API_KEY` trong Supabase CLI. Kiểm tra logs của Edge Function trên Supabase Dashboard để biết chi tiết lỗi API.
