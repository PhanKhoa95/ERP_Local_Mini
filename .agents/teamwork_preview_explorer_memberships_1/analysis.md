# Báo cáo Phân tích & Đề xuất Giải pháp: Thẻ thành viên & Ví (Memberships & Wallet Balance)

Báo cáo này phân tích hiện trạng mã nguồn của phân hệ **Thẻ thành viên & Ví** (Memberships & Wallet Balance) trong dự án `ERP_Local_Mini` và đề xuất chiến lược triển khai chi tiết cho các yêu cầu nâng cấp được ghi nhận vào ngày 2026-07-01.

---

## 1. Hiện trạng Hệ thống & Điểm nghẽn (Current State & Bottlenecks)

Qua khảo sát mã nguồn hiện tại, chúng tôi ghi nhận cấu trúc và các điểm nghẽn kỹ thuật sau:

### 1.1. Phân hệ Thẻ thành viên (`useMemberships.ts` & `Memberships.tsx`)
- **Giới hạn 1 thẻ/đối tác:** 
  - Trong `useMemberships.ts` (dòng 175-177), mutation `createMembership` chặn trùng đối tác:
    ```typescript
    if (all.some(m => m.partner_id === newM.partner_id)) {
      throw new Error("Khách hàng này đã được liên kết với một thẻ thành viên khác");
    }
    ```
  - Trong `Memberships.tsx` (dòng 87-89), biến `availableCustomers` lọc bỏ các đối tác đã sở hữu thẻ:
    ```typescript
    const availableCustomers = useMemo(() => {
      return customers.filter(c => !memberships.some(m => m.partner_id === c.id));
    }, [customers, memberships]);
    ```
- **Chưa có hỗ trợ Supabase (Online Mode) cho Thẻ:**
  - `useMemberships.ts` hiện đang hoạt động 100% bằng dữ liệu giả lập trong `localStorage` thông qua các key `erp-mini-local-demo-memberships` và `erp-mini-local-demo-membership-transactions`. Không hề có kết nối trực tiếp đến bảng database của Supabase.
- **Chưa có thuộc tính hình ảnh thẻ (`card_image`):**
  - Interface `Membership` chưa định nghĩa trường `card_image`.
  - Giao diện chưa có nút tải ảnh lên và hiển thị ảnh thực tế mà chỉ dùng CSS Gradient giả lập theo hạng thẻ.

### 1.2. Hồ sơ đối tác (`PartnerDetailDialog.tsx`)
- Giao diện chi tiết đối tác đang hiển thị một thẻ VIP mô phỏng dựa vào thuộc tính `partner.promo_segment` (VIP Member/Khách Sỉ/Khách Lẻ) thay vì lấy dữ liệu thẻ thực tế từ `useMemberships.ts`.

### 1.3. Cấu hình kế toán & Hạch toán tự động (`useAccounting.ts` & `erpEventBus.ts`)
- **Tài khoản đối ứng bị gán cứng:**
  - Khi nạp/hoàn tiền ví trong `useMemberships.ts` (mutation `performTransaction`, dòng 308-322), tài khoản Nợ/Có đang bị cố định là `"acc-1111"` (Tiền mặt) và `"acc-3387"` (Nhận trước của KH).
  - Khi thanh toán đơn hàng bằng ví trong `erpEventBus.ts` (dòng 284-289), tài khoản đối ứng ví cũng bị gán cứng là `"acc-3387"`:
    ```typescript
    const isMembershipWallet = order.payment_method === "membership_wallet";
    const salesDrAccId = isMembershipWallet ? "acc-3387" : "acc-131";
    ```
- **Online Mode chưa có hạch toán tự động:**
  - Bút toán kế toán tự động cho đơn hàng chỉ hoạt động trong chế độ Local Demo thông qua đăng ký Event Bus (`erpEventBus.ts`, dòng 269). Đối với chế độ Online, việc tạo đơn hàng (`useOrders.ts`) chưa đi kèm cơ chế tự động ghi nhận bút toán vào bảng `journal_entries` và `journal_lines` trong Supabase.

---

## 2. Thiết lập Schema Database (Supabase Migration)

