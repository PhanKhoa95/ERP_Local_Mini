## Kế hoạch cải thiện hiệu năng & ổn định khi chuyển trang

### Chẩn đoán (đã rà code thực tế)

| # | Nguyên nhân lag/giật | Vị trí | Ảnh hưởng |
|---|----------------------|--------|-----------|
| 1 | `MainLayout` được render **lại bên trong từng page** → Sidebar/ERPChatbot **unmount + remount** mỗi lần đổi route | `src/components/layout/MainLayout.tsx` được wrap thủ công ở 30+ page | Mỗi click sidebar = build lại toàn bộ sidebar + chatbot + auth context query |
| 2 | `useDashboardStats` SELECT **toàn bộ** orders/products/partners không giới hạn, không aggregate phía DB | `src/hooks/useDashboardStats.ts` | Khi data lớn → fetch hàng MB; tính toán trên client gây jank |
| 3 | Realtime subscription `event: "*"` trên `orders` và `products` invalidate dashboard **mỗi mutation bất kỳ** | `useDashboardStats.ts` | Một POS click = re-fetch lại toàn bộ dashboard ngay cả khi không xem |
| 4 | `ERPChatbot` + `SalesChatWidget` luôn **mount kèm Supabase/AI client** dù chưa mở | `MainLayout.tsx`, `Dashboard.tsx` | Tăng JS init, giữ listener không cần |
| 5 | Tất cả page khai báo `lazy()` nhưng **import recharts/framer-motion** ngay tại Dashboard → bundle ban đầu vẫn nặng (recharts ~4.6 MB raw) | `src/components/dashboard/*Chart.tsx` | TTI chậm, route đầu tiên load lâu |
| 6 | `QueryClient` chỉ set `staleTime: 30s`, không có `gcTime`/retry/network mode → mọi điều hướng → query refetch | `src/App.tsx` | "Chớp trắng" mỗi lần đổi tab |
| 7 | `AuthContext.fetchCompany` gọi lại mỗi lần `onAuthStateChange` fire (kể cả TOKEN_REFRESHED) | `src/contexts/AuthContext.tsx` | Giật khi token tự refresh |
| 8 | Không có `manualChunks` trong `vite.config.ts` → vendor 1 chunk khổng lồ | `vite.config.ts` | First load chậm, parsing JS chặn UI |
| 9 | `useEffect(...setInterval)` trong `VoiceReportRecorder` không clear khi nhanh chóng chuyển page (đã clear, nhưng có nhiều hook giữ `setInterval` ẩn — cần audit) | nhiều hook | Memory leak nhỏ → tích lũy |
| 10 | 77 hook query phần lớn dùng `useQuery` mặc định, không truyền `select`/`staleTime` → mỗi page mở lại fetch toàn bộ | `src/hooks/*.ts` | Lag rõ khi vào trang nặng (Inventory 594 dòng, POS 738, Warehouses 748) |

### Phạm vi sửa (chỉ frontend + 1 RPC tổng hợp dashboard)

```text
┌───────────────────────────────────────────────────────────┐
│ A. Layout shell ổn định (1 lần mount)                    │
│    App.tsx → BrowserRouter → AuthProvider → AppShell      │
│       AppShell = Sidebar + ERPChatbot + <Outlet/>         │
│    Page không wrap MainLayout nữa                         │
├───────────────────────────────────────────────────────────┤
│ B. QueryClient tuning                                     │
│    staleTime 60s, gcTime 5 min, refetchOnReconnect off,   │
│    retry 1, networkMode "offlineFirst"                    │
├───────────────────────────────────────────────────────────┤
│ C. Dashboard nhẹ                                          │
│    - RPC SQL get_dashboard_stats(p_company_id) aggregate  │
│      ở DB (SUM/COUNT) → trả 1 JSON nhỏ                    │
│    - Bỏ subscribe "*"; chỉ invalidate khi user vào tab    │
│      dashboard (refetchOnMount)                           │
├───────────────────────────────────────────────────────────┤
│ D. Lazy chatbot & widget                                  │
│    ERPChatbot/SalesChatWidget chỉ render khi user click   │
│    nút mở (dynamic import + Suspense)                     │
├───────────────────────────────────────────────────────────┤
│ E. Code-split recharts                                    │
│    Mỗi component chart bọc trong React.lazy + suspense    │
│    skeleton; thêm manualChunks { recharts, radix, vendor }│
├───────────────────────────────────────────────────────────┤
│ F. AuthContext gọn                                        │
│    Chỉ fetch company khi user.id THỰC SỰ đổi (so sánh     │
│    với previous ref) – bỏ qua TOKEN_REFRESHED             │
└───────────────────────────────────────────────────────────┘
```

