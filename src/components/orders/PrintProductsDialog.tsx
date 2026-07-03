import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Printer,
  Download,
  CheckCircle2,
  ListFilter,
  FileSpreadsheet,
  History,
  QrCode,
  Barcode,
  ChevronDown,
  ChevronRight,
  User,
  Calendar,
  Layers,
  Settings,
  Eye,
  Trash2,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { generateBarcodeSvg } from "@/lib/barcodeGenerator";
import * as XLSX from "@e965/xlsx";

interface OrderItem {
  id: string;
  product_id?: string | null;
  quantity?: number;
  unit_price?: number;
  discount?: number;
  total?: number;
  products?: { name: string; sku: string } | null;
}

interface Order {
  id: string;
  order_number?: string;
  created_at?: string;
  status?: string;
  subtotal?: number | null;
  discount?: number | null;
  voucher_discount?: number | null;
  shipping_fee?: number | null;
  total?: number | null;
  shipping_address?: string | null;
  notes?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_address?: string | null;
  partners?: { name: string; phone?: string; address?: string } | null;
  sales_channels?: { name: string } | null;
  order_items?: OrderItem[];
}

interface PrintProductsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOrders: Order[];
}

interface PrintHistoryItem {
  id: string;
  printed_at: string;
  user_name: string;
  orders_count: number;
  print_type: "sku_list" | "barcode" | "both";
  order_numbers: string[];
  items_summary: { sku: string; name: string; quantity: number }[];
}

