# Handoff Report: Centralized Event-Driven Observer for ERP Local Demo

## 1. Observation

During a thorough inspection of the ERP Local Mini codebase, the following file paths, lines, and data structures were observed regarding order creation, payment transaction writing, contract signing, and local storage operations:

### 1.1 Local Demo Creation Entry Points

#### A. Order Creation & Stock Deduction
*   **File**: `src/hooks/useOrders.ts`
*   **Location**: `createOrder` mutation (lines 753–832)
*   **Verbatim local mode block** (lines 759–789):
    ```typescript
    if (isLocalDemoAuthEnabled()) {
      const all = getLocalOrders(companyId);
      const orderId = `ord-${Date.now()}`;
      const orderNumber = orderData.order_number || orderId;
      const newOrder: Order = {
        ...orderData,
        id: orderId,
        company_id: companyId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        order_items: (items || []).map((item, idx) => ({
          id: `oi-${Date.now()}-${idx}`,
          order_id: orderId,
          product_id: item.product_id || null,
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          total_price: (item.quantity || 1) * (item.unit_price || 0),
          products: item.product_name ? { id: item.product_id, name: item.product_name, sku: item.sku || null } : null
        }))
      } as any;
      
      all.unshift(newOrder);
      saveLocalOrders(all);

      // Deduct stock for local demo
      if (items && items.length > 0) {
        deductLocalStock(items, orderNumber);
      }

      return newOrder;
    }
    ```
*   **Stock deduction helper** (lines 638–653): Calls `createLocalInventoryTransaction` from `src/lib/localInventoryStore.ts` which modifies product stock quantities directly in the local store and adds an inventory transaction record.

#### B. Payment Transactions Writing
*   **File**: `src/hooks/usePaymentTransactions.ts`
*   **Location**: `createTransaction` mutation (lines 324–393)
*   **Verbatim local mode block** (lines 326–361):
    ```typescript
    if (isLocalDemoAuthEnabled()) {
      const raw = localStorage.getItem(TRANSACTIONS_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const newTx: PaymentTransaction = {
        id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        partner_id: transaction.partner_id,
        order_id: transaction.order_id || null,
        transaction_type: transaction.transaction_type,
        amount: transaction.amount,
        payment_method: transaction.payment_method || null,
        reference_number: transaction.reference_number || null,
        notes: transaction.notes || null,
        transaction_date: transaction.transaction_date || new Date().toISOString(),
        created_by: "admin",
        created_at: new Date().toISOString(),
      };
      list.unshift(newTx);
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(list));
      
      if (transaction.order_id && (transaction.transaction_type === 'payment_in' || transaction.transaction_type === 'payment_out')) {
        const rawOrders = localStorage.getItem(ORDERS_KEY);
        const orders = rawOrders ? JSON.parse(rawOrders) : [];
        const orderIdx = orders.findIndex((o: any) => o.id === transaction.order_id);
        if (orderIdx > -1) {
          orders[orderIdx].paid_amount = (orders[orderIdx].paid_amount || 0) + transaction.amount;
          
          // Auto update payment_status if fully paid
          if (orders[orderIdx].paid_amount >= (orders[orderIdx].total || 0)) {
            orders[orderIdx].payment_status = "paid";
          }
          
          localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
        }
      }
      return newTx;
    }
    ```

#### C. Contracts Signing & Milestone Completion
*   **File**: `src/hooks/useContracts.ts`
*   **Location**: `signContract` mutation (lines 381–413)
*   **Verbatim local mode block** (lines 383–401):
    ```typescript
    if (isLocalDemoAuthEnabled()) {
      const local = getLocalContracts(companyId);
      const idx = local.findIndex(c => c.id === params.contract_id);
      if (idx >= 0) {
        local[idx] = {
          ...local[idx],
          status: "active",
          signed_at: new Date().toISOString(),
          signer_user_id: user?.id || "local-demo-user",
          signer_vneid_hash: params.vneid_hash || "vneid-hash-mock",
          offline_hash: params.offline_hash || "offline-hash-mock",
          updated_at: new Date().toISOString(),
        };
        saveLocalContracts(local);
        createLocalOrderFromContract(companyId || "", local[idx]);
        return { contract: local[idx] };
      }
      throw new Error("Không tìm thấy hợp đồng local để ký");
    }
    ```
