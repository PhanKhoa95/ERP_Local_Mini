import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Scale,
  Plus,
  Loader2,
  CheckCircle,
  Calendar,
  TrendingUp,
  Percent
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReconciliationItem {
  tracking_code: string;
  order_number?: string;
  order_id?: string;
  actual_cod: number;     // In database
  statement_cod: number;  // In imported file
  actual_ship: number;    // In database
  statement_ship: number; // In imported file
  status: "matched" | "discrepancy" | "not_found";
  details?: string;
}

interface ReconciliationSheet {
  id: string;
  name: string;
  type: "carrier" | "marketplace";
  partner_name: string;
  created_at: string;
  total_orders: number;
  matched_count: number;
  discrepancy_count: number;
  not_found_count: number;
  items: ReconciliationItem[];
  options: {
    accumulate_cod: boolean;
    accumulate_ship: boolean;
  };
}

const LOCAL_SHEETS_KEY = "erp-mini-local-demo-reconciliation-sheets";
const ORDERS_KEY = "erp-mini-local-demo-orders";
const TRANSACTIONS_KEY = "erp-mini-local-demo-payment-transactions";

export function ReconciliationTab() {
  const { toast } = useToast();
  const [sheets, setSheets] = useState<ReconciliationSheet[]>([]);
  const [activeSheet, setActiveSheet] = useState<ReconciliationSheet | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // New sheet form state
  const [sheetName, setSheetName] = useState("");
  const [sheetType, setSheetType] = useState<"carrier" | "marketplace">("carrier");
  const [partnerName, setPartnerName] = useState("GHTK");
  const [accumulateCod, setAccumulateCod] = useState(false);
  const [accumulateShip, setAccumulateShip] = useState(false);
  const [csvContent, setCsvContent] = useState("");
  const [colTracking, setColTracking] = useState("0");
  const [colCod, setColCod] = useState("1");
  const [colShip, setColShip] = useState("2");

  useEffect(() => {
    const raw = localStorage.getItem(LOCAL_SHEETS_KEY);
    if (raw) {
      try {
        setSheets(JSON.parse(raw));
      } catch (e) {
        setSheets([]);
      }
    } else {
      // Seed default sheets
      const seed: ReconciliationSheet[] = [
        {
          id: "sheet-1",
          name: "Đối soát GHTK Kỳ 25",
          type: "carrier",
          partner_name: "GHTK",
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          total_orders: 4,
          matched_count: 3,
          discrepancy_count: 1,
          not_found_count: 0,
          options: { accumulate_cod: false, accumulate_ship: false },
          items: [
            { tracking_code: "GHTK-00129", order_number: "POS-ORD-001", actual_cod: 198000, statement_cod: 198000, actual_ship: 30000, statement_ship: 30000, status: "matched" },
            { tracking_code: "GHTK-00130", order_number: "POS-ORD-002", actual_cod: 350000, statement_cod: 350000, actual_ship: 35000, statement_ship: 35000, status: "matched" },
            { tracking_code: "GHTK-00131", order_number: "POS-ORD-003", actual_cod: 500000, statement_cod: 480000, actual_ship: 40000, statement_ship: 45000, status: "discrepancy", details: "Lệch COD: -20,000đ; Lệch ship: +5,000đ" },
            { tracking_code: "GHTK-00132", order_number: "POS-ORD-004", actual_cod: 120000, statement_cod: 120000, actual_ship: 25000, statement_ship: 25000, status: "matched" },
          ]
        }
      ];
      setSheets(seed);
      localStorage.setItem(LOCAL_SHEETS_KEY, JSON.stringify(seed));
    }
  }, []);

  const saveSheets = (newSheets: ReconciliationSheet[]) => {
    setSheets(newSheets);
    localStorage.setItem(LOCAL_SHEETS_KEY, JSON.stringify(newSheets));
  };

  // Helper: auto-generate demo CSV based on current orders in localStorage
  const loadDemoData = () => {
    const rawOrders = localStorage.getItem(ORDERS_KEY);
    const orders = rawOrders ? JSON.parse(rawOrders) : [];
    
    // Pick first 3 orders or default templates
    const order1 = orders[0] || { order_number: "POS-ORD-001", paid_amount: 198000, total: 198000, shipping_fee: 30000 };
    const order2 = orders[1] || { order_number: "POS-ORD-002", paid_amount: 350000, total: 350000, shipping_fee: 35000 };
    const order3 = orders[2] || { order_number: "POS-ORD-003", paid_amount: 500000, total: 500000, shipping_fee: 40000 };
    
    const tracking1 = order1.tracking_code || order1.order_number || "GHTK-00129";
    const tracking2 = order2.tracking_code || order2.order_number || "GHTK-00130";
    const tracking3 = order3.tracking_code || order3.order_number || "GHTK-00131";

    setSheetName(`Đối soát ${partnerName} ${new Date().toLocaleDateString("vi-VN")}`);
    
    // Create demo statements:
    const cod1 = order1.total || order1.paid_amount || 198000;
    const ship1 = order1.shipping_fee || 30000;
    
    const cod2 = order2.total || order2.paid_amount || 350000;
    const ship2 = (order2.shipping_fee || 35000) + 5000; // 5k higher shipping fee

    const cod3 = (order3.total || order3.paid_amount || 500000) - 20000; // 20k lower COD statement
    const ship3 = order3.shipping_fee || 40000;

    const demoCSV = [
      `${tracking1}, ${cod1}, ${ship1}`,
      `${tracking2}, ${cod2}, ${ship2}`,
      `${tracking3}, ${cod3}, ${ship3}`,
      `GHTK-RANDOM-999, 150000, 20000`
    ].join("\n");

    setCsvContent(demoCSV);
    setColTracking("0");
    setColCod("1");
    setColShip("2");

    toast({
      title: "Đã tải dữ liệu demo mẫu",
      description: "Dữ liệu được nạp khớp với danh sách đơn hàng thực tế của bạn.",
    });
  };

  const handleProcessReconciliation = () => {
    if (!sheetName) {
      toast({ title: "Lỗi", description: "Vui lòng nhập tên đợt đối soát", variant: "destructive" });
      return;
    }
    if (!csvContent.trim()) {
      toast({ title: "Lỗi", description: "Vui lòng nhập dữ liệu đối soát", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Load current orders to match
      const rawOrders = localStorage.getItem(ORDERS_KEY);
      const ordersList = rawOrders ? JSON.parse(rawOrders) : [];

      const lines = csvContent.split("\n");
      const parsedItems: ReconciliationItem[] = [];

      let matched = 0;
      let discrepancy = 0;
      let notFound = 0;

      lines.forEach((line) => {
        const parts = line.split(",").map((p) => p.trim());
        if (parts.length < 2) return;

        const idxTrack = parseInt(colTracking) || 0;
        const idxCod = parseInt(colCod) || 1;
        const idxShip = parseInt(colShip) || 2;

        const trackCode = parts[idxTrack] || "";
        const statCod = parseFloat(parts[idxCod]) || 0;
        const statShip = parts[idxShip] ? parseFloat(parts[idxShip]) : 0;

        if (!trackCode) return;

        // Try matching by tracking_code, or order_number, or platform_order_id
        const order = ordersList.find(
          (o: any) =>
            (o.tracking_code && o.tracking_code === trackCode) ||
            (o.order_number && o.order_number === trackCode) ||
            (o.id && o.id === trackCode)
        );

        if (!order) {
          parsedItems.push({
            tracking_code: trackCode,
            actual_cod: 0,
            statement_cod: statCod,
            actual_ship: 0,
            statement_ship: statShip,
            status: "not_found",
            details: "Không tìm thấy mã vận đơn này trên hệ thống.",
          });
          notFound++;
        } else {
          const actCod = order.total || order.paid_amount || 0;
          const actShip = order.shipping_fee || 0;

          const codDiff = statCod - actCod;
          const shipDiff = statShip - actShip;

          const hasDiff = Math.abs(codDiff) > 1 || Math.abs(shipDiff) > 1;

          if (hasDiff) {
            let detailStr = "";
            if (Math.abs(codDiff) > 1) {
              detailStr += `Lệch COD: ${codDiff > 0 ? "+" : ""}${codDiff.toLocaleString("vi-VN")}đ (ERP: ${actCod.toLocaleString("vi-VN")}đ, File: ${statCod.toLocaleString("vi-VN")}đ). `;
            }
            if (Math.abs(shipDiff) > 1) {
              detailStr += `Lệch ship: ${shipDiff > 0 ? "+" : ""}${shipDiff.toLocaleString("vi-VN")}đ (ERP: ${actShip.toLocaleString("vi-VN")}đ, File: ${statShip.toLocaleString("vi-VN")}đ).`;
            }

            parsedItems.push({
              tracking_code: trackCode,
              order_number: order.order_number,
              order_id: order.id,
              actual_cod: actCod,
              statement_cod: statCod,
              actual_ship: actShip,
              statement_ship: statShip,
              status: "discrepancy",
              details: detailStr,
            });
            discrepancy++;
          } else {
            parsedItems.push({
              tracking_code: trackCode,
              order_number: order.order_number,
              order_id: order.id,
              actual_cod: actCod,
              statement_cod: statCod,
              actual_ship: actShip,
              statement_ship: statShip,
              status: "matched",
            });
            matched++;
          }
        }
      });

      const newSheet: ReconciliationSheet = {
        id: `sheet-${Date.now()}`,
        name: sheetName,
        type: sheetType,
        partner_name: partnerName,
        created_at: new Date().toISOString(),
        total_orders: parsedItems.length,
        matched_count: matched,
        discrepancy_count: discrepancy,
        not_found_count: notFound,
        items: parsedItems,
        options: {
          accumulate_cod: accumulateCod,
          accumulate_ship: accumulateShip,
        },
      };

      const updated = [newSheet, ...sheets];
      saveSheets(updated);
      setActiveSheet(newSheet);
      setDialogOpen(false);
      setIsLoading(false);

      // Reset form
      setSheetName("");
      setCsvContent("");

      toast({
        title: "Đối soát thành công!",
        description: `Kết quả: ${matched} khớp, ${discrepancy} lệch, ${notFound} không tìm thấy.`,
      });
    }, 1500);
  };

  // Perform quick update: update matched orders to PAID and set tags
  const handleApplyOrderUpdates = () => {
    if (!activeSheet) return;

    const rawOrders = localStorage.getItem(ORDERS_KEY);
    const ordersList = rawOrders ? JSON.parse(rawOrders) : [];
    let updatedCount = 0;

    activeSheet.items.forEach((item) => {
      if (item.status === "matched" && item.order_id) {
        const orderIdx = ordersList.findIndex((o: any) => o.id === item.order_id);
        if (orderIdx > -1) {
          ordersList[orderIdx].status = "paid";
          ordersList[orderIdx].payment_status = "paid";
          ordersList[orderIdx].paid_amount = item.statement_cod;
          
          // Add tag
          const currentTags = ordersList[orderIdx].tags ? String(ordersList[orderIdx].tags).split(",") : [];
          if (!currentTags.some(t => t.trim() === "Đã đối soát")) {
            currentTags.push("Đã đối soát");
          }
          ordersList[orderIdx].tags = currentTags.join(", ");
          updatedCount++;
        }
      } else if (item.status === "discrepancy" && item.order_id) {
        const orderIdx = ordersList.findIndex((o: any) => o.id === item.order_id);
        if (orderIdx > -1) {
          const currentTags = ordersList[orderIdx].tags ? String(ordersList[orderIdx].tags).split(",") : [];
          if (!currentTags.some(t => t.trim() === "Đối soát lệch")) {
            currentTags.push("Đối soát lệch");
          }
          ordersList[orderIdx].tags = currentTags.join(", ");
          updatedCount++;
        }
      }
    });

    localStorage.setItem(ORDERS_KEY, JSON.stringify(ordersList));
    
    // Invalidate state triggers order updates in parent components
    window.dispatchEvent(new Event("storage"));

    toast({
      title: "Đã cập nhật trạng thái đơn",
      description: `Đã cập nhật ${updatedCount} đơn hàng thành công / lệch sang Đã thu tiền và gắn tags đối soát tương ứng.`,
    });
  };

  // Generate automated cashflow transaction entries based on reconciliation details
  const handleAutoAccounting = () => {
    if (!activeSheet) return;

    const rawTransactions = localStorage.getItem(TRANSACTIONS_KEY);
    const txList = rawTransactions ? JSON.parse(rawTransactions) : [];
    let codEntriesCount = 0;
    let shipEntriesCount = 0;

    activeSheet.items.forEach((item) => {
      if (item.order_id && item.status !== "not_found") {
        // 1. Create payment_in transaction for COD statement amount (Receipts)
        if (item.statement_cod > 0) {
          const newCodTx = {
            id: `tx-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
            partner_id: "partner-customer-default", // Default or generic customer
            order_id: item.order_id,
            transaction_type: "payment_in",
            amount: item.statement_cod,
            payment_method: "chuyen_khoan",
            reference_number: `COD-${item.tracking_code}`,
            notes: `Thu hộ COD qua đối soát ${activeSheet.partner_name} - ${activeSheet.name}`,
            transaction_date: new Date().toISOString(),
            created_by: "admin",
            created_at: new Date().toISOString(),
            tag: "Tiền hàng",
            hach_toan: true,
            locked: true,
          };
          txList.unshift(newCodTx);
          codEntriesCount++;
        }

        // 2. Create payment_out transaction for shipping fee statement amount (Expenditures)
        if (item.statement_ship > 0) {
          const newShipTx = {
            id: `tx-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
            partner_id: "partner-supplier-default",
            order_id: item.order_id,
            transaction_type: "payment_out",
            amount: item.statement_ship,
            payment_method: "chuyen_khoan",
            reference_number: `SHIP-${item.tracking_code}`,
            notes: `Phí vận chuyển qua đối soát ${activeSheet.partner_name} - ${activeSheet.name}`,
            transaction_date: new Date().toISOString(),
            created_by: "admin",
            created_at: new Date().toISOString(),
            tag: "Vận chuyển",
            hach_toan: true,
            locked: true,
          };
          txList.unshift(newShipTx);
          shipEntriesCount++;
        }
      }
    });

    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(txList));
    window.dispatchEvent(new Event("storage"));

    toast({
      title: "Đã hạch toán thành công",
      description: `Đã tự động tạo ${codEntriesCount} phiếu thu COD và ${shipEntriesCount} phiếu chi phí vận chuyển trong sổ quỹ thu chi.`,
    });
  };

  const handleDeleteSheet = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sheets.filter((s) => s.id !== id);
    saveSheets(updated);
    if (activeSheet?.id === id) {
      setActiveSheet(updated[0] || null);
    }
    toast({ title: "Đã xóa phiếu đối soát" });
  };

  // Stats
  const totalReconciled = sheets.reduce((sum, s) => sum + s.total_orders, 0);
  const matchedRate = totalReconciled > 0 
    ? Math.round((sheets.reduce((sum, s) => sum + s.matched_count, 0) / totalReconciled) * 100) 
    : 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sidebar: List of sheets & Stats */}
      <div className="lg:col-span-1 space-y-4">
        {/* Stats Card */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border-blue-500/15 shadow-none">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <Scale className="h-4 w-4" /> Tổng quan đối soát
              </span>
              <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-mono text-[10px]">
                ERP Local
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-muted-foreground text-[10px] block">ĐÃ ĐỐI SOÁT</span>
                <span className="text-xl font-bold text-foreground font-mono">{totalReconciled}</span>
                <span className="text-[10px] text-muted-foreground"> đơn hàng</span>
              </div>
              <div>
                <span className="text-muted-foreground text-[10px] block">TỶ LỆ KHỚP</span>
                <span className="text-xl font-bold text-emerald-600 font-mono flex items-center gap-1">
                  {matchedRate}% <Percent className="h-3 w-3" />
                </span>
                <span className="text-[10px] text-emerald-600 font-medium"> độ chính xác</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* List Sheets Card */}
        <Card className="shadow-none">
          <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-foreground">Lịch sử đối soát</CardTitle>
            <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1" onClick={() => setDialogOpen(true)}>
              <Plus className="h-3 w-3" /> Tạo mới
            </Button>
          </CardHeader>
          <CardContent className="p-2 space-y-1 max-h-[350px] overflow-y-auto">
            {sheets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-xs">
                Chưa có phiếu đối soát nào.
              </div>
            ) : (
              sheets.map((sheet) => (
                <div
                  key={sheet.id}
                  onClick={() => setActiveSheet(sheet)}
                  className={cn(
                    "flex flex-col p-3 rounded-lg cursor-pointer transition-colors text-xs border",
                    activeSheet?.id === sheet.id
                      ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-foreground"
                      : "bg-transparent border-transparent hover:bg-secondary/40 text-muted-foreground"
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-foreground truncate max-w-[150px]">{sheet.name}</span>
                    <Badge variant="outline" className="text-[8px] px-1 py-0 font-bold bg-white dark:bg-card">
                      {sheet.partner_name}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(sheet.created_at).toLocaleDateString("vi-VN")}</span>
                    </div>
                    <div className="flex items-center gap-1 font-semibold text-foreground">
                      <span className="text-emerald-600">{sheet.matched_count} K</span>
                      <span>·</span>
                      <span className="text-amber-500">{sheet.discrepancy_count} L</span>
                      <span>·</span>
                      <button 
                        onClick={(e) => handleDeleteSheet(sheet.id, e)}
                        className="text-red-500 hover:text-red-700 ml-1.5 font-normal"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Details Panel */}
      <div className="lg:col-span-2 space-y-4">
        {activeSheet ? (
          <Card className="shadow-none">
            <CardHeader className="p-4 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-md font-bold text-foreground">{activeSheet.name}</CardTitle>
                    <Badge className="text-[9px] font-bold px-1.5 py-0 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      {activeSheet.type === "carrier" ? "Đơn vị vận chuyển" : "Sàn TMĐT"}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Tạo lúc {new Date(activeSheet.created_at).toLocaleString("vi-VN")} · Đơn vị: {activeSheet.partner_name}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" className="h-8 text-xs font-semibold" onClick={handleApplyOrderUpdates}>
                    Cập nhật Đơn
                  </Button>
                  <Button size="sm" className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold" onClick={handleAutoAccounting}>
                    <TrendingUp className="h-3.5 w-3.5 mr-1" /> Hạch toán Thu chi
                  </Button>
                </div>
              </div>

              {/* Stat badges */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/15 p-2.5 rounded-lg text-center">
                  <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-medium block">THÀNH CÔNG (KHỚP)</span>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {activeSheet.matched_count}
                  </span>
                </div>
                <div className="bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/15 p-2.5 rounded-lg text-center">
                  <span className="text-amber-600 dark:text-amber-400 text-[10px] font-medium block">LỆCH SỐ LIỆU</span>
                  <span className="text-lg font-bold text-amber-600 dark:text-amber-400 font-mono">
                    {activeSheet.discrepancy_count}
                  </span>
                </div>
                <div className="bg-destructive/10 dark:bg-destructive/20 border border-destructive/15 p-2.5 rounded-lg text-center">
                  <span className="text-destructive text-[10px] font-medium block">KHÔNG TÌM THẤY ĐƠN</span>
                  <span className="text-lg font-bold text-destructive font-mono">
                    {activeSheet.not_found_count}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/30 text-muted-foreground">
                      <th className="p-3 text-left font-medium">Mã vận đơn / Đơn hàng</th>
                      <th className="p-3 text-right font-medium">COD (ERP / Đối soát)</th>
                      <th className="p-3 text-right font-medium">Phí Ship (ERP / Đối soát)</th>
                      <th className="p-3 text-center font-medium">Kết quả</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeSheet.items.map((item, i) => (
                      <tr key={i} className="border-b hover:bg-secondary/20 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-foreground font-mono">{item.tracking_code}</div>
                          {item.order_number && (
                            <div className="text-[10px] text-muted-foreground">Mã ERP: {item.order_number}</div>
                          )}
                          {item.details && (
                            <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-semibold">
                              {item.details}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="font-mono">{item.actual_cod.toLocaleString("vi-VN")}đ</div>
                          <div className="text-[10px] text-muted-foreground font-mono">File: {item.statement_cod.toLocaleString("vi-VN")}đ</div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="font-mono">{item.actual_ship.toLocaleString("vi-VN")}đ</div>
                          <div className="text-[10px] text-muted-foreground font-mono">File: {item.statement_ship.toLocaleString("vi-VN")}đ</div>
                        </td>
                        <td className="p-3 text-center">
                          {item.status === "matched" && (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] px-1.5 py-0">
                              Khớp 100%
                            </Badge>
                          )}
                          {item.status === "discrepancy" && (
                            <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[9px] px-1.5 py-0">
                              Lệch số liệu
                            </Badge>
                          )}
                          {item.status === "not_found" && (
                            <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[9px] px-1.5 py-0">
                              Không tìm thấy
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-16 border border-dashed rounded-lg bg-card text-muted-foreground flex flex-col items-center justify-center">
            <Scale className="h-12 w-12 opacity-30 mb-3" />
            <h4 className="font-bold text-foreground mb-1 text-sm">Chưa chọn đợt đối soát</h4>
            <p className="text-xs max-w-xs text-muted-foreground">
              Vui lòng chọn đợt đối soát cũ từ danh sách lịch sử bên trái hoặc tạo mới một đợt để bắt đầu.
            </p>
          </div>
        )}
      </div>

      {/* Dialog: Create Reconciliation Sheet */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Scale className="h-5 w-5 text-blue-600" /> Tạo phiếu đối soát mới
            </DialogTitle>
            <DialogDescription>
              Nhập thông tin đối tác và dán dữ liệu CSV để chạy thuật toán đối soát tự động.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3 text-xs text-foreground">
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="sheetName" className="font-semibold">Tên đợt đối soát</Label>
                <Input
                  id="sheetName"
                  placeholder="Ví dụ: Đối soát GHTK Kỳ 26"
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-semibold">Hình thức</Label>
                  <Select
                    value={sheetType}
                    onValueChange={(val: any) => {
                      setSheetType(val);
                      setPartnerName(val === "carrier" ? "GHTK" : "Shopee");
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover z-[100]">
                      <SelectItem value="carrier">Đơn vị vận chuyển</SelectItem>
                      <SelectItem value="marketplace">Sàn TMĐT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="font-semibold">Đơn vị</Label>
                  <Select value={partnerName} onValueChange={setPartnerName}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover z-[100]">
                      {sheetType === "carrier" ? (
                        <>
                          <SelectItem value="GHTK">Giaohangtietkiem (GHTK)</SelectItem>
                          <SelectItem value="GHN">Giaohangnhanh (GHN)</SelectItem>
                          <SelectItem value="Viettel Post">Viettel Post</SelectItem>
                          <SelectItem value="VNPost">VNPost</SelectItem>
                          <SelectItem value="J&T Express">J&T Express</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="Shopee">Shopee</SelectItem>
                          <SelectItem value="Lazada">Lazada</SelectItem>
                          <SelectItem value="TikTok Shop">TikTok Shop</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2.5 border p-3 rounded-lg bg-secondary/25">
                <span className="font-bold text-[10px] block text-muted-foreground mb-1">CẤU HÌNH CỘT (CSV 0-INDEX)</span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Cột Mã Vận Đơn</Label>
                    <Input className="h-8" value={colTracking} onChange={(e) => setColTracking(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Cột Tiền COD</Label>
                    <Input className="h-8" value={colCod} onChange={(e) => setColCod(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Cột Phí Ship</Label>
                    <Input className="h-8" value={colShip} onChange={(e) => setColShip(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="space-y-2 border p-3 rounded-lg bg-secondary/15">
                <span className="font-bold text-[10px] block text-muted-foreground">TÙY CHỌN NGHIỆP VỤ</span>
                <div className="flex items-center gap-2">
                  <Checkbox id="accCod" checked={accumulateCod} onCheckedChange={(val) => setAccumulateCod(!!val)} />
                  <Label htmlFor="accCod" className="text-[11px] font-medium leading-none cursor-pointer">
                    Cộng dồn với COD hiện tại
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="accShip" checked={accumulateShip} onCheckedChange={(val) => setAccumulateShip(!!val)} />
                  <Label htmlFor="accShip" className="text-[11px] font-medium leading-none cursor-pointer">
                    Cộng dồn với phí ship hiện tại
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-3 flex flex-col h-full">
              <div className="flex items-center justify-between">
                <Label htmlFor="csvArea" className="font-semibold">Dữ liệu đối soát (CSV)</Label>
                <Button size="sm" variant="outline" className="h-6 text-[10px] border-dashed text-blue-600 hover:text-blue-700" onClick={loadDemoData}>
                  Tải dữ liệu mẫu
                </Button>
              </div>
              <Textarea
                id="csvArea"
                placeholder="Dán dữ liệu Excel/CSV tại đây. Dạng: Mã_Vận_Đơn, Tiền_COD, Phí_Ship. Ví dụ:&#13;GHTK-00129, 198000, 30000"
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                className="flex-1 min-h-[220px] font-mono text-[11px]"
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isLoading}>
              Hủy bỏ
            </Button>
            <Button onClick={handleProcessReconciliation} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold min-w-[120px]">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Chạy đối soát"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
