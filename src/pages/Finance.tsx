import { useState, useEffect, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Wallet,
  Loader2,
  Package,
  ShoppingCart,
  FileText,
  Send,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Settings,
  Link2,
  History,
  QrCode
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinanceStats } from "@/hooks/useFinanceStats";
import { ReconciliationPanel } from "@/components/finance/ReconciliationPanel";
import { FinanceAnomalyAlert } from "@/components/finance/FinanceAnomalyAlert";
import { CassoReconciliation } from "@/components/finance/CassoReconciliation";
import { useGlobalDateFilter } from "@/contexts/GlobalDateFilterContext";
import { useOrders } from "@/hooks/useOrders";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const statusLabels: Record<string, string> = {
  pending: "Chờ xử lý",
  confirmed: "Đã xác nhận",
  processing: "Đang xử lý",
  shipping: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
};

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  confirmed: "bg-info/10 text-info",
  processing: "bg-primary/10 text-primary",
  shipping: "bg-purple-500/10 text-purple-500",
  delivered: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};

interface EInvoice {
  id: string;
  invoice_number: string; // e.g. HD-2026-0001
  order_id: string;
  order_number: string;
  customer_name: string;
  amount: number;
  tax_rate: number; // 8 or 10
  vat_amount: number;
  status: "draft" | "issued" | "failed" | "cancelled";
  issued_at: string;
  provider: string; // "MISA", "VNPT", "Viettel", "BKAV"
  tax_code?: string; // Tax authority code (Mã cơ quan thuế)
}

const PROVIDERS = [
  { value: "MISA", label: "MISA meInvoice" },
  { value: "Viettel", label: "Viettel SInvoicer" },
  { value: "VNPT", label: "VNPT Invoice" },
  { value: "BKAV", label: "BKAV eHoadon" },
];

const TAX_STATUS_LABELS: Record<string, string> = {
  draft: "Bản nháp",
  issued: "Đã phát hành (CQT cấp mã)",
  failed: "Phát hành lỗi",
  cancelled: "Đã hủy hóa đơn",
};

const TAX_STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  issued: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400",
  failed: "bg-red-50 text-red-700 border-red-200",
  cancelled: "bg-orange-50 text-orange-700 border-orange-200",
};