*   **Milestone Completion**:
    *   **Location**: `completeMilestone` mutation (lines 472–499)
    *   **Verbatim local mode block** (lines 474–487):
        ```typescript
        if (isLocalDemoAuthEnabled()) {
          const local = getLocalMilestones();
          const idx = local.findIndex(m => m.id === params.milestone_id);
          if (idx >= 0) {
            local[idx] = {
              ...local[idx],
              status: "completed",
              completed_at: new Date().toISOString(),
            };
            saveLocalMilestones(local);
            return { milestone: local[idx] };
          }
          throw new Error("Không tìm thấy milestone local");
        }
        ```

---

### 1.2 Local Storage Configuration & Keys

The data schemas used by the ERP Local Demo mode are stored as JSON arrays under specific keys. The table below catalogs these keys:

| Data Type | Key Name in Local Storage | Structure / Schema | Context File Reference |
| :--- | :--- | :--- | :--- |
| **Orders** | `erp-mini-local-demo-orders` | `Order[]` | `src/hooks/useOrders.ts` |
| **Products/Stock** | `erp-mini-local-demo-products` | `Product[]` | `src/lib/localInventoryStore.ts` |
| **Stock Moves** | `erp-mini-local-demo-inventory-transactions` | `InventoryTransaction[]` | `src/lib/localInventoryStore.ts` |
| **Partners** | `erp-mini-local-demo-partners` | `Partner[]` | `src/hooks/usePartners.ts` |
| **Payments** | `erp-mini-local-demo-payment-transactions` | `PaymentTransaction[]` | `src/hooks/usePaymentTransactions.ts` |
| **Accounts** | `erp-mini-local-demo-accounts` | `ChartOfAccount[]` | `src/hooks/useAccounting.ts` |
| **Journal Entries** | `erp-mini-local-demo-journal-entries` | `JournalEntry[]` | `src/hooks/useAccounting.ts` |
| **Journal Lines** | `erp-mini-local-demo-journal-lines` | `JournalLine[]` | `src/hooks/useAccounting.ts` |

#### ⚠️ Critical Local Storage Key Inconsistencies (Bugs) Identified:
1.  **Orders Key Mismatch**:
    *   `useOrders.ts` defines `const LOCAL_ORDERS_KEY = "erp-mini-local-demo-orders";`.
    *   However, `useContracts.ts` (lines 193 and 252) reads and writes local orders under `"erp-mini-local-demo"`!
    *   `useOrderReturns.ts` (line 22) also reads orders from `"erp-mini-local-demo"`.
    *   *Impact*: Orders created via contract signature (`createLocalOrderFromContract`) or returns are isolated under a separate local storage key and **do not appear** in the main Orders list.
2.  **Chart of Accounts Key Mismatch**:
    *   `useAccounting.ts` uses `const LOCAL_ACCOUNTS_KEY = "erp-mini-local-demo-accounts";`.
    *   However, `useOrderReturns.ts` (line 156 and 175) and `usePayroll.ts` (line 369) read/write the accounts list under `"erp-mini-local-demo-chart-of-accounts"`.
    *   *Impact*: Inconsistencies between payroll/return ledger accounts and the main chart of accounts displayed in the Accounting page.

---

### 1.3 React Query Invalidation Keys Mismatch
In `src/lib/queryInvalidation.ts`, the accounting invalidations use:
```typescript
queryClient.invalidateQueries({ queryKey: ["journal_entries"] });
queryClient.invalidateQueries({ queryKey: ["chart_of_accounts"] });
```
However, the queries in `src/hooks/useAccounting.ts` are declared as:
```typescript
queryKey: ["chart-of-accounts", companyId]
queryKey: ["journal-entries-and-lines", companyId, ...]
```
Because of the hyphen-vs-underscore mismatch (`chart_of_accounts` vs `chart-of-accounts` and `journal_entries` vs `journal-entries-and-lines`), calling `invalidateOrderRelated` or `invalidateAccountingRelated` does not refresh the accounting UI elements under local demo mode.

---

## 2. Logic Chain

1.  **Decoupling via Event Bus**:
    *   Currently, creating an order triggers stock deduction synchronously in the hook using a direct function call (`deductLocalStock(items, orderNumber)`). Adding accounting and partner debt logic to `createOrder` inside `useOrders.ts` would bloat the hook, creating high coupling and circular dependencies.
    *   By introducing an Event Bus (`erpEventBus.ts`) implementing a PubSub pattern, hooks only need to perform their primary insert mutation and then publish a single event (e.g. `ORDER_CREATED`).