Để hỗ trợ chế độ Online, cần thiết lập các bảng `memberships` và `membership_transactions` trong database thật. Dưới đây là mã SQL đề xuất:

```sql
-- 1. Tạo bảng memberships
CREATE TABLE public.memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
    card_number TEXT NOT NULL,
    tier TEXT NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'diamond')),
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    points INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'locked', 'expired')),
    card_image TEXT, -- Lưu Base64 (Local) hoặc Public URL của Supabase Storage (Online)
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    CONSTRAINT memberships_card_number_company_unique UNIQUE (company_id, card_number)
);

-- 2. Tạo bảng membership_transactions
CREATE TABLE public.membership_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_id UUID NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'payment', 'refund', 'adjust')),
    amount NUMERIC(15, 2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 3. Kích hoạt RLS (Row Level Security)
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_transactions ENABLE ROW LEVEL SECURITY;

-- 4. Định nghĩa chính sách RLS theo Tenant (Company-scoped)
CREATE POLICY "Members can view own company memberships" ON public.memberships
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.company_members cm 
            WHERE cm.company_id = memberships.company_id AND cm.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins/managers can manage memberships" ON public.memberships
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.company_members cm 
            WHERE cm.company_id = memberships.company_id AND cm.user_id = auth.uid() AND cm.role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Members can view transactions" ON public.membership_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.memberships m
            JOIN public.company_members cm ON cm.company_id = m.company_id
            WHERE m.id = membership_transactions.membership_id AND cm.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins/managers can manage transactions" ON public.membership_transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.memberships m
            JOIN public.company_members cm ON cm.company_id = m.company_id
            WHERE m.id = membership_transactions.membership_id AND cm.user_id = auth.uid() AND cm.role IN ('admin', 'manager')
        )
    );
```

---

## 3. Chiến lược Triển khai Chi tiết (Implementation Strategy)

### 3.1. R1: Quản lý nhiều thẻ và Upload hình ảnh thẻ
- **Mã nguồn liên quan:** `src/hooks/useMemberships.ts`, `src/pages/Memberships.tsx`, `src/components/partners/PartnerDetailDialog.tsx`.
- **Giải pháp:**
  1. **Cho phép nhiều thẻ:**
    - Trong `useMemberships.ts` -> Mutation `createMembership`: Xóa bỏ đoạn code ném lỗi khi `partner_id` đã có thẻ. Chỉ giữ lại kiểm tra duy nhất của `card_number`.
    - Trong `Memberships.tsx` -> Đổi `availableCustomers` thành danh sách toàn bộ khách hàng để có thể phát hành thêm thẻ mới cho bất kỳ ai.
    - Trong `POS.tsx` -> Đổi cơ chế tự động tìm thẻ duy nhất. Nếu đối tác được chọn có nhiều thẻ thành viên, hiển thị một nút chọn thẻ (Select Card Dropdown) bên cạnh nút thanh toán để thu ngân lựa chọn thẻ thanh toán phù hợp.
  2. **Tải lên hình ảnh thẻ:**
    - Mở rộng interface `Membership` thêm trường `card_image?: string`.
    - Trong form phát hành thẻ (`Memberships.tsx`), thêm trường tải lên file (`<input type="file" accept="image/*" />`).
    - **Local Demo:** Chuyển đổi file ảnh thành chuỗi Base64 bằng `FileReader.readAsDataURL` và lưu trực tiếp vào trường `card_image`.
    - **Online Mode:** Upload file lên Supabase Storage bucket tên `membership-cards` và lưu Public URL của file vào trường `card_image`.
    - **Thiết kế Glassmorphism nâng cao:** Trên giao diện hiển thị thẻ, nếu thẻ có thuộc tính `card_image`, sử dụng hình ảnh đó làm hình nền của thẻ với hiệu ứng làm mờ và phủ tối (`backdrop-blur bg-black/40`) để đảm bảo các chữ hiển thị rõ ràng.
  3. **Hiển thị danh sách thẻ đối tác:**
    - Trong `PartnerDetailDialog.tsx`, import `useMemberships` để lấy toàn bộ danh sách thẻ.
    - Lọc thẻ theo đối tác: `const partnerCards = memberships.filter(m => m.partner_id === partner.id)`.
    - Hiển thị danh sách này dưới dạng danh sách các thẻ Glassmorphic dạng lưới hoặc thanh trượt thay thế cho thẻ tĩnh giả lập như hiện tại.

