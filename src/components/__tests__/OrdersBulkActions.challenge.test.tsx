import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Orders from "../../pages/Orders";
import React from "react";

// Mock AuthContext
vi.mock("@/contexts/AuthContext", () => ({
  useAuthContext: () => ({
    user: { id: "test-user-id", email: "test@company.com" },
    session: {},
    loading: false,
    signOut: vi.fn(),
    companyId: "demo-company",
    companyName: "Demo Company",
    role: "admin",
    companyLoading: false,
    companyError: null,
  }),
  AuthProvider: ({ children }: any) => <>{children}</>,
}));

// Mock routers and query hooks
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useLocation: () => ({ state: { searchTerm: "" } }),
  useSearchParams: () => [new URLSearchParams("view=list"), vi.fn()],
  useNavigate: () => mockNavigate,
}));

// Mock permissions
const mockPermissions = {
  getUserRegion: vi.fn().mockReturnValue("Toàn quốc"),
  canCreate: vi.fn().mockReturnValue(true),
  canEdit: vi.fn().mockReturnValue(true),
  canDelete: vi.fn().mockReturnValue(true),
};
vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => mockPermissions,
  getRegionFromProvince: (province: string) => {
    if (province.includes("Hà Nội")) return "Miền Bắc";
    if (province.includes("Đà Nẵng")) return "Miền Trung";
    return "Miền Nam";
  },
}));

// Mock other hooks
vi.mock("@/hooks/useSalesChannels", () => ({
  useSalesChannels: () => ({
    channels: [
      { id: "channel-retail", name: "Bán lẻ", color: "#3B82F6" },
      { id: "channel-shopee", name: "Shopee", color: "#F97316" },
    ],
  }),
}));

vi.mock("@/hooks/useWarehouses", () => ({
  useWarehouses: () => ({
    warehouses: [{ id: "wh-1", name: "Kho chính" }],
  }),
}));

vi.mock("@/hooks/useShippingZones", () => ({
  useShippingZones: () => ({
    shippingZones: [],
  }),
}));

vi.mock("@/contexts/GlobalDateFilterContext", () => ({
  useGlobalDateFilter: () => ({
    startDate: null,
    endDate: null,
  }),
}));

// Mock exportExcel
vi.mock("@/lib/exportExcel", () => ({
  exportOrdersToExcel: vi.fn(),
}));

// Mock localDemoAuth and localInventoryStore
vi.mock("@/lib/localDemoAuth", () => ({
  isLocalDemoAuthEnabled: vi.fn().mockReturnValue(true),
}));

vi.mock("@/lib/localInventoryStore", () => ({
  createLocalInventoryTransaction: vi.fn(),
  getLocalProductBom: vi.fn().mockReturnValue([]),
}));

// Mock toast hook
const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock list of orders
const mockOrders = [
  {
    id: "ord-1",
    order_number: "ORD-001",
    status: "pending",
    total: 150000,
    shipping_fee: 30000,
    customer_name: "Nguyễn Văn An",
    customer_phone: "0912345678",
    payment_method: "cod",
    payment_status: "unpaid",
    source_type: "pos",
    channel_id: "channel-retail",
    warehouse_id: "wh-1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    partners: { name: "Giao Hàng Tiết Kiệm" },
    order_items: [
      {
        id: "item-1",
        product_id: "prod-1",
        quantity: 2,
        unit_price: 60000,
        products: { id: "prod-1", name: "Sản phẩm A", sku: "SKU-A" },
      },
    ],
  },
  {
    id: "ord-2",
    order_number: "ORD-002",
    status: "confirmed",
    total: 200000,
    shipping_fee: 20000,
    customer_name: "Trần Thị Bé",
    customer_phone: "0905123456",
    payment_method: "vietqr",
    payment_status: "paid",
    source_type: "shopee",
    channel_id: "channel-shopee",
    warehouse_id: "wh-1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    partners: null, // "Tự vận chuyển / Chưa chọn"
    order_items: [
      {
        id: "item-2",
        product_id: "prod-2",
        quantity: 1,
        unit_price: 200000,
        products: { id: "prod-2", name: "Sản phẩm B", sku: "SKU-B" },
      },
    ],
  },
  {
    id: "ord-3",
    order_number: "ORD-003",
    status: "delivered",
    total: 300000,
    shipping_fee: 0,
    customer_name: "Lê Văn Cường",
    customer_phone: "0987654321",
    payment_method: "vietqr",
    payment_status: "paid",
    source_type: "facebook",
    channel_id: "channel-retail",
    warehouse_id: "wh-1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    partners: { name: "Giao Hàng Nhanh" },
    order_items: [
      {
        id: "item-3",
        product_id: "prod-1",
        quantity: 1,
        unit_price: 60000,
        products: { id: "prod-1", name: "Sản phẩm A", sku: "SKU-A" },
      },
    ],
  },
];