2.  **Synchronous In-Mutation Processing**:
    *   If the event publishing is asynchronous but awaited within the React Query mutation function (i.e., `await erpEventBus.publish(...)`), all registered subscribers will run and persist their state changes to `localStorage` *during* the execution of the mutation.
    *   This guarantees that when the mutation finishes and React Query triggers `onSuccess`, the subsequent React Query invalidation will fetch the newly synced, updated state from `localStorage`.
3.  **Correcting Key Inconsistencies**:
    *   The planned subscribers must write to the canonical local storage keys (`erp-mini-local-demo-orders`, `erp-mini-local-demo-accounts`, `erp-mini-local-demo-partners`) rather than the mismatched keys.
    *   By introducing a handler for `CONTRACT_SIGNED`, we can intercept contract signatures, generate the order under the correct `"erp-mini-local-demo-orders"` key, and publish `ORDER_CREATED` to kick off the downstream inventory, accounting, and partner debt handlers. This corrects the existing bug seamlessly.

---

## 3. Caveats

*   **LocalStorage Limit**: All operations are restricted to `localStorage` in demo mode. Large catalogs may hit the quota limit.
*   **Concurrency**: There is no locking mechanism on `localStorage`. Simultaneous mutation runs could lead to overwrite issues (though React single-threaded state mitigates this in ordinary UI usage).
*   **Query Key Alignment**: Correcting the invalidations requires aligning the query keys in `queryInvalidation.ts` to use hyphens (`chart-of-accounts`, `journal-entries-and-lines`) instead of underscores.

---

## 4. Conclusion & Proposed Implementation Plan

We propose creating a centralized Event Bus in `src/lib/erpEventBus.ts` that will act as the orchestrator for all local demo side-effects.

### 4.1 Event Bus Design (`src/lib/erpEventBus.ts`)

```typescript
import { Order, OrderItem } from "@/hooks/useOrders";
import { PaymentTransaction } from "@/hooks/usePaymentTransactions";
import { SmartContract } from "@/hooks/useContracts";

export type ErpEvents = {
  ORDER_CREATED: { order: Order; items: any[] };
  PAYMENT_RECORDED: { transaction: PaymentTransaction };
  CONTRACT_SIGNED: { contract: SmartContract };
};

export type ErpEventName = keyof ErpEvents;
export type ErpEventHandler<T extends ErpEventName> = (payload: ErpEvents[T]) => void | Promise<void>;

class ErpEventBus {
  private listeners: { [K in ErpEventName]?: ErpEventHandler<K>[] } = {};

  subscribe<T extends ErpEventName>(event: T, handler: ErpEventHandler<T>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(handler as any);
    return () => this.unsubscribe(event, handler);
  }

  unsubscribe<T extends ErpEventName>(event: T, handler: ErpEventHandler<T>): void {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event]!.filter(h => h !== handler);
  }

  async publish<T extends ErpEventName>(event: T, payload: ErpEvents[T]): Promise<void> {
    const handlers = this.listeners[event] || [];
    for (const handler of handlers) {
      try {
        await handler(payload);
      } catch (err) {
        console.error(`[erpEventBus] Error in handler for event "${event}":`, err);
      }
    }
  }
}

export const erpEventBus = new ErpEventBus();
```

---

### 4.2 Subscriber Logic Specifications

The following subscribers will be registered within `src/lib/erpEventBus.ts` as side-effect observers:

#### A. Inventory Handler
*   **Event**: `ORDER_CREATED`
*   **Action**: Subtracts stock for each item unless the product is a service.
*   **Code Implementation**:
    ```typescript
    import { createLocalInventoryTransaction } from "./localInventoryStore";

    erpEventBus.subscribe("ORDER_CREATED", async ({ order, items }) => {
      if (typeof window === "undefined") return;
      for (const item of items) {
        if (!item.product_id) continue;
        try {
          // Re-use existing helper which updates stock and logs transaction
          createLocalInventoryTransaction({
            product_id: item.product_id,
            transaction_type: "out",
            quantity: item.quantity || 1,
            notes: `Trừ tồn kho - Đơn hàng ${order.order_number || order.id}`,
          });
        } catch (err) {
          console.warn(`[Inventory Handler] Không thể trừ kho cho ${item.product_id}:`, err);
        }
      }
    });
    ```

