import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Loader2,
  TrendingUp,
  Users,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  FileText,
  Download,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { usePaymentTransactions } from "@/hooks/usePaymentTransactions";
import { usePartners } from "@/hooks/usePartners";
import { format, differenceInDays } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatCurrency = (value: number) => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toLocaleString("vi-VN");
};

const getAgingBucket = (dateStr: string): string => {
  const days = differenceInDays(new Date(), new Date(dateStr));
  if (days <= 30) return "0–30 ngày";
  if (days <= 60) return "31–60 ngày";
  if (days <= 90) return "61–90 ngày";
  return "> 90 ngày";
};

const agingColor: Record<string, string> = {
  "0–30 ngày": "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  "31–60 ngày": "bg-amber-500/10 text-amber-600 border-amber-500/20",
  "61–90 ngày": "bg-orange-500/10 text-orange-600 border-orange-500/20",
  "> 90 ngày": "bg-destructive/10 text-destructive border-destructive/20",
};

const txTypeLabel: Record<string, string> = {
  receivable: "Ghi nợ KH",
  payable: "Ghi nợ NCC",
  payment_in: "Thu tiền",
  payment_out: "Chi tiền",
};

const txTypeColor: Record<string, string> = {
  receivable: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  payable: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  payment_in: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  payment_out: "bg-red-500/10 text-red-600 border-red-500/20",
};

const AGING_COLORS = ["#10b981", "#f59e0b", "#f97316", "#ef4444"];

// ─── Component ──────────────────────────────────────────────────────────────

