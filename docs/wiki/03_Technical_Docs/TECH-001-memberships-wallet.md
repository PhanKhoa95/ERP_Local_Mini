---
id: TECH-001-memberships-wallet
type: technical
status: draft
target_agent: Dev_Agent
created_at: 2026-07-15
source_ids:
  - SPEC-001-memberships-wallet
---

# Tài liệu kỹ thuật: Triển khai Thẻ thành viên & Số dư Ví

## Kiến trúc và luồng dữ liệu
- Bổ sung trường `memberships` (mảng đối tượng) và `wallet_balance` (số) vào mô hình dữ liệu đối tác (`partners`).
- Khi nạp tiền:
  1. Giao diện ví gọi `addTransaction` hoặc ghi vào `payment_transactions` với loại `deposit`.
  2. Event Bus phát sự kiện `WALLET_DEPOSIT`.
  3. Accounting Handler bắt sự kiện, sinh bút toán Sổ cái: Nợ TK 111 / Có TK 3387.
- Khi thanh toán đơn hàng bằng ví:
  1. Tạo đơn hàng với hình thức thanh toán `Wallet`.
  2. Trừ trực tiếp `wallet_balance` của đối tác.
  3. Event Bus phát sự kiện `ORDER_CREATED`.
  4. Accounting Handler bắt sự kiện, sinh bút toán Sổ cái: Nợ TK 3387 / Có TK 511.

## Mô-đun hoặc tệp sở hữu
- Hook ví & thẻ: `src/hooks/useLoyalty.ts` hoặc `src/hooks/useMembership.ts`.
- Giao diện đối tác: `src/components/partners/PartnerDetailDialog.tsx`.
- Giao diện cấu hình: `src/components/settings/AccountingSettings.tsx`.

## Kiểm thử và bằng chứng triển khai
- Thêm file kiểm thử: `tests/e2e/memberships_wallet.spec.ts`.
- Lệnh chạy: `npx playwright test tests/e2e/memberships_wallet.spec.ts`.