#### B. Accounting Handler
*   **Events**: `ORDER_CREATED`, `PAYMENT_RECORDED`
*   **Action**: Auto-generates posted double-entry journal entries and lines and adjusts Chart of Accounts balances.
*   **Code Implementation**:
    ```typescript
    erpEventBus.subscribe("ORDER_CREATED", async ({ order, items }) => {
      if (typeof window === "undefined") return;
      const companyId = order.company_id || "demo-company";
      
      const rawAccounts = localStorage.getItem("erp-mini-local-demo-accounts");
      let accounts = rawAccounts ? JSON.parse(rawAccounts) : [];
      const rawEntries = localStorage.getItem("erp-mini-local-demo-journal-entries") || "[]";
      const rawLines = localStorage.getItem("erp-mini-local-demo-journal-lines") || "[]";
      const entries = JSON.parse(rawEntries);
      const lines = JSON.parse(rawLines);
      
      const entryDate = (order.created_at || new Date().toISOString()).split("T")[0];
      const orderNum = order.order_number || order.id;
      const totalAmount = Number(order.total || 0);
      
      // 1. Sales Entry (Dr 131 Phải thu KH / Cr 511 Doanh thu)
      const salesEntryId = `ent-sales-${order.id}`;
      entries.unshift({
        id: salesEntryId,
        company_id: companyId,
        entry_date: entryDate,
        description: `Doanh thu đơn hàng ${orderNum}`,
        status: "posted",
        source_type: "order",
        source_id: order.id,
        created_by: "system",
        posted_by: "system",
        created_at: order.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      lines.push(
        {
          id: `line-sales-dr-${order.id}`,
          entry_id: salesEntryId,
          account_id: "acc-131",
          debit: totalAmount,
          credit: 0,
          memo: `Ghi nhận phải thu đơn ${orderNum}`,
          created_at: order.created_at
        },
        {
          id: `line-sales-cr-${order.id}`,
          entry_id: salesEntryId,
          account_id: "acc-511",
          debit: 0,
          credit: totalAmount,
          memo: `Doanh thu bán hàng đơn ${orderNum}`,
          created_at: order.created_at
        }
      );
      
      // Update account balances
      accounts = accounts.map((acc: any) => {
        if (acc.id === "acc-131") return { ...acc, balance: (acc.balance || 0) + totalAmount };
        if (acc.id === "acc-511") return { ...acc, balance: (acc.balance || 0) + totalAmount };
        return acc;
      });
      
      // 2. COGS Entry (Dr 632 Giá vốn / Cr 156 Hàng hóa)
      const rawProducts = localStorage.getItem("erp-mini-local-demo-products") || "[]";
      const products = JSON.parse(rawProducts);
      let costAmount = 0;
      for (const item of items) {
        const prod = products.find((p: any) => p.id === item.product_id);
        if (prod && !prod.is_service) {
          costAmount += (prod.cost_price || 0) * (item.quantity || 1);
        }
      }
      if (costAmount === 0 && totalAmount > 0) {
        costAmount = Math.round(totalAmount * 0.47); // fallback mock ratio
      }
      
      if (costAmount > 0) {
        const cogsEntryId = `ent-cogs-${order.id}`;
        entries.unshift({
          id: cogsEntryId,
          company_id: companyId,
          entry_date: entryDate,
          description: `Giá vốn đơn hàng ${orderNum}`,
          status: "posted",
          source_type: "order",
          source_id: order.id,
          created_by: "system",
          posted_by: "system",
          created_at: order.created_at,
          updated_at: order.updated_at
        });
        
        lines.push(
          {
            id: `line-cogs-dr-${order.id}`,
            entry_id: cogsEntryId,
            account_id: "acc-632",
            debit: costAmount,
            credit: 0,
            memo: `Ghi nhận giá vốn đơn ${orderNum}`,
            created_at: order.created_at
          },
          {
            id: `line-cogs-cr-${order.id}`,
            entry_id: cogsEntryId,
            account_id: "acc-156",
            debit: 0,
            credit: costAmount,
            memo: `Xuất kho hàng hóa đơn ${orderNum}`,
            created_at: order.created_at
          }
        );
        
        accounts = accounts.map((acc: any) => {
          if (acc.id === "acc-632") return { ...acc, balance: (acc.balance || 0) + costAmount };
          if (acc.id === "acc-156") return { ...acc, balance: (acc.balance || 0) - costAmount };
          return acc;
        });
      }
      
      localStorage.setItem("erp-mini-local-demo-accounts", JSON.stringify(accounts));
      localStorage.setItem("erp-mini-local-demo-journal-entries", JSON.stringify(entries));
      localStorage.setItem("erp-mini-local-demo-journal-lines", JSON.stringify(lines));
    });

    erpEventBus.subscribe("PAYMENT_RECORDED", async ({ transaction }) => {
      if (typeof window === "undefined") return;
      const companyId = "demo-company";
      
      const rawAccounts = localStorage.getItem("erp-mini-local-demo-accounts");
      let accounts = rawAccounts ? JSON.parse(rawAccounts) : [];
      const rawEntries = localStorage.getItem("erp-mini-local-demo-journal-entries") || "[]";
      const rawLines = localStorage.getItem("erp-mini-local-demo-journal-lines") || "[]";
      const entries = JSON.parse(rawEntries);
      const lines = JSON.parse(rawLines);
      
      const entryDate = (transaction.transaction_date || new Date().toISOString()).split("T")[0];
      const entryId = `ent-pay-${transaction.id}`;
      const amount = Number(transaction.amount || 0);
      const payAccId = ["vietqr", "bank_transfer", "transfer"].includes(transaction.payment_method || "") 
        ? "acc-1121" 
        : "acc-1111";
      
      if (transaction.transaction_type === "payment_in") {
        // Dr Bank/Cash (1121/1111) / Cr Receivables (131)
        entries.unshift({
          id: entryId,
          company_id: companyId,
          entry_date: entryDate,
          description: transaction.notes || `Thu tiền khách hàng (giao dịch ${transaction.id})`,
          status: "posted",
          source_type: "payment",
          source_id: transaction.id,
          created_by: "system",
          posted_by: "system",
          created_at: transaction.created_at,
          updated_at: transaction.created_at
        });
        
        lines.push(
          {
            id: `line-payin-dr-${transaction.id}`,
            entry_id: entryId,
            account_id: payAccId,
            debit: amount,
            credit: 0,
            memo: transaction.notes || `Thu tiền`,
            created_at: transaction.created_at
          },
          {
            id: `line-payin-cr-${transaction.id}`,
            entry_id: entryId,
            account_id: "acc-131",
            debit: 0,
            credit: amount,
            memo: `Giảm phải thu từ giao dịch thu tiền`,
            created_at: transaction.created_at
          }
        );
        
        accounts = accounts.map((acc: any) => {
          if (acc.id === payAccId) return { ...acc, balance: (acc.balance || 0) + amount };
          if (acc.id === "acc-131") return { ...acc, balance: (acc.balance || 0) - amount };
          return acc;
        });
      } else if (transaction.transaction_type === "payment_out") {
        // Dr Capex/Payables/Expense (211/331/642) / Cr Bank/Cash (1121/1111)
        const isSupplier = transaction.partner_id && transaction.partner_id.includes("supplier");
        const isCapex = transaction.notes && transaction.notes.toLowerCase().includes("capex");
        const drAccId = isCapex ? "acc-211" : (isSupplier ? "acc-331" : "acc-642");
        
        entries.unshift({
          id: entryId,
          company_id: companyId,
          entry_date: entryDate,
          description: transaction.notes || `Chi tiền thanh toán (giao dịch ${transaction.id})`,
          status: "posted",
          source_type: "payment",
          source_id: transaction.id,
          created_by: "system",
          posted_by: "system",
          created_at: transaction.created_at,
          updated_at: transaction.created_at
        });
        
        lines.push(
          {
            id: `line-payout-dr-${transaction.id}`,
            entry_id: entryId,
            account_id: drAccId,
            debit: amount,
            credit: 0,
            memo: transaction.notes || `Chi tiền ghi nhận nợ/chi phí`,
            created_at: transaction.created_at
          },
          {
            id: `line-payout-cr-${transaction.id}`,
            entry_id: entryId,
            account_id: payAccId,
            debit: 0,
            credit: amount,
            memo: `Chi tiền`,
            created_at: transaction.created_at
          }
        );
        
        accounts = accounts.map((acc: any) => {
          if (acc.id === drAccId) {
            const inc = ["asset", "expense"].includes(acc.account_type);
            return { ...acc, balance: (acc.balance || 0) + (inc ? amount : -amount) };
          }
          if (acc.id === payAccId) return { ...acc, balance: (acc.balance || 0) - amount };
          return acc;
        });
      }
      
      localStorage.setItem("erp-mini-local-demo-accounts", JSON.stringify(accounts));
      localStorage.setItem("erp-mini-local-demo-journal-entries", JSON.stringify(entries));
      localStorage.setItem("erp-mini-local-demo-journal-lines", JSON.stringify(lines));
    });
    ```