const Finance = () => {
  const { toast } = useToast();
  const { startDate, endDate } = useGlobalDateFilter();
  const { data: stats, isLoading } = useFinanceStats(startDate, endDate);
  const { orders = [] } = useOrders();

  const [activeTab, setActiveTab] = useState("overview");

  // E-Invoices state
  const [eInvoices, setEInvoices] = useState<EInvoice[]>([]);
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("all");
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);

  // New Invoice Form
  const [newInvoice, setNewInvoice] = useState({
    order_id: "",
    tax_rate: 8,
    provider: "MISA",
  });

  useEffect(() => {
    const raw = localStorage.getItem("erp-mini-local-demo-e-invoices");
    if (raw) {
      try {
        setEInvoices(JSON.parse(raw));
      } catch (e) {
        setEInvoices([]);
      }
    } else {
      const defaultInvoices: EInvoice[] = [
        { id: "e-inv-1", invoice_number: "HD-2026-0001", order_id: "order-1", order_number: "DH-1002", customer_name: "Nguyễn Văn A", amount: 250000, tax_rate: 8, vat_amount: 20000, status: "issued", issued_at: "2026-07-01T10:00:00Z", provider: "MISA", tax_code: "CQT-67C1CFE67D55" },
        { id: "e-inv-2", invoice_number: "HD-2026-0002", order_id: "order-2", order_number: "DH-1005", customer_name: "Trần Thị B", amount: 480000, tax_rate: 10, vat_amount: 48000, status: "draft", issued_at: "2026-07-02T09:30:00Z", provider: "Viettel" },
      ];
      setEInvoices(defaultInvoices);
      localStorage.setItem("erp-mini-local-demo-e-invoices", JSON.stringify(defaultInvoices));
    }
  }, []);

  const saveInvoices = (list: EInvoice[]) => {
    setEInvoices(list);
    localStorage.setItem("erp-mini-local-demo-e-invoices", JSON.stringify(list));
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoice.order_id) return;
    const selectedOrder = orders.find((o) => o.id === newInvoice.order_id);
    if (!selectedOrder) return;

    setIsIssuing(true);

    // Simulate digital signature and tax authority connection
    setTimeout(() => {
      const vatAmount = Math.round((Number(selectedOrder.total || 0) * newInvoice.tax_rate) / 100);
      const invoiceNum = `HD-2026-${String(eInvoices.length + 1).padStart(4, "0")}`;
      const taxCode = `CQT-${Math.random().toString(36).substring(2, 14).toUpperCase()}`;

      const created: EInvoice = {
        id: `e-inv-${Date.now()}`,
        invoice_number: invoiceNum,
        order_id: selectedOrder.id,
        order_number: selectedOrder.order_number,
        customer_name: (selectedOrder as any).customer_name || "Khách hàng lẻ",
        amount: Number(selectedOrder.total || 0),
        tax_rate: newInvoice.tax_rate,
        vat_amount: vatAmount,
        status: "issued",
        issued_at: new Date().toISOString(),
        provider: newInvoice.provider,
        tax_code: taxCode,
      };

      saveInvoices([...eInvoices, created]);
      setIsIssuing(false);
      setInvoiceDialogOpen(false);
      setNewInvoice({ order_id: "", tax_rate: 8, provider: "MISA" });

      toast({
        title: "Phát hành hóa đơn thành công",
        description: `Hóa đơn ${invoiceNum} đã được cơ quan thuế cấp mã: ${taxCode}`,
      });
    }, 1500);
  };

  const handleCancelInvoice = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn hủy hóa đơn này? Hóa đơn hủy sẽ gửi thông báo lên cơ quan thuế.")) {
      const updated = eInvoices.map((inv) =>
        inv.id === id ? { ...inv, status: "cancelled" as const } : inv
      );
      saveInvoices(updated);
      toast({ title: "Đã hủy hóa đơn điện tử thành công" });
    }
  };

  // Filter e-invoices
  const filteredInvoices = useMemo(() => {
    return eInvoices.filter((inv) => {
      const matchesSearch =
        inv.invoice_number.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
        inv.order_number.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
        inv.customer_name.toLowerCase().includes(invoiceSearch.toLowerCase());

      const matchesStatus =
        invoiceStatusFilter === "all" || inv.status === invoiceStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [eInvoices, invoiceSearch, invoiceStatusFilter]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString("vi-VN");
  };

  return (
    <MainLayout>
      <Header title="Tài chính" subtitle="Theo dõi dòng tiền, đối soát và hóa đơn điện tử" />

      <div className="p-4 sm:p-6 space-y-6 text-xs text-foreground">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="overview" className="gap-1.5">
              <TrendingUp className="h-4 w-4" /> Tổng quan
            </TabsTrigger>
            <TabsTrigger value="reconciliation" className="gap-1.5">
              <Link2 className="h-4 w-4" /> Đối soát giao dịch
            </TabsTrigger>
            <TabsTrigger value="e_invoices" className="gap-1.5">
              <FileText className="h-4 w-4" /> Hóa đơn điện tử ({eInvoices.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Financial Overview */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              <Card className="p-4 border border-border shadow-none">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-success/10 text-success">
                    <ArrowDownLeft className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Tổng doanh thu</p>
                    <p className="text-lg font-bold text-success">
                      {formatCurrency(stats?.totalRevenue || 0)}
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 border border-border shadow-none">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-destructive/10 text-destructive">
                    <ArrowUpRight className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Giá vốn</p>
                    <p className="text-lg font-bold text-destructive">
                      {formatCurrency(stats?.totalCOGS || 0)}
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 border border-border shadow-none">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Lợi nhuận gộp</p>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(stats?.grossProfit || 0)}
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 border border-border shadow-none">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-info/10 text-info">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Biên lợi nhuận</p>
                    <p className="text-lg font-bold text-info">
                      {(stats?.profitMargin || 0).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 border border-border shadow-none">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-warning/10 text-warning">
                    <ShoppingCart className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Đơn đã giao</p>
                    <p className="text-lg font-bold text-warning">
                      {stats?.deliveredCount || 0}/{stats?.orderCount || 0}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border border-border shadow-none">
                <CardHeader className="p-4 border-b">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider">Doanh thu & Chi phí theo tháng</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="h-[280px]">
                    {stats?.chartData && stats.chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(value) => `${value}M`} />
                          <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} formatter={(value: number) => [`${value}M`, ""]} />
                          <Bar dataKey="revenue" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} name="Doanh thu" />
                          <Bar dataKey="expense" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Chi phí" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">Chưa có dữ liệu</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border shadow-none">
                <CardHeader className="p-4 border-b">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider">Lợi nhuận theo tháng</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="h-[280px]">
                    {stats?.chartData && stats.chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats.chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(value) => `${value}M`} />
                          <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} formatter={(value: number) => [`${value}M`, "Lợi nhuận"]} />
                          <Line type="monotone" dataKey="profit" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ fill: "hsl(var(--primary))", strokeWidth: 1.5 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">Chưa có dữ liệu</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders */}
            <Card className="border border-border shadow-none">
              <CardHeader className="p-4 border-b">
                <CardTitle className="text-xs font-bold uppercase tracking-wider">Đơn hàng gần đây</CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border bg-muted/15">
                      <th className="p-3 font-medium text-muted-foreground">Đơn hàng</th>
                      <th className="p-3 font-medium text-muted-foreground">Kênh</th>
                      <th className="p-3 font-medium text-muted-foreground">Trạng thái</th>
                      <th className="p-3 font-medium text-muted-foreground">Số tiền</th>
                      <th className="p-3 font-medium text-muted-foreground">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats?.recentTransactions?.map((tx) => (
                      <tr key={tx.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                        <td className="p-3 font-medium text-foreground">{tx.description}</td>
                        <td className="p-3">
                          <Badge variant="secondary" className="text-[9px] px-1 py-0">{tx.channel}</Badge>
                        </td>
                        <td className="p-3">
                          <Badge className={cn("text-[9px] px-1 py-0", statusColors[tx.status])}>
                            {statusLabels[tx.status] || tx.status}
                          </Badge>
                        </td>
                        <td className={cn("p-3 font-semibold", tx.status === "delivered" ? "text-success" : "text-foreground")}>
                          {tx.status === "delivered" && "+"}
                          {tx.amount.toLocaleString("vi-VN")}đ
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {new Date(tx.date).toLocaleString("vi-VN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <FinanceAnomalyAlert />
          </TabsContent>

          {/* Tab 2: Reconciliation Panels */}
          <TabsContent value="reconciliation" className="space-y-6">
            <ReconciliationPanel />
            <CassoReconciliation />
          </TabsContent>

          {/* Tab 3: E-Invoices Management */}
          <TabsContent value="e_invoices" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex flex-1 w-full sm:w-auto gap-2 items-center">
                <div className="relative flex-1 sm:max-w-xs">
                  <Input
                    placeholder="Mã hoá đơn, khách hàng..."
                    value={invoiceSearch}
                    onChange={(e) => setInvoiceSearch(e.target.value)}
                    className="h-8"
                  />
                </div>
                <Select value={invoiceStatusFilter} onValueChange={setInvoiceStatusFilter}>
                  <SelectTrigger className="w-[140px] h-8 text-xs bg-white dark:bg-card">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-foreground">
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="draft">Bản nháp</SelectItem>
                    <SelectItem value="issued">Đã phát hành</SelectItem>
                    <SelectItem value="failed">Lỗi</SelectItem>
                    <SelectItem value="cancelled">Đã hủy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" onClick={() => setInvoiceDialogOpen(true)} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                <Send className="h-3.5 w-3.5 mr-1.5" /> Phát hành Hóa đơn
              </Button>
            </div>

            <Card className="border border-border shadow-none">
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b bg-muted/15">
                      <th className="p-3 font-medium text-muted-foreground">Ký hiệu hóa đơn</th>
                      <th className="p-3 font-medium text-muted-foreground">Đơn gốc</th>
                      <th className="p-3 font-medium text-muted-foreground">Khách hàng</th>
                      <th className="p-3 font-medium text-muted-foreground">Giá trị (Thuế VAT)</th>
                      <th className="p-3 font-medium text-muted-foreground">Trạng thái</th>
                      <th className="p-3 font-medium text-muted-foreground">Mã cơ quan thuế</th>
                      <th className="p-3 font-medium text-muted-foreground text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="border-b hover:bg-secondary/15 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-foreground flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-blue-500" />
                            {inv.invoice_number}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {format(new Date(inv.issued_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                          </div>
                        </td>
                        <td className="p-3 font-mono font-semibold text-muted-foreground">{inv.order_number}</td>
                        <td className="p-3 font-semibold text-foreground">{inv.customer_name}</td>
                        <td className="p-3">
                          <div className="font-bold">{inv.amount.toLocaleString("vi-VN")}đ</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            VAT {inv.tax_rate}%: {inv.vat_amount.toLocaleString("vi-VN")}đ ({inv.provider})
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 font-bold", TAX_STATUS_COLORS[inv.status])}>
                            {TAX_STATUS_LABELS[inv.status]}
                          </Badge>
                        </td>
                        <td className="p-3 font-mono text-[10px] text-emerald-600 font-bold">
                          {inv.tax_code ? (
                            <span className="flex items-center gap-1">
                              <QrCode className="h-3 w-3 text-emerald-500" />
                              {inv.tax_code}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/30">—</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {inv.status === "issued" && (
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-orange-500 hover:text-orange-700 font-semibold" onClick={() => handleCancelInvoice(inv.id)}>
                              Hủy HĐ
                            </Button>
                          )}
                          {inv.status === "cancelled" && (
                            <span className="text-[10px] text-muted-foreground">Đã báo hủy</span>
                          )}
                          {inv.status === "draft" && (
                            <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white font-semibold" onClick={() => {
                              setNewInvoice({ order_id: inv.order_id, tax_rate: inv.tax_rate, provider: inv.provider });
                              setInvoiceDialogOpen(true);
                            }}>
                              Phát hành
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredInvoices.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          Không tìm thấy hóa đơn điện tử nào.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <div className="p-4 border rounded-lg bg-secondary/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h4 className="font-bold text-xs mb-1">Cấu hình kết nối Hóa đơn điện tử</h4>
                <p className="text-[10px] text-muted-foreground max-w-xl">
                  ERP Local Mini hỗ trợ kết nối trực tiếp đến các nhà cung cấp hóa đơn được Tổng cục Thuế chứng thực thông qua cổng API. Vui lòng cấu hình chi tiết thông tin chữ ký số HSM trong phần cài đặt doanh nghiệp.
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-8 font-semibold gap-1">
                  <Settings className="h-3.5 w-3.5" /> Thiết lập kết nối
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog: Issue E-Invoice */}
      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent className="max-w-md bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground text-sm font-bold">
              <FileText className="h-4.5 w-4.5 text-blue-600" />
              Ký & Phát hành Hóa đơn Điện tử
            </DialogTitle>
            <DialogDescription className="text-xs">
              Hóa đơn điện tử sẽ được gửi trực tiếp đến hệ thống của Tổng cục Thuế để cấp mã xác thực.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateInvoice} className="space-y-4 text-foreground text-xs">
            <div className="space-y-1">
              <Label className="font-semibold">Chọn Đơn hàng phát hành</Label>
              <Select value={newInvoice.order_id} onValueChange={(val) => setNewInvoice({ ...newInvoice, order_id: val })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Chọn đơn hàng..." /></SelectTrigger>
                <SelectContent className="bg-popover text-foreground z-[140] max-h-[200px] overflow-y-auto">
                  {orders
                    .filter((o) => o.status === "delivered" || (o.status as string) === "paid")
                    .map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.order_number} - {(o as any).customer_name || "Khách lẻ"} ({Number(o.total || 0).toLocaleString("vi-VN")}đ)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="font-semibold">Thuế suất VAT</Label>
                <Select value={String(newInvoice.tax_rate)} onValueChange={(val) => setNewInvoice({ ...newInvoice, tax_rate: Number(val) })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover text-foreground z-[140]">
                    <SelectItem value="8">8% (Thuế giảm)</SelectItem>
                    <SelectItem value="10">10% (Thuế thường)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="font-semibold">Nhà cung cấp hóa đơn</Label>
                <Select value={newInvoice.provider} onValueChange={(val) => setNewInvoice({ ...newInvoice, provider: val })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover text-foreground z-[140]">
                    {PROVIDERS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-[10px]">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600" /> THÔNG TIN CHỮ KÝ SỐ (HSM)
              </span>
              <p className="text-[10px]">
                Hệ thống đang kết nối với Chữ ký số HSM Viettel (Trạng thái: Sẵn sàng). Hóa đơn sau khi phát hành sẽ có hiệu lực pháp lý và không thể sửa đổi nội dung.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setInvoiceDialogOpen(false)} disabled={isIssuing}>Hủy</Button>
              <Button type="submit" disabled={isIssuing || !newInvoice.order_id} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                {isIssuing ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Đang ký số...
                  </>
                ) : (
                  <>
                    Ký & Phát hành HĐ
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Finance;
