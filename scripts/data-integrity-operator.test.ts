import { describe, it } from "vitest";
import { buildSystemDataAuditReport, type SystemAuditSnapshot } from "../src/lib/systemDataAudit";
import * as fs from "fs";
import * as path from "path";

const sampleSnapshot: SystemAuditSnapshot = {
  products: [
    { id: "shirt", sku: "TP001", name: "Finished shirt", stock_quantity: 5, cost_price: 60, selling_price: 80, is_service: false },
    { id: "fabric", sku: "NVL001", name: "Fabric", stock_quantity: 10, cost_price: 30, selling_price: 35, is_service: false },
    { id: "service-consult", sku: "DV001", name: "Tư vấn thiết kế", stock_quantity: 0, cost_price: 0, selling_price: 150, is_service: true }
  ],
  warehouseStock: [
    { id: "stock-shirt", product_id: "shirt", warehouse_id: "main-wh", quantity: 5 },
    { id: "stock-fabric", product_id: "fabric", warehouse_id: "main-wh", quantity: 10 }
  ],
  orders: [
    {
      id: "order-1",
      order_number: "SO-001",
      subtotal: 200,
      total: 200,
      paid_amount: 200,
      payment_status: "paid",
      status: "delivered",
      order_items: [{ id: "line-1", product_id: "shirt", quantity: 2, unit_price: 100, total: 200 }]
    }
  ],
  payments: [
    { id: "payment-1", order_id: "order-1", transaction_type: "payment_in", amount: 200, reference_number: "REF-1001", created_at: "2026-07-17T03:00:00Z" }
  ],
  journalEntries: [
    {
      id: "journal-1",
      description: "SO-001 Balanced Entry",
      status: "posted",
      journal_lines: [
        { id: "line-j1-d", entry_id: "journal-1", debit: 200, credit: 0 },
        { id: "line-j1-c", entry_id: "journal-1", debit: 0, credit: 200 }
      ]
    }
  ],
  journalLines: [],
  productBom: [
    {
      id: "bom-1",
      product_id: "shirt",
      material_id: "fabric",
      quantity: 2,
      product: { id: "shirt", sku: "TP001", name: "Finished shirt", cost_price: 60 },
      material: { id: "fabric", sku: "NVL001", name: "Fabric", cost_price: 30 }
    }
  ],
  memberships: [],
  membershipTransactions: []
};

const anomalySnapshot: SystemAuditSnapshot = {
  ...sampleSnapshot,
  products: [
    { id: "shirt", sku: "TP001", name: "Finished shirt", stock_quantity: 8, cost_price: 60, selling_price: 80, is_service: false }, // Mismatch (8 vs 5)
    { id: "fabric", sku: "NVL001", name: "Fabric", stock_quantity: -2, cost_price: 35, selling_price: 30, is_service: false } // Negative stock
  ]
};

describe("M.A.T.R.I.X Data Integrity Operator", () => {
  it("executes forensic data integrity scan and writes report", () => {
    console.log("==================================================");
    console.log("   M.A.T.R.I.X SYSTEM DATA INTEGRITY OPERATOR    ");
    console.log("==================================================");

    const cleanReport = buildSystemDataAuditReport(sampleSnapshot);
    console.log(`- Clean State Score: ${cleanReport.score}%`);

    const anomalyReport = buildSystemDataAuditReport(anomalySnapshot);
    console.log(`- Anomaly State Score: ${anomalyReport.score}%`);

    // Construct Markdown Report for Artifacts
    let md = `# M.A.T.R.I.X Data Integrity Operator Audit Report\n\n`;
    md += `Thời gian quét: ${new Date().toLocaleString("vi-VN")}\n\n`;
    
    md += `## 1. Trạng thái Hệ thống Đồng bộ (Clean baseline)\n`;
    md += `- **Điểm tin cậy dữ liệu**: ${cleanReport.score}%\n`;
    md += `- **Tổng số phép kiểm**: ${cleanReport.totalChecks}\n`;
    md += `- **Số lỗi**: ${cleanReport.errorCount}\n`;
    md += `- **Số cảnh báo**: ${cleanReport.warningCount}\n\n`;

    md += `## 2. Trạng thái Hệ thống Bất thường (Simulated Anomalies)\n`;
    md += `- **Điểm tin cậy dữ liệu**: ${anomalyReport.score}%\n`;
    md += `- **Tổng số phép kiểm**: ${anomalyReport.totalChecks}\n`;
    md += `- **Số lỗi**: ${anomalyReport.errorCount}\n`;
    md += `- **Số cảnh báo**: ${anomalyReport.warningCount}\n\n`;

    md += `### Danh sách các vấn đề phát hiện:\n\n`;
    md += `| Module | Loại thực thể | ID thực thể | Vấn đề | Mức độ | Khuyến nghị giải quyết |\n`;
    md += `| --- | --- | --- | --- | --- | --- |\n`;
    
    anomalyReport.issues.forEach(issue => {
      md += `| ${issue.module} | ${issue.entityType} | ${issue.entityId} | ${issue.title} | **${issue.severity.toUpperCase()}** | ${issue.recommendation} |\n`;
    });

    const artifactPath = path.join("C:", "Users", "KHOA MEDIA", ".gemini", "antigravity", "brain", "1640b070-1132-4584-95c1-41f2663699bc", "data_integrity_report.md");
    fs.writeFileSync(artifactPath, md, "utf8");
    console.log(`\n[Xong] Đã xuất báo cáo kiểm toán toàn vẹn dữ liệu thành công ra tệp:\n${artifactPath}`);
  });
});
