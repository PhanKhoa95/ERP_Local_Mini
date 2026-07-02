import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { PackingDialog } from "../orders/PackingDialog";
import React from "react";
import type { Order } from "@/hooks/useOrders";

// Mock toast hook
const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock localDemoAuth and localInventoryStore
const mockIsLocalDemoAuthEnabled = vi.fn().mockReturnValue(true);
vi.mock("@/lib/localDemoAuth", () => ({
  isLocalDemoAuthEnabled: () => mockIsLocalDemoAuthEnabled(),
}));

const mockGetLocalInventoryTransactions = vi.fn().mockReturnValue([]);
const mockCreateLocalInventoryTransaction = vi.fn();
const mockGetLocalProductBom = vi.fn().mockReturnValue([]);
vi.mock("@/lib/localInventoryStore", () => ({
  getLocalInventoryTransactions: () => mockGetLocalInventoryTransactions(),
  createLocalInventoryTransaction: (args: any) => mockCreateLocalInventoryTransaction(args),
  getLocalProductBom: (id: string) => mockGetLocalProductBom(id),
}));

// Sample data
const mockProduct1 = { id: "p-1", name: "Sản phẩm 1", sku: "SKU001", company_id: "demo" };
const mockProduct2 = { id: "p-2", name: "Sản phẩm 2", sku: "SKU002", company_id: "demo" };

const mockOrderItem1 = {
  id: "oi-1",
  product_id: "p-1",
  quantity: 2,
  unit_price: 100000,
  products: mockProduct1,
};

const mockOrderItem2 = {
  id: "oi-2",
  product_id: "p-2",
  quantity: 1,
  unit_price: 200000,
  products: mockProduct2,
};

const mockOrder1: Order = {
  id: "ord-1",
  order_number: "ORD-001",
  status: "pending",
  total: 400000,
  customer_name: "Nguyễn Văn A",
  customer_phone: "0901234567",
  shipping_address: "123 Đường A",
  order_items: [mockOrderItem1, mockOrderItem2],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  company_id: "demo",
  payment_method: "cod",
  payment_status: "unpaid",
  discount: 0,
  shipping_fee: 0,
} as any;

const mockOrder2: Order = {
  id: "ord-2",
  order_number: "ORD-002",
  status: "confirmed",
  total: 200000,
  customer_name: "Trần Thị B",
  customer_phone: "0987654321",
  shipping_address: "456 Đường B",
  order_items: [
    {
      id: "oi-3",
      product_id: "p-2",
      quantity: 1,
      unit_price: 200000,
      products: mockProduct2,
    },
  ],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  company_id: "demo",
  payment_method: "cod",
  payment_status: "unpaid",
  discount: 0,
  shipping_fee: 0,
} as any;

