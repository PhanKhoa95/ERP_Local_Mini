# Skill Factory (AI Agent Skills Standard)

Project: Multi Sale Organizer
Profile: webapp
Goal: Định nghĩa tiêu chuẩn thiết kế, xây dựng và tích hợp các kỹ năng (Skills / Tools) cho AI Sales Agent và các luồng tự động hóa trong hệ thống.

---

## 1. Khái niệm Skill

Trong hệ sinh thái Multi Sale Organizer, một **Skill** (kỹ năng) là một hàm thực thi độc lập (tool) được đóng gói và cung cấp cho LLM (thông qua AI Sales Agent tại `/sales-agent` hoặc Directive Dashboard tại `/directive-dashboard`) để tương tác với hệ thống. 

Ví dụ về các Skill bao gồm:
*   Tra cứu tồn kho theo mã SKU.
*   Tạo đơn hàng tự động từ tin nhắn chat của khách.
*   Cập nhật trạng thái thanh toán của đơn hàng.
*   Gửi mã giảm giá kích hoạt lại khách hàng cũ (phân khúc RFM).

---

## 2. Cấu trúc Thư mục & Quy chuẩn Đặt tên

Các tệp liên quan đến Skill được tổ chức tại phân hệ tự động hóa:

```txt
src/lib/skills/
├── types.ts              # Định nghĩa các interface và type chuẩn cho Skill
├── registry.ts           # Đăng ký danh sách Skill hiện có cho LLM sử dụng
└── definitions/          # Chứa các file định nghĩa Skill riêng lẻ
    ├── queryInventory.ts # Skill tra cứu kho hàng
    ├── createOrder.ts    # Skill tạo đơn hàng tự động
    └── resolveContact.ts # Skill phân giải danh tính khách hàng
```

*   **Tên tệp**: Viết thường theo định dạng camelCase (ví dụ: `createOrder.ts`).
*   **Tên Class/Object**: Tương ứng với tên tệp, bắt đầu bằng động từ hành động cụ thể.

---

## 3. Quy trình Xây dựng một Skill Mới

Quy trình phát triển bao gồm 5 bước tiêu chuẩn:

### Bước 1: Khai báo Types & Schema (Zod)
Định nghĩa cấu trúc dữ liệu đầu vào mà LLM phải trích xuất từ cuộc hội thoại.

```typescript
// src/lib/skills/definitions/queryInventory.ts
import { z } from "zod";

export const QueryInventorySchema = z.object({
  sku: z.string().min(1, "SKU là tham số bắt buộc"),
  warehouse_id: z.string().uuid().optional().describe("ID kho hàng cụ thể nếu có")
});

export type QueryInventoryInput = z.infer<typeof QueryInventorySchema>;
```

### Bước 2: Viết Handler xử lý Logic
Handler nhận đầu vào đã được validate, gọi client Supabase hoặc thư viện dùng chung để thực hiện hành động.

```typescript
import { supabase } from "@/integrations/supabase/client";

export async function queryInventoryHandler(input: QueryInventoryInput) {
  let query = supabase
    .from("warehouse_stock")
    .select("quantity, product:products(name, sku)")
    .eq("product.sku", input.sku);

  if (input.warehouse_id) {
    query = query.eq("warehouse_id", input.warehouse_id);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Lỗi truy vấn kho: ${error.message}`);
  
  return {
    success: true,
    data: data.map(item => ({
      product_name: item.product?.name,
      sku: item.product?.sku,
      stock: item.quantity
    }))
  };
}
```

### Bước 3: Đóng gói Metadata cho LLM
Khai báo đầy đủ tên, mô tả chức năng chi tiết và schema tham số để LLM nhận diện đúng chức năng (Function Calling).

```typescript
export const queryInventorySkill = {
  name: "query_inventory",
  description: "Dùng để tra cứu số lượng tồn kho của một sản phẩm dựa trên mã hàng hóa SKU.",
  parameters: QueryInventorySchema,
  execute: queryInventoryHandler
};
```

### Bước 4: Đăng ký Skill vào Registry
Thêm skill mới vào file `registry.ts` để AI Agent có thể truy cập động:

```typescript
// src/lib/skills/registry.ts
import { queryInventorySkill } from "./definitions/queryInventory";
import { createOrderSkill } from "./definitions/createOrder";

export const agentSkills = [
  queryInventorySkill,
  createOrderSkill
];
```

### Bước 5: Viết Test Case cho Skill
Tất cả các Skill bắt buộc phải có unit test đi kèm để kiểm thử khả năng xử lý biên (ví dụ: tham số bị trống, lỗi database) tại `tests/skills/`.

---

## 4. Nguyên tắc Thiết kế An toàn (Security & Guardrails)

*   **Không tự động thực thi các tác vụ nguy hiểm**: Các kỹ năng thay đổi cấu hình hệ thống, duyệt chi tiền hoặc xóa dữ liệu bắt buộc phải trả về trạng thái `requires_approval = true` để hiển thị nút xác nhận trên UI cho Admin bấm duyệt, không được chạy ngầm tự động.
*   **Bảo mật phân quyền (RLS)**: Handler chạy trên Client bắt buộc phải kế thừa token đăng nhập của tài khoản đang dùng (Auth Session) để Supabase áp dụng đúng chính sách RLS, ngăn chặn hành vi vượt quyền.
*   **Xử lý ngoại lệ thân thiện**: Khi gặp lỗi (ví dụ: sản phẩm không tồn tại), trả về cấu trúc JSON mô tả lỗi rõ ràng thay vì ném ra Exception làm crash luồng trò chuyện của AI.