### Chi tiết kỹ thuật

- **`src/App.tsx`**: tách `AppShell` mới chứa `<MainLayout>` cố định + `<Outlet/>`; chuyển từng route con sang dạng nested route (`<Route element={<AppShell/>}>`).
- **`src/routes.tsx`**: dùng nested route, mỗi page bỏ `<MainLayout>` ở đầu (chỉ render nội dung). Giữ lazy import.
- **`src/components/layout/MainLayout.tsx`**: nhận `<Outlet/>` thay vì children, không re-mount khi đổi route.
- **`src/contexts/AuthContext.tsx`**: lưu `lastUserIdRef`, chỉ gọi `fetchCompany` khi `session?.user?.id !== lastUserIdRef.current`.
- **`src/App.tsx` QueryClient**: thêm `gcTime: 300_000`, `staleTime: 60_000`, `retry: 1`, `refetchOnReconnect: false`.
- **Migration mới**: tạo function `public.get_dashboard_stats(p_company_id uuid)` `SECURITY DEFINER`, trả JSONB `{total_revenue, total_orders, total_products, total_customers, low_stock_count, revenue_by_channel}`. RLS qua kiểm tra `is_company_member(auth.uid(), p_company_id)`.
- **`src/hooks/useDashboardStats.ts`**: gọi RPC; bỏ subscribe `"*"`, thay bằng invalidate sau mutation (đã có `queryInvalidation.ts`). Giữ subscription chỉ trên dashboard route bằng `useEffect` mount/unmount của page.
- **`src/components/ai/ERPChatbot.tsx`** & **`SalesChatWidget.tsx`**: export `ERPChatbotLauncher` (chỉ render nút FAB nhỏ); khi click thì `React.lazy(() => import("./ERPChatbotPanel"))`.
- **`src/components/dashboard/RevenueChart.tsx`, `ChannelPieChart.tsx`, `CashFlowForecast.tsx`** và các chart nặng: chuyển thành `lazy()` + Suspense skeleton.
- **`vite.config.ts`**: thêm 
  ```ts
  build: { rollupOptions: { output: { manualChunks: {
    recharts: ["recharts"],
    radix: [/* gom @radix-ui/* */],
    react: ["react","react-dom","react-router-dom"],
    supabase: ["@supabase/supabase-js"],
  } } } }
  ```
- **Audit `setInterval`**: rà nhanh các hook nếu phát hiện thêm leak sẽ vá tại chỗ.

### Kết quả kỳ vọng

- Click sidebar: không còn flash trắng, sidebar đứng yên (vì không remount).
- Dashboard mở < 300 ms sau lần đầu (1 RPC nhỏ thay vì 4 SELECT lớn).
- Bundle initial giảm ~30–40% nhờ tách recharts/radix.
- Auth không re-fetch company khi token refresh ngầm.

### Files dự kiến chạm

| File | Thay đổi |
|------|----------|
| `src/App.tsx` | QueryClient options, AppShell wrapper |
| `src/routes.tsx` | Nested route, bỏ MainLayout per-page |
| `src/components/layout/MainLayout.tsx` | Dùng Outlet, lazy chatbot |
| `src/components/ai/ERPChatbot.tsx` | Tách Launcher + Panel (lazy) |
| `src/components/sales/SalesChatWidget.tsx` | Tách Launcher + Panel (lazy) |
| `src/contexts/AuthContext.tsx` | Bỏ refetch khi TOKEN_REFRESHED |
| `src/hooks/useDashboardStats.ts` | Dùng RPC, bỏ subscribe "*" |
| `src/components/dashboard/RevenueChart.tsx`, `ChannelPieChart.tsx`, `CashFlowForecast.tsx` | Lazy import |
| `src/pages/Dashboard.tsx` | Bỏ MainLayout wrap, lazy charts |
| 25+ `src/pages/*.tsx` | Bỏ `<MainLayout>` ở đầu (cơ học) |
| `vite.config.ts` | `manualChunks` |
| `supabase/migrations/*` | Function `get_dashboard_stats` |

Không động vào logic nghiệp vụ, không đổi schema bảng, không phá vỡ tính năng public storefront.