describe("PackingDialog Empirical Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsLocalDemoAuthEnabled.mockReturnValue(true);
    mockGetLocalInventoryTransactions.mockReturnValue([]);
    mockGetLocalProductBom.mockReturnValue([]);
  });

  it("1. Verify SKU scanning increments picked quantities correctly", async () => {
    render(
      <PackingDialog
        open={true}
        onOpenChange={vi.fn()}
        orderQueue={[mockOrder1]}
        allOrders={[mockOrder1]}
        onPackOrder={vi.fn().mockResolvedValue(undefined)}
      />
    );

    // Initial state: 0/2 for Sản phẩm 1
    expect(screen.getByText("0/2")).toBeInTheDocument();

    const input = screen.getByPlaceholderText("Quét barcode hoặc nhập mã đơn hàng...");
    
    // Scan SKU001 once
    await act(async () => {
      fireEvent.change(input, { target: { value: "SKU001" } });
      fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    });

    // Picked qty should increment to 1/2
    expect(screen.getByText("1/2")).toBeInTheDocument();
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Đã quét sản phẩm",
        description: expect.stringContaining("1/2"),
      })
    );

    // Scan SKU001 again
    await act(async () => {
      fireEvent.change(input, { target: { value: "SKU001" } });
      fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    });

    // Picked qty should increment to 2/2
    expect(screen.getByText("2/2")).toBeInTheDocument();

    // Scan SKU001 a third time
    await act(async () => {
      fireEvent.change(input, { target: { value: "SKU001" } });
      fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    });

    // Picked qty should remain 2/2 and show "Sản phẩm đã đủ" toast
    expect(screen.getByText("2/2")).toBeInTheDocument();
    expect(mockToast).toHaveBeenLastCalledWith(
      expect.objectContaining({
        title: "Sản phẩm đã đủ",
      })
    );
  });

  it("2. Verify that picking progress is preserved when switching between different orders in the queue", async () => {
    render(
      <PackingDialog
        open={true}
        onOpenChange={vi.fn()}
        orderQueue={[mockOrder1, mockOrder2]}
        allOrders={[mockOrder1, mockOrder2]}
        onPackOrder={vi.fn().mockResolvedValue(undefined)}
      />
    );

    // We are on Order 1
    expect(screen.getByText("Nguyễn Văn A")).toBeInTheDocument();
    expect(screen.getByText("0/2")).toBeInTheDocument();

    // Increment Sản phẩm 1 to 1/2 via SKU scan
    const input = screen.getByPlaceholderText("Quét barcode hoặc nhập mã đơn hàng...");
    await act(async () => {
      fireEvent.change(input, { target: { value: "SKU001" } });
      fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    });
    expect(screen.getByText("1/2")).toBeInTheDocument();

    // Click "Tiếp" button to switch to Order 2
    const nextBtn = screen.getByText("Tiếp");
    await act(async () => {
      fireEvent.click(nextBtn);
    });

    // We should be on Order 2
    expect(screen.getByText("Trần Thị B")).toBeInTheDocument();
    expect(screen.queryByText("Nguyễn Văn A")).not.toBeInTheDocument();
    expect(screen.getByText("0/1")).toBeInTheDocument();

    // Click "Trước" button to switch back to Order 1
    const prevBtn = screen.getByText("Trước");
    await act(async () => {
      fireEvent.click(prevBtn);
    });

    // We should be back on Order 1, and the progress 1/2 should be preserved
    expect(screen.getByText("Nguyễn Văn A")).toBeInTheDocument();
    expect(screen.getByText("1/2")).toBeInTheDocument();
  });

  it("3. Verify that queue progression is correct and does not crash or double deduct stock in local demo mode", async () => {
    const onPackOrderMock = vi.fn().mockResolvedValue(undefined);
    
    const { rerender } = render(
      <PackingDialog
        open={true}
        onOpenChange={vi.fn()}
        orderQueue={[mockOrder1, mockOrder2]}
        allOrders={[mockOrder1, mockOrder2]}
        onPackOrder={onPackOrderMock}
      />
    );

    // Initial state: first order (ORD-001)
    expect(screen.getByText("Nguyễn Văn A")).toBeInTheDocument();

    // Mark all as picked
    const markAllBtn = screen.getByText("Đã đủ hàng");
    await act(async () => {
      fireEvent.click(markAllBtn);
    });

    // Deduct stock is checked by default. Complete packing.
    const completeBtn = screen.getByText("Xác nhận đóng hàng");
    await act(async () => {
      fireEvent.click(completeBtn);
    });

    // Check that transactions are created for ORD-001 (oi-1 qty 2, oi-2 qty 1)
    await waitFor(() => {
      expect(mockCreateLocalInventoryTransaction).toHaveBeenCalledTimes(2);
    });
    expect(mockCreateLocalInventoryTransaction).toHaveBeenNthCalledWith(1, expect.objectContaining({
      product_id: "p-1",
      quantity: 2,
      notes: expect.stringContaining("ORD-001"),
    }));
    expect(mockCreateLocalInventoryTransaction).toHaveBeenNthCalledWith(2, expect.objectContaining({
      product_id: "p-2",
      quantity: 1,
      notes: expect.stringContaining("ORD-001"),
    }));

    // Verify onPackOrder callback was fired for ORD-001
    expect(onPackOrderMock).toHaveBeenCalledWith("ord-1");

    // Queue progression: should switch to Order 2 (Trần Thị B)
    await waitFor(() => {
      expect(screen.getByText("Trần Thị B")).toBeInTheDocument();
    });

    // Clear call history of mocks to test double deduction prevention
    mockCreateLocalInventoryTransaction.mockClear();
    onPackOrderMock.mockClear();

    // Now mock getLocalInventoryTransactions to contain transactions for ORD-002
    mockGetLocalInventoryTransactions.mockReturnValue([
      {
        id: "tx-existing",
        product_id: "p-2",
        transaction_type: "out",
        quantity: 1,
        notes: "Trừ tồn kho - Đơn hàng ORD-002",
      },
    ]);

    // Mark all as picked for Order 2
    const markAllBtn2 = screen.getByText("Đã đủ hàng");
    await act(async () => {
      fireEvent.click(markAllBtn2);
    });

    // Complete packing for Order 2
    const completeBtn2 = screen.getByText("Xác nhận đóng hàng");
    await act(async () => {
      fireEvent.click(completeBtn2);
    });

    // Wait and check if createLocalInventoryTransaction was NOT called for ORD-002 due to double deduction prevention
    await waitFor(() => {
      expect(onPackOrderMock).toHaveBeenCalledWith("ord-2");
    });
    
    // createLocalInventoryTransaction should not have been called because transaction already existed
    expect(mockCreateLocalInventoryTransaction).not.toHaveBeenCalled();
  });
});
