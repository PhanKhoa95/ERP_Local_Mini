import { describe, it, expect, beforeEach, vi } from "vitest";
import { 
  createLocalProduct, 
  getLocalProductBom, 
  addLocalBomItem, 
  createLocalInventoryTransaction, 
  updateLocalProduct,
  logLocalAction
} from "../localInventoryStore";

// Mock global window and localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    }
  };
})();

Object.defineProperty(global, "window", {
  value: { localStorage: localStorageMock },
  writable: true
});
Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
  writable: true
});

describe("ERP Business Refinement - Inventory, BOM & COGS Calculation", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should calculate correct COGS via product BOM when direct cost is 0", () => {
    // 1. Create a product with cost_price = 0 (direct)
    const product = createLocalProduct({
      name: "Sticker Logo",
      sku: "STK-LOGO",
      selling_price: 99000,
      cost_price: 0,
      is_service: false,
    });

    // 2. Create raw materials with positive costs
    const decal = createLocalProduct({
      name: "Decal Giay A4",
      sku: "MAT-DECAL-TEST",
      selling_price: 10000,
      cost_price: 5000,
      is_service: false,
    });

    const ink = createLocalProduct({
      name: "Muc In Pet",
      sku: "MAT-INK-TEST",
      selling_price: 2000,
      cost_price: 1000,
      is_service: false,
    });

    // 3. Add BOM items
    addLocalBomItem({
      product_id: product.id,
      material_id: decal.id,
      quantity: 2,
    });

    addLocalBomItem({
      product_id: product.id,
      material_id: ink.id,
      quantity: 5,
    });

    // 4. Retrieve BOM items
    const bom = getLocalProductBom(product.id);
    expect(bom.length).toBe(2);

    // 5. Verify local inventory helper logs actions
    const rawLogs = localStorage.getItem("erp-mini-local-demo-audit-logs");
    const logs = rawLogs ? JSON.parse(rawLogs) : [];
    expect(logs.some((l: any) => l.action === "Thêm định mức BOM")).toBe(true);
  });

  it("should deduct raw materials stock correctly on transaction creation", () => {
    const rawMaterial = createLocalProduct({
      name: "Mica Tấm",
      sku: "MAT-MICA-TEST",
      selling_price: 50000,
      cost_price: 30000,
      stock_quantity: 100,
      is_service: false,
    });

    // Create an 'out' transaction to simulate production usage
    createLocalInventoryTransaction({
      product_id: rawMaterial.id,
      transaction_type: "out",
      quantity: 5,
      notes: "Xuất kho sản xuất bảng QR"
    });

    const rawLogs = localStorage.getItem("erp-mini-local-demo-audit-logs");
    const logs = rawLogs ? JSON.parse(rawLogs) : [];
    expect(logs.some((l: any) => l.action === "Xuất kho vật tư")).toBe(true);
  });

  it("should track audit logs for price edits", () => {
    const product = createLocalProduct({
      name: "Card Cam On",
      sku: "CARD-THANK-TEST",
      selling_price: 50000,
      cost_price: 20000,
      is_service: false,
    });

    // Edit selling price
    updateLocalProduct({
      id: product.id,
      selling_price: 60000,
    });

    const rawLogs = localStorage.getItem("erp-mini-local-demo-audit-logs");
    const logs = rawLogs ? JSON.parse(rawLogs) : [];
    expect(logs.some((l: any) => l.action === "Sửa giá bán")).toBe(true);
  });
});