#### C. Partner Debt Handler
*   **Events**: `ORDER_CREATED`, `PAYMENT_RECORDED`
*   **Action**: Dynamically increments partner outstanding receivables on sales order creation, and decreases debt on receipt of cash.
*   **Code Implementation**:
    ```typescript
    erpEventBus.subscribe("ORDER_CREATED", async ({ order }) => {
      if (typeof window === "undefined" || !order.partner_id) return;
      
      const rawPartners = localStorage.getItem("erp-mini-local-demo-partners");
      if (!rawPartners) return;
      
      const partners = JSON.parse(rawPartners);
      const idx = partners.findIndex((p: any) => p.id === order.partner_id);
      if (idx !== -1) {
        const total = Number(order.total || 0);
        const paid = Number(order.paid_amount || 0);
        const outstanding = total - paid;
        
        partners[idx].total_spent = (partners[idx].total_spent || 0) + total;
        partners[idx].debt_amount = (partners[idx].debt_amount || 0) + outstanding;
        partners[idx].updated_at = new Date().toISOString();
        
        localStorage.setItem("erp-mini-local-demo-partners", JSON.stringify(partners));
      }
    });

    erpEventBus.subscribe("PAYMENT_RECORDED", async ({ transaction }) => {
      if (typeof window === "undefined" || !transaction.partner_id) return;
      
      const rawPartners = localStorage.getItem("erp-mini-local-demo-partners");
      if (!rawPartners) return;
      
      const partners = JSON.parse(rawPartners);
      const idx = partners.findIndex((p: any) => p.id === transaction.partner_id);
      if (idx !== -1) {
        const amount = Number(transaction.amount || 0);
        
        if (transaction.transaction_type === "payment_in") {
          partners[idx].debt_amount = (partners[idx].debt_amount || 0) - amount;
        } else if (transaction.transaction_type === "payment_out") {
          partners[idx].debt_amount = (partners[idx].debt_amount || 0) - amount;
        }
        partners[idx].updated_at = new Date().toISOString();
        
        localStorage.setItem("erp-mini-local-demo-partners", JSON.stringify(partners));
      }
    });
    ```

