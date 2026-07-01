import { describe, it, expect } from "vitest";
import { buildSystemDataAuditReport, type SystemAuditSnapshot } from "../systemDataAudit";

// Giả lập dữ liệu hệ thống mặc định để kiểm tra bất thường
const defaultProducts = [
  { id: "prod-sticker", sku: "STICKER", name: "Sticker trang trí", stock_quantity: 1000, cost_price: 1500, selling_price: 5000 },
  { id: "prod-box", sku: "BOX-GIFT", name: "Hộp quà Kraft", stock_quantity: 500, cost_price: 4500, selling_price: 12000 },
  { id: "prod-ribbon", sku: "RIBBON-R", name: "Ruy băng đỏ", stock_quantity: 80, cost_price: 8000, selling_price: 15000 },
  { id: "prod-combo-xmas", sku: "COMBO-XMAS", name: "Combo Quà Giáng Sinh", stock_quantity: 50, cost_price: 18500, selling_price: 49000 }
];

const defaultOrders = [
  {
    id: "ord-init-1",
    order_number: "POS-ORD-001",
    subtotal: 198000,
    total: 198000,
    paid_amount: 198000,
    payment_status: "paid",
    status: "delivered",
    order_items: [
      { id: "item-1", product_id: "prod-combo-xmas", quantity: 4, unit_price: 49500, total: 198000 }
    ]
  },
  {
    id: "ord-init-2",
    order_number: "SO-002",
    subtotal: 75000,
    total: 75000,
    paid_amount: 0,
    payment_status: "unpaid",
    status: "confirmed",
    order_items: [
      { id: "item-2", product_id: "prod-ribbon", quantity: 5, unit_price: 15000, total: 75000 }
    ]
  }
];

const defaultPayments = [
  { id: "tx-init-1", order_id: "ord-init-1", transaction_type: "payment_in", amount: 198000 }
];

const defaultJournalEntries = [
  {
    id: "journal-init-1",
    description: "Doanh thu POS-ORD-001",
    status: "posted",
    journal_lines: [
      { id: "line-dr-1", entry_id: "journal-init-1", debit: 198000, credit: 0 },
      { id: "line-cr-1", entry_id: "journal-init-1", debit: 0, credit: 198000 }
    ]
  }
];

const defaultWarehouseStock = [
  { id: "stock-sticker", product_id: "prod-sticker", warehouse_id: "local-warehouse-default", quantity: 1000 },
  { id: "stock-box", product_id: "prod-box", warehouse_id: "local-warehouse-default", quantity: 500 },
  { id: "stock-ribbon", product_id: "prod-ribbon", warehouse_id: "local-warehouse-default", quantity: 80 },
  { id: "stock-combo-xmas", product_id: "prod-combo-xmas", warehouse_id: "local-warehouse-default", quantity: 50 }
];

describe("Kiểm toán dòng tiền và bất thường hệ thống", () => {
  it("Quét dữ liệu hệ thống mặc định để phát hiện bất thường", () => {
    const snapshot: SystemAuditSnapshot = {
      products: defaultProducts,
      warehouseStock: defaultWarehouseStock,
      orders: defaultOrders,
      payments: defaultPayments,
      journalEntries: defaultJournalEntries,
      journalLines: [],
      productBom: [],
      memberships: [],
      membershipTransactions: []
    };

    const report = buildSystemDataAuditReport(snapshot);

    console.log("=== KẾT QUẢ QUÉT BẤT THƯỜNG DÒNG TIỀN HỆ THỐNG ===");
    console.log(`Thời gian quét: ${report.scannedAt}`);
    console.log(`Điểm tin cậy dữ liệu: ${report.score}%`);
    console.log(`Tổng số phép kiểm: ${report.totalChecks}`);
    console.log(`Số phép kiểm đạt: ${report.okChecks}`);
    console.log(`Số lỗi phát hiện: ${report.errorCount}`);
    console.log(`Số cảnh báo phát hiện: ${report.warningCount}`);
    console.log("==============================================");

    if (report.issues.length === 0) {
      console.log("Chúc mừng! Không phát hiện bất thường dòng tiền hoặc sai lệch dữ liệu nào trong cấu hình mặc định.");
    } else {
      console.log("DANH SÁCH CÁC SAI LỆCH VÀ BẤT THƯỜNG PHÁT HIỆN:");
      report.issues.forEach((issue, index) => {
        console.log(`\n[${index + 1}] Phân hệ: ${issue.module} | Mức độ: ${issue.severity.toUpperCase()}`);
        console.log(`- Vấn đề: ${issue.title}`);
        console.log(`- Chi tiết: ${issue.detail}`);
        console.log(`- Giá trị kỳ vọng (${issue.expectedLabel}): ${issue.expectedValue}`);
        console.log(`- Giá trị thực tế (${issue.actualLabel}): ${issue.actualValue}`);
        console.log(`- Lệch (Delta): ${issue.delta}`);
        console.log(`- Đề xuất khắc phục: ${issue.recommendation}`);
      });
    }
    console.log("==============================================");
    expect(report.errorCount).toBe(0);
  });

  it("Phát hiện bất đồng bộ thẻ thành viên: số dư âm, lệch dòng tiền, trùng số thẻ", () => {
    const snapshot: SystemAuditSnapshot = {
      products: defaultProducts,
      warehouseStock: defaultWarehouseStock,
      orders: defaultOrders,
      payments: defaultPayments,
      journalEntries: defaultJournalEntries,
      journalLines: [],
      productBom: [],
      memberships: [
        { id: "mem-1", partner_id: "cust-1", card_number: "MEM-GOLD-123", balance: -5000, points: 0, status: "active" }, // Lỗi 1: số dư âm
        { id: "mem-2", partner_id: "cust-2", card_number: "MEM-GOLD-123", balance: 10000, points: 0, status: "active" }, // Lỗi 2: Trùng số thẻ với mem-1
        { id: "mem-3", partner_id: "cust-3", card_number: "MEM-SILVER-456", balance: 50000, points: 0, status: "active" } // Lỗi 3: Lệch dòng tiền ví (không giao dịch nào mà số dư bằng 50k)
      ],
      membershipTransactions: [
        { id: "tx-1", membership_id: "mem-1", transaction_type: "deposit", amount: 10000 },
        { id: "tx-2", membership_id: "mem-1", transaction_type: "payment", amount: 15000 } // mem-1 nạp 10k chi 15k -> âm 5k
      ]
    };

    const report = buildSystemDataAuditReport(snapshot);
    
    // Lọc các lỗi liên quan đến ví thành viên
    const membershipIssues = report.issues.filter(issue => issue.module === "Thẻ thành viên");
    expect(membershipIssues.length).toBeGreaterThan(0);
    
    const negativeBalanceIssue = membershipIssues.find(issue => issue.title === "Số dư ví thành viên bị âm");
    expect(negativeBalanceIssue).toBeDefined();
    
    const duplicateCardIssue = membershipIssues.find(issue => issue.title === "Trùng số thẻ thành viên");
    expect(duplicateCardIssue).toBeDefined();

    const imbalanceIssue = membershipIssues.find(issue => issue.title === "Lệch số dư ví so với lịch sử giao dịch");
    expect(imbalanceIssue).toBeDefined();
  });
});