### 3.2. R2: Cấu hình động tài khoản đối ứng cho Ví
- **Mã nguồn liên quan:** `src/pages/Settings.tsx`, `src/hooks/useShopSettings.ts`.
- **Giải pháp:**
  1. **Nâng cấp `useShopSettings.ts` hỗ trợ Local Demo:**
    - Sửa `useShopSettings.ts` để khi `isLocalDemoAuthEnabled()` trả về `true`, hệ thống sẽ đọc/ghi cấu hình từ `localStorage` thay vì gọi đến bảng `shop_settings` của Supabase.
  2. **Giao diện cấu hình:**
    - Tạo component `MembershipSettingsTab.tsx` trong thư mục `src/components/settings/`.
    - Dùng hook `useAccounting` để lấy danh mục tài khoản (`accounts`). Lọc ra các tài khoản thuộc nhóm Nợ phải trả / Phải thu / Doanh thu chưa thực hiện (ví dụ: `3387`, `131`, `3388`,...) để hiển thị trong ô chọn (Select).
    - Lưu cấu hình dưới khóa `"wallet_accounting_config"` có định dạng: `{ offset_account_id: string }`.
  3. **Tích hợp vào trang Cài đặt:**
    - Trong `src/pages/Settings.tsx`, thêm một Tab trigger `"membership"` và hiển thị component `MembershipSettingsTab` khi tab này được chọn.

### 3.3. R3 + R4: Tự động hạch toán dòng tiền Ví (Cả Local Demo & Online)
- **Mã nguồn liên quan:** `src/hooks/useMemberships.ts`, `src/lib/erpEventBus.ts`, `src/hooks/useOrders.ts`.
- **Giải pháp:**
  1. **Nạp/Hoàn tiền ví (Deposit/Refund):**
    - Đọc cấu hình tài khoản đối ứng từ shop settings:
      - **Local Demo:** Đọc từ `localStorage` key `"wallet_accounting_config"`, nếu chưa cấu hình thì mặc định dùng `"acc-3387"`.
      - **Online Mode:** Đọc từ `shop_settings` bảng Supabase, nếu chưa có thì lấy tài khoản có mã `"3387"` từ danh mục tài khoản.
    - Thực hiện ghi nhận bút toán kế toán:
      - Nợ (Dr): Tài khoản Tiền mặt (`1111`) hoặc Ngân hàng (`1121`) được thủ quỹ chọn khi nạp tiền.
      - Có (Cr): Tài khoản đối ứng đã cấu hình (ví dụ: `3387`).
      - (Bút toán đảo ngược đối với giao dịch hoàn tiền).
    - **Local Demo:** Ghi trực tiếp vào `LOCAL_ENTRIES_KEY` và `LOCAL_LINES_KEY`.
    - **Online Mode:** Thực hiện insert đồng thời vào bảng `journal_entries` và `journal_lines` trong Supabase qua transaction/RPC.
  2. **Thanh toán đơn hàng bằng ví (POS payment):**
    - **Local Demo:** Cập nhật hàm lắng nghe sự kiện `ORDER_CREATED` trong `erpEventBus.ts`. Đọc cấu hình đối ứng ví và thay thế tài khoản gán cứng `"acc-3387"` bằng tài khoản cấu hình động đó để ghi nhận bút toán:
      - Nợ (Dr): Tài khoản đối ứng ví đã cấu hình (e.g. `3387`).
      - Có (Cr): Tài khoản Doanh thu bán hàng (`acc-511`).
    - **Online Mode:** Trong mutation `createOrder` của `useOrders.ts`, khi đơn hàng có `payment_method === 'membership_wallet'`, thực hiện chèn bút toán tương ứng (Dr Tài khoản đối ứng ví / Cr Tài khoản doanh thu `511`) vào bảng kế toán của Supabase.