#### D. Contract-Order Handler (Bug Solution for useContracts.ts)
*   **Event**: `CONTRACT_SIGNED`
*   **Action**: Safely creates an order under the correct key `erp-mini-local-demo-orders` and triggers the `ORDER_CREATED` event downstream.
*   **Code Implementation**:
    ```typescript
    erpEventBus.subscribe("CONTRACT_SIGNED", async ({ contract }) => {
      if (typeof window === "undefined") return;
      
      const rawOrders = localStorage.getItem("erp-mini-local-demo-orders") || "[]";
      const orders = JSON.parse(rawOrders);
      
      // Query sample products and values
      const productsRaw = localStorage.getItem("erp-mini-local-demo-products") || "[]";
      const products = JSON.parse(productsRaw);
      const finishedProd = products[0] || { id: "local-prod-sticker", name: "Sticker logo decal giấy", sku: "PRD-STICKER" };
      
      const orderId = `ord-${Date.now()}`;
      const newOrder = {
        id: orderId,
        company_id: contract.company_id,
        order_number: `ORD-${Date.now().toString().slice(-6)}`,
        customer_name: "Nhà phân phối (Hợp đồng)",
        payment_method: "Ghi nợ",
        payment_status: "pending",
        status: "pending",
        total: contract.total_value || 3600000,
        paid_amount: 0,
        partner_id: contract.partner_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes: `Tạo tự động từ Hợp đồng ${contract.contract_number}`,
        order_items: [{
          id: `oi-${Date.now()}-0`,
          order_id: orderId,
          product_id: finishedProd.id,
          quantity: 1,
          unit_price: contract.total_value || 3600000,
          total_price: contract.total_value || 3600000,
          products: { id: finishedProd.id, name: finishedProd.name, sku: finishedProd.sku }
        }]
      };

      orders.unshift(newOrder);
      localStorage.setItem("erp-mini-local-demo-orders", JSON.stringify(orders));
      
      // Cascade order creation event
      await erpEventBus.publish("ORDER_CREATED", {
        order: newOrder as any,
        items: newOrder.order_items
      });
    });
    ```