const mockMutateOrderStatus = vi.fn();

vi.mock("@/hooks/useOrders", () => ({
  useOrders: () => ({
    orders: mockOrders,
    isLoading: false,
    createOrder: { mutateAsync: vi.fn(), isPending: false },
    updateOrderStatus: { mutateAsync: mockMutateOrderStatus, isPending: false },
  }),
}));

describe("Orders page - Bulk Action Bar", () => {
  let mockWindowOpen: any;
  let mockPrint: any;
  let mockWrite: any;
  let mockClose: any;
  let mockFocus: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockWrite = vi.fn();
    mockClose = vi.fn();
    mockFocus = vi.fn();
    mockPrint = vi.fn();

    mockWindowOpen = vi.fn().mockReturnValue({
      document: {
        write: mockWrite,
        close: mockClose,
      },
      focus: mockFocus,
      print: mockPrint,
    });

    vi.spyOn(window, "open").mockImplementation(mockWindowOpen);

    window.Element.prototype.scrollIntoView = vi.fn();
  });

  const setup = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    return render(
      <QueryClientProvider client={queryClient}>
        <Orders />
      </QueryClientProvider>
    );
  };

  it("does not render the bulk action bar when no orders are selected", () => {
    setup();
    expect(screen.queryByText(/đã chọn/i)).not.toBeInTheDocument();
  });

  it("renders the bulk action bar when one or more orders are selected", async () => {
    setup();
    // Select all orders by checking the main header checkbox
    const checkboxes = screen.getAllByRole("checkbox");
    // checkboxes[0] is the select all checkbox in list view
    fireEvent.click(checkboxes[0]);

    // Bulk action bar should show up
    expect(await screen.findByText("3 đã chọn")).toBeInTheDocument();
  });

  it("handles the 'Thao tác' actions correctly (delete, assign, tag)", async () => {
    setup();
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);

    // Wait for bulk bar
    await screen.findByText("3 đã chọn");

    // Select "Thao tác" select trigger
    const selectTrigger = screen.getByText("Thao tác");
    fireEvent.click(selectTrigger);

    // Let's test "Phân công nhân viên"
    const assignOption = await screen.findByText("Phân công nhân viên");
    fireEvent.click(assignOption);

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Đã phân công nhân viên",
        description: expect.stringContaining("Đã phân công 3 đơn hàng"),
      })
    );

    // After action, selected orders are cleared, so the bar is hidden
    expect(screen.queryByText(/đã chọn/i)).not.toBeInTheDocument();

    // Select again
    fireEvent.click(checkboxes[0]);
    await screen.findByText("3 đã chọn");

    // Let's test "Gắn thẻ"
    fireEvent.click(screen.getByText("Thao tác"));
    const tagOption = await screen.findByText("Gắn thẻ");
    fireEvent.click(tagOption);

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Đã cập nhật thẻ",
        description: expect.stringContaining("Đã cập nhật thẻ (tags) cho 3 đơn hàng"),
      })
    );

    // Select again
    fireEvent.click(checkboxes[0]);
    await screen.findByText("3 đã chọn");

    // Let's test "Xóa đơn đã chọn"
    fireEvent.click(screen.getByText("Thao tác"));
    const deleteOption = await screen.findByText("Xóa đơn đã chọn");
    
    // Mock the state changes & deletion behavior
    mockMutateOrderStatus.mockResolvedValueOnce({});
    fireEvent.click(deleteOption);

    // Should call mutateAsync for each of the selected order IDs
    await waitFor(() => {
      expect(mockMutateOrderStatus).toHaveBeenCalledTimes(3);
    });
    expect(mockMutateOrderStatus).toHaveBeenNthCalledWith(1, { id: "ord-1", status: "deleted" });
    expect(mockMutateOrderStatus).toHaveBeenNthCalledWith(2, { id: "ord-2", status: "deleted" });
    expect(mockMutateOrderStatus).toHaveBeenNthCalledWith(3, { id: "ord-3", status: "deleted" });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Đã xóa đơn hàng",
        description: expect.stringContaining("Đã cập nhật trạng thái cho 3 đơn hàng sang \"Đã xóa\""),
      })
    );
  });

  it("stops and reports error if delete mutation fails (mixed order status issue)", async () => {
    setup();
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);

    await screen.findByText("3 đã chọn");

    // Test a failed deletion (e.g. ord-3 is delivered, so transition throws an error)
    mockMutateOrderStatus.mockRejectedValueOnce(new Error("Không thể chuyển trạng thái từ \"delivered\" sang \"deleted\""));

    fireEvent.click(screen.getByText("Thao tác"));
    const deleteOption = await screen.findByText("Xóa đơn đã chọn");
    fireEvent.click(deleteOption);

    await waitFor(() => {
      expect(mockMutateOrderStatus).toHaveBeenCalled();
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Lỗi xóa đơn hàng",
        description: "Không thể chuyển trạng thái từ \"delivered\" sang \"deleted\"",
        variant: "destructive",
      })
    );
  });

  it("verifies printable view - Aggregated Product pick list", async () => {
    setup();
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);

    await screen.findByText("3 đã chọn");

    const printProductsButton = screen.getByText("In sản phẩm");
    fireEvent.click(printProductsButton);

    // Should open window, write aggregated product table, and trigger print
    expect(mockWindowOpen).toHaveBeenCalledTimes(1);
    expect(mockWrite).toHaveBeenCalled();
    expect(mockPrint).toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalled();

    // Verify aggregation:
    // Product A has sku SKU-A: ord-1 (qty 2) + ord-3 (qty 1) = 3 total quantity
    // Product B has sku SKU-B: ord-2 (qty 1) = 1 total quantity
    const writtenHtml = mockWrite.mock.calls[0][0];
    expect(writtenHtml).toContain("DANH SÁCH TỔNG HỢP SẢN PHẨM CẦN NHẶT");
    expect(writtenHtml).toContain("SKU-A");
    expect(writtenHtml).toContain("Sản phẩm A");
    expect(writtenHtml).toContain("SKU-B");
    expect(writtenHtml).toContain("Sản phẩm B");
    
    // Check that quantity 3 for SKU-A and 1 for SKU-B are rendered
    expect(writtenHtml).toContain(">3</td>");
    expect(writtenHtml).toContain(">1</td>");
  });

  it("verifies printable view - Grouped Handover slips", async () => {
    setup();
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);

    await screen.findByText("3 đã chọn");

    const printHandoverButton = screen.getByText("In phiếu bàn giao");
    fireEvent.click(printHandoverButton);

    expect(mockWindowOpen).toHaveBeenCalledTimes(1);
    expect(mockWrite).toHaveBeenCalled();
    expect(mockPrint).toHaveBeenCalled();

    const writtenHtml = mockWrite.mock.calls[0][0];
    expect(writtenHtml).toContain("PHIẾU BÀN GIAO ĐƠN HÀNG HÀNG LOẠT");
    
    // Groups should be:
    // 1. Giao Hàng Tiết Kiệm (ord-1, total 150000)
    // 2. Giao Hàng Nhanh (ord-3, total 300000)
    // 3. Tự vận chuyển / Chưa chọn (ord-2, total 200000)
    expect(writtenHtml).toContain("Đơn vị vận chuyển: Giao Hàng Tiết Kiệm (1 đơn)");
    expect(writtenHtml).toContain("Đơn vị vận chuyển: Giao Hàng Nhanh (1 đơn)");
    expect(writtenHtml).toContain("Đơn vị vận chuyển: Tự vận chuyển / Chưa chọn (1 đơn)");

    expect(writtenHtml).toContain("150.000đ");
    expect(writtenHtml).toContain("300.000đ");
    expect(writtenHtml).toContain("200.000đ");
  });
});