const DebtReport = () => {
  const { transactions, isLoading, debtSummary } = usePaymentTransactions();
  const { customers, suppliers } = usePartners();

  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPartner, setSelectedPartner] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [debtView, setDebtView] = useState<"receivable" | "payable">("receivable");

  // ── Totals ──────────────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const receivable = debtSummary
      .filter((p) => p.partner_type === "customer" || p.partner_type === "both")
      .reduce((s, p) => s + Math.abs(Number(p.debt_amount) || 0), 0);
    const payable = debtSummary
      .filter((p) => p.partner_type === "supplier" || p.partner_type === "both")
      .reduce((s, p) => s + Math.abs(Number(p.debt_amount) || 0), 0);
    const overdue = debtSummary
      .filter((p) => {
        const days = differenceInDays(new Date(), new Date(p.created_at || new Date()));
        return days > 30 && Number(p.debt_amount) > 0;
      })
      .reduce((s, p) => s + Math.abs(Number(p.debt_amount) || 0), 0);
    return { receivable, payable, net: receivable - payable, overdue };
  }, [debtSummary]);

  // ── Aging buckets for chart ──────────────────────────────────────────────
  const agingData = useMemo(() => {
    const buckets: Record<string, number> = {
      "0–30 ngày": 0,
      "31–60 ngày": 0,
      "61–90 ngày": 0,
      "> 90 ngày": 0,
    };
    transactions
      .filter((t) => t.transaction_type === "receivable" || t.transaction_type === "payable")
      .forEach((t) => {
        const bucket = getAgingBucket(t.transaction_date);
        buckets[bucket] += Math.abs(Number(t.amount) || 0) / 1_000_000;
      });
    return Object.entries(buckets).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(1)) }));
  }, [transactions]);

  // ── Monthly trend ────────────────────────────────────────────────────────
  const monthlyData = useMemo(() => {
    const map = new Map<string, { thu: number; chi: number }>();
    transactions.forEach((t) => {
      const m = format(new Date(t.transaction_date), "MM/yy");
      const cur = map.get(m) || { thu: 0, chi: 0 };
      if (t.transaction_type === "payment_in") cur.thu += Number(t.amount) / 1_000_000;
      if (t.transaction_type === "payment_out") cur.chi += Number(t.amount) / 1_000_000;
      map.set(m, cur);
    });
    return [...map.entries()]
      .map(([month, v]) => ({
        month,
        thu: parseFloat(v.thu.toFixed(1)),
        chi: parseFloat(v.chi.toFixed(1)),
      }))
      .slice(-6);
  }, [transactions]);

  // ── Filtered transactions ────────────────────────────────────────────────
  const filteredTx = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch =
        !searchTerm ||
        t.partners?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.partners?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.reference_number?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchPartner = selectedPartner === "all" || t.partner_id === selectedPartner;
      const matchType = selectedType === "all" || t.transaction_type === selectedType;
      return matchSearch && matchPartner && matchType;
    });
  }, [transactions, searchTerm, selectedPartner, selectedType]);

  // ── Debt list filtered ───────────────────────────────────────────────────
  const filteredDebt = useMemo(() => {
    const isCustomer = debtView === "receivable";
    return debtSummary
      .filter((p) =>
        isCustomer
          ? p.partner_type === "customer" || p.partner_type === "both"
          : p.partner_type === "supplier" || p.partner_type === "both"
      )
      .filter((p) =>
        !searchTerm ||
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => Math.abs(Number(b.debt_amount)) - Math.abs(Number(a.debt_amount)));
  }, [debtSummary, debtView, searchTerm]);

  if (isLoading) {
    return (
      <MainLayout>
        <Header title="Công nợ" subtitle="Phải thu · Phải trả · Đối soát" />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Header
        title="Công nợ"
        subtitle="Theo dõi tiền khách còn nợ và tiền shop còn nợ nhà cung cấp — đối soát từng phiếu"
      />

      <div className="p-4 sm:p-6 space-y-6">

        {/* ── KPI Cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Phải thu */}
          <Card className="p-4 border-l-4 border-l-blue-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Phải thu (KH nợ)</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(totals.receivable)}đ</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {debtSummary.filter((p) => p.partner_type === "customer").length} khách hàng
                </p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <ArrowDownLeft className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </Card>

          {/* Phải trả */}
          <Card className="p-4 border-l-4 border-l-amber-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Phải trả (nợ NCC)</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(totals.payable)}đ</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {debtSummary.filter((p) => p.partner_type === "supplier").length} nhà cung cấp
                </p>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10">
                <ArrowUpRight className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </Card>

          {/* Công nợ ròng */}
          <Card className="p-4 border-l-4 border-l-emerald-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Công nợ ròng</p>
                <p className={cn(
                  "text-2xl font-bold mt-1",
                  totals.net >= 0 ? "text-emerald-600" : "text-destructive"
                )}>
                  {totals.net >= 0 ? "+" : "-"}{formatCurrency(Math.abs(totals.net))}đ
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {totals.net >= 0 ? "▲ Có lợi" : "▼ Cần chú ý"}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </Card>

          {/* Quá hạn */}
          <Card className="p-4 border-l-4 border-l-red-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Quá hạn &gt; 30 ngày</p>
                <p className="text-2xl font-bold text-destructive mt-1">{formatCurrency(totals.overdue)}đ</p>
                <p className="text-xs text-muted-foreground mt-1">Cần ưu tiên xử lý</p>
              </div>
              <div className="p-2 rounded-lg bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </Card>
        </div>

        {/* ── Charts Row ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tuổi nợ */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Phân tích tuổi nợ</CardTitle>
              <CardDescription className="text-xs">Phân bổ nợ theo thời gian tồn đọng (triệu đồng)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                {agingData.some((d) => d.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={agingData} barSize={40}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="name" fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tickFormatter={(v) => `${v}M`} fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip formatter={(v: number) => [`${v}M`, "Công nợ"]} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {agingData.map((_, i) => (
                          <Cell key={i} fill={AGING_COLORS[i % AGING_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    Không có dữ liệu tuổi nợ
                  </div>
                )}
              </div>
              {/* Legend */}
              <div className="flex flex-wrap gap-2 mt-2">
                {["0–30 ngày", "31–60 ngày", "61–90 ngày", "> 90 ngày"].map((label, i) => (
                  <span key={label} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: AGING_COLORS[i] }} />
                    {label}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Thu chi theo tháng */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Thu chi theo tháng</CardTitle>
              <CardDescription className="text-xs">6 tháng gần nhất (triệu đồng)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} barCategoryGap="30%">
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="month" fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tickFormatter={(v) => `${v}M`} fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip formatter={(v: number) => [`${v.toFixed(1)}M`]} />
                      <Bar dataKey="thu" name="Thu tiền" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="chi" name="Chi tiền" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    Chưa có dữ liệu giao dịch
                  </div>
                )}
              </div>
              <div className="flex gap-4 mt-2">
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block bg-emerald-500" />Thu tiền
                </span>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block bg-red-500" />Chi tiền
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Main Tabs ─────────────────────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="overview" className="text-xs gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Danh sách công nợ
              </TabsTrigger>
              <TabsTrigger value="transactions" className="text-xs gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Lịch sử giao dịch
              </TabsTrigger>
              <TabsTrigger value="reconcile" className="text-xs gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" /> Đối soát phiếu
              </TabsTrigger>
            </TabsList>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <Download className="h-3.5 w-3.5" /> Xuất Excel
            </Button>
          </div>

          {/* ── TAB 1: Danh sách công nợ ──────────────────────────────── */}
          <TabsContent value="overview" className="space-y-4">
            {/* Sub-toggle: Phải thu / Phải trả */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => setDebtView("receivable")}
                  className={cn(
                    "px-4 py-1.5 text-xs font-semibold transition-colors",
                    debtView === "receivable"
                      ? "bg-blue-600 text-white"
                      : "bg-background text-muted-foreground hover:bg-muted"
                  )}
                >
                  <ArrowDownLeft className="h-3 w-3 inline mr-1" />
                  Phải thu ({debtSummary.filter((p) => p.partner_type === "customer").length})
                </button>
                <button
                  onClick={() => setDebtView("payable")}
                  className={cn(
                    "px-4 py-1.5 text-xs font-semibold transition-colors border-l border-border",
                    debtView === "payable"
                      ? "bg-amber-500 text-white"
                      : "bg-background text-muted-foreground hover:bg-muted"
                  )}
                >
                  <ArrowUpRight className="h-3 w-3 inline mr-1" />
                  Phải trả ({debtSummary.filter((p) => p.partner_type === "supplier").length})
                </button>
              </div>
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder={debtView === "receivable" ? "Tìm khách hàng..." : "Tìm nhà cung cấp..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-8 text-xs"
                />
              </div>
            </div>

            <Card className="border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs w-8">#</TableHead>
                    <TableHead className="text-xs">Mã</TableHead>
                    <TableHead className="text-xs">
                      {debtView === "receivable" ? "Khách hàng" : "Nhà cung cấp"}
                    </TableHead>
                    <TableHead className="text-xs">Tuổi nợ</TableHead>
                    <TableHead className="text-xs text-right">Tổng chi tiêu</TableHead>
                    <TableHead className="text-xs text-right">Đã thanh toán</TableHead>
                    <TableHead className="text-xs text-right font-bold">
                      {debtView === "receivable" ? "Còn phải thu" : "Còn phải trả"}
                    </TableHead>
                    <TableHead className="text-xs w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDebt.map((p, idx) => {
                    const debt = Math.abs(Number(p.debt_amount) || 0);
                    const spent = Number(p.total_spent || 0);
                    const paid = spent - debt;
                    const agingBucket = getAgingBucket(p.created_at || new Date().toISOString());
                    return (
                      <TableRow key={p.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">{p.code}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {debtView === "receivable" ? (
                              <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                                <Users className="h-3.5 w-3.5 text-blue-500" />
                              </div>
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                                <Building2 className="h-3.5 w-3.5 text-amber-500" />
                              </div>
                            )}
                            <span className="text-xs font-semibold">{p.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("text-[10px] border", agingColor[agingBucket])}>
                            {agingBucket}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-right text-muted-foreground">
                          {formatCurrency(spent)}đ
                        </TableCell>
                        <TableCell className="text-xs text-right text-emerald-600">
                          {formatCurrency(Math.max(0, paid))}đ
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={cn(
                            "text-sm font-bold",
                            debt > 0
                              ? debtView === "receivable" ? "text-blue-600" : "text-amber-600"
                              : "text-muted-foreground"
                          )}>
                            {formatCurrency(debt)}đ
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredDebt.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10 text-muted-foreground text-sm">
                        {debtView === "receivable"
                          ? "Không có khách hàng nào có công nợ phải thu"
                          : "Không có nhà cung cấp nào có công nợ phải trả"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {/* Totals footer */}
              {filteredDebt.length > 0 && (
                <div className="border-t bg-muted/20 px-4 py-3 flex justify-end gap-8">
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Tổng chi tiêu</p>
                    <p className="text-sm font-semibold">
                      {formatCurrency(filteredDebt.reduce((s, p) => s + Number(p.total_spent || 0), 0))}đ
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      {debtView === "receivable" ? "Tổng phải thu" : "Tổng phải trả"}
                    </p>
                    <p className={cn(
                      "text-sm font-bold",
                      debtView === "receivable" ? "text-blue-600" : "text-amber-600"
                    )}>
                      {formatCurrency(filteredDebt.reduce((s, p) => s + Math.abs(Number(p.debt_amount) || 0), 0))}đ
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ── TAB 2: Lịch sử giao dịch ──────────────────────────────── */}
          <TabsContent value="transactions" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo đối tác, mã tham chiếu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-8 text-xs"
                />
              </div>
              <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                <SelectTrigger className="w-full sm:w-[200px] h-8 text-xs">
                  <SelectValue placeholder="Tất cả đối tác" />
                </SelectTrigger>
                <SelectContent className="bg-popover text-foreground z-50">
                  <SelectItem value="all" className="text-xs">Tất cả đối tác</SelectItem>
                  {[...customers, ...suppliers].map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full sm:w-[160px] h-8 text-xs">
                  <SelectValue placeholder="Loại giao dịch" />
                </SelectTrigger>
                <SelectContent className="bg-popover text-foreground z-50">
                  <SelectItem value="all" className="text-xs">Tất cả loại</SelectItem>
                  <SelectItem value="receivable" className="text-xs">Ghi nợ KH</SelectItem>
                  <SelectItem value="payable" className="text-xs">Ghi nợ NCC</SelectItem>
                  <SelectItem value="payment_in" className="text-xs">Thu tiền</SelectItem>
                  <SelectItem value="payment_out" className="text-xs">Chi tiền</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => {
                setSearchTerm(""); setSelectedPartner("all"); setSelectedType("all");
              }}>
                <RefreshCw className="h-3 w-3" /> Xoá lọc
              </Button>
            </div>

            <Card className="border border-border overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/20">
                <span className="text-xs text-muted-foreground">
                  {filteredTx.length} giao dịch
                </span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs">Ngày</TableHead>
                    <TableHead className="text-xs">Đối tác</TableHead>
                    <TableHead className="text-xs">Loại</TableHead>
                    <TableHead className="text-xs">Mã tham chiếu</TableHead>
                    <TableHead className="text-xs">PTTT</TableHead>
                    <TableHead className="text-xs text-right">Số tiền</TableHead>
                    <TableHead className="text-xs">Ghi chú</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTx.map((t) => (
                    <TableRow key={t.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-xs whitespace-nowrap">
                            {format(new Date(t.transaction_date), "dd/MM/yyyy", { locale: vi })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {t.partners?.partner_type === "customer" ? (
                            <Users className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                          ) : (
                            <Building2 className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          )}
                          <div>
                            <p className="text-xs font-semibold">{t.partners?.name || "—"}</p>
                            <p className="text-[10px] text-muted-foreground">{t.partners?.code}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-[10px] border", txTypeColor[t.transaction_type])}>
                          {txTypeLabel[t.transaction_type] || t.transaction_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {t.reference_number || t.orders?.order_number || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground capitalize">
                        {t.payment_method || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={cn(
                          "text-sm font-bold",
                          t.transaction_type === "payment_in" ? "text-emerald-600"
                            : t.transaction_type === "payment_out" ? "text-destructive"
                            : t.transaction_type === "receivable" ? "text-blue-600"
                            : "text-amber-600"
                        )}>
                          {t.transaction_type === "payment_in" && "+"}
                          {t.transaction_type === "payment_out" && "-"}
                          {Number(t.amount).toLocaleString("vi-VN")}đ
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">
                        {t.notes || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredTx.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground text-sm">
                        Không có giao dịch nào khớp bộ lọc
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* ── TAB 3: Đối soát phiếu ─────────────────────────────────── */}
          <TabsContent value="reconcile" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Summary boxes */}
              <Card className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/10">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Đã đối soát</p>
                  <p className="text-xl font-bold text-emerald-600">
                    {transactions.filter((t) => t.transaction_type === "payment_in" || t.transaction_type === "payment_out").length}
                  </p>
                  <p className="text-[10px] text-muted-foreground">phiếu thanh toán</p>
                </div>
              </Card>
              <Card className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-amber-500/10">
                  <Clock className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Chờ đối soát</p>
                  <p className="text-xl font-bold text-amber-600">
                    {transactions.filter((t) => t.transaction_type === "receivable" || t.transaction_type === "payable").length}
                  </p>
                  <p className="text-[10px] text-muted-foreground">phiếu công nợ</p>
                </div>
              </Card>
              <Card className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-destructive/10">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Chênh lệch</p>
                  <p className="text-xl font-bold text-destructive">
                    {formatCurrency(totals.receivable + totals.payable - transactions
                      .filter((t) => t.transaction_type === "payment_in" || t.transaction_type === "payment_out")
                      .reduce((s, t) => s + Number(t.amount), 0))}đ
                  </p>
                  <p className="text-[10px] text-muted-foreground">cần xử lý</p>
                </div>
              </Card>
            </div>

            {/* Reconciliation table */}
            <Card className="border border-border overflow-hidden">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-sm font-semibold">Chi tiết đối soát từng phiếu</CardTitle>
                <CardDescription className="text-xs">
                  Kiểm tra từng phiếu công nợ được tạo tự động từ đơn hàng và phiếu nhập kho
                </CardDescription>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs">Ngày tạo</TableHead>
                    <TableHead className="text-xs">Đối tác</TableHead>
                    <TableHead className="text-xs">Loại phiếu</TableHead>
                    <TableHead className="text-xs">Nguồn</TableHead>
                    <TableHead className="text-xs text-right">Giá trị phiếu</TableHead>
                    <TableHead className="text-xs text-right">Đã thanh toán</TableHead>
                    <TableHead className="text-xs text-right">Còn lại</TableHead>
                    <TableHead className="text-xs text-center">Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions
                    .filter((t) => t.transaction_type === "receivable" || t.transaction_type === "payable")
                    .map((t) => {
                      const value = Number(t.amount) || 0;
                      // Find matching payments
                      const paid = transactions
                        .filter(
                          (tx) =>
                            tx.partner_id === t.partner_id &&
                            (tx.transaction_type === "payment_in" || tx.transaction_type === "payment_out") &&
                            tx.reference_number === t.reference_number
                        )
                        .reduce((s, tx) => s + Number(tx.amount), 0);
                      const remaining = Math.max(0, value - paid);
                      const isPaid = remaining === 0;
                      const isPartial = paid > 0 && remaining > 0;
                      return (
                        <TableRow key={t.id} className="hover:bg-muted/20 transition-colors">
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(new Date(t.transaction_date), "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              {t.partners?.partner_type === "customer" ? (
                                <Users className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                              ) : (
                                <Building2 className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                              )}
                              <span className="text-xs font-semibold">{t.partners?.name || "—"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn("text-[10px] border", txTypeColor[t.transaction_type])}>
                              {txTypeLabel[t.transaction_type]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {t.reference_number || t.orders?.order_number || "—"}
                          </TableCell>
                          <TableCell className="text-xs text-right font-semibold">
                            {value.toLocaleString("vi-VN")}đ
                          </TableCell>
                          <TableCell className="text-xs text-right text-emerald-600">
                            {paid.toLocaleString("vi-VN")}đ
                          </TableCell>
                          <TableCell className="text-xs text-right font-bold text-destructive">
                            {remaining > 0 ? `${remaining.toLocaleString("vi-VN")}đ` : "—"}
                          </TableCell>
                          <TableCell className="text-center">
                            {isPaid ? (
                              <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20">
                                <CheckCircle2 className="h-2.5 w-2.5 mr-1" />Hoàn tất
                              </Badge>
                            ) : isPartial ? (
                              <Badge className="text-[10px] bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/20">
                                <Clock className="h-2.5 w-2.5 mr-1" />Một phần
                              </Badge>
                            ) : (
                              <Badge className="text-[10px] bg-red-500/10 text-red-600 border border-red-500/20 hover:bg-red-500/20">
                                <XCircle className="h-2.5 w-2.5 mr-1" />Chưa TT
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  {transactions.filter((t) => t.transaction_type === "receivable" || t.transaction_type === "payable").length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10 text-muted-foreground text-sm">
                        Chưa có phiếu công nợ nào để đối soát
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default DebtReport;