---

### 4.3 Integration in Hooks (Publisher Call Sites)

#### In `src/hooks/useOrders.ts`:
Modify the `createOrder` mutation function to import `erpEventBus` and publish the event:
```typescript
// Replace lines 783-786:
// deductLocalStock(items, orderNumber);
await erpEventBus.publish("ORDER_CREATED", { order: newOrder, items: payload.items || [] });
```

#### In `src/hooks/usePaymentTransactions.ts`:
Modify the `createTransaction` mutation function to publish the payment event:
```typescript
// Insert after line 343 (saving the transaction list):
await erpEventBus.publish("PAYMENT_RECORDED", { transaction: newTx });
```

#### In `src/hooks/useContracts.ts`:
Modify the `signContract` mutation function to trigger `CONTRACT_SIGNED` instead of the direct inconsistent order creator:
```typescript
// Replace line 397:
// createLocalOrderFromContract(companyId || "", local[idx]);
await erpEventBus.publish("CONTRACT_SIGNED", { contract: local[idx] });
```

---

### 4.4 React Query Invalidation State Alignment

To ensure the newly created entries and stock balances sync on the UI immediately, align `src/lib/queryInvalidation.ts` by replacing underscores with hyphens in the query keys, and add `"orders"` invalidation to contract updates:

```typescript
// Proposed fix inside src/lib/queryInvalidation.ts:
export function invalidateAccountingRelated(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["journal-entries-and-lines"] }); // Fix from "journal_entries"
  queryClient.invalidateQueries({ queryKey: ["chart-of-accounts"] });         // Fix from "chart_of_accounts"
}

export function invalidateContractRelated(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["smart-contracts"] });
  queryClient.invalidateQueries({ queryKey: ["contract-milestones"] });
  queryClient.invalidateQueries({ queryKey: ["finance-stats"] });
  queryClient.invalidateQueries({ queryKey: ["journal-entries-and-lines"] }); // Fix from "journal_entries"
  queryClient.invalidateQueries({ queryKey: ["chart-of-accounts"] });         // Fix from "chart_of_accounts"
  queryClient.invalidateQueries({ queryKey: ["orders"] });                    // Added to sync orders generated from contracts
}
```

---

## 5. Verification Method

To verify the proposed implementation independently, perform the following validation protocol:

1.  **Code Compilation & Test Check**:
    Run the linter and type-checker to make sure the event map and subscriber functions compile without TS compiler errors:
    ```powershell
    npm run build
    ```
2.  **Order Flow Integration Testing**:
    *   Initialize local storage keys via UI or Console.
    *   Create a local order under POS screen with product `Sticker logo decal giấy` (initial stock: 450).
    *   *Verify*:
        1.  Product stock drops to `450 - quantity` in `"erp-mini-local-demo-products"` storage.
        2.  A journal entry `Doanh thu đơn hàng POS-ORD-xxx` is appended to `"erp-mini-local-demo-journal-entries"` with corresponding lines.
        3.  The customer's `debt_amount` in `"erp-mini-local-demo-partners"` increases by `total - paid_amount`.
3.  **Payment Flow Integration Testing**:
    *   Record a payment for the partner under the Partner details dialog.
    *   *Verify*:
        1.  Customer `debt_amount` decreases.
        2.  A journal entry representing the collection (Dr Bank/Cash, Cr Receivables) is written.
4.  **Contract Signature Integration Testing**:
    *   Sign a contract in the Smart Contracts page.
    *   *Verify*:
        1.  An order with `ORD-xxx` is written to `"erp-mini-local-demo-orders"` (instead of the buggy `"erp-mini-local-demo"`).
        2.  Downstream stock deduction and accounting entries are triggered.
        3.  React Query invalidates and displays the new order immediately on the Orders dashboard screen.
