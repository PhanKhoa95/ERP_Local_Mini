# Scope: Logic Resolution & Data Sync - Milestone 1

## Architecture
This milestone resolves critical business logic gaps (R1) and data synchronization issues (R2) in the ERP codebase, specifically:
- UI safety alerts and input rules validation in products dialog.
- Core integrity checks blocking product deletion if used in another product's Bill of Materials (BOM) for both local and Supabase modes.
- Service product classification extensions to support quantity tracking and limit capacity when configured.
- Graph-based cycle detection (BFS/DFS) in BOM assignments.
- Real-time and recursive price propagation through the BOM hierarchy.
- Product inventory level aggregation across warehouses.
- Automated double-entry book-keeping triggers upon manual inventory operations via events.

Data flows:
- `ProductDialog` (UI) ↔ validation layer & hooks.
- Product hooks/local store ↔ BOM cycle detection ↔ `product_bom` / `BOM_KEY`.
- `warehouse_stock` mutations ↔ sum updates ↔ `products.stock_quantity`.
- `StockTransactionDialog` / local inventory ↔ `erpEventBus` ↔ accounting handlers ↔ `journal_entries` / `journal_items`.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| 1 | Validation & Safety (R1.3, R1.4, R1.8) | Implement ProductDialog price warning, BOM delete blocking in local & Supabase modes, and BOM circular dependency cycle detection. | None | PLANNED |
| 2 | Service Quantity & Stock Sync (R1.5, R2.2) | Enable limited service inventory management and synchronize products.stock_quantity with sum of warehouse_stock.quantity. | Milestone 1 | PLANNED |
| 3 | Cost Propagation & Accounting (R2.1, R2.3) | Implement recursive cost price propagation on BOM changes, and publish STOCK_TRANSACTION_RECORDED event to auto-create journal entries. | Milestone 2 | PLANNED |

## Interface Contracts
### BOM Cycle Detector
- **Signature**: `checkCircularDependency(productId: string, candidateMaterialId: string, bomItems: ProductBom[]): boolean`
- **Behavior**: Returns `true` if adding `candidateMaterialId` under `productId` forms a cycle, `false` otherwise.

### Product Cost Sync
- **Signature**: `syncParentBomCost(productId: string): Promise<void>` (Supabase) / `syncLocalParentBomCost(productId: string): void` (Local)
- **Behavior**: Recalculate parent's cost price recursively based on active BOM items and material costs.

### Event Bus: Stock Transaction
- **Event**: `STOCK_TRANSACTION_RECORDED`
- **Payload**:
  ```typescript
  interface StockTransactionRecordedPayload {
    transaction: {
      id: string;
      product_id: string;
      quantity: number;
      type: "in" | "out" | "adjustment";
      warehouse_id: string;
      company_id: string;
    };
    product: {
      cost_price: number;
      name: string;
    };
  }
  ```