export function PrintProductsDialog({
  open,
  onOpenChange,
  selectedOrders,
}: PrintProductsDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("list");

  // Tab 1 States: Column configuration & views
  const [groupBySku, setGroupBySku] = useState(true);
  const [visibleColumns, setVisibleColumns] = useState({
    image: false,
    order_number: true,
    sku: true,
    name: true,
    variant: true,
    quantity: true,
    warehouse: true,
    notes: true,
    barcode: false,
    qr: false,
  });
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Tab 2 States: Barcode configuration
  const [barcodeType, setBarcodeType] = useState<"barcode" | "qr">("barcode");
  const [paperFormat, setPaperFormat] = useState("a4_4"); // a4_4, a4_3, thermal_1
  const [horizontalMargin, setHorizontalMargin] = useState(5); // mm
  const [itemsPerLine, setItemsPerLine] = useState(4);
  const [extraNote, setExtraNote] = useState("");
  const [customQuantities, setCustomQuantities] = useState<Record<string, number>>({});

  // Tab 3 States: Print logs history
  const [printLogs, setPrintLogs] = useState<PrintHistoryItem[]>([]);
  const [selectedLog, setSelectedLog] = useState<PrintHistoryItem | null>(null);

  // Load settings and history from localStorage on open
  useEffect(() => {
    if (open) {
      const stored = localStorage.getItem("erp-mini-print-products-history");
      if (stored) {
        try {
          setPrintLogs(JSON.parse(stored));
        } catch (e) {
          console.error("Error reading print history", e);
        }
      }
      setSelectedLog(null);

      // Load settings
      const savedSettings = localStorage.getItem("erp-mini-print-barcode-settings");
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          if (parsed.barcodeType) setBarcodeType(parsed.barcodeType);
          if (parsed.paperFormat) setPaperFormat(parsed.paperFormat);
          if (parsed.horizontalMargin !== undefined) setHorizontalMargin(parsed.horizontalMargin);
          if (parsed.itemsPerLine !== undefined) setItemsPerLine(parsed.itemsPerLine);
          if (parsed.extraNote !== undefined) setExtraNote(parsed.extraNote);
        } catch (e) {
          console.error("Error reading barcode settings", e);
        }
      }
    }
  }, [open]);

  // Save settings when they change
  useEffect(() => {
    if (open) {
      const settings = {
        barcodeType,
        paperFormat,
        horizontalMargin,
        itemsPerLine,
        extraNote,
      };
      localStorage.setItem("erp-mini-print-barcode-settings", JSON.stringify(settings));
    }
  }, [barcodeType, paperFormat, horizontalMargin, itemsPerLine, extraNote, open]);

  const savePrintLog = useCallback((type: "sku_list" | "barcode" | "both", summaryItems: any[]) => {
    const newLog: PrintHistoryItem = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      printed_at: new Date().toISOString(),
      user_name: "Quản trị viên", // Mock user fallback
      orders_count: selectedOrders.length,
      print_type: type,
      order_numbers: selectedOrders.map(o => o.order_number || o.id),
      items_summary: summaryItems,
    };
    
    setPrintLogs(prev => {
      const updated = [newLog, ...prev].slice(0, 100); // Limit to 100 entries
      localStorage.setItem("erp-mini-print-products-history", JSON.stringify(updated));
      return updated;
    });
  }, [selectedOrders]);

  // Clear a history log item
  const handleDeleteLog = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPrintLogs(prev => {
      const updated = prev.filter(log => log.id !== id);
      localStorage.setItem("erp-mini-print-products-history", JSON.stringify(updated));
      return updated;
    });
    if (selectedLog?.id === id) {
      setSelectedLog(null);
    }
    toast({ title: "Đã xóa lịch sử", description: "Đã xóa vết lịch sử in thành công." });
  };

  // Toggle visible columns
  const toggleColumn = (col: keyof typeof visibleColumns) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [col]: !prev[col],
    }));
  };

  // Toggle expand row for sub-details
  const toggleRowExpand = (sku: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [sku]: !prev[sku],
    }));
  };

  // 1. Process Order Items
  // Detailed items - flat array of order_item entries
  const flatOrderItems = useMemo(() => {
    const items: Array<{
      orderId: string;
      orderNumber: string;
      customerName: string;
      customerPhone: string;
      customerAddress: string;
      orderNotes: string;
      itemId: string;
      productId: string;
      sku: string;
      productName: string;
      quantity: number;
      warehouseName: string;
    }> = [];

    selectedOrders.forEach((order) => {
      const orderItems = order.order_items || [];
      orderItems.forEach((item) => {
        items.push({
          orderId: order.id,
          orderNumber: order.order_number || order.id,
          customerName: order.customer_name || order.partners?.name || "Khách lẻ",
          customerPhone: order.customer_phone || order.partners?.phone || "N/A",
          customerAddress: order.shipping_address || order.customer_address || order.partners?.address || "N/A",
          orderNotes: order.notes || "",
          itemId: item.id,
          productId: item.product_id || "",
          sku: item.products?.sku || "N/A",
          productName: item.products?.name || "Sản phẩm không tên",
          quantity: item.quantity || 0,
          warehouseName: (order as any).warehouses?.name || "Kho mặc định",
        });
      });
    });

    return items;
  }, [selectedOrders]);

  // Grouped items by SKU
  const groupedOrderItems = useMemo(() => {
    const map: Record<
      string,
      {
        sku: string;
        productName: string;
        productId: string;
        totalQuantity: number;
        warehouseName: string;
        orders: Array<{
          orderNumber: string;
          customerName: string;
          customerPhone: string;
          customerAddress: string;
          quantity: number;
          orderNotes: string;
        }>;
      }
    > = {};

    flatOrderItems.forEach((item) => {
      const key = item.sku;
      if (!map[key]) {
        map[key] = {
          sku: item.sku,
          productName: item.productName,
          productId: item.productId,
          totalQuantity: 0,
          warehouseName: item.warehouseName,
          orders: [],
        };
      }
      map[key].totalQuantity += item.quantity;
      map[key].orders.push({
        orderNumber: item.orderNumber,
        customerName: item.customerName,
        customerPhone: item.customerPhone,
        customerAddress: item.customerAddress,
        quantity: item.quantity,
        orderNotes: item.orderNotes,
      });
    });

    return Object.values(map);
  }, [flatOrderItems]);

  // Set default custom quantities for Tab 2 (tem in)
  useEffect(() => {
    const defaults: Record<string, number> = {};
    groupedOrderItems.forEach((item) => {
      defaults[item.sku] = item.totalQuantity;
    });
    setCustomQuantities(defaults);
  }, [groupedOrderItems]);

  // Sync paper format with items per line
  const handlePaperFormatChange = (value: string) => {
    setPaperFormat(value);
    if (value === "a4_4") {
      setItemsPerLine(4);
    } else if (value === "a4_3") {
      setItemsPerLine(3);
    } else if (value === "thermal_1") {
      setItemsPerLine(1);
    }
  };

  // Helper to generate a realistic mock location based on SKU string
  const getMockLocation = (sku: string) => {
    if (!sku || sku === "N/A") {
      return { zone: "Khu A", aisle: "Dãy 01", shelf: "Tầng 01", bin: "Hộp 01" };
    }
    let hash = 0;
    for (let i = 0; i < sku.length; i++) {
      hash = (hash << 5) - hash + sku.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    const absHash = Math.abs(hash);
    const zones = ["Khu A", "Khu B", "Khu C", "Khu D"];
    const zone = zones[absHash % zones.length];
    const aisle = `Dãy ${String((absHash % 4) + 1).padStart(2, "0")}`;
    const shelf = `Tầng ${String((absHash % 5) + 1).padStart(2, "0")}`;
    const bin = `Hộp ${String((absHash % 15) + 1).padStart(2, "0")}`;
    return { zone, aisle, shelf, bin };
  };

  // 2. Export to Excel function
  const handleExportExcel = (withLocation: boolean = false) => {
    if (selectedOrders.length === 0) return;

    let dataToExport: any[] = [];
    if (groupBySku) {
      dataToExport = groupedOrderItems.map((item, idx) => {
        const row: any = {
          "STT": idx + 1,
          "Mã sản phẩm (SKU)": item.sku,
          "Tên sản phẩm": item.productName,
          "Tổng số lượng": item.totalQuantity,
          "Kho xuất": item.warehouseName,
        };

        if (withLocation) {
          const loc = getMockLocation(item.sku);
          row["Khu vực (Zone)"] = loc.zone;
          row["Dãy hàng (Aisle)"] = loc.aisle;
          row["Kệ hàng (Shelf)"] = loc.shelf;
          row["Vị trí hộp (Bin)"] = loc.bin;
        }

        row["Số đơn hàng liên quan"] = item.orders.length;
        row["Chi tiết đơn hàng"] = item.orders
          .map((o) => `${o.orderNumber}(x${o.quantity})`)
          .join(", ");

        return row;
      });
    } else {
      dataToExport = flatOrderItems.map((item, idx) => {
        const row: any = {
          "STT": idx + 1,
          "Mã đơn hàng": item.orderNumber,
          "Mã sản phẩm (SKU)": item.sku,
          "Tên sản phẩm": item.productName,
          "Số lượng": item.quantity,
          "Kho xuất": item.warehouseName,
        };

        if (withLocation) {
          const loc = getMockLocation(item.sku);
          row["Khu vực (Zone)"] = loc.zone;
          row["Dãy hàng (Aisle)"] = loc.aisle;
          row["Kệ hàng (Shelf)"] = loc.shelf;
          row["Vị trí hộp (Bin)"] = loc.bin;
        }

        row["Khách hàng"] = item.customerName;
        row["Số điện thoại"] = item.customerPhone;
        row["Địa chỉ giao hàng"] = item.customerAddress;
        row["Ghi chú đơn"] = item.orderNotes;

        return row;
      });
    }

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, withLocation ? "Danh sach lo ke" : "Danh sach nhap hang");

    // Set column widths
    const maxLens = Object.keys(dataToExport[0] || {}).map((key) => {
      let maxLen = key.length;
      dataToExport.forEach((row) => {
        const val = row[key];
        if (val) {
          maxLen = Math.max(maxLen, String(val).length);
        }
      });
      return { wch: maxLen + 3 };
    });
    ws["!cols"] = maxLens;

    const dateStr = new Date().toLocaleDateString("vi-VN").replace(/\//g, "-");
    const fileName = withLocation
      ? `danh-sach-lo-ke-${dateStr}.xlsx`
      : `danh-sach-pick-hang-${dateStr}.xlsx`;

    XLSX.writeFile(wb, fileName);
    
    toast({
      title: withLocation ? "Xuất Excel Lô - Kệ thành công" : "Xuất Excel thành công",
      description: withLocation
        ? "Đã tải file Excel danh sách sản phẩm kèm vị trí kệ hàng."
        : "Đã tải file Excel danh sách sản phẩm cần nhặt.",
    });
  };

  // 3. Print PDF Pick List function
  const handlePrintPickList = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const tableHeaders = `
      <th>STT</th>
      ${visibleColumns.sku ? "<th>SKU (Mã SP)</th>" : ""}
      ${visibleColumns.name ? "<th>Tên sản phẩm</th>" : ""}
      ${visibleColumns.quantity ? "<th style='text-align:center;'>SL tổng</th>" : ""}
      ${visibleColumns.warehouse ? "<th>Kho xuất</th>" : ""}
      ${groupBySku ? "<th>Chi tiết đơn chứa</th>" : "<th>Mã đơn</th>"}
      ${visibleColumns.notes ? "<th>Ghi chú</th>" : ""}
      ${visibleColumns.barcode ? "<th>Mã vạch</th>" : ""}
      ${visibleColumns.qr ? "<th style='text-align:center;'>QR Code</th>" : ""}
    `;

    let tableRows = "";
    if (groupBySku) {
      groupedOrderItems.forEach((item, idx) => {
        const barcodeSvg = visibleColumns.barcode ? generateBarcodeSvg(item.sku, 150, 45, false) : "";
        const qrContainerId = `qr-${item.sku}`;
        
        tableRows += `
          <tr>
            <td style="text-align:center; font-weight:bold;">${idx + 1}</td>
            ${visibleColumns.sku ? `<td style="font-family:monospace;font-weight:bold;">${item.sku}</td>` : ""}
            ${visibleColumns.name ? `<td>${item.productName}</td>` : ""}
            ${visibleColumns.quantity ? `<td style="text-align:center;font-size:15px;font-weight:bold;color:#2563eb;">${item.totalQuantity}</td>` : ""}
            ${visibleColumns.warehouse ? `<td>${item.warehouseName}</td>` : ""}
            <td>
              <div style="font-size:11px;">
                ${item.orders.map(o => `<b>${o.orderNumber}</b>(x${o.quantity} - ${o.customerName})`).join("<br/>")}
              </div>
            </td>
            ${visibleColumns.notes ? `<td><small style="color:#666">${item.orders.map(o => o.orderNotes).filter(Boolean).join(" | ") || "-"}</small></td>` : ""}
            ${visibleColumns.barcode ? `<td style="padding:4px;text-align:center">${barcodeSvg}</td>` : ""}
            ${visibleColumns.qr ? `<td style="text-align:center;padding:4px"><div class="qr-placeholder" data-val="${item.sku}"></div></td>` : ""}
          </tr>
        `;
      });
    } else {
      flatOrderItems.forEach((item, idx) => {
        const barcodeSvg = visibleColumns.barcode ? generateBarcodeSvg(item.sku, 150, 45, false) : "";
        tableRows += `
          <tr>
            <td style="text-align:center;">${idx + 1}</td>
            ${visibleColumns.sku ? `<td style="font-family:monospace;">${item.sku}</td>` : ""}
            ${visibleColumns.name ? `<td>${item.productName}</td>` : ""}
            ${visibleColumns.quantity ? `<td style="text-align:center;font-weight:bold;">${item.quantity}</td>` : ""}
            ${visibleColumns.warehouse ? `<td>${item.warehouseName}</td>` : ""}
            <td><b>${item.orderNumber}</b><br/><small>${item.customerName} - ${item.customerPhone}</small></td>
            ${visibleColumns.notes ? `<td>${item.orderNotes || "-"}</td>` : ""}
            ${visibleColumns.barcode ? `<td style="padding:4px;text-align:center">${barcodeSvg}</td>` : ""}
            ${visibleColumns.qr ? `<td style="text-align:center;padding:4px"><div class="qr-placeholder" data-val="${item.sku}"></div></td>` : ""}
          </tr>
        `;
      });
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Phiếu Pick Hàng Gom Đơn</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; font-size: 13px; color: #333; }
          .header { text-align: center; margin-bottom: 20px; }
          .header h2 { margin: 0 0 5px; font-size: 20px; text-transform: uppercase; letter-spacing: 0.5px; }
          .header p { margin: 3px 0; color: #666; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; font-size: 11px; font-weight: bold; color: #475569; text-transform: uppercase; }
          td { border: 1px solid #cbd5e1; padding: 8px 10px; line-height: 1.4; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .footer { margin-top: 35px; display: flex; justify-content: space-between; font-size: 11px; color: #666; border-top: 1px dashed #cbd5e1; padding-top: 15px; }
          @media print {
            body { padding: 0; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Danh sách gom sản phẩm đóng gói</h2>
          <p>Thời gian in: ${new Date().toLocaleString("vi-VN")} | Tổng đơn được chọn: ${selectedOrders.length}</p>
          <p>Chế độ: ${groupBySku ? "Gộp theo SKU sản phẩm" : "Tách chi tiết theo từng đơn hàng"}</p>
        </div>
        <table>
          <thead>
            <tr>${tableHeaders}</tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <div class="footer">
          <span>Hệ thống ERP Local Mini</span>
          <span>Thủ kho ký nhận: .......................................</span>
        </div>
      </body>
      </html>
    `);

    // Inject QR codes into printing window dynamically
    if (visibleColumns.qr) {
      const placeholders = printWindow.document.querySelectorAll(".qr-placeholder");
      placeholders.forEach((ph) => {
        const val = ph.getAttribute("data-val") || "";
        // Render QR SVG dynamically inside printing frame
        ph.innerHTML = `<svg width="50" height="50" viewBox="0 0 29 29" xmlns="http://www.w3.org/2000/svg" style="display:inline-block">
          <rect width="100%" height="100%" fill="white"/>
          <path d="M0 0h7v7H0zm1 1v5h5V1zm9-1h1v1h-1zm1 1h1v1h-1zm-2 1h1v1h-1zm3 0h1v1h-1zm-2 1h1v1h-1zm2 1h1v1h-1zm-1 1h1v1h-1zm-1 1h1v1h-1zm2 0h1v1h-1zm9-8h7v7h-7zm1 1v5h5V1zm-17 9h1v1H3zm1 1h1v1H4zm-1 1h1v1H3zm-2 1h1v1H1zm1 1h1v1H2zm3 0h1v1H5zm15-5h1v1h-1zm1 1h1v1h-1zm-2 1h1v1h-1zm3 0h1v1h-1zm-2 1h1v1h-1zm2 1h1v1h-1zm-1 1h1v1h-1zm-1 1h1v1h-1zm2 0h1v1h-1zm-11 5h1v1h-1zm1 1h1v1h-1zm-2 1h1v1h-1zm3 0h1v1h-1zm-2 1h1v1h-1zm2 1h1v1h-1zm-1 1h1v1h-1zm-1 1h1v1h-1zm2 0h1v1h-1zm4-12h7v7h-7zm1 1v5h5v-5zm-5 13h1v1h-1zm6 0h1v1h-1z" fill="black"/>
        </svg>`;
      });
    }

    printWindow.document.close();
    printWindow.focus();
    // Save print logs to Tab 3
    const summaryItems = groupedOrderItems.map(item => ({
      sku: item.sku,
      name: item.productName,
      quantity: item.totalQuantity
    }));
    savePrintLog("sku_list", summaryItems);
    
    // Tiny delay to ensure styles and font are loaded
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // 4. Print Barcode / QR Label function
  const handlePrintBarcodeLabels = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    let labelsHtml = "";
    groupedOrderItems.forEach((item) => {
      const qtyToPrint = customQuantities[item.sku] ?? item.totalQuantity;
      if (qtyToPrint <= 0) return;

      const codeSvg = barcodeType === "barcode" ? generateBarcodeSvg(item.sku, 160, 50, false) : "";
      
      for (let i = 0; i < qtyToPrint; i++) {
        const itemHtml = barcodeType === "barcode" 
          ? `<div class="label-item">
              <div class="prod-name">${item.productName}</div>
              <div class="barcode-svg">${codeSvg}</div>
              <div class="sku-text">${item.sku}</div>
              ${extraNote ? `<div class="extra-note">${extraNote}</div>` : ""}
             </div>`
          : `<div class="label-item qr-label">
              <div class="label-left">
                <div class="prod-name">${item.productName}</div>
                <div class="sku-text">${item.sku}</div>
                ${extraNote ? `<div class="extra-note">${extraNote}</div>` : ""}
              </div>
              <div class="label-right">
                <div class="qr-placeholder" data-val="${item.sku}"></div>
              </div>
             </div>`;
        labelsHtml += itemHtml;
      }
    });

    const isThermal = paperFormat === "thermal_1";
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>In Tem Nhãn Barcode/QR</title>
        <style>
          @page {
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: white;
            color: black;
          }
          .grid-container {
            display: grid;
            grid-template-columns: repeat(${itemsPerLine}, 1fr);
            gap: 4px;
            padding: ${horizontalMargin}mm;
            box-sizing: border-box;
          }
          .label-item {
            border: 1px solid #ccc;
            border-radius: 3px;
            padding: 6px;
            text-align: center;
            box-sizing: border-box;
            background: white;
            height: ${isThermal ? "40mm" : "25mm"};
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            overflow: hidden;
            page-break-inside: avoid;
          }
          .qr-label {
            flex-direction: row;
            justify-content: space-between;
            padding: 6px 12px;
          }
          .label-left {
            text-align: left;
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .prod-name {
            font-size: 10px;
            font-weight: bold;
            line-height: 1.2;
            max-height: 2.4em;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            margin-bottom: 2px;
          }
          .barcode-svg {
            margin: 2px 0;
          }
          .sku-text {
            font-size: 8px;
            font-family: monospace;
            font-weight: bold;
            color: #333;
          }
          .extra-note {
            font-size: 7px;
            color: #666;
            margin-top: 1px;
            border-top: 0.5px dashed #ccc;
            width: 100%;
            text-align: center;
            padding-top: 1px;
          }
          .qr-label .extra-note {
            text-align: left;
          }
          @media print {
            .grid-container {
              padding: ${horizontalMargin}mm;
            }
            .label-item {
              border: 1px solid transparent; /* Hide border when printing to stick properly */
            }
          }
        </style>
      </head>
      <body>
        <div class="grid-container">
          ${labelsHtml}
        </div>
      </body>
      </html>
    `);

    // Inject QR Code SVG for QR type
    if (barcodeType === "qr") {
      const placeholders = printWindow.document.querySelectorAll(".qr-placeholder");
      placeholders.forEach((ph) => {
        const val = ph.getAttribute("data-val") || "";
        ph.innerHTML = `<svg width="45" height="45" viewBox="0 0 29 29" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="white"/>
          <path d="M0 0h7v7H0zm1 1v5h5V1zm9-1h1v1h-1zm1 1h1v1h-1zm-2 1h1v1h-1zm3 0h1v1h-1zm-2 1h1v1h-1zm2 1h1v1h-1zm-1 1h1v1h-1zm-1 1h1v1h-1zm2 0h1v1h-1zm9-8h7v7h-7zm1 1v5h5V1zm-17 9h1v1H3zm1 1h1v1H4zm-1 1h1v1H3zm-2 1h1v1H1zm1 1h1v1H2zm3 0h1v1H5zm15-5h1v1h-1zm1 1h1v1h-1zm-2 1h1v1h-1zm3 0h1v1h-1zm-2 1h1v1h-1zm2 1h1v1h-1zm-1 1h1v1h-1zm-1 1h1v1h-1zm2 0h1v1h-1zm-11 5h1v1h-1zm1 1h1v1h-1zm-2 1h1v1h-1zm3 0h1v1h-1zm-2 1h1v1h-1zm2 1h1v1h-1zm-1 1h1v1h-1zm-1 1h1v1h-1zm2 0h1v1h-1zm4-12h7v7h-7zm1 1v5h5v-5zm-5 13h1v1h-1zm6 0h1v1h-1z" fill="black"/>
        </svg>`;
      });
    }

    printWindow.document.close();
    printWindow.focus();

    // Log print
    const summaryItems = groupedOrderItems.map(item => ({
      sku: item.sku,
      name: item.productName,
      quantity: customQuantities[item.sku] ?? item.totalQuantity
    })).filter(i => i.quantity > 0);
    savePrintLog("barcode", summaryItems);

    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[92vw] w-[92vw] max-h-[92vh] h-[92vh] flex flex-col p-6 bg-white dark:bg-slate-900 rounded-xl overflow-hidden">
        <DialogHeader className="border-b pb-3 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Printer className="h-5 w-5 text-blue-600" />
            In & Gom sản phẩm hàng loạt
            <Badge className="ml-2 bg-blue-500 text-white font-semibold">
              {selectedOrders.length} đơn đã chọn
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Giao diện cấu hình in danh sách nhặt hàng và tem barcode sản phẩm. Giúp nhân viên kho pick hàng nhanh, chính xác.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 mt-4">
          <TabsList className="mb-4 self-start bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <TabsTrigger value="list" className="gap-1.5 text-xs py-1.5">
              <Layers className="h-3.5 w-3.5" />
              In danh sách nhặt hàng
            </TabsTrigger>
            <TabsTrigger value="barcode" className="gap-1.5 text-xs py-1.5">
              <QrCode className="h-3.5 w-3.5" />
              In barcode sản phẩm
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5 text-xs py-1.5">
              <History className="h-3.5 w-3.5" />
              Lịch sử in
            </TabsTrigger>
          </TabsList>

          {/* ==================== TAB 1: IN DANH SÁCH ==================== */}
          <TabsContent value="list" className="flex-1 flex flex-col min-h-0 space-y-4 outline-none">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border flex-shrink-0">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    id="group-sku"
                    checked={groupBySku}
                    onCheckedChange={setGroupBySku}
                  />
                  <Label htmlFor="group-sku" className="text-xs font-semibold cursor-pointer">
                    Gộp theo SKU ({groupedOrderItems.length} dòng)
                  </Label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExportExcel(false)} className="h-8 gap-1.5 text-xs">
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                  Xuất Excel
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExportExcel(true)} className="h-8 gap-1.5 text-xs border-dashed border-orange-500 text-orange-600 hover:text-orange-700 hover:bg-orange-50/50">
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  Xuất Lô - Kệ
                </Button>
                <Button onClick={handlePrintPickList} size="sm" className="h-8 gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                  <Printer className="h-3.5 w-3.5" />
                  In danh sách
                </Button>
              </div>
            </div>

            {/* Main Area: Column configuration & Table Preview */}
            <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0 overflow-hidden">
              {/* Column options side panel */}
              <div className="w-full md:w-56 p-3 bg-slate-50 dark:bg-slate-900 border rounded-xl flex-shrink-0 overflow-y-auto">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                  Cấu hình cột in
                </h4>
                <div className="space-y-2">
                  {Object.keys(visibleColumns).map((col) => (
                    <label
                      key={col}
                      className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={visibleColumns[col as keyof typeof visibleColumns]}
                        onCheckedChange={() => toggleColumn(col as keyof typeof visibleColumns)}
                      />
                      <span className="text-xs text-foreground font-medium capitalize">
                        {col === "image" ? "Hình ảnh" :
                         col === "order_number" ? (groupBySku ? "Đơn hàng chứa" : "Mã đơn") :
                         col === "sku" ? "Mã SKU" :
                         col === "name" ? "Tên sản phẩm" :
                         col === "variant" ? "Biến thể" :
                         col === "quantity" ? "Số lượng" :
                         col === "warehouse" ? "Kho hàng" :
                         col === "notes" ? "Ghi chú đơn" :
                         col === "barcode" ? "Mã vạch" : "Mã QR"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Table Preview container */}
              <div className="flex-1 border rounded-xl overflow-hidden flex flex-col min-h-0 bg-card">
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 z-10 border-b border-border shadow-xs">
                      <tr>
                        {groupBySku && <th className="w-10 text-center p-3"></th>}
                        <th className="w-12 text-center p-3 font-semibold text-muted-foreground">STT</th>
                        {visibleColumns.image && <th className="p-3 font-semibold text-muted-foreground">Hình ảnh</th>}
                        {visibleColumns.sku && <th className="p-3 font-semibold text-muted-foreground">SKU</th>}
                        {visibleColumns.name && <th className="p-3 font-semibold text-muted-foreground">Sản phẩm</th>}
                        {visibleColumns.quantity && <th className="p-3 font-semibold text-muted-foreground text-center">SL</th>}
                        {visibleColumns.warehouse && <th className="p-3 font-semibold text-muted-foreground">Kho hàng</th>}
                        {!groupBySku && <th className="p-3 font-semibold text-muted-foreground">Mã đơn / Khách</th>}
                        {groupBySku && visibleColumns.order_number && <th className="p-3 font-semibold text-muted-foreground">Số đơn</th>}
                        {visibleColumns.notes && <th className="p-3 font-semibold text-muted-foreground">Ghi chú</th>}
                        {visibleColumns.barcode && <th className="p-3 font-semibold text-muted-foreground text-center">Barcode</th>}
                        {visibleColumns.qr && <th className="p-3 font-semibold text-muted-foreground text-center">QR</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {groupBySku ? (
                        groupedOrderItems.map((item, idx) => {
                          const isExpanded = expandedRows[item.sku];
                          return (
                            <>
                              <tr
                                key={item.sku}
                                onClick={() => toggleRowExpand(item.sku)}
                                className="hover:bg-slate-500/5 cursor-pointer transition-colors"
                              >
                                <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 rounded-full"
                                    onClick={() => toggleRowExpand(item.sku)}
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="h-3.5 w-3.5" />
                                    ) : (
                                      <ChevronRight className="h-3.5 w-3.5" />
                                    )}
                                  </Button>
                                </td>
                                <td className="p-3 text-center font-bold">{idx + 1}</td>
                                {visibleColumns.image && (
                                  <td className="p-3">
                                    <div className="w-8 h-8 rounded border bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                                      {item.sku.substring(0, 2)}
                                    </div>
                                  </td>
                                )}
                                {visibleColumns.sku && (
                                  <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                                    {item.sku}
                                  </td>
                                )}
                                {visibleColumns.name && <td className="p-3 font-medium">{item.productName}</td>}
                                {visibleColumns.quantity && (
                                  <td className="p-3 text-center font-bold text-base text-blue-600 dark:text-blue-400">
                                    {item.totalQuantity}
                                  </td>
                                )}
                                {visibleColumns.warehouse && <td className="p-3 text-muted-foreground">{item.warehouseName}</td>}
                                {visibleColumns.order_number && (
                                  <td className="p-3">
                                    <Badge variant="secondary" className="text-[10px] font-bold">
                                      {item.orders.length} đơn
                                    </Badge>
                                  </td>
                                )}
                                {visibleColumns.notes && (
                                  <td className="p-3 max-w-[150px] truncate text-muted-foreground">
                                    {item.orders.map((o) => o.orderNotes).filter(Boolean).join(" | ") || "-"}
                                  </td>
                                )}
                                {visibleColumns.barcode && (
                                  <td className="p-3">
                                    <div className="flex justify-center" dangerouslySetInnerHTML={{ __html: generateBarcodeSvg(item.sku, 110, 32, false) }}></div>
                                  </td>
                                )}
                                {visibleColumns.qr && (
                                  <td className="p-3">
                                    <div className="flex justify-center">
                                      <QRCodeSVG value={item.sku} size={26} />
                                    </div>
                                  </td>
                                )}
                              </tr>
                              {/* Expanded order rows details */}
                              {isExpanded && (
                                <tr>
                                  <td colSpan={12} className="bg-slate-50/50 dark:bg-slate-900/30 p-3">
                                    <div className="pl-8 pr-4 py-2 border-l-2 border-blue-500 space-y-1.5">
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Đơn hàng chứa sản phẩm này:</p>
                                      {item.orders.map((ord, oIdx) => (
                                        <div key={oIdx} className="flex items-center justify-between text-xs bg-white dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                                          <div className="flex items-center gap-3">
                                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{ord.orderNumber}</span>
                                            <span className="text-muted-foreground">|</span>
                                            <span>Khách: <strong className="text-foreground">{ord.customerName}</strong> ({ord.customerPhone})</span>
                                            <span className="text-slate-300">|</span>
                                            <span className="text-muted-foreground truncate max-w-[200px]">{ord.customerAddress}</span>
                                          </div>
                                          <div className="flex items-center gap-4">
                                            {ord.orderNotes && (
                                              <span className="text-[10px] bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900 px-1.5 py-0.5 rounded">
                                                Ghi chú: {ord.orderNotes}
                                              </span>
                                            )}
                                            <Badge className="bg-slate-200 dark:bg-slate-800 text-foreground font-bold">
                                              Số lượng: {ord.quantity}
                                            </Badge>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </>
                          );
                        })
                      ) : (
                        flatOrderItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-500/5 transition-colors">
                            <td className="p-3 text-center">{idx + 1}</td>
                            {visibleColumns.image && (
                              <td className="p-3">
                                <div className="w-8 h-8 rounded border bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                                  {item.sku.substring(0, 2)}
                                </div>
                              </td>
                            )}
                            {visibleColumns.sku && <td className="p-3 font-mono font-bold">{item.sku}</td>}
                            {visibleColumns.name && <td className="p-3">{item.productName}</td>}
                            {visibleColumns.quantity && <td className="p-3 text-center font-bold">{item.quantity}</td>}
                            {visibleColumns.warehouse && <td className="p-3">{item.warehouseName}</td>}
                            <td className="p-3">
                              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{item.orderNumber}</span>
                              <div className="text-[10px] text-muted-foreground mt-0.5">{item.customerName} - {item.customerPhone}</div>
                            </td>
                            {visibleColumns.notes && <td className="p-3 text-muted-foreground">{item.orderNotes || "-"}</td>}
                            {visibleColumns.barcode && (
                              <td className="p-3">
                                <div className="flex justify-center" dangerouslySetInnerHTML={{ __html: generateBarcodeSvg(item.sku, 110, 32, false) }}></div>
                              </td>
                            )}
                            {visibleColumns.qr && (
                              <td className="p-3">
                                <div className="flex justify-center">
                                  <QRCodeSVG value={item.sku} size={26} />
                                </div>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ==================== TAB 2: IN BARCODE TEM NHÃN ==================== */}
          <TabsContent value="barcode" className="flex-1 flex flex-col min-h-0 space-y-4 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0 overflow-hidden">
              {/* Configurations panel */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border rounded-xl flex flex-col space-y-4 overflow-y-auto">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                  Cấu hình in tem nhãn
                </h4>

                <div className="space-y-3.5">
                  {/* Select code type */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Loại mã in</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={barcodeType === "barcode" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setBarcodeType("barcode")}
                        className="flex-1 h-8 text-xs gap-1"
                      >
                        <Barcode className="h-3.5 w-3.5" />
                        Mã vạch (Barcode)
                      </Button>
                      <Button
                        type="button"
                        variant={barcodeType === "qr" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setBarcodeType("qr")}
                        className="flex-1 h-8 text-xs gap-1"
                      >
                        <QrCode className="h-3.5 w-3.5" />
                        Mã QR (QR Code)
                      </Button>
                    </div>
                  </div>

                  {/* Print settings format */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Khổ giấy / Layout</Label>
                    <select
                      value={paperFormat}
                      onChange={(e) => handlePaperFormatChange(e.target.value)}
                      className="w-full text-xs h-8 border rounded-md px-2.5 bg-background focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                      <option value="a4_4">Khổ A4 (4 tem / hàng)</option>
                      <option value="a4_3">Khổ A5/A4 (3 tem / hàng)</option>
                      <option value="thermal_1">Máy in nhiệt K80 (1 tem / hàng)</option>
                    </select>
                  </div>

                  {/* Horizontal margin */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold flex justify-between">
                      <span>Căn lề ngang</span>
                      <span className="font-mono text-muted-foreground">{horizontalMargin} mm</span>
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={40}
                      value={horizontalMargin}
                      onChange={(e) => setHorizontalMargin(Number(e.target.value))}
                      className="h-8 text-xs"
                    />
                  </div>

                  {/* Extra notes */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Ghi chú thêm trên tem</Label>
                    <Input
                      placeholder="Ví dụ: Hàng tặng kèm, tên shop..."
                      value={extraNote}
                      onChange={(e) => setExtraNote(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>

                  {/* Action button */}
                  <Button
                    onClick={handlePrintBarcodeLabels}
                    className="w-full h-9 font-semibold text-xs bg-blue-600 hover:bg-blue-700 text-white gap-2 mt-4"
                  >
                    <Printer className="h-4 w-4" />
                    Bắt đầu in tem nhãn
                  </Button>
                </div>
              </div>

              {/* Preview & Quantity selection panel */}
              <div className="lg:col-span-2 border rounded-xl flex flex-col min-h-0 bg-card overflow-hidden">
                <div className="border-b p-3 bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    Điều chỉnh số lượng & Xem trước
                  </h4>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    Tổng cộng: {Object.values(customQuantities).reduce((a, b) => a + b, 0)} tem sẽ được in
                  </span>
                </div>

                <div className="flex-1 flex flex-col md:flex-row min-h-0 divide-x divide-y md:divide-y-0">
                  {/* Quantity inputs list */}
                  <div className="w-full md:w-64 overflow-y-auto p-3 space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Số lượng in cho mỗi SKU:</p>
                    {groupedOrderItems.map((item) => (
                      <div key={item.sku} className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border text-xs">
                        <div className="flex-1 min-w-0">
                          <p className="font-mono font-bold truncate text-[11px]">{item.sku}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{item.productName}</p>
                        </div>
                        <Input
                          type="number"
                          min={0}
                          value={customQuantities[item.sku] ?? 0}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            setCustomQuantities(prev => ({ ...prev, [item.sku]: val }));
                          }}
                          className="w-16 h-7 text-center text-xs p-1 font-bold"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Print Layout Preview */}
                  <div className="flex-1 overflow-y-auto p-4 bg-slate-100 dark:bg-slate-950 flex flex-col items-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">Bố cục in trên giấy nhãn (Xem trước):</p>
                    
                    <div 
                      className="border shadow-md bg-white dark:bg-slate-900 p-3 rounded w-[95%] max-w-[450px]"
                      style={{
                        paddingLeft: `${horizontalMargin}px`,
                        paddingRight: `${horizontalMargin}px`,
                      }}
                    >
                      <div 
                        className="grid gap-2"
                        style={{
                          gridTemplateColumns: `repeat(${itemsPerLine}, 1fr)`,
                        }}
                      >
                        {groupedOrderItems.map((item) => {
                          const qty = customQuantities[item.sku] ?? item.totalQuantity;
                          if (qty <= 0) return null;
                          
                          // Render 1 preview card per SKU that has qty > 0
                          const previewCode = barcodeType === "barcode" ? (
                            <div className="w-full flex justify-center py-1 select-none pointer-events-none opacity-80" dangerouslySetInnerHTML={{ __html: generateBarcodeSvg(item.sku, 80, 24, false) }}></div>
                          ) : (
                            <div className="w-full flex justify-center py-1 select-none pointer-events-none opacity-80">
                              <QRCodeSVG value={item.sku} size={24} />
                            </div>
                          );

                          return (
                            <div 
                              key={item.sku} 
                              className={`border border-dashed border-slate-300 dark:border-slate-700 p-1.5 flex flex-col justify-center items-center text-center rounded bg-slate-50/20 text-black dark:text-white ${
                                barcodeType === "qr" && itemsPerLine === 1 ? "flex-row justify-between text-left px-3" : ""
                              }`}
                              style={{
                                fontSize: "8px",
                                height: itemsPerLine === 1 ? "60px" : "48px",
                              }}
                            >
                              {barcodeType === "qr" && itemsPerLine === 1 ? (
                                <>
                                  <div className="flex-1 min-w-0 pr-2">
                                    <div className="font-bold truncate text-[8px] max-h-[2em]">{item.productName}</div>
                                    <div className="font-mono text-[7px] mt-0.5">{item.sku}</div>
                                    {extraNote && <div className="text-[6px] text-muted-foreground mt-0.5 border-t border-slate-200 pt-0.5 truncate">{extraNote}</div>}
                                  </div>
                                  <div className="flex-shrink-0">{previewCode}</div>
                                </>
                              ) : (
                                <>
                                  <div className="font-bold text-[8px] truncate w-full max-h-[1.2em]">{item.productName}</div>
                                  {previewCode}
                                  <div className="font-mono text-[7px] font-semibold">{item.sku}</div>
                                  {extraNote && <div className="text-[5px] text-muted-foreground truncate w-full mt-0.5 border-t border-slate-100 pt-0.5">{extraNote}</div>}
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ==================== TAB 3: LỊCH SỬ IN ==================== */}
          <TabsContent value="history" className="flex-1 flex flex-col min-h-0 outline-none">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0 overflow-hidden">
              {/* History list */}
              <div className="border rounded-xl flex flex-col min-h-0 bg-card overflow-hidden">
                <div className="border-b p-3 bg-slate-50 dark:bg-slate-800 flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Danh sách các lần in</span>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-border">
                  {printLogs.length === 0 ? (
                    <div className="text-center py-12 text-xs text-muted-foreground">
                      Không có lịch sử in ấn nào được ghi nhận.
                    </div>
                  ) : (
                    printLogs.map((log) => {
                      const date = new Date(log.printed_at);
                      const isSelected = selectedLog?.id === log.id;
                      return (
                        <div
                          key={log.id}
                          onClick={() => setSelectedLog(log)}
                          className={`p-3 text-xs cursor-pointer hover:bg-slate-500/5 transition-colors flex items-center justify-between ${
                            isSelected ? "bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500" : ""
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground">{log.id.split("-")[0]}...{log.id.slice(-4)}</span>
                              <Badge className={`text-[9px] px-1 py-0 ${
                                log.print_type === "sku_list" ? "bg-blue-100 text-blue-700" :
                                log.print_type === "barcode" ? "bg-purple-100 text-purple-700" :
                                "bg-amber-100 text-amber-700"
                              }`}>
                                {log.print_type === "sku_list" ? "List nhặt" :
                                 log.print_type === "barcode" ? "In tem" : "Cả hai"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-muted-foreground text-[10px]">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {date.toLocaleDateString("vi-VN")} {date.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {log.user_name}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                              {log.orders_count} đơn
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-red-500"
                              onClick={(e) => handleDeleteLog(log.id, e)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Selected log detail view */}
              <div className="md:col-span-2 border rounded-xl flex flex-col min-h-0 bg-card overflow-hidden">
                {selectedLog ? (
                  <>
                    {/* Log detail header */}
                    <div className="p-3 border-b bg-slate-50 dark:bg-slate-800 flex items-center justify-between flex-shrink-0">
                      <div>
                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Chi tiết lần in: {selectedLog.id}
                        </h4>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          In lúc: {new Date(selectedLog.printed_at).toLocaleString("vi-VN")} | Người in: {selectedLog.user_name}
                        </p>
                      </div>
                    </div>

                    {/* Log detail content tables */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {/* Order numbers array list */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Danh sách mã đơn in ({selectedLog.order_numbers.length} đơn):</Label>
                        <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                          {selectedLog.order_numbers.map((num, nIdx) => (
                            <Badge key={nIdx} variant="secondary" className="font-mono text-[10px] font-bold">
                              {num}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Products summary list table */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Danh sách sản phẩm được in tổng hợp:</Label>
                        <div className="border rounded-lg overflow-hidden text-xs">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 dark:bg-slate-800 border-b">
                                <th className="p-2 w-12 text-center">STT</th>
                                <th className="p-2 w-32">Mã SKU</th>
                                <th className="p-2">Tên sản phẩm</th>
                                <th className="p-2 w-20 text-center">Số lượng</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-white dark:bg-slate-900">
                              {selectedLog.items_summary.map((itm, iIdx) => (
                                <tr key={iIdx}>
                                  <td className="p-2 text-center">{iIdx + 1}</td>
                                  <td className="p-2 font-mono font-bold">{itm.sku}</td>
                                  <td className="p-2">{itm.name}</td>
                                  <td className="p-2 text-center font-bold text-blue-600 dark:text-blue-400">{itm.quantity}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center flex-1 py-12 text-center text-muted-foreground">
                    <History className="h-10 w-10 mb-2 opacity-30" />
                    <p className="text-sm">Chọn một dòng lịch sử in để xem chi tiết đối soát.</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