### 3.4. R5: Audit Logs
- **Mã nguồn liên quan:** `src/hooks/useAuditLogs.ts`, `src/hooks/useMemberships.ts`, `src/components/settings/MembershipSettingsTab.tsx`.
- **Giải pháp:**
  - Tận dụng hàm `logAction` của hook `useAuditLogs` để ghi nhận các nhật ký thao tác:
    1. **Thay đổi cấu hình:** Ghi lại khi lưu tài khoản đối ứng ví mới trong tab Cài đặt thẻ thành viên.
       - Hành động: `"Cập nhật cấu hình tài khoản đối ứng Ví"`
       - Bảng: `"shop_settings"`
       - Dữ liệu cũ & mới: Giá trị ID tài khoản kế toán trước và sau khi đổi.
    2. **Nạp/Rút ví:** Ghi lại khi thực hiện giao dịch nạp/hoàn ví trong `useMemberships.ts`.
       - Hành động: `"Nạp tiền ví thành viên"` / `"Hoàn tiền ví thành viên"`
       - Bảng: `"membership_transactions"`
       - Dữ liệu mới: `{ amount, card_number, description }`.
    3. **Thanh toán ví:** Ghi lại khi trừ tiền ví thanh toán đơn hàng.
       - Hành động: `"Thanh toán đơn hàng bằng ví"`
       - Bảng: `"membership_transactions"`
       - Dữ liệu mới: `{ amount, card_number, order_number }`.

---

## 4. Kế hoạch xác minh & Đảm bảo Chất lượng (Verification Strategy)

Để đảm bảo các thay đổi không phá vỡ tính toàn vẹn của ứng dụng, cần kiểm thử các kịch bản sau:

### 4.1. Quy trình Kiểm thử Từng bước (Step-by-step Manual Walkthrough)
1. **Kiểm thử cấu hình:**
   - Vào Cài đặt -> Cấu hình Thẻ & Ví. Chọn tài khoản đối ứng là `131`. Ấn lưu.
   - Kiểm tra xem có log ghi nhận trong tab Nhật ký hệ thống hay không.
2. **Kiểm thử phát hành nhiều thẻ & Upload:**
   - Phát hành thẻ thành viên thứ nhất cho khách hàng A, chọn một tệp ảnh đại diện làm thẻ.
   - Phát hành thẻ thành viên thứ hai cho khách hàng A (hạng khác, mã khác) với hình ảnh khác.
   - Truy cập trang Chi tiết Khách hàng A. Xác nhận giao diện hiển thị đầy đủ cả 2 thẻ thành viên với hình ảnh tương ứng.
3. **Kiểm thử nạp tiền:**
   - Chọn thẻ thứ nhất của khách hàng A, thực hiện nạp 1.000.000đ tại quầy, chọn hình thức "Tiền mặt".
   - Vào Sổ cái kế toán, kiểm tra bút toán vừa tạo: Nợ `1111` (1.000.000đ) và Có `131` (1.000.000đ) - do tài khoản đối ứng đã cấu hình ở bước 1 là `131`.
4. **Kiểm thử thanh toán POS:**
   - Tạo đơn hàng POS cho khách hàng A trị giá 200.000đ.
   - Chọn hình thức thanh toán "Ví thành viên" và chọn thẻ thứ nhất của khách hàng A.
   - Xác nhận thanh toán thành công, số dư ví giảm còn 800.000đ.
   - Vào Sổ cái kế toán, kiểm tra bút toán thanh toán: Nợ `131` (200.000đ) và Có `511` (200.000đ).
   - Kiểm tra lịch sử giao dịch thành viên hiển thị dòng tiền 200.000đ và liên kết tới mã chứng từ đơn hàng.
   - Kiểm tra nhật ký Audit Logs xem có ghi nhận giao dịch thanh toán ví thành viên này không.

### 4.2. Lệnh Tĩnh & Build Kiểm tra
Trước khi hoàn thành, bắt buộc phải chạy các lệnh kiểm tra lỗi tĩnh để đảm bảo mã nguồn tuân thủ TypeScript:
```powershell
npm run typecheck
npm run build
```
Đồng thời, viết thêm test case cho các hook `useMemberships` và event bus trong `src/hooks/__tests__/useMemberships.test.ts` để tự động hóa việc xác minh luồng hạch toán dòng tiền và cấu hình động.
