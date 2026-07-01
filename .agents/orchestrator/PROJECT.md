# Project: Centralized Event-Driven Observer

## Architecture
- **Frontend**: React, TanStack React Query, Lucide Icons, Tailwind CSS, Sonner.
- **Local Storage DB**: Stores orders, products, partners, journal entries/lines, and payment transactions locally.
- **Event-Driven Observer**:
  - `src/lib/erpEventBus.ts`: Central PubSub Event Bus.
  - Business handlers for Inventory, Accounting Ledger, Partner Debt.
  - Integration with React Query client for invalidations.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Exploration & Analysis | Map codebase, identify hooks, localStorage keys, and design contract | none | DONE |
| 2 | Event Bus & Hook Integration | Implement `erpEventBus.ts` and dispatch events in useOrders, usePaymentTransactions, useContracts | M1 | DONE |
| 3 | Operations Handlers | Implement Stock, Accounting Ledger, and Partner Debt Subscribers | M2 | DONE |
| 4 | UI Sync & Invalidation | Connect event callbacks with React Query invalidations | M3 | DONE |
| 5 | Testing & Verification | Implement vitest test cases verifying all handlers and integrations | M4 | DONE |

## Interface Contracts
### `erpEventBus.ts`
- Events:
  - `ORDER_CREATED`: `{ order: Order, items: OrderItem[] }`
  - `PAYMENT_RECORDED`: `{ transaction: PaymentTransaction }`
  - `CONTRACT_SIGNED`: `{ contract: SmartContract }`
- Subscribe interface:
  - `subscribe(event: string, callback: (payload: any) => void): () => void`
- Publish interface:
  - `publish(event: string, payload: any): void`
