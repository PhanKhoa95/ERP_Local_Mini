---
id: TECH-002-event-bus
type: technical
status: current
target_agent: Dev_Agent
created_at: 2026-07-15
source_ids:
  - SPEC-002-event-bus
---

# Tài liệu kỹ thuật: Bộ phát sự kiện tập trung (Centralized Event Bus)

## Kiến trúc và luồng dữ liệu
Hệ thống sử dụng mẫu thiết kế Publish-Subscribe cục bộ trong bộ nhớ để làm trung gian điều phối liên lạc giữa các phân hệ:

- **Bộ phát**: [erpEventBus.ts](file:///y:/ERP_Local_Mini/src/lib/erpEventBus.ts) duy trì danh sách đăng ký sự kiện và xử lý phân phối sự kiện đồng bộ/bất đồng bộ.
- **Tích hợp Hooks**:
  - `useOrders.ts` kích hoạt `ORDER_CREATED` và `ORDER_UPDATED`.
  - `usePaymentTransactions.ts` kích hoạt `PAYMENT_RECORDED`.
  - `useContracts.ts` kích hoạt `CONTRACT_SIGNED`.
- **Đăng ký xử lý nghiệp vụ (Subscribers)**:
  - **Tồn kho**: Lắng nghe `ORDER_CREATED`, tự động gọi `localInventoryStore` cập nhật tồn kho.
  - **Kế toán**: Lắng nghe `ORDER_CREATED` và `PAYMENT_RECORDED` để tạo bút toán kép tương ứng.
  - **Công nợ đối tác**: Tự động tính toán lại `debt_amount` trong localStorage.

## Mô-đun hoặc tệp sở hữu
- Bộ phát lõi: [erpEventBus.ts](file:///y:/ERP_Local_Mini/src/lib/erpEventBus.ts)
- Bộ kiểm tra giám sát UI: [EventBusMonitorTab.tsx](file:///y:/ERP_Local_Mini/src/components/settings/EventBusMonitorTab.tsx) và [EventBusLogsTab.tsx](file:///y:/ERP_Local_Mini/src/components/settings/EventBusLogsTab.tsx)

## Kiểm thử và bằng chứng triển khai
- Thư viện unit test: [erpEventBus.test.ts](file:///y:/ERP_Local_Mini/src/lib/__tests__/erpEventBus.test.ts)
- Lệnh chạy: `npx vitest run src/lib/__tests__/erpEventBus.test.ts`
